begin;

create extension if not exists pgtap with schema extensions;
select plan(29);

select ok(
  to_regclass('public.ai_audit_events') is not null,
  'AI audit event register exists'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.ai_audit_events'::regclass),
  'RLS is enabled on AI audit events'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.ai_audit_feedback'::regclass),
  'RLS is enabled on AI audit feedback'
);

select is(
  (select count(*)::int from pg_trigger
   where tgrelid = 'public.ai_audit_events'::regclass and not tgisinternal
     and tgname in ('ai_audit_events_forbid_update', 'ai_audit_events_forbid_delete')),
  2,
  'AI audit events have UPDATE and DELETE rejection triggers'
);

select is(
  (select count(*)::int from pg_trigger
   where tgrelid = 'public.ai_audit_feedback'::regclass and not tgisinternal
     and tgname in ('ai_audit_feedback_forbid_update', 'ai_audit_feedback_forbid_delete')),
  2,
  'AI audit feedback has UPDATE and DELETE rejection triggers'
);

select ok(
  exists (select 1 from pg_indexes where schemaname = 'public'
    and indexname = 'ai_audit_events_trace_id_key' and indexdef ilike '%unique%'),
  'trace_id is unique for idempotent audit writes'
);

select ok(
  has_table_privilege('authenticated', 'public.ai_audit_events', 'SELECT')
  and not has_table_privilege('authenticated', 'public.ai_audit_events', 'INSERT')
  and not has_table_privilege('authenticated', 'public.ai_audit_events', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.ai_audit_events', 'DELETE')
  and not has_table_privilege('anon', 'public.ai_audit_events', 'SELECT')
  and not has_table_privilege('service_role', 'public.ai_audit_events', 'SELECT')
  and not has_table_privilege('service_role', 'public.ai_audit_events', 'INSERT'),
  'only authenticated users receive SELECT privilege on audit events'
);

select ok(
  not has_table_privilege('anon', 'public.ai_audit_feedback', 'SELECT')
  and not has_table_privilege('authenticated', 'public.ai_audit_feedback', 'SELECT')
  and not has_table_privilege('authenticated', 'public.ai_audit_feedback', 'INSERT')
  and not has_table_privilege('service_role', 'public.ai_audit_feedback', 'SELECT')
  and not has_table_privilege('service_role', 'public.ai_audit_feedback', 'INSERT'),
  'feedback table has no direct application-role access'
);

select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'write_ai_audit_event'
      and p.prosecdef and pg_get_userbyid(p.proowner) = 'postgres'
      and 'search_path=""' = any(p.proconfig)
  ),
  'trusted writer is postgres-owned SECURITY DEFINER with empty search_path'
);

select ok(
  has_function_privilege('service_role',
    'private.write_ai_audit_event(uuid,uuid,uuid,text,text,text,text,jsonb,jsonb,uuid[])', 'EXECUTE')
  and not has_function_privilege('anon',
    'private.write_ai_audit_event(uuid,uuid,uuid,text,text,text,text,jsonb,jsonb,uuid[])', 'EXECUTE')
  and not has_function_privilege('authenticated',
    'private.write_ai_audit_event(uuid,uuid,uuid,text,text,text,text,jsonb,jsonb,uuid[])', 'EXECUTE')
  and not exists (
    select 1 from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where p.oid = 'private.write_ai_audit_event(uuid,uuid,uuid,text,text,text,text,jsonb,jsonb,uuid[])'::regprocedure
      and a.grantee = 0 and a.privilege_type = 'EXECUTE'
  ),
  'trusted writer is executable only by service_role, not PUBLIC or clients'
);

select ok(
  has_function_privilege('authenticated', 'public.record_ai_feedback(uuid,text,text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.record_ai_feedback(uuid,text,text)', 'EXECUTE')
  and not exists (
    select 1 from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where p.oid = 'public.record_ai_feedback(uuid,text,text)'::regprocedure
      and a.grantee = 0 and a.privilege_type = 'EXECUTE'
  ),
  'feedback RPC is executable by authenticated users only'
);

