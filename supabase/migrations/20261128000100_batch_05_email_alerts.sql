-- CultivaNode, Batch 05 (part 4): farm alerts by email (FIE blueprint 5.6, BP-D7: in-app and email now).
--
-- Email is an integration kind like SMS and weather: staff choose the provider and paste its key in
-- Admin > Integrations, and the key lives in Vault. Providers:
--   resend      Resend HTTP API (default).
--   smtp        Any SMTP server (Zoho, Google Workspace, Brevo, Mailgun, a company mail server...). Supabase Edge
--               Functions block outgoing ports 25 and 587, so use port 465 (TLS) or another port the server offers.
--   mock_email  Development only: accepts every message and sends nothing.
--
-- Flow: every farm alert notification (kind farm_*) queues one email_outbox row for the farm owner, if the
-- profile has an email address and has not turned farm alert emails off. pg_cron wakes the send-email Edge
-- Function every 15 minutes when something is due; it claims the rows, groups them per person into one email
-- (so the 06:00 monitor run becomes one morning digest) and sends through the active provider. Rows older
-- than 3 days are dropped instead of sent, so a provider fixed late does not send stale alerts.
-- No email addresses are stored in the queue: the worker reads them at send time.

------------------------------------------------------------------------------------------------
-- 1. Providers
------------------------------------------------------------------------------------------------
insert into public.integration_providers
  (code, kind, name, description, docs_url, implemented, test_only, config_fields, secret_fields, sort_order)
values
  ('resend', 'email', 'Resend',
   'Email API. Verify your sending domain in Resend first; the From address must use that domain.',
   'https://resend.com/docs/api-reference/emails/send-email', true, false,
   '[{"key":"from_email","label":"From address","required":true,"help":"For example alerts@yourdomain.com, on a domain verified in Resend."},
     {"key":"from_name","label":"From name","required":true,"default":"CultivaNode"},
     {"key":"reply_to","label":"Reply-to address","required":false,"help":"Where replies go. Leave empty to use the From address."}]',
   '[{"key":"api_key","label":"API key","required":true,"help":"Starts with re_. A key with Sending access is enough."}]', 10),
  ('smtp', 'email', 'SMTP server',
   'Any mail server or email service that offers SMTP. Supabase blocks ports 25 and 587, so use 465 (TLS) or another port your server offers.',
   null, true, false,
   '[{"key":"host","label":"SMTP host","required":true,"help":"For example smtp.zoho.com or smtp-relay.brevo.com."},
     {"key":"port","label":"Port","required":true,"default":"465"},
     {"key":"security","label":"Security","required":true,"default":"tls","options":["tls","starttls"],"help":"tls for port 465; starttls for servers that upgrade a plain connection."},
     {"key":"username","label":"Username","required":true},
     {"key":"from_email","label":"From address","required":true},
     {"key":"from_name","label":"From name","required":true,"default":"CultivaNode"},
     {"key":"reply_to","label":"Reply-to address","required":false}]',
   '[{"key":"password","label":"Password or app password","required":true}]', 20),
  ('mock_email', 'email', 'Test email (no messages sent)',
   'Accepts every message and sends nothing. Development only.', null, true, true, '[]', '[]', 90)
on conflict (code) do nothing;

insert into public.integration_configs (provider, mode) values ('resend', 'live'), ('smtp', 'live')
on conflict (provider) do nothing;
insert into public.integration_settings (kind, active_provider) values ('email', 'resend')
on conflict (kind) do nothing;

------------------------------------------------------------------------------------------------
-- 2. The farmer's choice: farm alert emails on (default) or off
------------------------------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  profile_id        uuid primary key references public.profiles (id) on delete cascade,
  farm_alert_email  boolean not null default true,
  updated_at        timestamptz not null default now()
);
comment on table public.notification_preferences is 'Per-person delivery choices. No row means the defaults (farm alert emails on).';
alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon, authenticated;
grant select on public.notification_preferences to authenticated;
create policy notification_preferences_own on public.notification_preferences
  for select to authenticated using (profile_id = (select auth.uid()));

