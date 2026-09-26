-- Identity, role requests, approvals, verification tiers and business accounts.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

-- Fixture users (inserting into auth.users fires the profile trigger)
insert into auth.users (id, phone, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', '2348000000011', '{"full_name":"Adebayo Farmer","preferred_language":"yo"}'),
  ('22222222-2222-2222-2222-222222222222', '2348000000022', '{"full_name":"Bisi Other"}'),
  ('33333333-3333-3333-3333-333333333333', '2348000000033', '{"full_name":"Officer Kemi"}');
insert into public.admin_roles (profile_id, admin_role)
  values ('33333333-3333-3333-3333-333333333333', 'verification_officer');

select is(
  (select count(*)::int from public.profiles where id in (
    '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333')),
  3, 'a profile is created for every sign-up');
select is(
  (select full_name || '/' || preferred_language from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Adebayo Farmer/yo', 'profile takes name and language from sign-up metadata');

---------------------------------------------------------------- as farmer A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);

select is((select count(*)::int from public.profiles), 1, 'a user sees only their own profile');
select lives_ok($$ update public.profiles set full_name = 'Adebayo Okafor' where id = auth.uid() $$,
  'a user can edit their own name');
select throws_ok($$ update public.profiles set verification_tier = 3 where id = auth.uid() $$,
  '42501', null, 'a user cannot raise their own verification tier');

select lives_ok($$ insert into public.role_requests (role) values ('crop_farmer') $$,
  'a user can request the crop farmer role');
select ok(public.has_role('crop_farmer'), 'crop farmer role is approved instantly');
select is((select status::text from public.role_requests where role = 'crop_farmer'), 'approved',
  'the auto-approved request is marked approved');

select lives_ok($$ insert into public.role_requests (role, details) values ('machinery_owner', '{"equipment":"Tractor 75hp"}') $$,
  'a user can request the machinery owner role');
select ok(not public.has_role('machinery_owner'), 'machinery owner role waits for approval');
select throws_ok($$ insert into public.role_requests (role) values ('machinery_owner') $$,
  '23505', null, 'only one pending request per role');
select throws_ok($$ insert into public.role_requests (role) values ('service_provider') $$,
  '23514', null, 'a service provider request must name the provider type');
select throws_ok($$ insert into public.role_requests (role) values ('crop_farmer') $$,
  'P0001', 'You already hold this role.', 'cannot request a role already held');
select throws_ok($$ insert into public.role_requests (role, status) values ('buyer_offtaker', 'approved') $$,
  '42501', null, 'a user cannot submit an already-approved request');
select throws_ok($$ insert into public.role_requests (role) values ('admin') $$,
  '22P02', null, 'admin is not a requestable role');
select throws_ok($$ insert into public.user_roles (profile_id, role) values (auth.uid(), 'machinery_owner') $$,
  '42501', null, 'a user cannot grant themselves a role');
select throws_ok(
  $$ select public.approve_role_request((select id from public.role_requests where role = 'machinery_owner')) $$,
  '42501', 'You do not have permission to approve role requests.', 'a normal user cannot approve requests');

insert into public.role_requests (role, provider_type) values ('service_provider', 'mechanic');
select is((select (public.cancel_role_request(id)).status::text from public.role_requests
            where role = 'service_provider' and status = 'pending'),
  'cancelled', 'a user can cancel their own pending request');

---------------------------------------------------------------- as user B
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);
select is((select count(*)::int from public.role_requests), 0, 'users cannot see other people''s requests');

---------------------------------------------------------------- as the verification officer
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', true);
select is((select count(*)::int from public.role_requests where status = 'pending'), 1,
  'the officer sees the pending queue');
select throws_ok(
  $$ select public.reject_role_request((select id from public.role_requests where status = 'pending'), 'no') $$,
  '22023', null, 'a rejection needs a real reason');
select throws_ok(
  $$ select public.approve_role_request((select id from public.role_requests where status = 'pending'), 'Tractor seen') $$,
  '22023', 'Accept at least one supporting document before approving.',
  'a role that needs documents cannot be approved without an accepted document');
reset role;
insert into public.verification_documents (profile_id, role_request_id, document_type, storage_path, mime_type, size_bytes, status)
select profile_id, id, 'equipment_ownership', profile_id::text || '/tractor-receipt-0001.pdf', 'application/pdf', 1000, 'accepted'
  from public.role_requests where status = 'pending' and role = 'machinery_owner';
set local role authenticated;
select lives_ok(
  $$ select public.approve_role_request((select id from public.role_requests where status = 'pending'), 'Tractor seen') $$,
  'the officer approves the machinery owner request once a document is accepted');
select ok(exists(select 1 from public.user_roles
                  where profile_id = '11111111-1111-1111-1111-111111111111' and role = 'machinery_owner'),
  'approval grants the role');
reset role;
select ok(exists(select 1 from public.audit_log where action = 'role_approved'
                   and actor_id = '33333333-3333-3333-3333-333333333333'
                   and new_values ->> 'status' = 'approved'),
  'approval is written to the audit log with before/after values');

---------------------------------------------------------------- verification tiers (server-side writes)
insert into public.verifications (profile_id, kind, status, provider, masked_value, verified_at)
  values ('11111111-1111-1111-1111-111111111111', 'nin', 'verified', 'test', '*******4417', now());
select is((select verification_tier from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1::smallint, 'a verified NIN gives tier 1');
insert into public.verifications (profile_id, kind, status, provider, masked_value, verified_at)
  values ('11111111-1111-1111-1111-111111111111', 'bvn', 'verified', 'test', '*******0021', now());
select is((select verification_tier from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1::smallint, 'NIN plus BVN without a verified bank account stays at tier 1');
insert into public.bank_accounts (profile_id, bank_code, bank_name, account_name, account_number_last4, provider, status, verified_at, is_default)
  values ('11111111-1111-1111-1111-111111111111', '058', 'Test Bank', 'Adebayo Okafor', '1234', 'test', 'verified', now(), true);
select is((select verification_tier from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  2::smallint, 'NIN, BVN and a verified bank account give tier 2 (payout-ready)');

---------------------------------------------------------------- business accounts
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
insert into public.organizations (name, cac_number) values ('Okafor Farms Ltd', 'RC123456');
select is((select member_role::text from public.org_members where profile_id = auth.uid()), 'owner',
  'the creator becomes owner of the business');

insert into public.org_members (organization_id, profile_id, member_role)
  select id, '22222222-2222-2222-2222-222222222222', 'worker' from public.organizations;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222"}', true);
select throws_ok(
  $$ insert into public.org_members (organization_id, profile_id, member_role)
     select id, '33333333-3333-3333-3333-333333333333', 'worker' from public.organizations $$,
  '42501', null, 'staff who are not the owner cannot add members');

---------------------------------------------------------------- anonymous visitors
set local role anon;
select throws_ok($$ select count(*) from public.profiles $$, '42501', null, 'anonymous visitors cannot read profiles');

reset role;
select * from finish();
rollback;
