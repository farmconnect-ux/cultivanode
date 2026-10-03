-- MVP week 1: one claimant per ID, suspension and sign-out, the marketplace kill switch, listing publishing
-- and moderation, and the admin views (users search, queue counts, agent codes, business staff).
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(59);

insert into auth.users (id, phone) values
  ('b1000000-0000-0000-0000-000000000001', '2348000001001'),  -- Sade: super admin
  ('b1000000-0000-0000-0000-000000000002', '2348000001002'),  -- Tunde: support and disputes
  ('b1000000-0000-0000-0000-000000000003', '2348000001003'),  -- Uche: verification officer
  ('b1000000-0000-0000-0000-000000000004', '2348000001004'),  -- Kemi: farmer in Oyo
  ('b1000000-0000-0000-0000-000000000005', '2348000001005'),  -- Lanre: tractor owner, tier 2
  ('b1000000-0000-0000-0000-000000000006', '2348000001006'),  -- Musa: farmer in Lagos
  ('b1000000-0000-0000-0000-000000000007', '2348000001007');  -- Ngozi: farm manager at Lanre's business
insert into public.admin_roles (profile_id, admin_role) values
  ('b1000000-0000-0000-0000-000000000001', 'super_admin'),
  ('b1000000-0000-0000-0000-000000000002', 'support_disputes'),
  ('b1000000-0000-0000-0000-000000000003', 'verification_officer');
update public.profiles set onboarded_at = now(), full_name = v.n, state = v.s
  from (values ('b1000000-0000-0000-0000-000000000001'::uuid, 'Sade Admin', 'Lagos'),
               ('b1000000-0000-0000-0000-000000000002'::uuid, 'Tunde Support', 'Oyo'),
               ('b1000000-0000-0000-0000-000000000003'::uuid, 'Uche Officer', 'Oyo'),
               ('b1000000-0000-0000-0000-000000000004'::uuid, 'Kemi Farmer', 'Oyo'),
               ('b1000000-0000-0000-0000-000000000005'::uuid, 'Lanre Tractors Adeyemi', 'Oyo'),
               ('b1000000-0000-0000-0000-000000000006'::uuid, 'Musa Farmer', 'Lagos'),
               ('b1000000-0000-0000-0000-000000000007'::uuid, 'Ngozi Manager', 'Oyo')) v(i, n, s)
 where id = v.i;
insert into public.user_roles (profile_id, role) values
  ('b1000000-0000-0000-0000-000000000004', 'crop_farmer'),
  ('b1000000-0000-0000-0000-000000000005', 'machinery_owner'),
  ('b1000000-0000-0000-0000-000000000006', 'crop_farmer');
update public.profiles set verification_tier = 2 where id = 'b1000000-0000-0000-0000-000000000005';
insert into public.farms (id, owner_id, name, location, state) values
  ('b1000000-0000-0000-0000-0000000000f1', 'b1000000-0000-0000-0000-000000000004', 'Kemi maize', 'SRID=4326;POINT(3.8967 7.3775)', 'Oyo');
insert into auth.sessions (user_id) values
  ('b1000000-0000-0000-0000-000000000005'), ('b1000000-0000-0000-0000-000000000005'),
  ('b1000000-0000-0000-0000-000000000004');

---------------------------------------------------------------- 1. one claimant per ID
select is((public.record_identity_verification('b1000000-0000-0000-0000-000000000004', 'nin', true, 'mock', 'r1', '*******1234',
            repeat('a', 64), 1.0)) ->> 'status', 'verified', 'the first account to verify a NIN claims it');
select is((public.record_identity_verification('b1000000-0000-0000-0000-000000000006', 'nin', true, 'mock', 'r2', '*******1234',
            repeat('a', 64), 1.0)) ->> 'failure_reason', 'already_linked', 'a second account with the same NIN is refused');