insert into auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values
  ('e6000000-0000-0000-0000-000000000001', '2348066660001', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e6000000-0000-0000-0000-000000000002', '2348066660002', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.profiles (id, phone, full_name, state, lga)
values
  ('e6000000-0000-0000-0000-000000000001', '2348066660001', 'AI Audit Owner', 'Oyo', 'Ibadan'),
  ('e6000000-0000-0000-0000-000000000002', '2348066660002', 'Other Farmer', 'Oyo', 'Ibadan')
on conflict (id) do nothing;

insert into public.farms (id, name, location, owner_id, zone, state, lga)
values (
  'e6000000-0000-0000-0000-0000000000f1',
  'AI Audit Test Farm',
  'SRID=4326;POINT(3.89715 7.37795)',
  'e6000000-0000-0000-0000-000000000001',
  'derived_savanna',
  'Oyo',
  'Ibadan'
);

set local role service_role;

select set_config(
  'test.ai_audit_event_id',
  private.write_ai_audit_event(
    'e6000000-0000-0000-0000-000000000001',
    'e6000000-0000-0000-0000-0000000000f1',
    'e6000000-0000-0000-0000-0000000000a1',
    'claude',
    'claude-sonnet-5-5',
    'farm-intelligence-v1',
    'completed',
    '{"status":"passed","rule_ids":[],"reason_codes":[],"blocked":false}'::jsonb,
    '[{"source":"soil_records","record_id":"soil-001","observed_at":"2026-11-20T10:00:00Z"}]'::jsonb,
    '{}'::uuid[]
  )::text,
  true
);

select is(
  private.write_ai_audit_event(
    'e6000000-0000-0000-0000-000000000001',
    'e6000000-0000-0000-0000-0000000000f1',
    'e6000000-0000-0000-0000-0000000000a1',
    'claude',
    'claude-sonnet-5-5',
    'farm-intelligence-v1',
    'completed',
    '{"status":"passed","rule_ids":[],"reason_codes":[],"blocked":false}'::jsonb,
    '[{"source":"soil_records","record_id":"soil-001","observed_at":"2026-11-20T10:00:00Z"}]'::jsonb,
    '{}'::uuid[]
  ),
  current_setting('test.ai_audit_event_id')::uuid,
  'repeated identical trace writes return the original event ID'
);

select throws_ok(
  $$select private.write_ai_audit_event(
    'e6000000-0000-0000-0000-000000000001',
    'e6000000-0000-0000-0000-0000000000f1',
    'e6000000-0000-0000-0000-0000000000a1',
    'gemini','gemini-flash-latest','farm-intelligence-v1','completed',
    '{}'::jsonb,'[]'::jsonb,'{}'::uuid[]
  )$$,
  '23505',
  'Trace ID is already associated with a different AI audit event.',
  'trace ID cannot be reused for a different event'
);

select throws_ok(
  $$select private.write_ai_audit_event(
    'e6000000-0000-0000-0000-000000000001',
    'e6000000-0000-0000-0000-0000000000f1',
    'e6000000-0000-0000-0000-0000000000a2',
    'claude','claude-sonnet-5-5','farm-intelligence-v1','completed',
    '{}'::jsonb,'[{"source":"soil_records","record_id":"soil-001","raw_prompt":"do not store"}]'::jsonb,'{}'::uuid[]
  )$$,
  '22023',
  null,
  'context references reject arbitrary or prompt-bearing fields'
);

select throws_ok(
  $q$select private.write_ai_audit_event(
    'e6000000-0000-0000-0000-000000000001',
    'e6000000-0000-0000-0000-0000000000f1',
    'e6000000-0000-0000-0000-0000000000a3',
    'claude','claude-sonnet-5-5','farm-intelligence-v1','completed',
    '{}'::jsonb,'[{"record_id":"soil-001"}]'::jsonb,'{}'::uuid[]
  )$q$,
  '22023',
  null,
  'context references require a source field'
);

select throws_ok(
  $q$select private.write_ai_audit_event(
    'e6000000-0000-0000-0000-000000000001',
    'e6000000-0000-0000-0000-0000000000f1',
    'e6000000-0000-0000-0000-0000000000a4',
    'claude','claude-sonnet-5-5','farm-intelligence-v1','completed',
    '{}'::jsonb,'[{"source":"soil_records"}]'::jsonb,'{}'::uuid[]
  )$q$,
  '22023',
  null,
  'context references require a record_id field'
);

reset role;

select is(
  (select count(*)::int from public.ai_audit_events
   where trace_id = 'e6000000-0000-0000-0000-0000000000a1'),
  1,
  'trusted writer persisted exactly one audit event'
);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e6000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.ai_audit_events
   where trace_id = 'e6000000-0000-0000-0000-0000000000a1'),
  1,
  'farm owner can read the audit event through farm-scoped RLS'
);

