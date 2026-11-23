-- CultivaNode, Batch 05 (part 2): weather window and stock monitors
-- FIE blueprint 5.6. Builds on 20261126000000 (monitor registry, events, dedup, consent gating).
--
--   weather_window_conflict  (risk) a fertiliser, spray or weeding job in the next 3 days falls on a day the
--                            forecast shows heavy rain (25 mm or more), or strong wind (40 km/h or more)
--                            for spray jobs. Same thresholds as the app's weather alerts.
--   inventory_low_stock      (need) a stock item is at or below the reorder level the farmer set.
--   inventory_expiring       (need) a stock item with quantity left expires within 14 days.
--
-- Weather comes from outside, so it follows the blueprint's execution model: SQL never calls a provider.
-- pg_cron wakes the farm-weather-worker Edge Function at 05:30 Lagos (30 minutes before the monitors). The
-- worker asks weather_worker_places() which places need a forecast (only consented farms with a weather-
-- sensitive job in the next 3 days, rounded to 0.1 degree so nearby farms share one call), fetches each
-- forecast from the active weather provider and stores it with record_weather_worker_forecast(). The
-- monitor uses forecasts fetched in the last 12 hours only (blueprint freshness rule) and words every alert
-- as a risk, never as something that has happened (PRO-AC-04).

------------------------------------------------------------------------------------------------
-- 1. Registry
------------------------------------------------------------------------------------------------
insert into public.fie_monitors (monitor_key, version, enabled, event_type, cooldown, description)
values
  ('weather_window_conflict', 1, true, 'risk', interval '3 days',
   'A fertiliser, spray or weeding job in the next 3 days falls on a day with heavy rain or strong wind forecast.'),
  ('inventory_low_stock', 1, true, 'need', interval '7 days',
   'A stock item is at or below the reorder level the farmer set. Reminds weekly.'),
  ('inventory_expiring', 1, true, 'need', interval '30 days',
   'A stock item with quantity left expires within 14 days.')
on conflict (monitor_key) do update
  set description = excluded.description,
      event_type = excluded.event_type,
      cooldown = excluded.cooldown,
      updated_at = clock_timestamp();

------------------------------------------------------------------------------------------------
-- 2. Farm-place forecasts (server-owned; written only by the weather worker through the RPC below)
------------------------------------------------------------------------------------------------
create table if not exists private.farm_weather_forecasts (
  lat_key        numeric(4,1) not null check (lat_key between 3.0 and 15.0),
  lon_key        numeric(4,1) not null check (lon_key between 2.0 and 16.0),
  forecast_date  date not null,
  rain_mm        numeric(6,1) not null check (rain_mm between 0 and 1000),
  wind_kmh       numeric(5,1) not null check (wind_kmh between 0 and 300),
  max_c          numeric(4,1) check (max_c is null or max_c between -10 and 60),
  provider       text not null check (provider ~ '^[a-z][a-z0-9_]{1,40}$'),
  fetched_at     timestamptz not null default clock_timestamp(),
  primary key (lat_key, lon_key, forecast_date)
);

alter table private.farm_weather_forecasts owner to postgres;
revoke all on table private.farm_weather_forecasts from public, anon, authenticated, service_role;

-- Rounded place key of a farm (0.1 degree, about 11 km).
create or replace function private.fie_farm_place(p_farm_id uuid)
returns table (lat_key numeric, lon_key numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select round(extensions.st_y(f.location::extensions.geometry)::numeric, 1),
         round(extensions.st_x(f.location::extensions.geometry)::numeric, 1)
    from public.farms f
   where f.id = p_farm_id and f.location is not null;
$$;

alter function private.fie_farm_place(uuid) owner to postgres;
revoke all on function private.fie_farm_place(uuid) from public, anon, authenticated, service_role;

-- Places the worker should fetch: consented farms with a weather-sensitive job in the next 3 days.
create or replace function public.weather_worker_places()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('lat', q.lat_key, 'lon', q.lon_key) order by q.lat_key, q.lon_key), '[]'::jsonb)
    from (
      select distinct p.lat_key, p.lon_key
        from public.crop_cycle_operations o
        join public.crop_cycles c on c.id = o.crop_cycle_id
        cross join lateral private.fie_farm_place(c.farm_id) p
       where o.status in ('pending', 'in_progress')
         and o.operation_type in ('fertiliser', 'pest_control', 'disease_control', 'weed_control')
         and c.status in ('land_preparation', 'planting', 'establishment', 'maintenance', 'harvesting')
         and o.scheduled_date between (now() at time zone 'Africa/Lagos')::date
                                  and (now() at time zone 'Africa/Lagos')::date + 3
         and private.fie_farm_is_monitored(c.farm_id)
       limit 200
    ) q;
