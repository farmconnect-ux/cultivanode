-- Batch 05 (part 2) pgTAP tests: weather window and stock monitors, and the weather worker RPCs.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, phone, raw_user_meta_data) values
  ('41000000-0000-4000-8000-000000000001', '2348041000001', '{"full_name":"Farmer Kola"}')
on conflict (id) do nothing;
insert into public.consents (profile_id, consent_type, granted, document_version, created_by)
values ('41000000-0000-4000-8000-000000000001', 'ai_intelligence', true, 'test-41', '41000000-0000-4000-8000-000000000001');

-- Farm at lat 7.37, lon 3.89 -> place key (7.4, 3.9).
insert into public.farms (id, owner_id, name, location, area_ha, zone, state, lga) values
  ('41000000-0000-4000-8000-000000000101', '41000000-0000-4000-8000-000000000001', 'Kola Farm 41',
   'SRID=4326;POINT(3.89 7.37)', 2.0, 'derived_savanna', 'Oyo', 'Ibadan');
insert into public.plots (id, farm_id, name, area_ha) values
  ('41000000-0000-4000-8000-000000000201', '41000000-0000-4000-8000-000000000101', 'Kola plot', 1.0);
insert into public.crop_cycles (id, farm_id, plot_id, crop_id, season, status, target_area_ha, planting_date, expected_harvest_date, target_yield_kg) values
  ('41000000-0000-4000-8000-000000000301', '41000000-0000-4000-8000-000000000101', '41000000-0000-4000-8000-000000000201',
   'maize', 'early_rainy', 'maintenance', 1.0, current_date - 30, current_date + 75, 3000);
insert into public.soil_records (plot_id, tested_on, soil_type, ph)
values ('41000000-0000-4000-8000-000000000201', current_date - 100, 'loam', 6.2);

insert into public.crop_cycle_operations (id, crop_cycle_id, operation_type, name, stage, status, scheduled_date) values
  -- fertiliser on a heavy-rain day (alert), spray on a windy day (alert), fertiliser on a windy day (no alert:
  -- wind only matters for spraying), harvest on a heavy-rain day (not weather-sensitive), spray in 5 days (outside 3-day window).
  ('41000000-0000-4000-8000-000000000401', '41000000-0000-4000-8000-000000000301', 'fertiliser', 'Top-dress urea', 'Vegetative', 'pending', current_date + 1),
  ('41000000-0000-4000-8000-000000000402', '41000000-0000-4000-8000-000000000301', 'pest_control', 'Spray for armyworm', 'Vegetative', 'pending', current_date + 2),
  ('41000000-0000-4000-8000-000000000403', '41000000-0000-4000-8000-000000000301', 'fertiliser', 'Second dose', 'Vegetative', 'pending', current_date + 2),
  ('41000000-0000-4000-8000-000000000404', '41000000-0000-4000-8000-000000000301', 'harvest', 'Early harvest', 'Harvest', 'pending', current_date + 1),
  ('41000000-0000-4000-8000-000000000405', '41000000-0000-4000-8000-000000000301', 'pest_control', 'Later spray', 'Vegetative', 'pending', current_date + 5);

insert into public.farm_inventory (id, farm_id, item_name, category, quantity, unit, reorder_threshold, expiry_date) values
  ('41000000-0000-4000-8000-000000000501', '41000000-0000-4000-8000-000000000101', 'Urea 50kg', 'fertiliser', 2, 'bags', 3, null),
  ('41000000-0000-4000-8000-000000000502', '41000000-0000-4000-8000-000000000101', 'NPK 15-15-15', 'fertiliser', 10, 'bags', 3, null),
  ('41000000-0000-4000-8000-000000000503', '41000000-0000-4000-8000-000000000101', 'Emamectin', 'chemical', 4, 'liters', null, current_date + 10),
  ('41000000-0000-4000-8000-000000000504', '41000000-0000-4000-8000-000000000101', 'Old herbicide', 'chemical', 0, 'liters', null, current_date + 5);

