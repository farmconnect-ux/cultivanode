-- Batch 03.3 pgTAP tests: telemetry trust boundary and scheduler failure visibility (PR #24 review, Medium 3 and 4)
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, phone)
values ('37000000-0000-4000-8000-000000000001', '2348037000001')
on conflict (id) do nothing;

insert into public.farms (id, owner_id, name, zone, state, location)
values ('37000000-0000-4000-8000-000000000101', '37000000-0000-4000-8000-000000000001', 'Farm Trust 37', 'derived_savanna', 'Oyo', extensions.st_geogfromtext('POINT(3.947 7.3775)'))
on conflict (id) do nothing;

insert into public.farm_machinery_assets (id, farm_id, asset_code, name, category, engine_hours)
values ('37000000-0000-4000-8000-000000000201', '37000000-0000-4000-8000-000000000101', 'TR-37', 'Tractor 37', 'tractor', 50.0)
on conflict (id) do nothing;

-- 1. The provenance trigger now runs with the caller's privileges (no SECURITY DEFINER).
select ok(
  not (select p.prosecdef
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'private' and p.proname = 'guard_machinery_telemetry_provenance'),
  'guard_machinery_telemetry_provenance is SECURITY INVOKER'
);

-- Act as the farm owner and try to switch on the old trust flags.
set local role authenticated;
select set_config('request.jwt.claim.sub', '37000000-0000-4000-8000-000000000001', true);
select set_config('app.telemetry_trusted_writer', '1', true);
select set_config('app.telemetry_trust_transition', '1', true);

-- 2. Setting the old flag no longer lets a direct insert claim device provenance.
select throws_ok(
  $$
    insert into public.machinery_telemetry (
      farm_id, machinery_id, recorded_at, status, source_category, validation_status, trust_classification
    ) values (
      '37000000-0000-4000-8000-000000000101', '37000000-0000-4000-8000-000000000201', now() - interval '1 minute',
      'idle', 'device_authenticated', 'verified', 'verified_current'
    )
  $$,
  '42501',
  null,
  'session flag cannot make a direct insert device_authenticated'
);

-- 3. ...nor verified_current on an otherwise ordinary row.
select throws_ok(
  $$
    insert into public.machinery_telemetry (
      farm_id, machinery_id, recorded_at, status, trust_classification
    ) values (
      '37000000-0000-4000-8000-000000000101', '37000000-0000-4000-8000-000000000201', now() - interval '1 minute',
      'idle', 'verified_current'
    )
  $$,
  '42501',
  null,
  'session flag cannot make a direct insert verified_current'
);

-- 4. An ordinary direct observation still works with the invoker trigger and is downgraded correctly.
select lives_ok(
  $$
    insert into public.machinery_telemetry (farm_id, machinery_id, recorded_at, status, fuel_pct, trace_id)
    values (
      '37000000-0000-4000-8000-000000000101', '37000000-0000-4000-8000-000000000201', now() - interval '2 minutes',
      'idle', 55, '37000000-0000-4000-8000-000000000999'
    )
  $$,
  'farm owner can still record a plain observation'
);

select ok(
  (select source_category = 'farmer_observation'
      and validation_status = 'provisional'
      and trust_classification = 'unverified_provisional'
      and actor_id = '37000000-0000-4000-8000-000000000001'::uuid
      and payload_sha256 ~ '^[a-f0-9]{64}$'
     from public.machinery_telemetry
    where trace_id = '37000000-0000-4000-8000-000000000999'),
  'direct observation is farmer_observation, provisional, attributed and hashed'
);

reset role;
-- Clear the transaction-local JWT identity: scheduler functions refuse JWT-authenticated sessions.
select set_config('request.jwt.claim.sub', '', true);

-- 6. The failure assertion is private to the scheduler.
select ok(
  has_function_privilege('cultivanode_scheduler', 'private.assert_scheduled_task_succeeded(text)', 'execute')
  and not has_function_privilege('authenticated', 'private.assert_scheduled_task_succeeded(text)', 'execute')
  and not has_function_privilege('anon', 'private.assert_scheduled_task_succeeded(text)', 'execute')
  and not has_function_privilege('service_role', 'private.assert_scheduled_task_succeeded(text)', 'execute'),
  'assert_scheduled_task_succeeded is executable only by the scheduler role (and owner)'
);

-- 7. Unknown task names are rejected.
select throws_ok(
  $$ select private.assert_scheduled_task_succeeded('drop_everything') $$,
  '22023',
  null,
  'unknown task name rejected'
);

-- 8. A latest run that failed makes the assertion raise (so pg_cron marks the job run failed).
insert into private.scheduled_task_runs (task_name, invoking_user, effective_user, status, started_at, finished_at, duration_ms, error_code, error_message)
values ('expire_bookings', 'postgres', 'postgres', 'failed', clock_timestamp(), clock_timestamp(), 3, 'XX000', 'simulated failure');

select throws_ok(
  $$ select private.assert_scheduled_task_succeeded('expire_bookings') $$,
  'P0001',
  null,
  'assertion raises when the latest run failed'
);

-- 9. A later successful run clears it.
insert into private.scheduled_task_runs (task_name, invoking_user, effective_user, status, started_at, finished_at, duration_ms)
values ('expire_bookings', 'postgres', 'postgres', 'completed', clock_timestamp() + interval '1 second', clock_timestamp() + interval '1 second', 2);

select lives_ok(
  $$ select private.assert_scheduled_task_succeeded('expire_bookings') $$,
  'assertion passes when the latest run completed'
);

-- 10. A real run through the wrapper followed by the assertion passes end to end.
select private.run_scheduled_task('auto_confirm_bookings');

select lives_ok(
  $$ select private.assert_scheduled_task_succeeded('auto_confirm_bookings') $$,
  'wrapper run then assertion succeeds for a healthy task'
);

-- 11. When pg_cron is present, every registered job runs the wrapper, commits, then asserts.
select ok(
  not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron')
  or (
    select count(*) = 3
           and bool_and(j.command like 'select private.run_scheduled_task(%); commit; select private.assert_scheduled_task_succeeded(%);')
      from cron.job j
      join private.scheduled_task_registry r on r.cron_job_name = j.jobname
  ),
  'cron jobs run, commit, then assert success'
);

select * from finish();
rollback;