$$;

alter function public.weather_worker_places() owner to postgres;
revoke all on function public.weather_worker_places() from public, anon, authenticated, service_role;
grant execute on function public.weather_worker_places() to service_role;

-- Store one place's daily forecast. Validates every value; a bad day is skipped, not guessed.
create or replace function public.record_weather_worker_forecast(
  p_lat numeric, p_lon numeric, p_provider text, p_days jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lat  numeric := round(p_lat, 1);
  v_lon  numeric := round(p_lon, 1);
  v_day  jsonb;
  v_date date;
  v_rain numeric;
  v_wind numeric;
  v_max  numeric;
  v_n    integer := 0;
begin
  if p_lat is null or p_lon is null or v_lat not between 3.0 and 15.0 or v_lon not between 2.0 and 16.0 then
    raise exception 'Place is outside the supported area.' using errcode = '22023';
  end if;
  if p_provider is null or p_provider !~ '^[a-z][a-z0-9_]{1,40}$' then
    raise exception 'Invalid provider.' using errcode = '22023';
  end if;
  if p_days is null or jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) > 16 then
    raise exception 'Days must be an array of at most 16 entries.' using errcode = '22023';
  end if;

  for v_day in select * from jsonb_array_elements(p_days) loop
    begin
      v_date := (v_day ->> 'date')::date;
      v_rain := (v_day ->> 'rain_mm')::numeric;
      v_wind := (v_day ->> 'wind_kmh')::numeric;
      v_max  := nullif(v_day ->> 'max_c', '')::numeric;
    exception when others then
      continue;
    end;
    if v_date is null or v_rain is null or v_wind is null
       or v_date < (now() at time zone 'Africa/Lagos')::date - 1
       or v_date > (now() at time zone 'Africa/Lagos')::date + 16
       or v_rain not between 0 and 1000 or v_wind not between 0 and 300
       or (v_max is not null and v_max not between -10 and 60) then
      continue;
    end if;

    insert into private.farm_weather_forecasts (lat_key, lon_key, forecast_date, rain_mm, wind_kmh, max_c, provider, fetched_at)
    values (v_lat, v_lon, v_date, round(v_rain, 1), round(v_wind, 1), round(v_max, 1), p_provider, clock_timestamp())
    on conflict (lat_key, lon_key, forecast_date) do update
      set rain_mm = excluded.rain_mm,
          wind_kmh = excluded.wind_kmh,
          max_c = excluded.max_c,
          provider = excluded.provider,
          fetched_at = excluded.fetched_at;
    v_n := v_n + 1;
  end loop;

  -- Keep the table small: forecasts for past days are no longer needed.
  delete from private.farm_weather_forecasts
   where forecast_date < (now() at time zone 'Africa/Lagos')::date - 7;

  return v_n;
end;
$$;

alter function public.record_weather_worker_forecast(numeric, numeric, text, jsonb) owner to postgres;
revoke all on function public.record_weather_worker_forecast(numeric, numeric, text, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.record_weather_worker_forecast(numeric, numeric, text, jsonb) to service_role;

-- Wake the worker (same pattern and Vault secret as private.wake_notify_worker). Does nothing without
-- pg_net, the functions_base_url / notify_worker_secret Vault entries, or a place to check.
create or replace function private.wake_weather_worker()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url    text := (select decrypted_secret from vault.decrypted_secrets where name = 'functions_base_url');
  v_secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'notify_worker_secret');
begin
  if v_url is null or v_secret is null or not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_net') then
    return false;
  end if;
  if public.weather_worker_places() = '[]'::jsonb then
    return false;
  end if;
  execute 'select net.http_post(url := $1, body := ''{}''::jsonb, headers := $2, timeout_milliseconds := 120000)'
    using rtrim(v_url, '/') || '/farm-weather-worker',
          jsonb_build_object('Content-Type', 'application/json', 'x-worker-secret', v_secret);
  return true;
end;
$$;

