begin;

create extension if not exists pgtap with schema extensions;
select plan(54);

-- Deterministic rolling-window predicate coverage. Fixed timestamps exercise the
-- exact helper called by both production branches, avoiding wall-clock race windows.
select ok(
  private.ai_compliance_window_expired(
    '2026-11-20 11:59:59+00'::timestamptz,
    '2026-11-20 12:00:00+00'::timestamptz
  ),
  'window start earlier than cutoff is expired'
);
select ok(
  private.ai_compliance_window_expired(
    '2026-11-20 12:00:00+00'::timestamptz,
    '2026-11-20 12:00:00+00'::timestamptz
  ),
  'window start exactly equal to cutoff is expired (inclusive boundary)'
);
select ok(
  not private.ai_compliance_window_expired(
    '2026-11-20 12:00:01+00'::timestamptz,
    '2026-11-20 12:00:00+00'::timestamptz
  ),
  'window start later than cutoff remains active'
);

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

-- 4-6: Default config (including cooldown), function grants, and SECURITY DEFINER hygiene
select ok(
  (select not enabled and window_seconds = 900
     and throttle_write_cooldown_seconds = 60
     and principal_attempt_limit = 10
     and principal_denied_limit = 5
     and system_attempt_limit = 30
   from private.ai_compliance_lookup_config where singleton),
  'lookup starts disabled with documented provisional thresholds and 60s write-suppression cooldown'
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
-- 0001 = Super Admin A, 0002 = Ordinary User, 0003 = Target,
-- 0004 = Deleted Admin, 0005 = Super Admin B, 0006 = Suspended Admin, 0007 = Deleting Admin
insert into auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values
  ('e7000000-0000-0000-0000-000000000001', '2348077770001', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000002', '2348077770002', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000003', '2348077770003', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000004', '2348077770004', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000005', '2348077770005', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000006', '2348077770006', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e7000000-0000-0000-0000-000000000007', '2348077770007', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.profiles (id, phone, full_name, state, lga)
values
  ('e7000000-0000-0000-0000-000000000001', '2348077770001', 'Compliance Super Admin A', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000002', '2348077770002', 'Compliance Officer', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000003', '2348077770003', 'Compliance Target', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000004', '2348077770004', 'Deleted Compliance Admin', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000005', '2348077770005', 'Compliance Super Admin B', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000006', '2348077770006', 'Suspended Compliance Admin', 'Oyo', 'Ibadan'),
  ('e7000000-0000-0000-0000-000000000007', '2348077770007', 'Deleting Compliance Admin', 'Oyo', 'Ibadan')
on conflict (id) do nothing;

update public.profiles
   set deletion_status = 'completed', deleted_at = now()
 where id = 'e7000000-0000-0000-0000-000000000004';
update public.profiles
   set suspended_at = now()
 where id = 'e7000000-0000-0000-0000-000000000006';
update public.profiles
   set deletion_status = 'storage_pending'
 where id = 'e7000000-0000-0000-0000-000000000007';

insert into public.admin_roles (profile_id, admin_role)
values
  ('e7000000-0000-0000-0000-000000000001', 'super_admin'),
  ('e7000000-0000-0000-0000-000000000004', 'super_admin'),
  ('e7000000-0000-0000-0000-000000000005', 'super_admin'),
  ('e7000000-0000-0000-0000-000000000006', 'super_admin'),
  ('e7000000-0000-0000-0000-000000000007', 'super_admin')
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

-- 8-11: Deleted, suspended, and deleting accounts are denied with ZERO persistent writes
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'denied',
  'deleted account is denied compliance lookup'
);
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'denied',
  'suspended account is denied compliance lookup'
);
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'denied',
  'deleting account is denied compliance lookup'
);
reset role;
select ok(
  (select count(*) = 0 from public.audit_log
    where actor_id in (
      'e7000000-0000-0000-0000-000000000004',
      'e7000000-0000-0000-0000-000000000006',
      'e7000000-0000-0000-0000-000000000007'
    ) and action = 'ai_actor_compliance_lookup')
  and (select count(*) = 0 from private.ai_compliance_lookup_limits)
  and (select count(*) = 0 from private.ai_compliance_lookup_throttle_state),
  'deleted, suspended and deleting accounts generate zero compliance audit, limit or throttle records'
);

-- 12-16: Disabled feature write suppression inside cooldown + deterministic cooldown expiry
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request')->>'status',
  'unavailable',
  'first disabled-feature call returns unavailable'
);

reset role;
select set_config('test.disabled_ctid_before',
  (select ctid::text from private.ai_compliance_lookup_throttle_state
    where scope_key = 'unavailable:e7000000-0000-0000-0000-000000000001'), true);
