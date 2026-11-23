-- CultivaNode, Batch 05 (part 1): first farm monitors and intelligence events
-- FIE blueprint section 5.6 (Proactive Intelligence Engine), workflow W3, PRO-AC-01 to 03 and 07.
--
-- Rules first, model second (BP-4): monitors are deterministic SQL rules that create intelligence
-- events. The model is never asked whether an event exists. This part ships three record-based
-- monitors that need no agricultural documents and no weather data:
--   upcoming_operation  crop operations due in the next 7 days (one alert at 7 days, one at 2 days)
--   overdue_operation   crop operations and farm tasks past their date and not done (weekly reminder)
--   soil_test_stale     a nutrient operation within 14 days on a plot with no soil test in 2 years
-- Weather window and inventory shortfall monitors follow in a later part.
--
-- Safety and privacy:
--   * Only farms whose owner has an active account (not deleted, not suspended, no deletion in
--     progress) and a current ai_intelligence consent grant are processed (PRO-AC-03).
--   * Dedup is enforced in the database: an insert with the same dedup_key inside its monitor's
--     cooldown raises unique_violation (PRO-AC-02).
--   * Events are read-only to farmers under RLS (can_view_farm); the only write path for them is
--     respond_to_intelligence_event (useful / not useful / done), which feeds PRO-AC-06.
--   * Each run is recorded in private.scheduled_task_runs through the existing wrapper (PRO-AC-07).

------------------------------------------------------------------------------------------------
-- 1. Monitor registry
------------------------------------------------------------------------------------------------
create table if not exists public.fie_monitors (
  monitor_key       text primary key check (monitor_key ~ '^[a-z][a-z0-9_]{2,63}$'),
  version           integer not null default 1 check (version >= 1),
  enabled           boolean not null default true,
  event_type        text not null check (event_type in ('need', 'risk', 'opportunity', 'anomaly')),
  cooldown          interval not null check (cooldown >= interval '1 hour' and cooldown <= interval '90 days'),
  description       text not null check (char_length(description) between 10 and 500),
  created_at        timestamptz not null default clock_timestamp(),
  updated_at        timestamptz not null default clock_timestamp()
);

alter table public.fie_monitors owner to postgres;
alter table public.fie_monitors enable row level security;
alter table public.fie_monitors force row level security;
revoke all on table public.fie_monitors from public, anon, authenticated, service_role;
grant select on table public.fie_monitors to authenticated;

drop policy if exists fie_monitors_read on public.fie_monitors;
create policy fie_monitors_read on public.fie_monitors
  for select to authenticated using (true);

insert into public.fie_monitors (monitor_key, version, enabled, event_type, cooldown, description)
values
  ('upcoming_operation', 1, true, 'need', interval '30 days',
   'A planned crop operation is due within 7 days. Alerts once at 7 days and once at 2 days.'),
  ('overdue_operation', 1, true, 'need', interval '7 days',
   'A crop operation or farm task is past its date and not marked done. Reminds weekly for 60 days.'),
  ('soil_test_stale', 1, true, 'need', interval '30 days',
   'A fertiliser or manure operation is due within 14 days on a plot with no soil test in the last 2 years.')
on conflict (monitor_key) do update
  set description = excluded.description,
      event_type = excluded.event_type,
      cooldown = excluded.cooldown,
      updated_at = clock_timestamp();

------------------------------------------------------------------------------------------------
-- 2. Intelligence events
------------------------------------------------------------------------------------------------
create table if not exists public.fie_intelligence_events (
  id                   uuid primary key default gen_random_uuid(),
  farm_id              uuid not null references public.farms (id) on delete cascade,
  monitor_key          text not null references public.fie_monitors (monitor_key) on delete restrict,
  monitor_version      integer not null,
  event_type           text not null check (event_type in ('need', 'risk', 'opportunity', 'anomaly')),
  severity             text not null check (severity in ('info', 'warning', 'urgent')),
  subject_type         text not null check (subject_type in ('crop_cycle_operation', 'farm_operational_task', 'crop_cycle', 'plot')),
  subject_id           uuid not null,
  crop_cycle_id        uuid references public.crop_cycles (id) on delete set null,
  dedup_key            text not null check (char_length(dedup_key) between 8 and 200),
  evidence             jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  status               text not null default 'open' check (status in ('open', 'acknowledged', 'dismissed', 'resolved')),
  farmer_response      text check (farmer_response is null or farmer_response in ('useful', 'not_useful')),
  responded_by         uuid references public.profiles (id) on delete set null,
  responded_at         timestamptz,
  notified_profile_id  uuid references public.profiles (id) on delete set null,
  run_trace_id         uuid,
  detected_at          timestamptz not null default clock_timestamp(),
  cooldown_until       timestamptz not null,
  check (cooldown_until > detected_at)
);

