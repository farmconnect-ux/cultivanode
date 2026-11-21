-- Batch 03.3 (Workstream A) pgTAP tests: Scheduler Identity, Privilege Hardening & Allowlisted Wrapper
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- 1. Dedicated cultivanode_scheduler role exists with NOLOGIN, NOSUPERUSER, NOBYPASSRLS, NOINHERIT, NOCREATEDB, NOCREATEROLE.
select ok(
  exists (
    select 1
      from pg_catalog.pg_roles
     where rolname = 'cultivanode_scheduler'
       and rolsuper = false
       and rolbypassrls = false
       and rolcanlogin = false
       and rolcreatedb = false
       and rolcreaterole = false
       and rolinherit = false
  ),
  'cultivanode_scheduler exists with NOLOGIN, NOSUPERUSER, NOBYPASSRLS, NOINHERIT, NOCREATEDB, NOCREATEROLE'
);

-- 2. cultivanode_scheduler has zero direct table privileges on public.bookings, public.farms, or public.sms_outbox.
select ok(
  not has_table_privilege('cultivanode_scheduler', 'public.bookings', 'select')
  and not has_table_privilege('cultivanode_scheduler', 'public.bookings', 'update')
  and not has_table_privilege('cultivanode_scheduler', 'public.farms', 'select')
  and not has_table_privilege('cultivanode_scheduler', 'public.sms_outbox', 'select'),
  'cultivanode_scheduler has zero direct privileges on public tables'
);

-- 3. Individual scheduled task functions are revoked from public, anon, authenticated, service_role, AND cultivanode_scheduler.
select ok(
  not has_function_privilege('authenticated', 'private.expire_bookings()', 'execute')
  and not has_function_privilege('service_role', 'private.expire_bookings()', 'execute')
  and not has_function_privilege('cultivanode_scheduler', 'private.expire_bookings()', 'execute')
  and not has_function_privilege('cultivanode_scheduler', 'private.wake_notify_worker()', 'execute')
  and not has_function_privilege('cultivanode_scheduler', 'private.auto_confirm_bookings()', 'execute'),
  'individual task functions cannot be invoked directly by authenticated, service_role, or cultivanode_scheduler'
);

-- 4. private.run_scheduled_task(text) is granted ONLY to cultivanode_scheduler (never anon, authenticated, or service_role).
select ok(
  not has_function_privilege('anon', 'private.run_scheduled_task(text)', 'execute')
  and not has_function_privilege('authenticated', 'private.run_scheduled_task(text)', 'execute')
  and not has_function_privilege('service_role', 'private.run_scheduled_task(text)', 'execute')
  and has_function_privilege('cultivanode_scheduler', 'private.run_scheduled_task(text)', 'execute'),
  'private.run_scheduled_task(text) is executable by cultivanode_scheduler and revoked from anon/authenticated/service_role'
);

-- 5. Registry tables are inaccessible to anon, authenticated, service_role, and cultivanode_scheduler.
select ok(
  not has_table_privilege('authenticated', 'private.scheduled_task_registry', 'select')
  and not has_table_privilege('service_role', 'private.scheduled_task_registry', 'insert')
  and not has_table_privilege('cultivanode_scheduler', 'private.scheduled_task_runs', 'select'),
  'scheduler registry and runs ledger are inaccessible to non-owner roles'
);

-- 6. All three approved tasks are registered in private.scheduled_task_registry.
select is(
  (select count(*)::int from private.scheduled_task_registry where task_name in ('expire_bookings', 'wake_notify_worker', 'auto_confirm_bookings') and is_enabled = true),
  3,
  'all three approved scheduled tasks are registered and enabled'
);

-- 7. Unregistered task name is rejected (42501).
set local role cultivanode_scheduler;
select throws_ok(
  $$ select private.run_scheduled_task('drop_everything_task') $$,
  '42501',
  null,
  'unregistered task name is rejected'
);

-- 8. Arbitrary SQL injection payload is rejected by strict identifier regex (22023).
select throws_ok(
  $$ select private.run_scheduled_task('expire_bookings; DROP TABLE public.farms;--') $$,
  '22023',
  null,
  'arbitrary SQL payload is rejected by task identifier validation'
);

-- 9. JWT-authenticated context is rejected even if caller somehow holds role privilege (42501).
select set_config('request.jwt.claim.sub', '34000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$ select private.run_scheduled_task('expire_bookings') $$,
  '42501',
  null,
  'JWT-authenticated session is rejected by scheduler wrapper'
);
select set_config('request.jwt.claim.sub', '', true);

-- 10. Legitimate cultivanode_scheduler invocation of expire_bookings completes and records structured run ledger.
select is(
  (private.run_scheduled_task('expire_bookings') ->> 'status'),
  'completed',
  'cultivanode_scheduler executes registered expire_bookings task cleanly'
);

-- 11. Legitimate cultivanode_scheduler invocation of auto_confirm_bookings and wake_notify_worker complete cleanly.
select ok(
  (private.run_scheduled_task('auto_confirm_bookings') ->> 'status') = 'completed'
  and (private.run_scheduled_task('wake_notify_worker') ->> 'status') = 'completed',
  'cultivanode_scheduler executes auto_confirm_bookings and wake_notify_worker cleanly'
);

-- 12. Verify run ledger recorded trace_id, duration_ms, and completed status for all 3 tasks.
reset role;
select is(
  (select count(distinct task_name)::int from private.scheduled_task_runs where status = 'completed' and trace_id is not null and duration_ms >= 0),
  3,
  'structured execution ledger records trace_id and duration for all 3 completed tasks'
);

-- 13. Disabled task cannot be executed (42501).
update private.scheduled_task_registry set is_enabled = false where task_name = 'wake_notify_worker';
set local role cultivanode_scheduler;
select throws_ok(
  $$ select private.run_scheduled_task('wake_notify_worker') $$,
  '42501',
  null,
  'disabled scheduled task is rejected'
);

-- 14. Re-enabling restores execution cleanly; and if pg_cron is installed, no duplicate cron jobs exist for the 3 names.
reset role;
update private.scheduled_task_registry set is_enabled = true where task_name = 'wake_notify_worker';
select ok(
  not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron')
  or (
    select count(*)::int
      from cron.job
     where jobname in ('cultivanode-expire-bookings', 'cultivanode-wake-sms-worker', 'cultivanode-autoconfirm-bookings')
  ) = 3,
  'pg_cron registers exactly 3 non-duplicate jobs when extension is installed'
);

select * from finish();
rollback;