select set_config('test.disabled_ts_before',
  (select last_recorded_at::text from private.ai_compliance_lookup_throttle_state
    where scope_key = 'unavailable:e7000000-0000-0000-0000-000000000001'), true);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  (select count(*)::int from generate_series(1, 10)
   where public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request')->>'status' = 'unavailable'),
  10,
  '10 subsequent disabled-feature calls inside cooldown all return unavailable'
);

reset role;
select ok(
  (select ctid::text = current_setting('test.disabled_ctid_before')
      and last_recorded_at::text = current_setting('test.disabled_ts_before')
      and sampled_suppression_events = 1
     from private.ai_compliance_lookup_throttle_state
    where scope_key = 'unavailable:e7000000-0000-0000-0000-000000000001')
  and (select count(*) = 0 from private.ai_compliance_lookup_limits),
  '10 disabled-feature calls inside cooldown execute ZERO UPDATEs (ctid, last_recorded_at and sampled_suppression_events unchanged)'
);

-- Deterministically expire cooldown (shift last_recorded_at back 65s while remaining inside 900s window)
update private.ai_compliance_lookup_throttle_state
   set last_recorded_at = last_recorded_at - interval '65 seconds'
 where scope_key = 'unavailable:e7000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(
  public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request')->>'status',
  'unavailable',
  'disabled-feature call after cooldown expiry still returns unavailable'
);

reset role;
select ok(
  (select sampled_suppression_events = 2
     from private.ai_compliance_lookup_throttle_state
    where scope_key = 'unavailable:e7000000-0000-0000-0000-000000000001')
  and (select count(*) = 1 from public.audit_log
        where actor_id = 'e7000000-0000-0000-0000-000000000001'
          and action = 'ai_actor_compliance_lookup'
          and new_values->>'outcome' = 'unavailable'),
  'disabled-feature call after cooldown expiry increments sampled_suppression_events to 2 without adding extra audit_log rows'
);

-- Enable compliance lookup for functional & rate-limiting tests
delete from private.ai_compliance_lookup_limits;
delete from private.ai_compliance_lookup_throttle_state;
update private.ai_compliance_lookup_config
   set enabled = true,
       window_seconds = 900,
       throttle_write_cooldown_seconds = 60,
       principal_attempt_limit = 10,
       principal_denied_limit = 5,
       system_attempt_limit = 30,
       updated_at = clock_timestamp()
 where singleton = true;

-- 17-24: Permitted, unknown, malformed, unapproved purpose, and permission denial
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

-- 25-33: Principal-level limit, write suppression proof (ctid unchanged), cooldown expiry, parameter-variation resistance, and principal isolation
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

select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'throttled',
  'first over-limit request is throttled and creates initial throttle state'
);

reset role;
select set_config('test.principal_ctid_before',
  (select ctid::text from private.ai_compliance_lookup_throttle_state
    where scope_key = 'principal:e7000000-0000-0000-0000-000000000001'), true);
select set_config('test.principal_win_before',
  (select window_started_at::text from private.ai_compliance_lookup_throttle_state
    where scope_key = 'principal:e7000000-0000-0000-0000-000000000001'), true);
select set_config('test.principal_ts_before',
  (select last_recorded_at::text from private.ai_compliance_lookup_throttle_state
    where scope_key = 'principal:e7000000-0000-0000-0000-000000000001'), true);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- Vary subject IDs and purposes across 20 subsequent calls inside cooldown
select is(
  (select count(*)::int from generate_series(1, 20) g
   where public.compliance_lookup_ai_actor(
     case when g % 2 = 0 then :'actor_id'::uuid else gen_random_uuid() end,
     case when g % 3 = 0 then 'regulatory_inquiry' when g % 3 = 1 then 'security_incident' else 'legal_obligation' end
   )->>'status' = 'throttled'),
  20,
  '20 repeated calls inside cooldown (with varied subject IDs and purposes) are all throttled'
);

reset role;
select is(
  (select count(*)::int from private.ai_compliance_lookup_limits
   where principal_id = 'e7000000-0000-0000-0000-000000000001'),
  5,
  'ai_compliance_lookup_limits stays bounded at 5 rows despite 21 throttled calls'
);

select ok(
  (select ctid::text = current_setting('test.principal_ctid_before')
      and last_recorded_at::text = current_setting('test.principal_ts_before')
      and window_started_at::text = current_setting('test.principal_win_before')
      and sampled_suppression_events = 1
     from private.ai_compliance_lookup_throttle_state
    where scope_key = 'principal:e7000000-0000-0000-0000-000000000001'),
  '20 repeated throttled calls inside cooldown execute ZERO UPDATEs on throttle_state (ctid and timestamps unchanged)'
);