create index if not exists fie_intelligence_events_dedup_idx
  on public.fie_intelligence_events (dedup_key, cooldown_until desc);
create index if not exists fie_intelligence_events_farm_idx
  on public.fie_intelligence_events (farm_id, detected_at desc);
create index if not exists fie_intelligence_events_cycle_idx
  on public.fie_intelligence_events (crop_cycle_id) where crop_cycle_id is not null;

alter table public.fie_intelligence_events owner to postgres;
alter table public.fie_intelligence_events enable row level security;
alter table public.fie_intelligence_events force row level security;
revoke all on table public.fie_intelligence_events from public, anon, authenticated, service_role;
grant select on table public.fie_intelligence_events to authenticated;

drop policy if exists fie_intelligence_events_read on public.fie_intelligence_events;
create policy fie_intelligence_events_read on public.fie_intelligence_events
  for select to authenticated using (public.can_view_farm(farm_id));

-- Server-owned fields and database-enforced dedup within the monitor's cooldown (PRO-AC-02).
create or replace function private.fie_prepare_intelligence_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_monitor public.fie_monitors%rowtype;
begin
  select * into v_monitor from public.fie_monitors where monitor_key = new.monitor_key;
  if not found then
    raise exception 'Unknown monitor.' using errcode = '23503';
  end if;

  new.monitor_version := v_monitor.version;
  new.event_type := v_monitor.event_type;
  new.detected_at := clock_timestamp();
  new.cooldown_until := new.detected_at + v_monitor.cooldown;
  new.status := 'open';
  new.farmer_response := null;
  new.responded_by := null;
  new.responded_at := null;

  -- Serialise writers of the same key, then refuse a duplicate inside the cooldown.
  perform pg_advisory_xact_lock(hashtextextended('fie_event:' || new.dedup_key, 0));
  if exists (
    select 1 from public.fie_intelligence_events e
     where e.dedup_key = new.dedup_key
       and e.cooldown_until > new.detected_at
  ) then
    raise exception 'Duplicate intelligence event within cooldown.' using errcode = '23505';
  end if;

  return new;
end;
$$;

alter function private.fie_prepare_intelligence_event() owner to postgres;
revoke all on function private.fie_prepare_intelligence_event() from public, anon, authenticated, service_role;

drop trigger if exists fie_intelligence_events_prepare on public.fie_intelligence_events;
create trigger fie_intelligence_events_prepare
  before insert on public.fie_intelligence_events
  for each row execute function private.fie_prepare_intelligence_event();

------------------------------------------------------------------------------------------------
-- 3. Eligibility: active owner account and current ai_intelligence consent (PRO-AC-03)
------------------------------------------------------------------------------------------------
create or replace function private.fie_farm_is_monitored(p_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.farms f
      join public.profiles p on p.id = f.owner_id
     where f.id = p_farm_id
       and f.status <> 'inactive'
       and p.deleted_at is null
       and p.suspended_at is null
       and p.deletion_status is null
       and coalesce((
         select c.granted
           from public.consents c
          where c.profile_id = f.owner_id
            and c.consent_type = 'ai_intelligence'
          order by c.created_at desc, c.id desc
          limit 1
       ), false)
  );
$$;

alter function private.fie_farm_is_monitored(uuid) owner to postgres;
revoke all on function private.fie_farm_is_monitored(uuid) from public, anon, authenticated, service_role;

