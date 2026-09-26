-- Listings permissions and the nearby_listings() search.
-- Distances: 1 degree of latitude is about 111.32 km, so the fixtures sit due north of the farmer.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, phone, raw_user_meta_data) values
  ('f0000000-0000-0000-0000-00000000000f', '2348000000201', '{"full_name":"Farmer Funmi"}'),
  ('a0000000-0000-0000-0000-00000000000a', '2348000000202', '{"full_name":"Tractor Owner Ayo"}'),
  ('b0000000-0000-0000-0000-00000000000b', '2348000000203', '{"full_name":"Unverified Owner Bayo"}'),
  ('c0000000-0000-0000-0000-00000000000c', '2348000000204', '{"full_name":"Operator Chidi"}');

insert into public.user_roles (profile_id, role, provider_type) values
  ('f0000000-0000-0000-0000-00000000000f', 'crop_farmer', null),
  ('a0000000-0000-0000-0000-00000000000a', 'machinery_owner', null),
  ('b0000000-0000-0000-0000-00000000000b', 'machinery_owner', null),
  ('c0000000-0000-0000-0000-00000000000c', 'service_provider', 'machine_operator');
update public.profiles set verification_tier = 2
 where id in ('a0000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000c');

-- Farmer stands at lng 3.8967, lat 7.3775 (Ibadan).
insert into public.listings (owner_id, kind, category, provider_type, title, pricing_unit, rate_kobo,
                             location, service_radius_km, status) values
  ('a0000000-0000-0000-0000-00000000000a', 'equipment', 'tractor', null, 'T1 tractor 5 km', 'hectare', 2500000,
   'SRID=4326;POINT(3.8967 7.42242)', 30, 'active'),
  ('a0000000-0000-0000-0000-00000000000a', 'equipment', 'tractor', null, 'T2 tractor 20 km, travels 10 km', 'hectare', 2000000,
   'SRID=4326;POINT(3.8967 7.55716)', 10, 'active'),
  ('a0000000-0000-0000-0000-00000000000a', 'equipment', 'planter', null, 'T3 planter 40 km', 'hectare', 3000000,
   'SRID=4326;POINT(3.8967 7.73683)', 100, 'active'),
  ('a0000000-0000-0000-0000-00000000000a', 'equipment', 'tractor', null, 'T4 tractor 2 km paused', 'hectare', 1000000,
   'SRID=4326;POINT(3.8967 7.39547)', 30, 'paused'),
  ('c0000000-0000-0000-0000-00000000000c', 'service', 'machine_operator', 'machine_operator', 'S1 operator 8 km', 'day', 1500000,
   'SRID=4326;POINT(3.8967 7.44937)', 30, 'active'),
  ('a0000000-0000-0000-0000-00000000000a', 'equipment', 'harvester', null, 'T6 harvester 150 km', 'hectare', 5000000,
   'SRID=4326;POINT(3.8967 8.72500)', 200, 'active');

---------------------------------------------------------------- searching as the farmer
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-00000000000f"}', true);

select is(
  (select array_agg(title order by distance_km) from public.nearby_listings(7.3775, 3.8967)),
  array['T1 tractor 5 km', 'S1 operator 8 km'],
  'default 30 km search returns active listings in range, nearest first');
select ok(
  (select abs(distance_km - 5.0) < 0.05 from public.nearby_listings(7.3775, 3.8967) where title = 'T1 tractor 5 km'),
  'distance is reported in km (about 5.0)');
select ok(
  not exists (select 1 from public.nearby_listings(7.3775, 3.8967, 30) where title like 'T2%'),
  'a listing is hidden when the farmer is outside the provider''s own service radius');
select ok(
  not exists (select 1 from public.nearby_listings(7.3775, 3.8967, 30) where title like 'T4%'),
  'paused listings are not returned');
select is(
  (select array_agg(title order by distance_km) from public.nearby_listings(7.3775, 3.8967, p_kind => 'equipment')),
  array['T1 tractor 5 km'], 'filter by kind');
select is(
  (select array_agg(title) from public.nearby_listings(7.3775, 3.8967, p_category => 'machine_operator')),
  array['S1 operator 8 km'], 'filter by category');
select is(
  (select array_agg(title order by distance_km) from public.nearby_listings(7.3775, 3.8967, 50)),
  array['T1 tractor 5 km', 'S1 operator 8 km', 'T3 planter 40 km'],
  'a wider radius finds more');
select ok(
  not exists (select 1 from public.nearby_listings(7.3775, 3.8967, 500) where title like 'T6%'),
  'the search radius is capped at 100 km');
select is(
  (select count(*)::int from public.nearby_listings(7.3775, 3.8967, 50, p_limit => 1)), 1,
  'the result limit is respected');
select is(
  (select count(*)::int from public.nearby_listings(7.3775, 3.8967, 50, p_limit => 100000)), 3,
  'an oversized limit is capped rather than rejected');
select throws_ok($$ select * from public.nearby_listings(95, 3.9) $$, '22023', null, 'latitude outside -90..90 is rejected');
select throws_ok($$ select * from public.nearby_listings(7.3, null) $$, '22023', null, 'missing longitude is rejected');
select is((select count(*)::int from public.listings where title like 'T4%'), 0,
  'other users cannot see a paused listing');

---------------------------------------------------------------- who can create listings
select throws_ok($$
  insert into public.listings (kind, category, title, pricing_unit, rate_kobo, location)
  values ('equipment', 'tractor', 'Funmi tractor', 'hour', 500000, 'SRID=4326;POINT(3.9 7.4)')
$$, '42501', null, 'a farmer without the machinery owner role cannot list equipment');

select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-00000000000b"}', true);
select throws_ok($$
  insert into public.listings (kind, category, title, pricing_unit, rate_kobo, location)
  values ('equipment', 'tractor', 'Bayo tractor', 'hour', 500000, 'SRID=4326;POINT(3.9 7.4)')
$$, '42501', null, 'an approved owner below verification tier 2 cannot list');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-00000000000a"}', true);
select lives_ok($$
  insert into public.listings (kind, category, title, pricing_unit, rate_kobo, location, status)
  values ('equipment', 'boom_sprayer', 'Ayo boom sprayer', 'hectare', 800000, 'SRID=4326;POINT(3.9 7.4)', 'active')
$$, 'an approved, tier-2 machinery owner can list equipment');
select throws_ok($$
  update public.listings set status = 'suspended' where title = 'Ayo boom sprayer'
$$, '42501', null, 'owners cannot suspend listings (staff only)');
select throws_ok($$
  insert into public.listings (kind, category, title, pricing_unit, rate_kobo, location)
  values ('equipment', 'tractor', 'Free tractor', 'hour', 0, 'SRID=4326;POINT(3.9 7.4)')
$$, '23514', null, 'a price must be above zero');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000c"}', true);
select throws_ok($$
  insert into public.listings (kind, category, provider_type, title, pricing_unit, rate_kobo, location)
  values ('service', 'spraying_service', 'spraying_service', 'Chidi spraying', 'hectare', 700000, 'SRID=4326;POINT(3.9 7.4)')
$$, '42501', null, 'a provider can only list the service type they were approved for');

---------------------------------------------------------------- anonymous visitors
set local role anon;
select throws_ok($$ select * from public.nearby_listings(7.3775, 3.8967) $$, '42501', null,
  'anonymous visitors cannot run the search');

reset role;
select * from finish();
rollback;