create or replace function public.set_farm_alert_email(p_on boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Sign in required.' using errcode = '42501';
  end if;
  if p_on is null then
    raise exception 'Choose on or off.' using errcode = '22023';
  end if;
  insert into public.notification_preferences (profile_id, farm_alert_email, updated_at)
  values (v_uid, p_on, clock_timestamp())
  on conflict (profile_id) do update set farm_alert_email = excluded.farm_alert_email, updated_at = excluded.updated_at;
  -- Turning emails off also drops anything still waiting to go out.
  if not p_on then
    update public.email_outbox set status = 'skipped', error_code = 'opted_out', locked_at = null
     where profile_id = v_uid and status = 'queued';
  end if;
end;
$$;

------------------------------------------------------------------------------------------------
-- 3. Queue
------------------------------------------------------------------------------------------------
create table if not exists public.email_outbox (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  kind             text not null check (kind ~ '^[a-z][a-z_]{2,40}$'),
  data             jsonb not null default '{}'::jsonb,
  status           text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'skipped')),
  attempts         smallint not null default 0 check (attempts between 0 and 10),
  next_attempt_at  timestamptz not null default now(),
  locked_at        timestamptz,
  provider         text check (provider is null or provider ~ '^[a-z][a-z0-9_]{1,39}$'),
  message_id       text check (message_id is null or char_length(message_id) <= 200),
  error_code       text check (error_code is null or char_length(error_code) <= 80),
  created_at       timestamptz not null default now(),
  sent_at          timestamptz
);
create index if not exists email_outbox_due_idx on public.email_outbox (next_attempt_at) where status in ('queued', 'sending');
create index if not exists email_outbox_profile_idx on public.email_outbox (profile_id);
comment on table public.email_outbox is
  'Emails waiting for the send-email worker. No email addresses here: the worker reads them at send time. Service role only.';
alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon, authenticated;

-- A usable address on the profile, and the person has not turned farm alert emails off.
create or replace function private.farm_alert_email_wanted(p_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = p_profile
       and p.suspended_at is null and p.deleted_at is null
       and p.email ~* '^[^@\s<>"]+@[^@\s<>"]+\.[a-z]{2,}$'
       and coalesce((select n.farm_alert_email from public.notification_preferences n where n.profile_id = p.id), true)
  );
$$;

-- Every farm alert notification queues an email (the farm monitors call private.notify, which inserts it).
create or replace function private.enqueue_farm_alert_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind like 'farm\_%' and private.farm_alert_email_wanted(new.profile_id) then
    insert into public.email_outbox (profile_id, kind, data) values (new.profile_id, new.kind, new.data);
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_farm_alert_email on public.notifications;
create trigger notifications_farm_alert_email
  after insert on public.notifications
  for each row execute function private.enqueue_farm_alert_email();

-- Worker: claim a batch. Gives back rows a dead worker left in 'sending', drops stale or unwanted ones.
create or replace function public.claim_email_outbox(p_limit integer default 100)
returns table (id uuid, profile_id uuid, kind text, data jsonb, email text, full_name text,
               language public.app_language, attempts smallint)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  update public.email_outbox o set status = 'queued', locked_at = null
   where o.status = 'sending' and o.locked_at < now() - interval '10 minutes';

  update public.email_outbox o set status = 'skipped', error_code = 'expired', locked_at = null
   where o.status = 'queued' and o.created_at < now() - interval '3 days';

  update public.email_outbox o set status = 'skipped', error_code = 'no_recipient', locked_at = null
   where o.status = 'queued' and not private.farm_alert_email_wanted(o.profile_id);

  return query
  with due as (
    select o.id from public.email_outbox o
     where o.status = 'queued' and o.next_attempt_at <= now()
     order by o.profile_id, o.created_at
     limit greatest(1, least(coalesce(p_limit, 100), 500))
     for update skip locked
  ), taken as (
    update public.email_outbox o
       set status = 'sending', attempts = o.attempts + 1, locked_at = now()
      from due where o.id = due.id
    returning o.id, o.profile_id, o.kind, o.data, o.attempts
  )
  select t.id, t.profile_id, t.kind, t.data, p.email, p.full_name, p.preferred_language, t.attempts
    from taken t join public.profiles p on p.id = t.profile_id;
end;
$$;

-- Records the result. A retryable failure goes back in the queue (5, then 10 minutes later) up to 3 attempts.
create or replace function public.finish_email_outbox(p_ids uuid[], p_ok boolean, p_provider text, p_message_id text,
                                                      p_error text, p_retry boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.email_outbox o
     set status = case when p_ok then 'sent' when p_retry and o.attempts < 3 then 'queued' else 'failed' end,
         next_attempt_at = case when not p_ok and p_retry and o.attempts < 3
                                then now() + make_interval(mins => 5 * o.attempts) else o.next_attempt_at end,
         provider = left(p_provider, 40),
         message_id = left(p_message_id, 200),
         error_code = case when p_ok then null else left(p_error, 80) end,
         sent_at = case when p_ok then now() else null end,
         locked_at = null
   where o.id = any (p_ids) and o.status = 'sending';
end;
$$;

-- Wake the worker (same pattern and Vault secret as private.wake_notify_worker) when something is due.
create or replace function private.wake_email_worker()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url    text := (select decrypted_secret from vault.decrypted_secrets where name = 'functions_base_url');
  v_secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'notify_worker_secret');