select is(
  (select count(*)::int from public.audit_log
   where actor_id = 'e7000000-0000-0000-0000-000000000001'
     and action = 'ai_actor_compliance_lookup'
     and new_values->>'outcome' = 'throttled'),
  1,
  '21 throttled calls in one rolling window emit exactly one bounded audit_log summary row'
);

-- Deterministically expire cooldown (shift last_recorded_at back 65s, preserving window_started_at)
update private.ai_compliance_lookup_throttle_state
   set last_recorded_at = last_recorded_at - interval '65 seconds'
 where scope_key = 'principal:e7000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'throttled',
  'request after cooldown expiry remains throttled'
);

reset role;
select ok(
  (select sampled_suppression_events = 2
      and window_started_at::text = current_setting('test.principal_win_before')
     from private.ai_compliance_lookup_throttle_state
    where scope_key = 'principal:e7000000-0000-0000-0000-000000000001')
  and (select count(*) = 1 from public.audit_log
        where actor_id = 'e7000000-0000-0000-0000-000000000001'
          and action = 'ai_actor_compliance_lookup'
          and new_values->>'outcome' = 'throttled'),
  'cooldown expiry permits exactly one sampled update without resetting window_started_at or emitting extra audit_log rows'
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

-- 34-37: System-wide ceiling and write suppression under 20 repeated rejected calls
reset role;
delete from private.ai_compliance_lookup_limits;
delete from private.ai_compliance_lookup_throttle_state;
update private.ai_compliance_lookup_config
   set principal_attempt_limit = 100,
       principal_denied_limit = 100,
       system_attempt_limit = 8,
       updated_at = clock_timestamp()
 where singleton = true;

-- Callers without audit.read must not consume the shared system-wide ceiling.
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is(
  (select count(*)::int from generate_series(1, 20)
   where public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status' = 'denied'),
  20,
  '20 calls from a caller without audit.read are all denied'
);
reset role;
select ok(
  (select count(*) = 0 from private.ai_compliance_lookup_limits)
  and (select sampled_suppression_events = 1
         from private.ai_compliance_lookup_throttle_state
        where scope_key = 'unauthorised:e7000000-0000-0000-0000-000000000002'),
  'callers without audit.read write no admission counters and only one sampled throttle record'
);

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
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'throttled',
  'first request past system-wide ceiling creates initial system throttle state'
);

reset role;
select set_config('test.sys_ctid_before',
  (select ctid::text from private.ai_compliance_lookup_throttle_state where scope_key = 'system:global'), true);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(
  (select count(*)::int from generate_series(1, 20)
   where public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status' = 'throttled'),
  20,
  '20 repeated calls after system-wide ceiling inside cooldown are all throttled'
);

reset role;
select ok(
  (select count(*) = 8 from private.ai_compliance_lookup_limits)
  and (select ctid::text = current_setting('test.sys_ctid_before')
          and sampled_suppression_events = 1
         from private.ai_compliance_lookup_throttle_state where scope_key = 'system:global')
  and ((select count(*)::int from public.audit_log
         where action = 'ai_actor_compliance_lookup'
           and new_values->>'outcome' = 'throttled')
       - current_setting('test.sys_throttle_audit_before')::integer = 1),
  'system-wide throttling keeps limits at 8, executes ZERO UPDATEs inside cooldown (ctid unchanged) and emits 1 audit_log row'
);

-- 38-44: M4.1.1 deterministic rolling-window boundary & N_max = ceil(900/60) = 15 verification
-- Case A: Just before rolling-window boundary (899s elapsed, inside cooldown) -> no reset, no update, no extra audit
update private.ai_compliance_lookup_throttle_state
   set window_started_at = clock_timestamp() - interval '899 seconds',
       last_recorded_at = clock_timestamp() - interval '10 seconds'
 where scope_key = 'system:global';

select set_config('test.before_win_ctid',
  (select ctid::text from private.ai_compliance_lookup_throttle_state where scope_key = 'system:global'), true);
select set_config('test.before_win_started',
  (select window_started_at::text from private.ai_compliance_lookup_throttle_state where scope_key = 'system:global'), true);
select set_config('test.before_win_audit',
  (select count(*)::text from public.audit_log where action = 'ai_actor_compliance_lookup' and new_values->>'outcome' = 'throttled'), true);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'throttled',
  'just before rolling-window boundary (899s), request remains throttled'
);

reset role;
select ok(
  (select ctid::text = current_setting('test.before_win_ctid')
      and window_started_at::text = current_setting('test.before_win_started')
      and sampled_suppression_events = 1
     from private.ai_compliance_lookup_throttle_state where scope_key = 'system:global')
  and (select count(*)::int from public.audit_log
        where action = 'ai_actor_compliance_lookup' and new_values->>'outcome' = 'throttled')
      = current_setting('test.before_win_audit')::integer,
  'just before rolling-window boundary (899s), window does not reset and zero DML or audit writes occur'
);

-- Case E + B: Simulate all 14 subsequent 60s cooldown steps (reaching 840s -> sampled_suppression_events = 15),
-- verify suppression inside cooldown at step 15, then test exact 900s boundary resets to 1 (never 16).
do $$
declare
  v_step integer;
  v_status text;
begin
  for v_step in 1..14 loop
    update private.ai_compliance_lookup_throttle_state
       set window_started_at = clock_timestamp() - make_interval(secs => v_step * 60),
           last_recorded_at = clock_timestamp() - interval '60 seconds'
     where scope_key = 'system:global';

    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims',
      '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
    v_status := public.compliance_lookup_ai_actor(gen_random_uuid(), 'data_subject_request')->>'status';
    if v_status <> 'throttled' then
      raise exception 'Expected throttled at cooldown step %, got %', v_step, v_status;
    end if;
    reset role;
  end loop;
end $$;

select ok(
  (select sampled_suppression_events = 15
     from private.ai_compliance_lookup_throttle_state where scope_key = 'system:global')
  and (select count(*)::int from public.audit_log
        where action = 'ai_actor_compliance_lookup' and new_values->>'outcome' = 'throttled')
      = current_setting('test.before_win_audit')::integer,
  '14 cooldown expiries within 900s window reach exact maximum N_max = ceil(900/60) = 15 with zero extra audit rows'
);

-- Verify suppression inside cooldown immediately after the 15th sampled write
select set_config('test.step15_ctid',
  (select ctid::text from private.ai_compliance_lookup_throttle_state where scope_key = 'system:global'), true);
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'throttled',
  'request inside cooldown after 15th sampled write remains throttled'
);
reset role;
select ok(
  (select ctid::text = current_setting('test.step15_ctid')
      and sampled_suppression_events = 15
     from private.ai_compliance_lookup_throttle_state where scope_key = 'system:global'),
  'request inside cooldown after 15th sampled write executes ZERO UPDATEs (ctid unchanged)'
);

