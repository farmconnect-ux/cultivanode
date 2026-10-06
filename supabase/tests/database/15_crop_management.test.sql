-- Crop Management Module: Lifecycle, Overlap Invariant, Yield/Cost Rollup, RLS
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

-- Fixtures
insert into auth.users (id, phone, raw_user_meta_data) values
  ('c1111111-0000-0000-0000-000000000001', '2348000000201', '{"full_name":"Farmer Chioma"}'),
  ('c2222222-0000-0000-0000-000000000002', '2348000000202', '{"full_name":"Intruder Tunde"}')
on conflict (id) do nothing;

insert into public.user_roles (profile_id, role) values
  ('c1111111-0000-0000-0000-000000000001', 'crop_farmer'),
  ('c2222222-0000-0000-0000-000000000002', 'crop_farmer')
on conflict do nothing;

-- Farmer Chioma sets up farm and plot
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c1111111-0000-0000-0000-000000000001"}', true);

insert into public.farms (id, name, location, area_ha, zone, state, lga)
values ('f1111111-0000-0000-0000-000000000001', 'Chioma Farms', 'SRID=4326;POINT(3.89 7.37)', 2.0, 'derived_savanna', 'Oyo', 'Ibadan')
on conflict do nothing;

insert into public.plots (id, farm_id, name, area_ha, soil_texture, drainage, irrigation_type)
values ('p1111111-0000-0000-0000-000000000001', 'f1111111-0000-0000-0000-000000000001', 'Block A - Maize', 1.5, 'sandy_loam', 'well_drained', 'rainfed')
on conflict do nothing;

select lives_ok($$
  insert into public.crop_cycles (
    id, plot_id, crop_id, variety_id, season, status,
    target_area_ha, planting_date, expected_harvest_date,
    target_yield_kg, estimated_budget_kobo
  ) values (
    'cc111111-0000-0000-0000-000000000001',
    'p1111111-0000-0000-0000-000000000001',
    'maize', 'sammaze-52', 'early_rainy', 'active',
    1.5, current_date, current_date + 105,
    6000, 45000000
  )
$$, 'Farmer Chioma can create an active crop cycle on her plot');

-- Overlap constraint check
select throws_ok($$
  insert into public.crop_cycles (
    plot_id, crop_id, variety_id, season, status,
    target_area_ha, planting_date, expected_harvest_date,
    target_yield_kg
  ) values (
    'p1111111-0000-0000-0000-000000000001',
    'cowpea', 'ifa-brown', 'early_rainy', 'planning',
    1.5, current_date, current_date + 75,
    2000
  )
$$, '23505', null, 'Overlap check prevents second concurrent cycle on the same plot');

-- Chioma adds operations
select lives_ok($$
  insert into public.crop_cycle_operations (
    id, cycle_id, name, stage, relative_start_day, relative_end_day,
    scheduled_start_date, scheduled_end_date, actual_cost_kobo, status
  ) values (
    'op111111-0000-0000-0000-000000000001',
    'cc111111-0000-0000-0000-000000000001',
    'Land Preparation & Ploughing', 'land_prep', -14, -7,
    current_date - 14, current_date - 7, 7500000, 'completed'
  )
$$, 'Farmer Chioma can schedule and record completed operations');

-- Chioma adds input application
select lives_ok($$
  insert into public.crop_input_applications (
    cycle_id, operation_id, category, product_name, active_ingredient,
    rate_per_ha, unit, area_applied_ha, total_quantity, cost_kobo, applied_date
  ) values (
    'cc111111-0000-0000-0000-000000000001',
    'op111111-0000-0000-0000-000000000001',
    'fertiliser', 'NPK 15-15-15', 'NPK',
    200, 'kg', 1.5, 300, 12000000, current_date - 5
  )
$$, 'Farmer Chioma can record fertiliser application');

-- Check cost rollup trigger
select is(
  (select actual_cost_kobo from public.crop_cycles where id = 'cc111111-0000-0000-0000-000000000001'),
  19500000::bigint,
  'Crop cycle actual_cost_kobo correctly rolled up operations (75,000) and inputs (120,000) = 195,000 NGN (19500000 kobo)'
);