select is((public.record_identity_verification('b1000000-0000-0000-0000-000000000004', 'nin', true, 'mock', 'r3', '*******1234',
            repeat('a', 64), 1.0)) ->> 'status', 'verified', 'the owner can verify the same NIN again');
select is((public.record_identity_verification('b1000000-0000-0000-0000-000000000006', 'bvn', true, 'mock', 'r4', '*******1234',
            repeat('a', 64), 1.0)) ->> 'status', 'verified', 'claims are per kind (a BVN hash does not clash with a NIN hash)');
select is((public.record_bank_account_verification('b1000000-0000-0000-0000-000000000005', '058', 'GTBank', 'LANRE A', '1234',
            'mock', true, repeat('b', 64), 1.0)) ->> 'status', 'verified', 'a bank account is claimed by its first verifier');
select is((public.record_bank_account_verification('b1000000-0000-0000-0000-000000000004', '058', 'GTBank', 'LANRE A', '1234',
            'mock', true, repeat('b', 64), 1.0)) ->> 'failure_reason', 'already_linked', 'and refused for anyone else');
select is((select count(*)::int from public.id_claims), 3, 'three claims recorded');

---------------------------------------------------------------- 2. suspension, flags, sign-out
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000004"}', true);
select throws_ok($$ select public.admin_set_account_suspension('b1000000-0000-0000-0000-000000000005', true, 'Testing a refusal') $$,
  '42501', null, 'ordinary users cannot suspend accounts');
select throws_ok($$ select * from public.id_claims $$, '42501', null, 'id_claims cannot be read through the API');
select throws_ok($$ update public.profiles set suspended_at = now() where id = 'b1000000-0000-0000-0000-000000000004' $$,
  '42501', null, 'people cannot lift or set their own suspension');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000003"}', true);
select throws_ok($$ select public.admin_set_account_suspension('b1000000-0000-0000-0000-000000000005', true, 'Not my job') $$,
  '42501', null, 'a verification officer cannot suspend accounts');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000002"}', true);
select throws_ok($$ select public.admin_set_account_suspension('b1000000-0000-0000-0000-000000000005', true, 'no') $$,
  '22023', null, 'a reason is required');
select throws_ok($$ select public.admin_set_account_suspension('b1000000-0000-0000-0000-000000000002', true, 'Suspending myself') $$,
  '42501', null, 'staff cannot suspend themselves');
select throws_ok($$ select public.admin_set_account_suspension('b1000000-0000-0000-0000-000000000003', true, 'Staff dispute here') $$,
  '42501', null, 'support cannot suspend another staff member');
select lives_ok($$ select public.admin_set_account_flag('b1000000-0000-0000-0000-000000000006', true, 'Two farms at one pin') $$,
  'support can flag an account');
select lives_ok($$ select public.admin_force_sign_out('b1000000-0000-0000-0000-000000000004', 'Lost phone reported') $$,
  'support can force a sign-out');

reset role;
select is((select count(*)::int from auth.sessions where user_id = 'b1000000-0000-0000-0000-000000000004'), 0,
  'force sign-out ends every session');
select ok((select flagged_at is not null and flag_reason = 'Two farms at one pin' from public.profiles
            where id = 'b1000000-0000-0000-0000-000000000006'), 'the flag and its reason are stored');

