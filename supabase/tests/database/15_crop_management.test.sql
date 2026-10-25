-- Crop management on the current farm-scoped schema: who can create and see crop cycles, jobs, crop checks
-- (with their private photos and AI columns) and harvests, plus the data rules on a cycle.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

-- Fixtures (as the database owner): two farmers, Chioma's farm and plot.
insert into auth.users (id, phone, raw_user_meta_data) values
  ('c1111111-0000-0000-0000-000000000001', '2348000000201', '{"full_name":"Farmer Chioma"}'),
  ('c2222222-0000-0000-0000-000000000002', '2348000000202', '{"full_name":"Intruder Tunde"}')
on conflict (id) do nothing;
insert into public.user_roles (profile_id, role) values
  ('c1111111-0000-0000-0000-000000000001', 'crop_farmer'),
  ('c2222222-0000-0000-0000-000000000002', 'crop_farmer')
on conflict do nothing;
insert into public.farms (id, owner_id, name, location, area_ha, zone, state, lga)
values ('f1111111-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'Chioma Farms',
        'SRID=4326;POINT(3.89 7.37)', 2.0, 'derived_savanna', 'Oyo', 'Ibadan');
insert into public.plots (id, farm_id, name, area_ha)
values ('b1111111-0000-0000-0000-000000000001', 'f1111111-0000-0000-0000-000000000001', 'Block A', 1.5);

-- Chioma, signed in.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c1111111-0000-0000-0000-000000000001"}', true);

select lives_ok($$
  insert into public.crop_cycles (id, farm_id, plot_id, crop_id, season, status, target_area_ha, planting_date, expected_harvest_date, target_yield_kg)
  values ('cc111111-0000-0000-0000-000000000001', 'f1111111-0000-0000-0000-000000000001', 'b1111111-0000-0000-0000-000000000001',
          'maize', 'early_rainy', 'maintenance', 1.5, current_date, current_date + 105, 6000)
$$, 'a farmer starts a crop cycle on her farm');

select throws_ok($$
  insert into public.crop_cycles (farm_id, crop_id, season, target_area_ha, planting_date, expected_harvest_date)
  values ('f1111111-0000-0000-0000-000000000001', 'cowpea', 'early_rainy', 1, current_date, current_date - 1)
$$, '23514', null, 'harvest cannot be planned before planting');

select throws_ok($$
  update public.crop_cycles set plants_planted = 100, plants_alive = 120 where id = 'cc111111-0000-0000-0000-000000000001'
$$, '23514', null, 'more plants alive than planted is refused');

select lives_ok($$
  insert into public.crop_cycle_operations (crop_cycle_id, operation_type, name, stage, scheduled_date)
  values ('cc111111-0000-0000-0000-000000000001', 'fertiliser', 'Apply urea', 'Vegetative', current_date + 21)
$$, 'she plans a job on the cycle');

select lives_ok($$
  insert into public.crop_observations (id, crop_cycle_id, category, severity, title, description)
  values ('0b111111-0000-0000-0000-000000000001', 'cc111111-0000-0000-0000-000000000001', 'pest', 'high',
          'Holes in the leaf funnel', 'Fresh frass in most funnels in the north corner')
$$, 'she logs a crop check');

select ok(
  (select ai_diagnosis is null and ai_model is null and ai_analysed_at is null
     from public.crop_observations where id = '0b111111-0000-0000-0000-000000000001'),
  'a crop check has room for the AI''s suggestion');

select lives_ok($$
  insert into storage.objects (bucket_id, name, owner)
  values ('scouting-photos', 'c1111111-0000-0000-0000-000000000001/0b111111-0000-0000-0000-000000000001/a.jpg',
          'c1111111-0000-0000-0000-000000000001')
$$, 'she uploads a crop photo to her own folder');

select is((select count(*)::int from storage.objects where bucket_id = 'scouting-photos'), 1, 'and can see it');

select lives_ok($$
  insert into public.crop_harvests (crop_cycle_id, batch_code, quantity_kg, destination)
  values ('cc111111-0000-0000-0000-000000000001', 'MZ-001', 850, 'store')
$$, 'she records a harvest');

-- Tunde, another farmer.
select set_config('request.jwt.claims', '{"sub":"c2222222-0000-0000-0000-000000000002"}', true);

select is((select count(*)::int from public.crop_cycles), 0, 'another farmer sees none of her crops');
select is((select count(*)::int from public.crop_observations), 0, 'or her crop checks');
select is((select count(*)::int from public.crop_harvests), 0, 'or her harvests');
select is((select count(*)::int from storage.objects where bucket_id = 'scouting-photos'), 0, 'or her photos');

select throws_ok($$
  insert into public.crop_cycles (farm_id, crop_id, season, target_area_ha, planting_date, expected_harvest_date)
  values ('f1111111-0000-0000-0000-000000000001', 'cassava', 'early_rainy', 1, current_date, current_date + 300)
$$, '42501', null, 'and cannot add a crop to her farm');

select throws_ok($$
  insert into storage.objects (bucket_id, name, owner)
  values ('scouting-photos', 'c1111111-0000-0000-0000-000000000001/x/b.jpg', 'c2222222-0000-0000-0000-000000000002')
$$, '42501', null, 'or put photos in her folder');

reset role;
select ok(not (select public from storage.buckets where id = 'scouting-photos'), 'crop photos are in a private bucket');

select * from finish();
rollback;
