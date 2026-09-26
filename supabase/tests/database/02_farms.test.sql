-- Farms, plots, soil records: ownership, business staff, field agents, area calculation.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Fixtures (as the database owner)
insert into auth.users (id, phone, raw_user_meta_data) values
  ('a1111111-0000-0000-0000-000000000001', '2348000000101', '{"full_name":"Farmer Ade"}'),
  ('b2222222-0000-0000-0000-000000000002', '2348000000102', '{"full_name":"Worker Bola"}'),
  ('c3333333-0000-0000-0000-000000000003', '2348000000103', '{"full_name":"Manager Chika"}'),
  ('d4444444-0000-0000-0000-000000000004', '2348000000104', '{"full_name":"Agent Dayo"}'),
  ('e5555555-0000-0000-0000-000000000005', '2348000000105', '{"full_name":"Assisted Farmer Efe"}');

insert into public.user_roles (profile_id, role) values
  ('a1111111-0000-0000-0000-000000000001', 'crop_farmer'),
  ('d4444444-0000-0000-0000-000000000004', 'field_agent'),
  ('e5555555-0000-0000-0000-000000000005', 'crop_farmer');
update public.profiles set onboarded_by = 'd4444444-0000-0000-0000-000000000004'
 where id = 'e5555555-0000-0000-0000-000000000005';

---------------------------------------------------------------- farmer Ade
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-0000-0000-0000-000000000001"}', true);

-- About 100 m x 100 m near Ibadan (lng 3.8967, lat 7.3775): roughly 1 hectare.
select lives_ok($$
  insert into public.farms (name, location, boundary, zone, state, lga)
  values ('Ade Farm Akinyele',
          'SRID=4326;POINT(3.89715 7.37795)',
          'SRID=4326;POLYGON((3.8967 7.3775, 3.8976 7.3775, 3.8976 7.3784, 3.8967 7.3784, 3.8967 7.3775))',
          'derived_savanna', 'Oyo', 'Akinyele')
$$, 'a crop farmer can add a farm with a walked boundary');

select ok((select area_ha between 0.95 and 1.05 and area_is_measured from public.farms where name = 'Ade Farm Akinyele'),
  'farm area is calculated from the boundary (about 1 ha)');

select lives_ok($$
  insert into public.farms (name, location, area_ha) values ('Ade Second Plot', 'SRID=4326;POINT(3.90 7.40)', 2.5)
$$, 'a farm can be added with just a pin and an estimated area');
select ok((select area_ha = 2.5 and not area_is_measured from public.farms where name = 'Ade Second Plot'),
  'an estimated area is kept and marked as not measured');

select throws_ok($$
  insert into public.farms (name, location, boundary)
  values ('Bowtie', 'SRID=4326;POINT(3.9 7.4)',
          'SRID=4326;POLYGON((3.90 7.40, 3.91 7.41, 3.91 7.40, 3.90 7.41, 3.90 7.40))')
$$, '22023', null, 'a self-crossing boundary is rejected');

select lives_ok($$
  insert into public.plots (farm_id, name) select id, 'Plot A' from public.farms where name = 'Ade Farm Akinyele'
$$, 'the owner can add a plot');
select lives_ok($$
  insert into public.soil_records (plot_id, tested_on, soil_type, ph)
  select id, current_date, 'sandy loam', 6.2 from public.plots where name = 'Plot A'
$$, 'the owner can record a soil test');
select throws_ok($$
  insert into public.soil_records (plot_id, ph) select id, 15 from public.plots where name = 'Plot A'
$$, '23514', null, 'a pH above 14 is rejected');
select throws_ok($$
  update public.farms set owner_id = 'b2222222-0000-0000-0000-000000000002' where name = 'Ade Second Plot'
$$, '42501', null, 'a farm cannot be handed to someone else by editing owner_id');

---------------------------------------------------------------- someone with no farmer role, not a member
select set_config('request.jwt.claims', '{"sub":"b2222222-0000-0000-0000-000000000002"}', true);
select is((select count(*)::int from public.farms), 0, 'other users cannot see the farm');
select is((select count(*)::int from public.plots), 0, 'other users cannot see its plots');
with u as (update public.farms set name = 'Hijacked' returning 1)
select is(count(*)::int, 0, 'other users cannot rename the farm') from u;
select throws_ok($$
  insert into public.farms (name, location) values ('Bola Farm', 'SRID=4326;POINT(3.9 7.4)')
$$, '42501', null, 'a user without a farmer role cannot add a farm');

---------------------------------------------------------------- business: Ade makes a company, adds staff
select set_config('request.jwt.claims', '{"sub":"a1111111-0000-0000-0000-000000000001"}', true);
insert into public.organizations (name) values ('Ade Agro Ltd');
insert into public.org_members (organization_id, profile_id, member_role)
  select id, 'b2222222-0000-0000-0000-000000000002', 'worker' from public.organizations where name = 'Ade Agro Ltd';
insert into public.org_members (organization_id, profile_id, member_role)
  select id, 'c3333333-0000-0000-0000-000000000003', 'farm_manager' from public.organizations where name = 'Ade Agro Ltd';
update public.farms set organization_id = (select id from public.organizations where name = 'Ade Agro Ltd')
 where name = 'Ade Farm Akinyele';

select set_config('request.jwt.claims', '{"sub":"b2222222-0000-0000-0000-000000000002"}', true);
select is((select count(*)::int from public.farms), 1, 'a worker in the business can see the business farm');
with u as (update public.farms set name = 'Worker rename' returning 1)
select is(count(*)::int, 0, 'a worker cannot edit the business farm') from u;

select set_config('request.jwt.claims', '{"sub":"c3333333-0000-0000-0000-000000000003"}', true);
with u as (update public.farms set address_hint = 'Behind the market' returning 1)
select is(count(*)::int, 1, 'a farm manager can edit the business farm') from u;

---------------------------------------------------------------- field agent
select set_config('request.jwt.claims', '{"sub":"d4444444-0000-0000-0000-000000000004"}', true);
select lives_ok($$
  insert into public.farms (owner_id, onboarded_by, name, location, area_ha)
  values ('e5555555-0000-0000-0000-000000000005', auth.uid(), 'Efe Cassava Farm', 'SRID=4326;POINT(3.95 7.35)', 1.2)
$$, 'a field agent can add a farm for a farmer they onboarded');
select is((select count(*)::int from public.farms), 1, 'the agent sees only farms they onboarded');
select throws_ok($$
  insert into public.farms (owner_id, onboarded_by, name, location)
  values ('a1111111-0000-0000-0000-000000000001', auth.uid(), 'Not mine', 'SRID=4326;POINT(3.9 7.4)')
$$, '42501', null, 'a field agent cannot add farms for farmers they did not onboard');

---------------------------------------------------------------- anonymous visitors
set local role anon;
select throws_ok($$ select count(*) from public.farms $$, '42501', null, 'anonymous visitors cannot read farms');

reset role;
select * from finish();
rollback;
