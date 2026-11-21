-- CultivaNode 3.0, Batch 03.3 (Workstream A): Scheduler Identity & Privilege Hardening
--
-- Establishes a least-privilege execution boundary for pg_cron scheduled tasks:
-- 1. Creates dedicated role `cultivanode_scheduler` (NOLOGIN, NOSUPERUSER, NOCREATEDB,
--    NOCREATEROLE, NOINHERIT, NOBYPASSRLS) with zero public table access and zero direct
--    execution privileges on individual private task functions.
-- 2. Creates `private.scheduled_task_registry` (explicit static allowlist of approved tasks)
--    and `private.scheduled_task_runs` (structured execution ledger with trace_id, invoking/
--    effective roles, duration_ms, status, and sanitized error details).
-- 3. Implements `private.run_scheduled_task(p_task_name text)` (SECURITY DEFINER,
--    SET search_path = '', owned by postgres):
--    - Revoked from PUBLIC, anon, authenticated, service_role; granted ONLY to
--      `cultivanode_scheduler` (and owner postgres).
--    - Validates execution identity (`current_user in ('cultivanode_scheduler', 'postgres')`
--      and `auth.uid() is null`).
--    - Static allowlist dispatch ONLY (zero dynamic SQL; arbitrary SQL or unregistered task
--      names are rejected).
--    - Advisory transaction lock (`pg_try_advisory_xact_lock`) prevents duplicate concurrent
--      runs and records `skipped_concurrent`.
--    - Catches task exceptions inside a subtransaction so partial task mutations roll back
--      while the `failed` ledger entry persists durably.
-- 4. Re-registers the three approved pg_cron jobs to invoke `private.run_scheduled_task(...)`
--    and attempts `cron.alter_job(..., username := 'cultivanode_scheduler')`, transparently
--    recording the actual effective `cron.job.username` in `private.scheduled_task_registry`
--    (because Supabase Hosted `pg_cron` may restrict non-superuser `username` reassignment).
--
-- Rollback notes: Restore direct `cron.schedule` commands for the 3 jobs, drop
-- `private.run_scheduled_task(text)`, and retain `private.scheduled_task_runs` for audit.

------------------------------------------------------------------------------------------------
-- 1. Dedicated Least-Privilege Scheduler Role
------------------------------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'cultivanode_scheduler') then
    create role cultivanode_scheduler
      nologin
      nosuperuser
      nocreatedb
      nocreaterole
      noinherit
      nobypassrls;
  else
    alter role cultivanode_scheduler
      nologin
      nosuperuser
      nocreatedb
      nocreaterole
      noinherit
      nobypassrls;
  end if;
end $$;

-- Grant minimal schema usage on `private` ONLY; revoke everything unnecessary.
revoke all on schema public from cultivanode_scheduler;
revoke all on all tables in schema public from cultivanode_scheduler;
revoke all on all sequences in schema public from cultivanode_scheduler;
revoke all on all functions in schema public from cultivanode_scheduler;
revoke all on all functions in schema private from cultivanode_scheduler;
grant usage on schema private to cultivanode_scheduler;

-- Ensure individual scheduled task functions are never directly callable by non-owner roles
-- (including `cultivanode_scheduler`, `service_role`, `authenticated`, `anon`, and `public`).
revoke all on function private.expire_bookings() from public, anon, authenticated, service_role, cultivanode_scheduler;
revoke all on function private.wake_notify_worker() from public, anon, authenticated, service_role, cultivanode_scheduler;
revoke all on function private.auto_confirm_bookings() from public, anon, authenticated, service_role, cultivanode_scheduler;

------------------------------------------------------------------------------------------------
-- 2. Explicit Task Registry & Structured Execution Ledger
------------------------------------------------------------------------------------------------
create table if not exists private.scheduled_task_registry (
  task_name                 text primary key check (task_name ~ '^[a-z][a-z0-9_]{2,63}$'),
  cron_job_name             text not null unique,
  cron_schedule             text not null,
  description               text not null,
  is_enabled                boolean not null default true,
  prevent_concurrent        boolean not null default true,
  desired_cron_username     text not null default 'cultivanode_scheduler',
  effective_cron_username   text,
  username_assignment_note  text,
  created_at                timestamptz not null default clock_timestamp(),
  updated_at                timestamptz not null default clock_timestamp()
);

alter table private.scheduled_task_registry owner to postgres;
revoke all on table private.scheduled_task_registry from public, anon, authenticated, service_role, cultivanode_scheduler;

create table if not exists private.scheduled_task_runs (
  id                  uuid primary key default gen_random_uuid(),
  trace_id            uuid not null default gen_random_uuid(),
  task_name           text not null references private.scheduled_task_registry (task_name) on delete restrict,
  invoking_user       text not null,
  effective_user      text not null,
  status              text not null check (status in ('completed', 'failed', 'skipped_concurrent', 'rejected')),
  started_at          timestamptz not null default clock_timestamp(),
  finished_at         timestamptz not null default clock_timestamp(),
  duration_ms         integer not null check (duration_ms >= 0),
  result_summary      jsonb not null default '{}'::jsonb,
  error_code          text,
  error_message       text check (error_message is null or char_length(error_message) <= 500)
);

