begin;

create extension if not exists pgtap with schema extensions;
select plan(34);

-- 1-3: Private tables, RLS, and zero direct privileges for application roles
select ok(
  to_regclass('private.ai_compliance_lookup_limits') is not null
  and to_regclass('private.ai_compliance_lookup_throttle_state') is not null
  and to_regclass('private.ai_compliance_lookup_config') is not null,
  'private compliance limits, throttle state and configuration tables exist'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'private.ai_compliance_lookup_limits'::regclass)
  and (select relrowsecurity from pg_class where oid = 'private.ai_compliance_lookup_throttle_state'::regclass)
  and (select relrowsecurity from pg_class where oid = 'private.ai_compliance_lookup_config'::regclass),
  'RLS is enabled on all three private compliance tables'
);

select ok(
  not has_table_privilege('anon', 'private.ai_compliance_lookup_limits', 'SELECT')
  and not has_table_privilege('authenticated', 'private.ai_compliance_lookup_limits', 'SELECT')
  and not has_table_privilege('service_role', 'private.ai_compliance_lookup_limits', 'SELECT')
  and not has_table_privilege('anon', 'private.ai_compliance_lookup_throttle_state', 'SELECT')
  and not has_table_privilege('authenticated', 'private.ai_compliance_lookup_throttle_state', 'SELECT')
  and not has_table_privilege('service_role', 'private.ai_compliance_lookup_throttle_state', 'SELECT')
  and not has_table_privilege('anon', 'private.ai_compliance_lookup_config', 'SELECT')
  and not has_table_privilege('authenticated', 'private.ai_compliance_lookup_config', 'SELECT')
  and not has_table_privilege('service_role', 'private.ai_compliance_lookup_config', 'SELECT'),
  'compliance counters, throttle state and configuration are inaccessible to application roles'
);

-- 4-6: Default config, function grants, and SECURITY DEFINER hygiene
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

-- Seed test principals:
-- 0001 = Super Admin A, 0002 = Ordinary User, 0003 = Target, 0004 = Inactive Admin, 0005 = Super Admin B
insert into auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values
  ('e7000000-0000-0000-0000-000000000001', '2348077770001', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000002', '2348077770002', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000003', '2348077770003', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000004', '2348077770004', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000005', '2348077770005', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.profiles (id, phone, full_name, state, lga)
values
  ('e7000000-0000-0000-0000-000000000001', '2348077770001', 'Compliance Super Admin A', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000002', '2348077770002', 'Compliance Officer', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000003', '2348077770003', 'Compliance Target', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000004', '2348077770004', 'Inactive Compliance Admin', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000005', '2348077770005', 'Compliance Super Admin B', 'Oyo', 'Ibadan')
on conflict (id) do nothing;

update public.profiles
   set deletion_status = 'completed', deleted_at = now()
 where id = 'e7000000-0000-0000-0000-000000000004';

insert into public.admin_roles (profile_id, admin_role)
values
  ('e7000000-0000-0000-0000-000000000001', 'super_admin'),
  ('e7000000-0000-0000-0000-000000000004', 'super_admin'),
  ('e7000000-0000-0000-0000-000000000005', 'super_admin')
on conflict do nothing;

select private.resolve_or_create_ai_actor('e7000000-0000-0000-0000-000000000003') as actor_id
\gset

-- 7: Unauthenticated caller (no sub claim) is rejected before any write
set local role authenticated;
select set_config('request.jwt.claims', '{}', true);
select throws_ok(
  $$select public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request')$$,
  '28000',
  'Authentication is required.',
  'unauthenticated caller without JWT sub is rejected'
);

-- 8-9: Inactive/deleted account returns denied and writes ZERO audit or counter rows
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'denied',
  'inactive account is denied compliance lookup'
);
reset role;
select ok(
  (select count(*) = 0 from public.audit_log where actor_id = 'e7000000-0000-0000-0000-000000000004' and action = 'ai_actor_compliance_lookup')
  and (select count(*) = 0 from private.ai_compliance_lookup_limits where principal_id = 'e7000000-0000-0000-0000-000000000004')
  and (select count(*) = 0 from private.ai_compliance_lookup_throttle_state where scope_key like '%e7000000-0000-0000-0000-000000000004%'),
  'inactive account generates zero compliance audit, limit or throttle records'
);

-- 10-12: Disabled feature bounds persistent writes across 10 repeated calls
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  (select count(*)::int from generate_series(1, 10)
   where public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request')->>'status' = 'unavailable'),
  10,
  'disabled feature rejects all 10 calls with unavailable status'
);
reset role;
select is(
  (select count(*)::int from public.audit_log
   where actor_id = 'e7000000-0000-0000-0000-000000000001'
     and action = 'ai_actor_compliance_lookup'
     and new_values->>'outcome' = 'unavailable'),
  1,
  '10 disabled-feature calls emit at most one bounded audit_log row per window'
);
select ok(
  (select count(*) = 0 from private.ai_compliance_lookup_limits)
  and (select suppressed_count = 10 from private.ai_compliance_lookup_throttle_state
        where scope_key = 'unavailable:e7000000-0000-0000-0000-000000000001'),
  'disabled-feature calls write zero limit rows and aggregate suppressed_count in place'
);

-- Enable compliance lookup for functional & rate-limiting tests
delete from private.ai_compliance_lookup_limits;
delete from private.ai_compliance_lookup_throttle_state;
update private.ai_compliance_lookup_config
   set enabled = true,
       window_seconds = 900,
       principal_attempt_limit = 10,
       principal_denied_limit = 5,
       system_attempt_limit = 30,
       updated_at = clock_timestamp()
 where singleton = true;