------------------------------------------------------------------------------------------------
-- 4. Raise one event and notify the farm owner in-app (no SMS until a provider is contracted)
------------------------------------------------------------------------------------------------
create or replace function private.fie_raise_event(
  p_farm_id        uuid,
  p_monitor_key    text,
  p_severity       text,
  p_subject_type   text,
  p_subject_id     uuid,
  p_crop_cycle_id  uuid,
  p_dedup_key      text,
  p_evidence       jsonb,
  p_kind           text,
  p_note_data      jsonb,
  p_trace_id       uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_id    uuid;
begin
  if exists (
    select 1 from public.fie_intelligence_events e
     where e.dedup_key = p_dedup_key
       and e.cooldown_until > clock_timestamp()
  ) then
    return false;
  end if;

  select owner_id into v_owner from public.farms where id = p_farm_id;
  if v_owner is null then
    return false;
  end if;

  insert into public.fie_intelligence_events (
    farm_id, monitor_key, monitor_version, event_type, severity, subject_type, subject_id,
    crop_cycle_id, dedup_key, evidence, notified_profile_id, run_trace_id, cooldown_until
  ) values (
    p_farm_id, p_monitor_key, 0, 'need', p_severity, p_subject_type, p_subject_id,
    p_crop_cycle_id, p_dedup_key, coalesce(p_evidence, '{}'::jsonb), v_owner, p_trace_id,
    clock_timestamp() + interval '1 hour'  -- replaced by the trigger from the registry
  )
  returning id into v_id;

  perform private.notify(
    v_owner, p_kind, null,
    coalesce(p_note_data, '{}'::jsonb) || jsonb_build_object('event_id', v_id, 'monitor_key', p_monitor_key),
    false
  );
  return true;
end;
$$;

alter function private.fie_raise_event(uuid, text, text, text, uuid, uuid, text, jsonb, text, jsonb, uuid) owner to postgres;
revoke all on function private.fie_raise_event(uuid, text, text, text, uuid, uuid, text, jsonb, text, jsonb, uuid)
  from public, anon, authenticated, service_role;

------------------------------------------------------------------------------------------------
-- 5. Monitors (deterministic rules over farmer records, which stay unverified_provisional)
------------------------------------------------------------------------------------------------
create or replace function private.fie_monitor_upcoming_operation(p_today date, p_trace_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r          record;
  v_days     integer;
  v_mark     text;
  v_count    integer := 0;
begin
  for r in
    select o.id, o.name, o.operation_type, o.scheduled_date,
           c.id as cycle_id, c.crop_id, c.farm_id, f.name as farm_name
      from public.crop_cycle_operations o
      join public.crop_cycles c on c.id = o.crop_cycle_id
      join public.farms f on f.id = c.farm_id
     where o.status in ('pending', 'in_progress')
       and c.status in ('land_preparation', 'planting', 'establishment', 'maintenance', 'harvesting')
       and o.scheduled_date between p_today + 1 and p_today + 7
       and private.fie_farm_is_monitored(f.id)
     order by o.scheduled_date, o.id
     limit 5000
  loop
    v_days := r.scheduled_date - p_today;
    v_mark := case when v_days <= 2 then '2d' else '7d' end;
    if private.fie_raise_event(
      r.farm_id, 'upcoming_operation', case when v_days <= 2 then 'warning' else 'info' end,
      'crop_cycle_operation', r.id, r.cycle_id,
      format('upcoming_operation:%s:%s:%s', r.id, v_mark, r.scheduled_date),
      jsonb_build_object(
        'source', 'crop_cycle_operations', 'state', 'unverified_provisional',
        'operation_type', r.operation_type, 'scheduled_date', r.scheduled_date,
        'days_until', v_days, 'crop_id', r.crop_id),
      'farm_operation_upcoming',
      jsonb_build_object('title', left(r.name, 120), 'name', left(r.farm_name, 120),
                         'job_date', r.scheduled_date, 'crop_cycle_id', r.cycle_id, 'farm_id', r.farm_id),
      p_trace_id
    ) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

create or replace function private.fie_monitor_overdue_operation(p_today date, p_trace_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r          record;
  v_late     integer;
  v_count    integer := 0;
begin
  -- Crop operations on active cycles.
  for r in
    select o.id, o.name, o.operation_type, o.scheduled_date,
           c.id as cycle_id, c.crop_id, c.farm_id, f.name as farm_name
      from public.crop_cycle_operations o
      join public.crop_cycles c on c.id = o.crop_cycle_id
      join public.farms f on f.id = c.farm_id
     where o.status in ('pending', 'in_progress')
       and c.status in ('land_preparation', 'planting', 'establishment', 'maintenance', 'harvesting')
       and o.scheduled_date between p_today - 60 and p_today - 1
       and private.fie_farm_is_monitored(f.id)
     order by o.scheduled_date, o.id
     limit 5000
  loop
    v_late := p_today - r.scheduled_date;
    if private.fie_raise_event(
      r.farm_id, 'overdue_operation', case when v_late > 14 then 'urgent' else 'warning' end,
      'crop_cycle_operation', r.id, r.cycle_id,
      format('overdue_operation:%s:%s', r.id, r.scheduled_date),
      jsonb_build_object(
        'source', 'crop_cycle_operations', 'state', 'unverified_provisional',
        'operation_type', r.operation_type, 'scheduled_date', r.scheduled_date,
        'days_late', v_late, 'crop_id', r.crop_id),
      'farm_operation_overdue',
      jsonb_build_object('title', left(r.name, 120), 'name', left(r.farm_name, 120),
                         'job_date', r.scheduled_date, 'crop_cycle_id', r.cycle_id, 'farm_id', r.farm_id),
      p_trace_id
    ) then
      v_count := v_count + 1;
    end if;
  end loop;

  -- Farm tasks (labour and general work).
  for r in
    select t.id, t.title, t.category, t.due_date, t.crop_cycle_id, t.farm_id, f.name as farm_name
      from public.farm_operational_tasks t
      join public.farms f on f.id = t.farm_id
     where t.status not in ('completed', 'cancelled')
       and t.due_date between p_today - 60 and p_today - 1
       and private.fie_farm_is_monitored(f.id)
     order by t.due_date, t.id
     limit 5000
  loop
    v_late := p_today - r.due_date;
    if private.fie_raise_event(
      r.farm_id, 'overdue_operation', case when v_late > 14 then 'urgent' else 'warning' end,
      'farm_operational_task', r.id, r.crop_cycle_id,
      format('overdue_task:%s:%s', r.id, r.due_date),
      jsonb_build_object(
        'source', 'farm_operational_tasks', 'state', 'unverified_provisional',
        'category', r.category, 'due_date', r.due_date, 'days_late', v_late),
      'farm_task_overdue',
      jsonb_build_object('title', left(r.title, 120), 'name', left(r.farm_name, 120),
                         'job_date', r.due_date, 'farm_id', r.farm_id),
      p_trace_id
    ) then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

create or replace function private.fie_monitor_soil_test_stale(p_today date, p_trace_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r          record;
  v_count    integer := 0;
begin
  for r in
    select * from (
      select distinct on (c.id)
             o.id as op_id, o.name, o.operation_type, o.scheduled_date,
             c.id as cycle_id, c.crop_id, c.plot_id, c.farm_id, f.name as farm_name, p.name as plot_name,
             (select max(coalesce(s.tested_on, s.created_at::date))
                from public.soil_records s
               where s.plot_id = c.plot_id) as last_tested_on
        from public.crop_cycle_operations o
        join public.crop_cycles c on c.id = o.crop_cycle_id
        join public.farms f on f.id = c.farm_id
        join public.plots p on p.id = c.plot_id
       where o.status in ('pending', 'in_progress')
         and o.operation_type in ('fertiliser', 'manure', 'top_dressing', 'soil_amendment', 'liming')
         and c.status in ('land_preparation', 'planting', 'establishment', 'maintenance', 'harvesting')
         and o.scheduled_date between p_today and p_today + 14
         and private.fie_farm_is_monitored(f.id)
       order by c.id, o.scheduled_date, o.id
    ) q
    where q.last_tested_on is null or q.last_tested_on < p_today - 730
    limit 5000
  loop
    if private.fie_raise_event(
      r.farm_id, 'soil_test_stale', 'warning',
      'crop_cycle', r.cycle_id, r.cycle_id,
      format('soil_test_stale:%s', r.cycle_id),
      jsonb_build_object(
        'source', 'soil_records', 'state', 'unverified_provisional',
        'plot_id', r.plot_id, 'last_tested_on', r.last_tested_on,
        'operation_id', r.op_id, 'operation_type', r.operation_type,
        'scheduled_date', r.scheduled_date, 'crop_id', r.crop_id),
      'farm_soil_test_needed',
      jsonb_build_object('title', left(r.name, 120), 'name', left(coalesce(r.plot_name, r.farm_name), 120),
                         'job_date', r.scheduled_date, 'crop_cycle_id', r.cycle_id, 'farm_id', r.farm_id),
      p_trace_id
    ) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

alter function private.fie_monitor_upcoming_operation(date, uuid) owner to postgres;
alter function private.fie_monitor_overdue_operation(date, uuid) owner to postgres;
alter function private.fie_monitor_soil_test_stale(date, uuid) owner to postgres;
revoke all on function private.fie_monitor_upcoming_operation(date, uuid) from public, anon, authenticated, service_role;
revoke all on function private.fie_monitor_overdue_operation(date, uuid) from public, anon, authenticated, service_role;
revoke all on function private.fie_monitor_soil_test_stale(date, uuid) from public, anon, authenticated, service_role;

------------------------------------------------------------------------------------------------
-- 6. Run all enabled monitors (called only through private.run_scheduled_task)
------------------------------------------------------------------------------------------------
create or replace function private.run_farm_monitors(p_trace_id uuid, p_today date default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today   date := coalesce(p_today, (now() at time zone 'Africa/Lagos')::date);
  v_summary jsonb := jsonb_build_object('today', v_today);
  v_m       record;
  v_n       integer;
begin
  if nullif(current_setting('request.jwt.claim.sub', true), '') is not null
     or session_user not in ('cultivanode_scheduler', 'postgres', 'supabase_admin') then
    raise exception 'Unauthorized monitor execution identity.' using errcode = '42501';
  end if;

  for v_m in select monitor_key from public.fie_monitors where enabled order by monitor_key loop
    v_n := case v_m.monitor_key
      when 'upcoming_operation' then private.fie_monitor_upcoming_operation(v_today, p_trace_id)
      when 'overdue_operation'  then private.fie_monitor_overdue_operation(v_today, p_trace_id)
      when 'soil_test_stale'    then private.fie_monitor_soil_test_stale(v_today, p_trace_id)
      else null
    end;
    if v_n is not null then
      v_summary := v_summary || jsonb_build_object(v_m.monitor_key, v_n);
    end if;
  end loop;

  return v_summary;
end;
$$;

alter function private.run_farm_monitors(uuid, date) owner to postgres;
revoke all on function private.run_farm_monitors(uuid, date) from public, anon, authenticated, service_role;

------------------------------------------------------------------------------------------------
-- 7. Farmer response: useful / not useful / done (the only farmer write path; PRO-AC-06)
------------------------------------------------------------------------------------------------
create or replace function public.respond_to_intelligence_event(p_event_id uuid, p_response text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_farm uuid;
begin
  if v_uid is null then
    raise exception 'Sign in required.' using errcode = '42501';
  end if;
  if p_response is null or p_response not in ('useful', 'not_useful', 'done') then
    raise exception 'Response must be useful, not_useful or done.' using errcode = '22023';
  end if;

  select farm_id into v_farm from public.fie_intelligence_events where id = p_event_id;
  if v_farm is null or not private.profile_can_view_farm(v_uid, v_farm) then
    raise exception 'Alert not found.' using errcode = 'P0002';
  end if;

  update public.fie_intelligence_events
     set status = case p_response when 'useful' then 'acknowledged' when 'not_useful' then 'dismissed' else 'resolved' end,
         farmer_response = case when p_response = 'done' then farmer_response else p_response end,
         responded_by = v_uid,
         responded_at = clock_timestamp()
   where id = p_event_id;
end;
$$;

alter function public.respond_to_intelligence_event(uuid, text) owner to postgres;
revoke all on function public.respond_to_intelligence_event(uuid, text) from public, anon, service_role;
grant execute on function public.respond_to_intelligence_event(uuid, text) to authenticated;

------------------------------------------------------------------------------------------------
-- 8. Scheduler: add the farm_monitors task to the static allowlist (function copied from
--    20261123000000 with one new branch) and schedule it daily at 06:00 Lagos (05:00 UTC).
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
  'farm_monitors',
  'cultivanode-farm-monitors',
  '0 5 * * *',
  'Run the deterministic farm monitors (Batch 05) and raise intelligence events with in-app alerts.',
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
     where task_name = 'farm_monitors';
    return;
  end if;

  for v_job in execute format('select jobid from cron.job where jobname = %L', 'cultivanode-farm-monitors') loop
    execute format('select cron.unschedule(%s)', v_job.jobid);
  end loop;

  -- Same run, commit, assert form as the other jobs (20261123030000), so a failed run is visible.
  execute format(
    'select cron.schedule(%L, %L, %L)',
    'cultivanode-farm-monitors',
    '0 5 * * *',
    'select private.run_scheduled_task(''farm_monitors''); commit; select private.assert_scheduled_task_succeeded(''farm_monitors'');'
  ) into v_job_id;

  execute format('select username from cron.job where jobid = %s', v_job_id) into v_actual_user;

  update private.scheduled_task_registry
     set effective_cron_username = v_actual_user,
         username_assignment_note = 'Not reassigned: same arrangement as the Batch 03.3 jobs (pg_cron via libpq, '
                                    || 'cultivanode_scheduler is NOLOGIN). The job only calls the allowlisted wrapper.',
         updated_at = clock_timestamp()
   where task_name = 'farm_monitors';
end $$;
