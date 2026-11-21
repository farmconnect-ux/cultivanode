begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

-- 1: Wrapper exists, is postgres-owned SECURITY DEFINER with empty search_path
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'write_ai_audit_event'
      and p.prosecdef
      and pg_get_userbyid(p.proowner) = 'postgres'
      and 'search_path=""' = any(p.proconfig)
  ),
  'public.write_ai_audit_event wrapper is postgres-owned SECURITY DEFINER with empty search_path'
);

-- 2: Exact function ACL: service_role only; PUBLIC, anon, authenticated explicitly revoked
select ok(
  has_function_privilege('service_role',
    'public.write_ai_audit_event(uuid,uuid,uuid,text,text,text,text,jsonb,jsonb,uuid[],uuid)', 'EXECUTE')
  and not has_function_privilege('anon',
    'public.write_ai_audit_event(uuid,uuid,uuid,text,text,text,text,jsonb,jsonb,uuid[],uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated',
    'public.write_ai_audit_event(uuid,uuid,uuid,text,text,text,text,jsonb,jsonb,uuid[],uuid)', 'EXECUTE')
  and not exists (
    select 1 from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where p.oid = 'public.write_ai_audit_event(uuid,uuid,uuid,text,text,text,text,jsonb,jsonb,uuid[],uuid)'::regprocedure
      and a.grantee = 0
      and a.privilege_type = 'EXECUTE'
  ),
  'public.write_ai_audit_event grants EXECUTE exclusively to service_role (no PUBLIC, anon or authenticated grant)'
);

-- 3: Private tables remain completely inaccessible to application roles
select ok(
  not has_table_privilege('anon', 'private.ai_actor_directory', 'SELECT')
  and not has_table_privilege('authenticated', 'private.ai_actor_directory', 'SELECT')
  and not has_table_privilege('service_role', 'private.ai_actor_directory', 'SELECT')
  and not has_table_privilege('service_role', 'private.ai_prompt_versions', 'SELECT'),
  'private AI governance tables remain inaccessible through Data API roles'
);

-- Seed test user and farm
insert into auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values ('e9000000-0000-0000-0000-000000000001', '2348099990001', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.profiles (id, phone, full_name, state, lga)
values ('e9000000-0000-0000-0000-000000000001', '2348099990001', 'Wrapper Test Farmer', 'Oyo', 'Ibadan')
on conflict (id) do nothing;

insert into public.farms (id, name, location, owner_id, zone, state, lga)
values (
  'e9000000-0000-0000-0000-0000000000f1',
  'Wrapper Test Farm',
  extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'),
  'e9000000-0000-0000-0000-000000000001',
  'derived_savanna',
  'Oyo',
  'Ibadan'
) on conflict (id) do nothing;

-- 4: anon is rejected at runtime
set local role anon;
select throws_ok(
  $$select public.write_ai_audit_event(
    'e9000000-0000-0000-0000-000000000001',
    'e9000000-0000-0000-0000-0000000000f1',
    'e9000000-0000-0000-0000-0000000000a1',
    'claude', 'claude-sonnet-4-5', 'grounding-v1', 'completed',
    '{"status":"passed","rule_ids":[],"reason_codes":[],"blocked":false}'::jsonb,
    '[]'::jsonb, '{}'::uuid[], null
  )$$,
  '42501',
  null,
  'anon role cannot execute public.write_ai_audit_event'
);

-- 5: authenticated is rejected at runtime
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e9000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select throws_ok(
  $$select public.write_ai_audit_event(
    'e9000000-0000-0000-0000-000000000001',
    'e9000000-0000-0000-0000-0000000000f1',
    'e9000000-0000-0000-0000-0000000000a1',
    'claude', 'claude-sonnet-4-5', 'grounding-v1', 'completed',
    '{"status":"passed","rule_ids":[],"reason_codes":[],"blocked":false}'::jsonb,
    '[]'::jsonb, '{}'::uuid[], null
  )$$,
  '42501',
  null,
  'authenticated role cannot execute public.write_ai_audit_event'
);

-- 6-10: service_role succeeds, delegates cleanly, preserves idempotency, and underlying writer rejects invalid input
reset role;
set local role service_role;

select set_config(
  'test.wrapper_event_id',
  public.write_ai_audit_event(
    'e9000000-0000-0000-0000-000000000001',
    'e9000000-0000-0000-0000-0000000000f1',
    'e9000000-0000-0000-0000-0000000000a1',
    'rule-engine', 'grounding-deterministic', 'grounding-v1', 'completed',
    '{"status":"passed","rule_ids":[],"reason_codes":[],"blocked":false}'::jsonb,
    '[{"source":"farms","record_id":"e9000000-0000-0000-0000-0000000000f1","observed_at":"2026-11-21T04:00:00Z"}]'::jsonb,
    '{}'::uuid[],
    null
  )::text,
  true
);

select ok(
  current_setting('test.wrapper_event_id') ~ '^[0-9a-f-]{36}$',
  'service_role successfully persists AI audit event through public.write_ai_audit_event wrapper'
);

select is(
  public.write_ai_audit_event(
    'e9000000-0000-0000-0000-000000000001',
    'e9000000-0000-0000-0000-0000000000f1',
    'e9000000-0000-0000-0000-0000000000a1',
    'rule-engine', 'grounding-deterministic', 'grounding-v1', 'completed',
    '{"status":"passed","rule_ids":[],"reason_codes":[],"blocked":false}'::jsonb,
    '[{"source":"farms","record_id":"e9000000-0000-0000-0000-0000000000f1","observed_at":"2026-11-21T04:00:00Z"}]'::jsonb,
    '{}'::uuid[],
    null
  ),
  current_setting('test.wrapper_event_id')::uuid,
  'wrapper preserves idempotency for repeated identical trace_id submissions'
);

select throws_ok(
  $$select public.write_ai_audit_event(
    'e9000000-0000-0000-0000-000000000001',
    'e9000000-0000-0000-0000-0000000000f1',
    'e9000000-0000-0000-0000-0000000000a1',
    'claude', 'claude-sonnet-4-5', 'grounding-v1', 'blocked',
    '{"status":"blocked","rule_ids":["chemical"],"reason_codes":["paraquat"],"blocked":true}'::jsonb,
    '[]'::jsonb, '{}'::uuid[], null
  )$$,
  '23505',
  'Trace ID is already associated with a different AI audit event.',
  'wrapper preserves conflict rejection when reusing trace_id with different event payload'
);

select throws_ok(
  $$select public.write_ai_audit_event(
    'e9000000-0000-0000-0000-000000000001',
    'e9000000-0000-0000-0000-0000000000f1',
    'e9000000-0000-0000-0000-0000000000a2',
    'claude', 'claude-sonnet-4-5', 'grounding-v1', 'completed',
    '{"status":"passed"}'::jsonb,
    '[{"source":"auth_users","record_id":"secret"}]'::jsonb, '{}'::uuid[], null
  )$$,
  '22023',
  'Unsupported context reference source.',
  'wrapper delegates validation to private.write_ai_audit_event and rejects invalid sources'
);

reset role;
select is(
  (select count(*)::int from public.ai_audit_events where trace_id = 'e9000000-0000-0000-0000-0000000000a1'),
  1,
  'exactly one immutable row persisted in public.ai_audit_events via wrapper'
);

select * from finish();
rollback;