alter function private.wake_weather_worker() owner to postgres;
revoke all on function private.wake_weather_worker() from public, anon, authenticated, service_role, cultivanode_scheduler;

------------------------------------------------------------------------------------------------
-- 3. Monitors
------------------------------------------------------------------------------------------------
create or replace function private.fie_monitor_weather_window(p_today date, p_trace_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r        record;
  v_note   text;
  v_count  integer := 0;
begin
  for r in
    select o.id, o.name, o.operation_type, o.scheduled_date,
           c.id as cycle_id, c.crop_id, c.farm_id, f.name as farm_name,
           w.rain_mm, w.wind_kmh, w.provider, w.fetched_at
      from public.crop_cycle_operations o
      join public.crop_cycles c on c.id = o.crop_cycle_id
      join public.farms f on f.id = c.farm_id
      cross join lateral private.fie_farm_place(f.id) p
      join private.farm_weather_forecasts w
        on w.lat_key = p.lat_key and w.lon_key = p.lon_key and w.forecast_date = o.scheduled_date
     where o.status in ('pending', 'in_progress')
       and o.operation_type in ('fertiliser', 'pest_control', 'disease_control', 'weed_control')
       and c.status in ('land_preparation', 'planting', 'establishment', 'maintenance', 'harvesting')
       and o.scheduled_date between p_today and p_today + 3
       and w.fetched_at > clock_timestamp() - interval '12 hours'
       and (w.rain_mm >= 25
            or (w.wind_kmh >= 40 and o.operation_type in ('pest_control', 'disease_control', 'weed_control')))
       and private.fie_farm_is_monitored(f.id)
     order by o.scheduled_date, o.id
     limit 5000
  loop
    v_note := case
      when r.rain_mm >= 25 then trim(to_char(r.rain_mm, 'FM9990.0')) || ' mm of rain'
      else 'wind up to ' || trim(to_char(r.wind_kmh, 'FM990')) || ' km/h'
    end;
    if private.fie_raise_event(
      r.farm_id, 'weather_window_conflict', case when r.rain_mm >= 50 then 'urgent' else 'warning' end,
      'crop_cycle_operation', r.id, r.cycle_id,
      format('weather_window:%s:%s', r.id, r.scheduled_date),
      jsonb_build_object(
        'label', 'risk', 'source', 'farm_weather_forecasts', 'state', 'forecast',
        'operation_type', r.operation_type, 'scheduled_date', r.scheduled_date,
        'rain_mm', r.rain_mm, 'wind_kmh', r.wind_kmh,
        'provider', r.provider, 'fetched_at', r.fetched_at, 'crop_id', r.crop_id),
      'farm_weather_risk',
      jsonb_build_object('title', left(r.name, 120), 'name', left(r.farm_name, 120), 'note', v_note,
                         'job_date', r.scheduled_date, 'crop_cycle_id', r.cycle_id, 'farm_id', r.farm_id),
      p_trace_id
    ) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

create or replace function private.fie_monitor_inventory_low_stock(p_today date, p_trace_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r        record;
  v_left   numeric;
  v_count  integer := 0;
begin
  for r in
    select i.id, i.farm_id, i.item_name, i.category, i.quantity, coalesce(i.reserved_quantity, 0) as reserved,
           i.unit, i.reorder_threshold, f.name as farm_name
      from public.farm_inventory i
      join public.farms f on f.id = i.farm_id
     where i.reorder_threshold is not null
       and i.reorder_threshold > 0
       and i.quantity - coalesce(i.reserved_quantity, 0) <= i.reorder_threshold
       and private.fie_farm_is_monitored(f.id)
     order by i.farm_id, i.id
     limit 5000
  loop
    v_left := greatest(r.quantity - r.reserved, 0);
    if private.fie_raise_event(
      r.farm_id, 'inventory_low_stock', case when v_left = 0 then 'urgent' else 'warning' end,
      'inventory_item', r.id, null,
      format('inventory_low_stock:%s', r.id),
      jsonb_build_object(
        'source', 'farm_inventory', 'state', 'unverified_provisional', 'category', r.category,
        'quantity', r.quantity, 'reserved', r.reserved, 'unit', r.unit, 'reorder_threshold', r.reorder_threshold),
      'farm_stock_low',
      jsonb_build_object('title', left(r.item_name, 120), 'name', left(r.farm_name, 120),
                         'note', left(trim(to_char(v_left, 'FM999999990.##')) || ' ' || coalesce(r.unit, ''), 60),
                         'farm_id', r.farm_id),
      p_trace_id
    ) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

create or replace function private.fie_monitor_inventory_expiring(p_today date, p_trace_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r        record;
  v_count  integer := 0;
begin
  for r in
    select i.id, i.farm_id, i.item_name, i.category, i.quantity, i.unit, i.expiry_date, f.name as farm_name
      from public.farm_inventory i
      join public.farms f on f.id = i.farm_id
     where i.expiry_date between p_today and p_today + 14
       and i.quantity > 0
       and private.fie_farm_is_monitored(f.id)
     order by i.expiry_date, i.id
     limit 5000
  loop
    if private.fie_raise_event(
      r.farm_id, 'inventory_expiring', 'warning',
      'inventory_item', r.id, null,
      format('inventory_expiring:%s:%s', r.id, r.expiry_date),
      jsonb_build_object(
        'source', 'farm_inventory', 'state', 'unverified_provisional', 'category', r.category,
        'quantity', r.quantity, 'unit', r.unit, 'expiry_date', r.expiry_date),
      'farm_stock_expiring',
      jsonb_build_object('title', left(r.item_name, 120), 'name', left(r.farm_name, 120),
                         'job_date', r.expiry_date, 'farm_id', r.farm_id),
      p_trace_id
    ) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

alter function private.fie_monitor_weather_window(date, uuid) owner to postgres;
alter function private.fie_monitor_inventory_low_stock(date, uuid) owner to postgres;
alter function private.fie_monitor_inventory_expiring(date, uuid) owner to postgres;
revoke all on function private.fie_monitor_weather_window(date, uuid) from public, anon, authenticated, service_role;
revoke all on function private.fie_monitor_inventory_low_stock(date, uuid) from public, anon, authenticated, service_role;
revoke all on function private.fie_monitor_inventory_expiring(date, uuid) from public, anon, authenticated, service_role;

-- Stock items are a new subject type.
alter table public.fie_intelligence_events drop constraint if exists fie_intelligence_events_subject_type_check;
alter table public.fie_intelligence_events add constraint fie_intelligence_events_subject_type_check
  check (subject_type in ('crop_cycle_operation', 'farm_operational_task', 'crop_cycle', 'plot', 'inventory_item'));

------------------------------------------------------------------------------------------------
-- 4. Run the new monitors (function copied from 20261126000000 with three new branches)
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
      when 'weather_window_conflict' then private.fie_monitor_weather_window(v_today, p_trace_id)
      when 'inventory_low_stock' then private.fie_monitor_inventory_low_stock(v_today, p_trace_id)
      when 'inventory_expiring'  then private.fie_monitor_inventory_expiring(v_today, p_trace_id)
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
-- 5. Scheduler: wake_weather_worker at 05:30 Lagos (04:30 UTC), before farm_monitors at 06:00.
--    run_scheduled_task copied from 20261126000000 with one new branch.
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
  'wake_weather_worker',
  'cultivanode-wake-weather-worker',
  '30 4 * * *',
  'Wake the farm-weather-worker Edge Function to fetch forecasts for farms with weather-sensitive jobs soon.',
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
     where task_name = 'wake_weather_worker';
    return;
  end if;

  for v_job in execute format('select jobid from cron.job where jobname = %L', 'cultivanode-wake-weather-worker') loop
    execute format('select cron.unschedule(%s)', v_job.jobid);
  end loop;

  execute format(
    'select cron.schedule(%L, %L, %L)',
    'cultivanode-wake-weather-worker',
    '30 4 * * *',
    'select private.run_scheduled_task(''wake_weather_worker''); commit; select private.assert_scheduled_task_succeeded(''wake_weather_worker'');'
  ) into v_job_id;

  execute format('select username from cron.job where jobid = %s', v_job_id) into v_actual_user;

  update private.scheduled_task_registry
     set effective_cron_username = v_actual_user,
         username_assignment_note = 'Not reassigned: same arrangement as the Batch 03.3 jobs (pg_cron via libpq, '
                                    || 'cultivanode_scheduler is NOLOGIN). The job only calls the allowlisted wrapper.',
         updated_at = clock_timestamp()
   where task_name = 'wake_weather_worker';
end $$;