select ok(
  public.record_ai_feedback(
    'e6000000-0000-0000-0000-0000000000a1',
    'accepted',
    'The recommendation was useful.'
  ) is not null,
  'farm owner can submit constrained feedback for an existing trace'
);

select throws_ok(
  $$select public.record_ai_feedback(
    'e6000000-0000-0000-0000-0000000000a1','rejected',null
  )$$,
  '23505',
  null,
  'a user cannot submit duplicate feedback for the same trace'
);

select throws_ok(
  $$select public.record_ai_feedback(
    'e6000000-0000-0000-0000-0000000000a1','fabricated',null
  )$$,
  '22023',
  'Invalid AI feedback.',
  'feedback outcomes are restricted to accepted, rejected or modified'
);

select throws_ok(
  $$update public.ai_audit_events set execution_outcome = 'blocked'
    where trace_id = 'e6000000-0000-0000-0000-0000000000a1'$$,
  '42501',
  null,
  'authenticated users cannot mutate audit events'
);

select throws_ok(
  $$delete from public.ai_audit_events
    where trace_id = 'e6000000-0000-0000-0000-0000000000a1'$$,
  '42501',
  null,
  'authenticated users cannot delete audit events'
);

select set_config('request.jwt.claims',
  '{"sub":"e6000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.ai_audit_events
   where trace_id = 'e6000000-0000-0000-0000-0000000000a1'),
  0,
  'unrelated farmer cannot read another farm audit event'
);

select throws_ok(
  $$select public.record_ai_feedback(
    'e6000000-0000-0000-0000-0000000000a1','accepted',null
  )$$,
  '42501',
  'Farm access denied.',
  'unrelated farmer cannot submit feedback on another farm trace'
);

reset role;

select throws_ok(
  $$update public.ai_audit_events set execution_outcome = 'blocked'
    where trace_id = 'e6000000-0000-0000-0000-0000000000a1'$$,
  '42501',
  'ai_audit_events is append-only.',
  'database trigger rejects event updates even for database owner sessions'
);

select throws_ok(
  $$delete from public.ai_audit_events
    where trace_id = 'e6000000-0000-0000-0000-0000000000a1'$$,
  '42501',
  'ai_audit_events is append-only.',
  'database trigger rejects event deletion even for database owner sessions'
);

select throws_ok(
  $$update public.ai_audit_feedback set outcome = 'rejected'
    where trace_id = 'e6000000-0000-0000-0000-0000000000a1'$$,
  '42501',
  'ai_audit_feedback is append-only.',
  'database trigger rejects feedback updates'
);

select throws_ok(
  $$delete from public.ai_audit_feedback
    where trace_id = 'e6000000-0000-0000-0000-0000000000a1'$$,
  '42501',
  'ai_audit_feedback is append-only.',
  'database trigger rejects feedback deletion'
);

select * from finish();
rollback;