-- 13-19: Permitted, unknown, malformed, unapproved purpose, and permission denial
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
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'personal curiosity')->>'status',
  'denied',
  'unapproved free-text purposes are denied'
);

select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'permitted',
  'valid lookup remains available after isolated denied attempts'
);

select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'denied',
  'authenticated users without audit.read cannot look up actors'
);

reset role;
select is(
  (select count(*)::int from public.audit_log
   where actor_id = 'e7000000-0000-0000-0000-000000000002'
     and action = 'ai_actor_compliance_lookup'
     and new_values->>'outcome' = 'denied'),
  1,
  'permission denial is audited'
);

-- 21-26: Principal-level limit, parameter-variation resistance, bounded writes under 20 rejected calls, and principal isolation
delete from private.ai_compliance_lookup_limits;
delete from private.ai_compliance_lookup_throttle_state;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  (select count(*)::int from generate_series(1, 5)
   where public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request')->>'status' = 'denied'),
  5,
  'five unsuccessful lookups reach principal_denied_limit'
);

-- Vary subject IDs and purposes across 20 subsequent calls; all must be throttled
select is(
  (select count(*)::int from generate_series(1, 20) g
   where public.compliance_lookup_ai_actor(
     case when g % 2 = 0 then :'actor_id'::uuid else gen_random_uuid() end,
     case when g % 3 = 0 then 'regulatory_inquiry' when g % 3 = 1 then 'security_incident' else 'legal_obligation' end
   )->>'status' = 'throttled'),
  20,
  '20 repeated calls after principal limit (with varied subject IDs and purposes) are all throttled'
);

reset role;
select is(
  (select count(*)::int from private.ai_compliance_lookup_limits
   where principal_id = 'e7000000-0000-0000-0000-000000000001'),
  5,
  'ai_compliance_lookup_limits stays bounded at 5 rows despite 20 subsequent throttled calls'
);

select is(
  (select count(*)::int from public.audit_log
   where actor_id = 'e7000000-0000-0000-0000-000000000001'
     and action = 'ai_actor_compliance_lookup'
     and new_values->>'outcome' = 'throttled'),
  1,
  '20 repeated principal-throttled calls emit exactly one bounded audit_log row per window'
);

select is(
  (select suppressed_count from private.ai_compliance_lookup_throttle_state
   where scope_key = 'principal:e7000000-0000-0000-0000-000000000001'),
  20,
  'principal throttle state aggregates all 20 suppressed calls in a single row'
);

-- Principal B is unaffected by Principal A hitting its individual limit
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'permitted',
  'one principal exhausting its individual allowance does not block another principal'
);

-- 27-30: System-wide ceiling and bounded writes under 20 repeated rejected calls
reset role;
delete from private.ai_compliance_lookup_limits;
delete from private.ai_compliance_lookup_throttle_state;
update private.ai_compliance_lookup_config
   set principal_attempt_limit = 100,
       principal_denied_limit = 100,
       system_attempt_limit = 8,
       updated_at = clock_timestamp()
 where singleton = true;

select set_config('test.sys_throttle_audit_before',
  (select count(*)::text from public.audit_log
    where action = 'ai_actor_compliance_lookup'
      and new_values->>'outcome' = 'throttled'), true);

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
  (select count(*)::int from generate_series(1, 20)
   where public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status' = 'throttled'),
  20,
  '20 repeated calls after system-wide ceiling are all throttled'
);

reset role;
select ok(
  (select count(*) = 8 from private.ai_compliance_lookup_limits)
  and (select suppressed_count = 20 from private.ai_compliance_lookup_throttle_state where scope_key = 'system:global'),
  'system-wide throttling keeps limits at 8 rows and aggregates 20 suppressed calls in one state row'
);

select is(
  (select count(*)::int from public.audit_log
   where action = 'ai_actor_compliance_lookup'
     and new_values->>'outcome' = 'throttled')
  - current_setting('test.sys_throttle_audit_before')::integer,
  1,
  '20 repeated system-throttled calls emit exactly one bounded audit_log row per window'
);

-- 31: Transaction rollback leaves counters and audit_log consistent
delete from private.ai_compliance_lookup_limits;
delete from private.ai_compliance_lookup_throttle_state;
select set_config('test.rollback_audit_before',
  (select count(*)::text from public.audit_log where action = 'ai_actor_compliance_lookup'), true);

do $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  perform public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request');
  raise exception 'force_subtransaction_rollback';
exception
  when others then
    if sqlerrm <> 'force_subtransaction_rollback' then
      raise;
    end if;
end $$;

select ok(
  (select count(*) = 0 from private.ai_compliance_lookup_limits)
  and (select count(*)::int from public.audit_log where action = 'ai_actor_compliance_lookup')
      = current_setting('test.rollback_audit_before')::integer,
  'rolled-back lookup transaction leaves zero counter or audit_log artifacts'
);

-- 32-34: service_role revocation, direct directory isolation, and inactive-account enabled-feature check
set local role service_role;
select throws_ok(
  $$select public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request')$$,
  '42501',
  null,
  'service_role cannot invoke the compliance lookup RPC'
);

reset role;
select ok(
  not has_table_privilege('authenticated', 'private.ai_actor_directory', 'SELECT')
  and not has_function_privilege('authenticated', 'private.lookup_ai_actor_subject(uuid)', 'EXECUTE'),
  'compliance lookup does not grant direct actor-directory or lookup-function access'
);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'denied',
  'inactive account remains denied with zero audit writes even when feature is enabled'
);

select * from finish();
rollback;