-- Chioma records scouting observation
select lives_ok($$
  insert into public.crop_observations (
    cycle_id, category, severity, description
  ) values (
    'cc111111-0000-0000-0000-000000000001',
    'pest', 'low', 'Mild stem borer presence noted on south perimeter'
  )
$$, 'Farmer can record scouting observation');

-- Chioma records measurement
select lives_ok($$
  insert into public.crop_measurements (
    cycle_id, metric_name, metric_value
  ) values (
    'cc111111-0000-0000-0000-000000000001',
    'plant_height_cm', 42.5
  )
$$, 'Farmer can record crop growth measurement');

-- Chioma records harvest
select lives_ok($$
  insert into public.crop_harvests (
    cycle_id, batch_code, harvest_date, quantity_kg, quality_grade, moisture_pct
  ) values (
    'cc111111-0000-0000-0000-000000000001',
    'BATCH-MZ-2026-001', current_date, 3200.00, 'grade_a', 13.5
  )
$$, 'Farmer can record harvest batch');

-- Check yield rollup trigger
select is(
  (select actual_yield_kg from public.crop_cycles where id = 'cc111111-0000-0000-0000-000000000001'),
  3200.00::numeric,
  'Crop cycle actual_yield_kg rolled up to 3200 kg from harvest batch'
);

-- Chioma records second harvest batch
select lives_ok($$
  insert into public.crop_harvests (
    cycle_id, batch_code, harvest_date, quantity_kg, quality_grade, moisture_pct
  ) values (
    'cc111111-0000-0000-0000-000000000001',
    'BATCH-MZ-2026-002', current_date + 1, 2500.00, 'grade_b', 14.0
  )
$$, 'Farmer can record second harvest batch');

-- Check yield rollup trigger again
select is(
  (select actual_yield_kg from public.crop_cycles where id = 'cc111111-0000-0000-0000-000000000001'),
  5700.00::numeric,
  'Crop cycle actual_yield_kg rolled up to 5700 kg from both batches'
);

-- RLS: Switch to intruder Tunde
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c2222222-0000-0000-0000-000000000002"}', true);

-- Intruder cannot read Chioma's crop cycles
select is_empty($$
  select * from public.crop_cycles where id = 'cc111111-0000-0000-0000-000000000001'
$$, 'Intruder cannot read Chioma crop cycle');

-- Intruder cannot read Chioma's operations
select is_empty($$
  select * from public.crop_cycle_operations where cycle_id = 'cc111111-0000-0000-0000-000000000001'
$$, 'Intruder cannot read Chioma operations');

-- Intruder cannot read Chioma's harvests
select is_empty($$
  select * from public.crop_harvests where cycle_id = 'cc111111-0000-0000-0000-000000000001'
$$, 'Intruder cannot read Chioma harvests');

-- Intruder cannot create an operation on Chioma's cycle
select throws_ok($$
  insert into public.crop_cycle_operations (
    cycle_id, name, stage, relative_start_day, relative_end_day,
    scheduled_start_date, scheduled_end_date, status
  ) values (
    'cc111111-0000-0000-0000-000000000001',
    'Sabotage Weeding', 'weeding', 10, 15,
    current_date, current_date + 5, 'pending'
  )
$$, '42501', null, 'Intruder cannot insert operations on another farmers cycle');

-- Intruder cannot record harvest on Chioma's cycle
select throws_ok($$
  insert into public.crop_harvests (
    cycle_id, batch_code, harvest_date, quantity_kg, quality_grade
  ) values (
    'cc111111-0000-0000-0000-000000000001',
    'STOLEN-001', current_date, 500, 'grade_c'
  )
$$, '42501', null, 'Intruder cannot record harvest on another farmers cycle');

-- Intruder cannot update Chioma's cycle status
select lives_ok($$
  update public.crop_cycles set status = 'abandoned' where id = 'cc111111-0000-0000-0000-000000000001'
$$, 'Update silently affects 0 rows due to RLS filter');

-- Verify Chioma's cycle status was untouched
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c1111111-0000-0000-0000-000000000001"}', true);
select is(
  (select status from public.crop_cycles where id = 'cc111111-0000-0000-0000-000000000001')::text,
  'active',
  'Chioma crop cycle remains active and uncompromised'
);

select * from finish();
rollback;