-- Case B: At exact 900s rolling-window boundary (window_started_at <= v_window_cutoff),
-- window resets to sampled_suppression_events = 1 (never 16) and emits exactly 1 new audit summary row.
update private.ai_compliance_lookup_throttle_state
   set window_started_at = clock_timestamp() - interval '900 seconds',
       last_recorded_at = clock_timestamp() - interval '60 seconds'
 where scope_key = 'system:global';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status',
  'throttled',
  'at exact 900s boundary, request remains throttled while limits still hold 8 active rows'
);
reset role;
select ok(
  (select count(*) = 1 from private.ai_compliance_lookup_throttle_state where scope_key = 'system:global')
  and (select sampled_suppression_events = 1
         from private.ai_compliance_lookup_throttle_state where scope_key = 'system:global')
  and ((select count(*)::int from public.audit_log
         where action = 'ai_actor_compliance_lookup' and new_values->>'outcome' = 'throttled')
       = current_setting('test.before_win_audit')::integer + 1),
  'at exact 900s boundary, rolling window resets cleanly to sampled_suppression_events = 1 (never 16) with 1 new audit summary'
);

-- Case C: Just after rolling-window boundary (905s elapsed) -> expired window is replaced cleanly
update private.ai_compliance_lookup_throttle_state
   set window_started_at = clock_timestamp() - interval '905 seconds',
       last_recorded_at = clock_timestamp() - interval '65 seconds'
 where scope_key = 'system:global';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e7000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select ok(
  public.compliance_lookup_ai_actor(:'actor_id'::uuid, 'data_subject_request')->>'status' = 'throttled',
  'just after rolling-window boundary (905s), expired window is replaced cleanly and returns throttled'
);
reset role;

-- 38: Transaction rollback leaves counters, throttle state, and audit_log consistent
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
  and (select count(*) = 0 from private.ai_compliance_lookup_throttle_state)
  and (select count(*)::int from public.audit_log where action = 'ai_actor_compliance_lookup')
      = current_setting('test.rollback_audit_before')::integer,
  'rolled-back lookup transaction leaves zero counter, throttle-state or audit_log artifacts'
);

-- 39-41: service_role revocation, direct directory isolation, and deleted-account enabled-feature check
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
  'deleted account remains denied with zero writes even when feature is enabled'
);

select * from finish();
rollback;
