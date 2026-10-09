-- =============================================================================
-- CultivaNode Farm Intelligence: Crop Bridge, Rollups & Watchdog Functions
-- Migration: 004_crop_bridge_and_rollups.sql
-- Description: Rollup aggregations, watchdog for silent/stale nodes,
--              and clean bridging of approved observations into crop_measurements.
-- =============================================================================

--------------------------------------------------------------------------------
-- 1. Rollup Generation Procedure
-- Aggregates raw valid telemetry into 15m, 1h, and 1d rollups
--------------------------------------------------------------------------------
create or replace function public.process_telemetry_rollups(p_lookback_interval interval default interval '2 hours')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r_period text;
  r_trunc text;
begin
  -- 1. 15-minute rollups
  insert into public.telemetry_rollups (
    device_id, plot_id, channel_code, period, bucket_timestamp,
    avg_value, min_value, max_value, last_value, sample_count, valid_count
  )
  select
    device_id,
    plot_id,
    channel_code,
    '15m'::public.rollup_period,
    date_trunc('hour', source_timestamp) +
      floor(extract(minute from source_timestamp) / 15.0) * interval '15 minutes' as bucket_ts,
    round(avg(calibrated_value), 3),
    min(calibrated_value),
    max(calibrated_value),
    (array_agg(calibrated_value order by source_timestamp desc))[1],
    count(*),
    count(*) filter (where quality_flag = 'valid')
  from public.telemetry_readings
  where source_timestamp >= now() - p_lookback_interval
    and quality_flag in ('valid', 'suspicious')
  group by 1, 2, 3, 5
  on conflict (device_id, channel_code, period, bucket_timestamp)
  do update set
    avg_value = excluded.avg_value,
    min_value = excluded.min_value,
    max_value = excluded.max_value,
    last_value = excluded.last_value,
    sample_count = excluded.sample_count,
    valid_count = excluded.valid_count;

  -- 2. Hourly rollups
  insert into public.telemetry_rollups (
    device_id, plot_id, channel_code, period, bucket_timestamp,
    avg_value, min_value, max_value, last_value, sample_count, valid_count
  )
  select
    device_id,
    plot_id,
    channel_code,
    '1h'::public.rollup_period,
    date_trunc('hour', source_timestamp) as bucket_ts,
    round(avg(calibrated_value), 3),
    min(calibrated_value),
    max(calibrated_value),
    (array_agg(calibrated_value order by source_timestamp desc))[1],
    count(*),
    count(*) filter (where quality_flag = 'valid')
  from public.telemetry_readings
  where source_timestamp >= now() - p_lookback_interval
    and quality_flag in ('valid', 'suspicious')
  group by 1, 2, 3, 5
  on conflict (device_id, channel_code, period, bucket_timestamp)
  do update set
    avg_value = excluded.avg_value,
    min_value = excluded.min_value,
    max_value = excluded.max_value,
    last_value = excluded.last_value,
    sample_count = excluded.sample_count,
    valid_count = excluded.valid_count;

  -- 3. Daily rollups
  insert into public.telemetry_rollups (
    device_id, plot_id, channel_code, period, bucket_timestamp,
    avg_value, min_value, max_value, last_value, sample_count, valid_count
  )
  select
    device_id,
    plot_id,
    channel_code,
    '1d'::public.rollup_period,
    date_trunc('day', source_timestamp) as bucket_ts,
    round(avg(calibrated_value), 3),
    min(calibrated_value),
    max(calibrated_value),
    (array_agg(calibrated_value order by source_timestamp desc))[1],
    count(*),
    count(*) filter (where quality_flag = 'valid')
  from public.telemetry_readings
  where source_timestamp >= now() - p_lookback_interval
    and quality_flag in ('valid', 'suspicious')
  group by 1, 2, 3, 5
  on conflict (device_id, channel_code, period, bucket_timestamp)
  do update set
    avg_value = excluded.avg_value,
    min_value = excluded.min_value,
    max_value = excluded.max_value,
    last_value = excluded.last_value,
    sample_count = excluded.sample_count,
    valid_count = excluded.valid_count;
end;
$$;