---------------------------------------------------------------- 3. listings and the kill switch
-- (The bank check above recomputed Lanre's tier from his checks; set tier 2 directly for these tests.)
update public.profiles set verification_tier = 2 where id = 'b1000000-0000-0000-0000-000000000005';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000005"}', true);
select is(public.marketplace_open(), false, 'the marketplace starts switched off');
select throws_ok($$ insert into public.listings (kind, equipment_type, title, location, service_radius_km, status)
  values ('equipment', 'tractor', 'Lanre tractor', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'active') $$,
  '42501', null, 'publishing is refused while the marketplace is off');
select lives_ok($$ insert into public.listings (kind, equipment_type, title, description, location, service_radius_km, status)
  values ('equipment', 'tractor', 'Lanre tractor', '75 hp with operator', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'draft') $$,
  'a draft can be saved while the marketplace is off');
select lives_ok($$ insert into public.listing_rates (listing_id, unit, rate_kobo)
  select id, 'hectare', 2500000 from public.listings where title = 'Lanre tractor' $$, 'the owner prices the draft');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000002"}', true);
select throws_ok($$ select public.admin_set_feature_flag('marketplace_live', true, null, 'Open the pilot') $$,
  '42501', null, 'support cannot flip the kill switch (settings.manage)');
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000001"}', true);
select lives_ok($$ select public.admin_set_feature_flag('marketplace_live', true, array['Oyo'], 'Open the Oyo pilot') $$,
  'a super admin opens the marketplace for Oyo');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000005"}', true);
update public.listings set status = 'active' where title = 'Lanre tractor';
select is((select status::text from public.listings where title = 'Lanre tractor'), 'active',
  'the Oyo owner can publish once the marketplace is open there');
select is((select count(*)::int from public.nearby_listings(7.3775, 3.8967)), 0,
  'owners do not see their own listings in search');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000004"}', true);
select is((select array_agg(title) from public.nearby_listings(7.3775, 3.8967)), array['Lanre tractor'],
  'a farmer in Oyo finds the listing 5 km away');
select is((select provider from public.nearby_listings(7.3775, 3.8967)), '{"name": "Lanre", "state": "Oyo", "tier": 2, "rating": null}'::jsonb,
  'the provider card shows first name, state, tier and rating only (none yet)');
select is((select count(*)::int from public.nearby_listings(6.9, 3.8967, 100)), 0,
  'a farmer 60 km away is outside the 30 km service radius');

select is((select r ->> 'title' from public.nearby_listings_for_farm('b1000000-0000-0000-0000-0000000000f1') r), 'Lanre tractor',
  'searching from the farmer''s own farm uses the farm pin');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000006"}', true);
select is((select count(*)::int from public.nearby_listings(7.3775, 3.8967)), 0,
  'a farmer whose state is not in the pilot sees nothing');
select throws_ok($$ select * from public.nearby_listings_for_farm('b1000000-0000-0000-0000-0000000000f1') $$,
  'P0002', null, 'nobody can search from someone else''s farm');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000005"}', true);
select is((select round((public.my_listings() -> 0 ->> 'lat')::numeric, 3)), 7.422, 'my_listings() returns the pin');
select is((select public.my_listings() -> 0 -> 'rates' ->> 'hectare'), '2500000', 'and the prices');

---------------------------------------------------------------- 4. listing moderation
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000004"}', true);
select throws_ok($$ select public.admin_set_listing_status((select id from public.listings where title = 'Lanre tractor'), true, 'Not allowed here') $$,
  '42501', null, 'farmers cannot moderate listings');
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000002"}', true);
update public.listings set status = 'paused' where title = 'Lanre tractor';
select is((select status::text from public.listings where title = 'Lanre tractor'), 'active',
  'staff cannot change listings directly, only through the audited function');
select lives_ok($$ select public.admin_set_listing_status((select id from public.listings where title = 'Lanre tractor'), true, 'Photos are of another machine') $$,
  'support suspends a listing');
select is((select jsonb_array_length(public.admin_listings('suspended', 'lanre'))), 1, 'the admin listings view finds it');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000004"}', true);
select is((select count(*)::int from public.nearby_listings(7.3775, 3.8967)), 0, 'a suspended listing disappears from search');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000005"}', true);
update public.listings set status = 'active' where title = 'Lanre tractor';
select is((select status::text from public.listings where title = 'Lanre tractor'), 'suspended',
  'the owner cannot lift a suspension');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000002"}', true);
select lives_ok($$ select public.admin_set_listing_status((select id from public.listings where title = 'Lanre tractor'), false, 'New photos checked') $$,
  'support restores the listing');
select is((select status::text from public.listings where title = 'Lanre tractor'), 'paused', 'a restored listing comes back paused');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000005"}', true);
update public.listings set status = 'active' where title = 'Lanre tractor';

---------------------------------------------------------------- 5. suspending the owner
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000002"}', true);
select is((public.admin_set_account_suspension('b1000000-0000-0000-0000-000000000005', true, 'Took payment and never came')) ->> 'sessions_ended',
  '2', 'suspending ends the owner''s two sessions');

reset role;
select is((select banned_until from auth.users where id = 'b1000000-0000-0000-0000-000000000005'), 'infinity'::timestamptz,
  'the owner is banned from signing in');
set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000004"}', true);
select is((select count(*)::int from public.nearby_listings(7.3775, 3.8967)), 0,
  'a suspended owner''s listings are hidden from search');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000005"}', true);
select throws_ok($$ insert into public.listings (kind, equipment_type, title, location, service_radius_km, status)
  values ('equipment', 'tractor', 'Second tractor', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'draft') $$,
  '42501', null, 'a suspended account cannot create listings');
select is(public.marketplace_open(), false, 'the marketplace is closed to a suspended account');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000002"}', true);
select lives_ok($$ select public.admin_set_account_suspension('b1000000-0000-0000-0000-000000000005', false, 'Refund confirmed') $$,
  'support restores the account');
reset role;
select ok((select banned_until is null and p.suspended_at is null from auth.users u join public.profiles p on p.id = u.id
            where u.id = 'b1000000-0000-0000-0000-000000000005'), 'restoring lifts the ban');
select is((select count(*)::int from public.admin_actions where permission in ('users.suspend', 'listings.moderate', 'settings.manage')), 7,
  'every suspension, flag, sign-out, moderation and switch change is in admin_actions');

---------------------------------------------------------------- 6. admin views
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000003"}', true);
select is((select public.admin_search_users('0800 000 1005') -> 0 ->> 'full_name'), 'Lanre Tractors Adeyemi',
  'users can be found by a local phone number');
select is((select jsonb_array_length(public.admin_search_users('farmer'))), 2, 'and by name');
select is((select jsonb_array_length(public.admin_search_users(null, 'flagged'))), 1, 'and filtered to flagged accounts');
select ok((public.admin_dashboard()) ? 'median_approval_hours_30d', 'the overview reports the median approval time');

reset role;
insert into public.agent_onboarding_codes (agent_id, phone, code_hash, expires_at) values
  ('b1000000-0000-0000-0000-000000000004', '2348000009999', repeat('c', 64), now() + interval '10 minutes');
insert into public.organizations (id, name, owner_id) values
  ('b1000000-0000-0000-0000-0000000000aa', 'Lanre Farms Ltd', 'b1000000-0000-0000-0000-000000000005');
insert into public.org_members (organization_id, profile_id, member_role) values
  ('b1000000-0000-0000-0000-0000000000aa', 'b1000000-0000-0000-0000-000000000007', 'farm_manager')
on conflict do nothing;
set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000002"}', true);
select is((select public.admin_agent_codes() -> 0 ->> 'farmer_phone'), '234******9999', 'agent codes show a masked farmer phone');
select lives_ok($$ select public.admin_revoke_agent_code((select (public.admin_agent_codes() -> 0 ->> 'id')::uuid), 'Agent phone stolen') $$,
  'support revokes an open agent code');
select is((select public.admin_agent_codes() -> 0 ->> 'state'), 'revoked', 'and it shows as revoked');
select throws_ok($$ select public.admin_remove_org_member('b1000000-0000-0000-0000-0000000000aa', 'b1000000-0000-0000-0000-000000000005', 'Owner removal try') $$,
  '22023', null, 'a business owner cannot be removed');
select lives_ok($$ select public.admin_remove_org_member('b1000000-0000-0000-0000-0000000000aa', 'b1000000-0000-0000-0000-000000000007', 'Left the company') $$,
  'support removes a staff membership');

select * from finish();
rollback;