-- Worker RPCs are for the service role only.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$ select public.weather_worker_places() $$, '42501', null, 'farmers cannot list worker places');
select throws_ok($$ select public.record_weather_worker_forecast(7.4, 3.9, 'open_meteo', '[]'::jsonb) $$, '42501', null,
  'farmers cannot write forecasts');
reset role;

set local role service_role;
select ok(public.weather_worker_places() @> '[{"lat": 7.4, "lon": 3.9}]'::jsonb, 'the farm place needs a forecast');
select is(
  public.record_weather_worker_forecast(7.37, 3.89, 'open_meteo', jsonb_build_array(
    jsonb_build_object('date', current_date + 1, 'rain_mm', 32.5, 'wind_kmh', 12, 'max_c', 30),
    jsonb_build_object('date', current_date + 2, 'rain_mm', 2, 'wind_kmh', 45, 'max_c', 31),
    jsonb_build_object('date', current_date + 5, 'rain_mm', 0, 'wind_kmh', 60, 'max_c', 31),
    jsonb_build_object('date', 'not-a-date', 'rain_mm', 99, 'wind_kmh', 1),
    jsonb_build_object('date', current_date + 3, 'rain_mm', -5, 'wind_kmh', 1)
  )),
  3, 'valid days are stored and bad days skipped');
select throws_ok($$ select public.record_weather_worker_forecast(51.5, -0.1, 'open_meteo', '[]'::jsonb) $$, '22023', null,
  'places outside the supported area are refused');
reset role;

select private.run_farm_monitors(gen_random_uuid(), current_date);

-- Weather window (PRO-AC-01 cases, PRO-AC-04 wording).
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '41000000-0000-4000-8000-000000000401' and monitor_key = 'weather_window_conflict'), 1,
  'fertiliser on a heavy-rain day raises a weather risk');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '41000000-0000-4000-8000-000000000402' and monitor_key = 'weather_window_conflict'), 1,
  'spraying on a windy day raises a weather risk');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '41000000-0000-4000-8000-000000000403' and monitor_key = 'weather_window_conflict'), 0,
  'wind alone does not flag fertiliser');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '41000000-0000-4000-8000-000000000404'), 0,
  'harvest is not weather-sensitive here');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '41000000-0000-4000-8000-000000000405' and monitor_key = 'weather_window_conflict'), 0,
  'a job 5 days away is outside the weather window');
select ok((select bool_and(event_type = 'risk' and evidence ->> 'label' = 'risk' and evidence ->> 'state' = 'forecast')
             from public.fie_intelligence_events where monitor_key = 'weather_window_conflict'),
  'weather events are labelled risk and forecast');
select is((select data ->> 'note' from public.notifications
            where kind = 'farm_weather_risk' and data ->> 'title' = 'Top-dress urea'), '32.5 mm of rain',
  'the alert says what the forecast shows');

-- Stale forecasts are ignored (12-hour freshness rule).
update private.farm_weather_forecasts set fetched_at = clock_timestamp() - interval '13 hours';
delete from public.fie_intelligence_events where monitor_key = 'weather_window_conflict';
select private.run_farm_monitors(gen_random_uuid(), current_date);
select is((select count(*)::int from public.fie_intelligence_events where monitor_key = 'weather_window_conflict'), 0,
  'forecasts older than 12 hours raise nothing');

-- Stock.
select is((select severity from public.fie_intelligence_events where subject_id = '41000000-0000-4000-8000-000000000501'), 'warning',
  'stock at or below the reorder level raises low stock');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '41000000-0000-4000-8000-000000000502'), 0,
  'stock above the reorder level is fine');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '41000000-0000-4000-8000-000000000503' and monitor_key = 'inventory_expiring'), 1,
  'stock expiring in 10 days is flagged');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '41000000-0000-4000-8000-000000000504'), 0,
  'an empty item is not flagged as expiring');

-- Scheduler.
select is((private.run_scheduled_task('wake_weather_worker') ->> 'status'), 'completed',
  'wake_weather_worker runs through the wrapper (no-op without Vault settings)');

select * from finish();
rollback;
