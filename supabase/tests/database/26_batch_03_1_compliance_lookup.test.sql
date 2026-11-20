begin;

create extension if not exists pgtap with schema extensions;
select plan(26);

select ok(
  to_regclass('private.ai_compliance_lookup_limits') is not null
  and to_regclass('private.ai_compliance_lookup_config') is not null,
  'private compliance limits and configuration tables exist'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'private.ai_compliance_lookup_limits'::regclass)
  and (select relrowsecurity from pg_class where oid = 'private.ai_compliance_lookup_config'::regclass),
  'RLS is enabled on both private compliance tables'
);

select ok(
  not has_table_privilege('anon', 'private.ai_compliance_lookup_limits', 'SELECT')
  and not has_table_privilege('authenticated', 'private.ai_compliance_lookup_limits', 'SELECT')
  and not has_table_privilege('service_role', 'private.ai_compliance_lookup_limits', 'SELECT')
  and not has_table_privilege('anon', 'private.ai_compliance_lookup_config', 'SELECT')
  and not has_table_privilege('authenticated', 'private.ai_compliance_lookup_config', 'SELECT')
  and not has_table_privilege('service_role', 'private.ai_compliance_lookup_config', 'SELECT'),
  'compliance counters and configuration are inaccessible to application roles'
);

select ok(
  (select not enabled and window_seconds = 900
     and principal_attempt_limit = 10
     and principal_denied_limit = 5
     and system_attempt_limit = 30
   from private.ai_compliance_lookup_config where singleton),
  'lookup starts disabled with documented provisional thresholds'
);

select ok(
  has_function_privilege('authenticated', 'public.compliance_lookup_ai_actor(uuid,text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.compliance_lookup_ai_actor(uuid,text)', 'EXECUTE')
  and not has_function_privilege('service_role', 'public.compliance_lookup_ai_actor(uuid,text)', 'EXECUTE')
  and not exists (
    select 1 from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where p.oid = 'public.compliance_lookup_ai_actor(uuid,text)'::regprocedure
      and a.grantee = 0 and a.privilege_type = 'EXECUTE'
  ),
  'compliance lookup is executable only by authenticated users'
);

select ok(
  exists (
    select 1 from pg_proc p
    where p.oid = 'public.compliance_lookup_ai_actor(uuid,text)'::regprocedure
      and p.prosecdef
      and pg_get_userbyid(p.proowner) = 'postgres'
      and 'search_path=""' = any(p.proconfig)
  ),
  'compliance lookup is postgres-owned SECURITY DEFINER with empty search_path'
);

insert into auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values
  ('e7000000-0000-0000-0000-000000000001', '2348077770001', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000002', '2348077770002', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000003', '2348077770003', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.profiles (id, phone, full_name, state, lga)
values
  ('e7000000-0000-0000-0000-000000000001', '2348077770001', 'Compliance Super Admin', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000002', '2348077770002', 'Compliance Officer', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000003', '2348077770003', 'Compliance Target', 'Oyo', 'Ibadan')
on conflict (id) do nothing;

insert into public.admin_roles (profile_id, admin_role)
values ('e7000000-0000-0000-0000-000000000001', 'super_admin')
on conflict do nothing;

select private.resolve_or_create_ai_actor('e7000000-0000-0000-0000-000000000003') as actor_id
\gset

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'unavailable',
  'lookup fails closed while the operational switch is disabled'
);

select is(
  (select count(*)::int from public.audit_log
   where actor_id = 'e7000000-0000-0000-0000-000000000001'
     and action = 'ai_actor_compliance_lookup'
     and details->>'outcome' = 'unavailable'),
  1,
  'disabled lookup attempt is durably audited'
);

reset role;
update private.ai_compliance_lookup_config
   set enabled = true,
       window_seconds = 900,
       principal_attempt_limit = 10,
       principal_denied_limit = 5,
       system_attempt_limit = 30,
       updated_at = clock_timestamp()
 where singleton = true;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'permitted',
  'super admin can perform a permitted compliance lookup'
);

select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'profile_id',
  'e7000000-0000-0000-0000-000000000003',
  'permitted lookup returns the minimum actor attribution'
);

select is(
  public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request')->>'status',
  'denied',
  'unknown actor subject is denied without revealing actor data'
);

select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'x')->>'status',
  'denied',
  'malformed purpose is denied'
);

select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'permitted',
  'valid lookup remains available after isolated denied attempts'
);

select is(
  (select count(*)::int from public.audit_log
   where actor_id = 'e7000000-0000-0000-0000-000000000001'
     and action = 'ai_actor_compliance_lookup'),
  5,
  'every permitted and denied lookup attempt is written to audit_log'
);

select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'denied',
  'authenticated users without audit.read cannot look up actors'
);

select is(
  (select count(*)::int from public.audit_log
   where actor_id = 'e7000000-0000-0000-0000-000000000002'
     and action = 'ai_actor_compliance_lookup'
     and details->>'outcome' = 'denied'),
  1,
  'permission denial is audited'
);

select is(
  (select count(*)::int from private.ai_compliance_lookup_limits
   where principal_id = 'e7000000-0000-0000-0000-000000000002'
     and outcome = 'denied'),
  1,
  'denied attempts are counted against the requesting principal'
);

select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  (select count(*)::int from generate_series(1, 5)
   where public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request')->>'status' = 'denied'),
  5,
  'five unsuccessful lookups are recorded'
);

select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'throttled',
  'sixth request is throttled after five unsuccessful attempts'
);

select is(
  (select count(*)::int from public.audit_log
   where actor_id = 'e7000000-0000-0000-0000-000000000001'
     and action = 'ai_actor_compliance_lookup'
     and details->>'outcome' = 'throttled'),
  1,
  'throttled request is also audited'
);

reset role;
delete from private.ai_compliance_lookup_limits;
update private.ai_compliance_lookup_config
   set principal_attempt_limit = 100,
       principal_denied_limit = 100,
       system_attempt_limit = 8,
       updated_at = clock_timestamp()
 where singleton = true;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  (select count(*)::int from generate_series(1, 8)
   where public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status' = 'permitted'),
  8,
  'system-wide ceiling permits the configured number of requests'
);

select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'throttled',
  'system-wide ceiling throttles the next request'
);

select is(
  (select count(*)::int from public.audit_log
   where action = 'ai_actor_compliance_lookup'
     and details->>'outcome' = 'throttled'),
  2,
  'principal and system throttles are both durably audited'
);

select throws_ok(
  $$select public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request')$$,
  '42501',
  null,
  'lookup function does not expose private counter tables'
);

reset role;

select ok(
  not has_table_privilege('authenticated', 'private.ai_actor_directory', 'SELECT')
  and not has_function_privilege('authenticated', 'private.lookup_ai_actor_subject(uuid)', 'EXECUTE'),
  'compliance lookup does not grant direct actor-directory or lookup-function access'
);

select is(
  (select count(*)::int from public.audit_log
   where action = 'ai_actor_compliance_lookup'),
  (select count(*)::int from private.ai_compliance_lookup_limits),
  'every recorded attempt has a matching durable audit log entry'
);

select * from finish();
rollback;