create index if not exists scheduled_task_runs_task_started_idx
  on private.scheduled_task_runs (task_name, started_at desc);

create index if not exists scheduled_task_runs_trace_idx
  on private.scheduled_task_runs (trace_id);

alter table private.scheduled_task_runs owner to postgres;
revoke all on table private.scheduled_task_runs from public, anon, authenticated, service_role, cultivanode_scheduler;

-- Seed the 3 explicitly approved CultivaNode scheduled tasks.
insert into private.scheduled_task_registry (
  task_name, cron_job_name, cron_schedule, description, is_enabled, prevent_concurrent
)
values
  (
    'expire_bookings',
    'cultivanode-expire-bookings',
    '*/5 * * * *',
    'Expire unanswered booking requests past expires_at and enqueue expiry notifications.',
    true,
    true
  ),
  (
    'wake_notify_worker',
    'cultivanode-wake-sms-worker',
    '* * * * *',
    'Wake send-notifications edge worker via pg_net when queued SMS outbox messages are due.',
    true,
    true
  ),
  (
    'auto_confirm_bookings',
    'cultivanode-autoconfirm-bookings',
    '*/15 * * * *',
    'Auto-confirm awaiting_confirmation bookings past the 48-hour confirm_by deadline.',
    true,
    true
  )
on conflict (task_name) do update
  set cron_job_name = excluded.cron_job_name,
      cron_schedule = excluded.cron_schedule,
      description = excluded.description,
      updated_at = clock_timestamp();