--------------------------------------------------------------------------------
-- 2. Crop Measurements Bridge
-- Links approved daily/hourly aggregate observations into crop_measurements
-- without bloating it with millions of raw sensor pulses.
--------------------------------------------------------------------------------
create or replace function public.sync_approved_iot_to_crop_measurements(p_target_date date default current_date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer := 0;
begin
  -- Only execute if crop_measurements table exists in the schema
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'crop_measurements') then
    
    -- Insert daily summary observations from active, calibrated installations
    insert into public.crop_measurements (
      plot_id,
      measured_on,
      measurement_type,
      value_numeric,
      unit,
      source,
      metadata
    )
    select
      r.plot_id,
      r.bucket_timestamp::date,
      case r.channel_code
        when 'soil_moisture_pct' then 'soil_moisture'
        when 'air_temperature_c' then 'mean_temperature'
        when 'rainfall_mm'       then 'daily_rainfall'
        else r.channel_code
      end,
      case r.channel_code
        when 'rainfall_mm' then round(sum(r.max_value), 2) -- total rain
        else round(avg(r.avg_value), 2)                   -- mean value
      end,
      max(sc.unit),
      'iot_sensor',
      jsonb_build_object(
        'device_id', r.device_id,
        'rollup_period', '1d',
        'calibrated', true,
        'trust_label', 'sensor reading'
      )
    from public.telemetry_rollups r
    join public.devices d on d.id = r.device_id
    join public.sensor_channels sc on sc.channel_code = r.channel_code and sc.device_model_id = d.model_id
    where r.period = '1d'
      and r.bucket_timestamp::date = p_target_date
      and d.status in ('active', 'degraded')
      and r.valid_count > 0
    group by r.plot_id, r.bucket_timestamp::date, r.channel_code, r.device_id
    on conflict do nothing;
    
    get diagnostics v_inserted = row_count;
  end if;
  
  return v_inserted;
end;
$$;

--------------------------------------------------------------------------------
-- 3. Device Watchdog & Health Monitor
-- Detects silent/stale nodes (> 12 hours), updates status, and issues alerts
--------------------------------------------------------------------------------
create or replace function public.run_device_watchdog(p_stale_threshold_hours integer default 12)
returns table(device_serial text, previous_status text, new_status text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with stale_candidates as (
    select
      d.id as target_device_id,
      d.serial_number,
      d.status as prev_stat,
      inst.farm_id,
      inst.plot_id,
      d.last_seen_at
    from public.devices d
    join public.device_installations inst on inst.device_id = d.id and inst.is_active = true
    where d.status in ('active', 'degraded')
      and (d.last_seen_at is null or d.last_seen_at < now() - (p_stale_threshold_hours || ' hours')::interval)
  ),
  updated_devices as (
    update public.devices dev
    set status = 'offline',
        updated_at = now()
    from stale_candidates sc
    where dev.id = sc.target_device_id
    returning dev.serial_number, dev.id, dev.status
  ),
  inserted_events as (
    insert into public.device_events (
      device_id, event_type, severity, details, payload
    )
    select
      sc.target_device_id,
      'offline'::public.device_event_type,
      'warning'::public.device_alert_severity,
      'Node missed telemetry transmissions for over ' || p_stale_threshold_hours || ' hours.',
      jsonb_build_object(
        'last_seen_at', sc.last_seen_at,
        'threshold_hours', p_stale_threshold_hours
      )
    from stale_candidates sc
  ),
  inserted_alerts as (
    insert into public.device_alerts (
      farm_id, plot_id, device_id, channel_code,
      observation, confidence, suggested_action, source,
      severity, status, triggered_at
    )
    select
      sc.farm_id,
      sc.plot_id,
      sc.target_device_id,
      'device_health',
      'This soil sensor has not reported for ' || p_stale_threshold_hours || ' hours; crop advice from it is paused.',
      1.00,
      'Inspect physical node, antenna connection, and solar panel clean state in the field.',
      'device watchdog',
      'warning'::public.device_alert_severity,
      'open'::public.device_alert_status,
      now()
    from stale_candidates sc
    where not exists (
      select 1 from public.device_alerts a
      where a.device_id = sc.target_device_id
        and a.channel_code = 'device_health'
        and a.status = 'open'
    )
  )
  select
    sc.serial_number::text,
    sc.prev_stat::text,
    'offline'::text
  from stale_candidates sc;
end;
$$;