begin
  if not exists (select 1 from public.email_outbox where status = 'queued' and next_attempt_at <= now()) then
    return false;
  end if;
  if v_url is null or v_secret is null or not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_net') then
    return false;
  end if;
  execute 'select net.http_post(url := $1, body := ''{}''::jsonb, headers := $2, timeout_milliseconds := 120000)'
    using rtrim(v_url, '/') || '/send-email',
          jsonb_build_object('Content-Type', 'application/json', 'x-worker-secret', v_secret);
  return true;
end;
$$;

alter function public.set_farm_alert_email(boolean) owner to postgres;
alter function private.farm_alert_email_wanted(uuid) owner to postgres;
alter function private.enqueue_farm_alert_email() owner to postgres;
alter function public.claim_email_outbox(integer) owner to postgres;
alter function public.finish_email_outbox(uuid[], boolean, text, text, text, boolean) owner to postgres;
alter function private.wake_email_worker() owner to postgres;

revoke all on function public.set_farm_alert_email(boolean) from public, anon, service_role;
grant execute on function public.set_farm_alert_email(boolean) to authenticated;
revoke all on function private.farm_alert_email_wanted(uuid) from public, anon, authenticated, service_role;
revoke all on function private.enqueue_farm_alert_email() from public, anon, authenticated, service_role;
revoke all on function public.claim_email_outbox(integer) from public, anon, authenticated;
grant execute on function public.claim_email_outbox(integer) to service_role;
revoke all on function public.finish_email_outbox(uuid[], boolean, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.finish_email_outbox(uuid[], boolean, text, text, text, boolean) to service_role;
revoke all on function private.wake_email_worker() from public, anon, authenticated, service_role, cultivanode_scheduler;

------------------------------------------------------------------------------------------------
-- 4. Scheduler: wake_email_worker every 15 minutes (does nothing when the queue is empty).
--    run_scheduled_task copied from 20261127000000 with one new branch.
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
      when 'farm_monitors' then
        v_summary := private.run_farm_monitors(v_trace_id);
      when 'wake_weather_worker' then
        v_summary := jsonb_build_object('worker_woken', coalesce(private.wake_weather_worker(), false));
      when 'wake_email_worker' then
        v_summary := jsonb_build_object('worker_woken', coalesce(private.wake_email_worker(), false));
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

insert into private.scheduled_task_registry (
  task_name, cron_job_name, cron_schedule, description, is_enabled, prevent_concurrent
) values (
  'wake_email_worker',
  'cultivanode-wake-email-worker',
  '*/15 * * * *',
  'Wake the send-email Edge Function when farm alert emails are waiting.',
  true,
  true
)
on conflict (task_name) do update
  set cron_job_name = excluded.cron_job_name,
      cron_schedule = excluded.cron_schedule,
      description = excluded.description,
      updated_at = clock_timestamp();

do $$
declare
  v_job record;
  v_job_id bigint;
  v_actual_user text;
begin
  if not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    update private.scheduled_task_registry
       set effective_cron_username = null,
           username_assignment_note = 'pg_cron extension not installed in this environment',
           updated_at = clock_timestamp()
     where task_name = 'wake_email_worker';
    return;
  end if;

  for v_job in execute format('select jobid from cron.job where jobname = %L', 'cultivanode-wake-email-worker') loop
    execute format('select cron.unschedule(%s)', v_job.jobid);
  end loop;

  execute format(
    'select cron.schedule(%L, %L, %L)',
    'cultivanode-wake-email-worker',
    '*/15 * * * *',
    'select private.run_scheduled_task(''wake_email_worker''); commit; select private.assert_scheduled_task_succeeded(''wake_email_worker'');'
  ) into v_job_id;

  execute format('select username from cron.job where jobid = %s', v_job_id) into v_actual_user;

  update private.scheduled_task_registry
     set effective_cron_username = v_actual_user,
         username_assignment_note = 'Not reassigned: same arrangement as the Batch 03.3 jobs (pg_cron via libpq, '
                                    || 'cultivanode_scheduler is NOLOGIN). The job only calls the allowlisted wrapper.',
         updated_at = clock_timestamp()
   where task_name = 'wake_email_worker';
end $$;