------------------------------------------------------------------------------------------------
-- 3. Narrow Allowlisted Scheduler Wrapper (Zero Arbitrary SQL)
------------------------------------------------------------------------------------------------
create or replace function private.run_scheduled_task(
  p_task_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoking_role  text := session_user;
  v_jwt_sub        text := nullif(current_setting('request.jwt.claim.sub', true), '');
  v_task           private.scheduled_task_registry%rowtype;
  v_trace_id       uuid := gen_random_uuid();
  v_started_at     timestamptz := clock_timestamp();
  v_finished_at    timestamptz;
  v_duration_ms    integer;
  v_lock_key       bigint;
  v_locked         boolean := true;
  v_expired_count  integer;
  v_confirmed_cnt  integer;
  v_worker_woken   boolean;
  v_summary        jsonb := '{}'::jsonb;
  v_err_code       text;
  v_err_msg        text;
begin
  -- 1. Reject any PostgREST / JWT-authenticated session immediately.
  if v_jwt_sub is not null then
    raise exception 'Scheduled task runner cannot be invoked from a JWT-authenticated session.'
      using errcode = '42501';
  end if;

  -- 2. Validate invoking identity (only `cultivanode_scheduler`, `postgres`, or `supabase_admin`).
  if v_invoking_role not in ('cultivanode_scheduler', 'postgres', 'supabase_admin') then
    raise exception 'Unauthorized scheduler execution identity: %', v_invoking_role
      using errcode = '42501';
  end if;

  -- 3. Validate task name format and explicit registry allowlist (prevents arbitrary SQL).
  if p_task_name is null or p_task_name !~ '^[a-z][a-z0-9_]{2,63}$' then
    raise exception 'Invalid scheduled task identifier.' using errcode = '22023';
  end if;

  select * into v_task
    from private.scheduled_task_registry
   where task_name = p_task_name;

  if not found or not v_task.is_enabled then
    raise exception 'Scheduled task "%" is not registered or is disabled.', p_task_name
      using errcode = '42501';
  end if;

  -- 4. Prevent duplicate/concurrent execution via advisory transaction lock.
  if v_task.prevent_concurrent then
    v_lock_key := hashtextextended('cultivanode_scheduler:' || p_task_name, 0);
    v_locked := pg_try_advisory_xact_lock(v_lock_key);
    if not v_locked then
      v_finished_at := clock_timestamp();
      v_duration_ms := greatest(0, floor(extract(epoch from (v_finished_at - v_started_at)) * 1000)::integer);

      insert into private.scheduled_task_runs (
        trace_id, task_name, invoking_user, effective_user, status,
        started_at, finished_at, duration_ms, result_summary
      )
      values (
        v_trace_id, p_task_name, v_invoking_role, current_user, 'skipped_concurrent',
        v_started_at, v_finished_at, v_duration_ms,
        jsonb_build_object('reason', 'advisory_lock_held')
      );

      return jsonb_build_object(
        'ok', true,
        'status', 'skipped_concurrent',
        'task_name', p_task_name,
        'trace_id', v_trace_id,
        'invoking_user', v_invoking_role,
        'duration_ms', v_duration_ms
      );
    end if;
  end if;

  -- 5. Static allowlist dispatch inside subtransaction: partial failures roll back cleanly
  --    while the failure ledger entry still persists durably.
  begin
    case p_task_name
      when 'expire_bookings' then
        v_expired_count := private.expire_bookings();
        v_summary := jsonb_build_object('expired_count', coalesce(v_expired_count, 0));
      when 'wake_notify_worker' then
        v_worker_woken := private.wake_notify_worker();
        v_summary := jsonb_build_object('worker_woken', coalesce(v_worker_woken, false));
      when 'auto_confirm_bookings' then
        v_confirmed_cnt := private.auto_confirm_bookings();
        v_summary := jsonb_build_object('auto_confirmed_count', coalesce(v_confirmed_cnt, 0));
      else
        raise exception 'Task "%" has no static handler in scheduler allowlist.', p_task_name
          using errcode = '42501';
    end case;

    v_finished_at := clock_timestamp();
    v_duration_ms := greatest(0, floor(extract(epoch from (v_finished_at - v_started_at)) * 1000)::integer);

    insert into private.scheduled_task_runs (
      trace_id, task_name, invoking_user, effective_user, status,
      started_at, finished_at, duration_ms, result_summary
    )
    values (
      v_trace_id, p_task_name, v_invoking_role, current_user, 'completed',
      v_started_at, v_finished_at, v_duration_ms, v_summary
    );

    return jsonb_build_object(
      'ok', true,
      'status', 'completed',
      'task_name', p_task_name,
      'trace_id', v_trace_id,
      'invoking_user', v_invoking_role,
      'duration_ms', v_duration_ms,
      'result', v_summary
    );
  exception when others then
    v_err_code := sqlstate;
    v_err_msg := left(sqlerrm, 500);
    v_finished_at := clock_timestamp();
    v_duration_ms := greatest(0, floor(extract(epoch from (v_finished_at - v_started_at)) * 1000)::integer);

    insert into private.scheduled_task_runs (
      trace_id, task_name, invoking_user, effective_user, status,
      started_at, finished_at, duration_ms, result_summary, error_code, error_message
    )
    values (
      v_trace_id, p_task_name, v_invoking_role, current_user, 'failed',
      v_started_at, v_finished_at, v_duration_ms, '{}'::jsonb, v_err_code, v_err_msg
    );

    return jsonb_build_object(
      'ok', false,
      'status', 'failed',
      'task_name', p_task_name,
      'trace_id', v_trace_id,
      'invoking_user', v_invoking_role,
      'duration_ms', v_duration_ms,
      'error_code', v_err_code
    );
  end;
end;
$$;

alter function private.run_scheduled_task(text) owner to postgres;
revoke all on function private.run_scheduled_task(text) from public, anon, authenticated, service_role;
grant execute on function private.run_scheduled_task(text) to cultivanode_scheduler;

------------------------------------------------------------------------------------------------
-- 4. Idempotent pg_cron Job Registration & Honest Effective-Username Recording
------------------------------------------------------------------------------------------------
do $$
declare
  v_task           record;
  v_existing_job   record;
  v_job_id         bigint;
  v_actual_user    text;
  v_note           text;
begin
  if not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    update private.scheduled_task_registry
       set effective_cron_username = null,
           username_assignment_note = 'pg_cron extension not installed in this environment',
           updated_at = clock_timestamp();
    return;
  end if;

  for v_task in
    select task_name, cron_job_name, cron_schedule, desired_cron_username
      from private.scheduled_task_registry
     where is_enabled = true
     order by task_name
  loop
    -- Remove any duplicate or obsolete jobs sharing this job name.
    for v_existing_job in
      execute format('select jobid from cron.job where jobname = %L', v_task.cron_job_name)
    loop
      execute format('select cron.unschedule(%s)', v_existing_job.jobid);
    end loop;

    -- Register job to call the narrow allowlisted wrapper ONLY.
    execute format(
      'select cron.schedule(%L, %L, %L)',
      v_task.cron_job_name,
      v_task.cron_schedule,
      format('select private.run_scheduled_task(%L)', v_task.task_name)
    ) into v_job_id;

    v_note := 'Assigned to desired role cultivanode_scheduler';
    begin
      execute format(
        'select cron.alter_job(job_id := %s, username := %L)',
        v_job_id,
        v_task.desired_cron_username
      );
    exception when others then
      -- Hosted Supabase pg_cron restricts non-superuser username reassignment in cron.alter_job.
      -- Record the exact limitation honestly instead of misrepresenting the effective role.
      v_note := left('cron.alter_job username reassignment not permitted: ' || sqlerrm, 400);
    end;

    execute format('select username from cron.job where jobid = %s', v_job_id) into v_actual_user;

    update private.scheduled_task_registry
       set effective_cron_username = v_actual_user,
           username_assignment_note = v_note,
           updated_at = clock_timestamp()
     where task_name = v_task.task_name;
  end loop;
end $$;
