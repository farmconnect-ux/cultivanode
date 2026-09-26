-- M1 accounts: onboarding, role approval rules, business staff, privacy requests, staff tools and
-- field-agent assisted onboarding.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(57);

insert into auth.users (id, phone) values
  ('80000000-0000-0000-0000-000000000001', '2348000000801'),  -- Ada: individual farmer
  ('80000000-0000-0000-0000-000000000002', '2348000000802'),  -- Bisi: business owner
  ('80000000-0000-0000-0000-000000000003', '2348000000803'),  -- Chi: verification officer
  ('80000000-0000-0000-0000-000000000004', '2348000000804'),  -- Dayo: super admin
  ('80000000-0000-0000-0000-000000000005', '2348000000805'),  -- Efe: support
  ('80000000-0000-0000-0000-000000000006', '2348000000806');  -- Femi: field agent
insert into public.admin_roles (profile_id, admin_role) values
  ('80000000-0000-0000-0000-000000000003', 'verification_officer'),
  ('80000000-0000-0000-0000-000000000004', 'super_admin'),
  ('80000000-0000-0000-0000-000000000005', 'support_disputes');
update public.profiles set full_name = 'Staff', onboarded_at = now()
 where id in ('80000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000004',
              '80000000-0000-0000-0000-000000000005');
insert into public.user_roles (profile_id, role) values ('80000000-0000-0000-0000-000000000006', 'field_agent');
update public.profiles set full_name = 'Femi Agent', onboarded_at = now() where id = '80000000-0000-0000-0000-000000000006';

---------------------------------------------------------------- onboarding
set local role authenticated;
select set_config('request.jwt.claims', '{}', true);
select throws_ok($$ select public.complete_onboarding('Ada Obi', 'individual', null, null, 'Oyo', 'Ido', 'en',
  '[{"role":"crop_farmer"}]', '{"terms_of_use":true,"privacy_policy":true}', 'v1') $$,
  '42501', null, 'onboarding needs a signed-in user');

select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000001"}', true);
select throws_ok($$ select public.complete_onboarding('Ada Obi', 'individual', null, null, 'Oyo', 'Ido', 'en',
  '[{"role":"crop_farmer"}]', '{"terms_of_use":true,"privacy_policy":false}', 'v1') $$,
  '22023', 'Accept the terms of use and the privacy policy to continue.', 'the privacy policy must be accepted');
select throws_ok($$ select public.complete_onboarding('Ada Obi', 'individual', null, null, 'Oyo', 'Ido', 'en',
  '[{"role":"investor"}]', '{"terms_of_use":true,"privacy_policy":true}', 'v1') $$,
  '22023', 'That role is not open yet.', 'roles that are not open cannot be chosen');
select throws_ok($$ select public.complete_onboarding('Ada Obi', 'individual', null, null, 'Oyo', 'Ido', 'en',
  '[{"role":"service_provider"}]', '{"terms_of_use":true,"privacy_policy":true}', 'v1') $$,
  '22023', 'Choose the kind of service you offer.', 'a service provider must choose a service');
select throws_ok($$ select public.complete_onboarding('Ada Obi', 'individual', null, null, 'Oyo', 'Ido', 'en',
  '[]', '{"terms_of_use":true,"privacy_policy":true}', 'v1') $$,
  '22023', 'Choose at least one role.', 'at least one role is needed');
select throws_ok($$ select public.complete_onboarding('Ada Obi', 'individual', null, null, 'Oyo', 'Ido', 'en',
  '[{"role":"crop_farmer"}]', '{"terms_of_use":true,"privacy_policy":true,"sell_my_soul":true}', 'v1') $$,
  '22023', 'Unknown consent choice.', 'unknown consent keys are refused');
select throws_ok($$ select public.complete_onboarding('A', 'individual', null, null, 'Oyo', 'Ido', 'en',
  '[{"role":"crop_farmer"}]', '{"terms_of_use":true,"privacy_policy":true}', 'v1') $$,
  '22023', null, 'a real name is needed');

select lives_ok($$ select public.complete_onboarding(' Ada Obi ', 'individual', null, null, 'Oyo', 'Ido', 'yo',
  '[{"role":"crop_farmer"},{"role":"machinery_owner"},{"role":"crop_farmer"}]',
  '{"terms_of_use":true,"privacy_policy":true,"data_processing":true,"marketing_messages":false}', '2026-09 (draft)') $$,
  'a new user completes onboarding');
select is((select full_name || '|' || preferred_language || '|' || (onboarded_at is not null)::text
             from public.profiles where id = auth.uid()),
  'Ada Obi|yo|true', 'name, language and completion are saved');
select ok(public.has_role('crop_farmer'), 'the farmer role is granted at once');
select is((select status::text from public.role_requests where role = 'machinery_owner'), 'pending',
  'the machinery owner role waits for review');
select is((select count(*)::int from public.role_requests where role = 'crop_farmer'), 1,
  'a role chosen twice is requested once');
select is((select count(*)::int from public.current_consents where profile_id = auth.uid() and granted), 3,
  'the three accepted consents are recorded');
select is((select channel || '|' || document_version from public.consents
            where profile_id = auth.uid() and consent_type = 'terms_of_use'),
  'web|2026-09 (draft)', 'consents carry the channel and the document version');
select throws_ok($$ select public.complete_onboarding('Ada Obi', 'individual', null, null, 'Oyo', 'Ido', 'en',
  '[{"role":"crop_farmer"}]', '{"terms_of_use":true,"privacy_policy":true}', 'v1') $$,
  'P0001', 'Your account is already set up.', 'onboarding runs once');
select throws_ok($$ update public.profiles set onboarded_at = null where id = auth.uid() $$,
  '42501', null, 'users cannot reset their own onboarding');
select throws_ok($$ insert into public.role_requests (role) values ('investor') $$,
  '22023', 'This role is not open yet.', 'closed roles cannot be requested later either');

-- Business account
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000002"}', true);
select throws_ok($$ select public.complete_onboarding('Bisi Ade', 'business', ' ', null, 'Ogun', null, 'en',
  '[{"role":"crop_farmer"}]', '{"terms_of_use":true,"privacy_policy":true}', 'v1') $$,
  '22023', null, 'a business account needs a business name');
select lives_ok($$ select public.complete_onboarding('Bisi Ade', 'business', 'Ade Farms Ltd', 'RC123456', 'Ogun', null, 'en',
  '[{"role":"crop_farmer"},{"role":"service_provider","provider_type":"mechanic"}]',
  '{"terms_of_use":true,"privacy_policy":true}', 'v1') $$,
  'a business owner completes onboarding');
select is((select account_type::text from public.profiles where id = auth.uid()), 'business',
  'the profile becomes a business account');
select is((select public.org_role(id)::text from public.organizations where name = 'Ade Farms Ltd'), 'owner',
  'the person owns the new business');

---------------------------------------------------------------- business staff
select throws_ok($$ select public.add_org_member((select id from public.organizations limit 1), '0800 000 0899', 'worker') $$,
  'P0002', null, 'staff must have an account first');
select throws_ok($$ select public.add_org_member((select id from public.organizations limit 1), '08000000801', 'owner') $$,
  '22023', 'A business has one owner.', 'a second owner cannot be added');
select lives_ok($$ select public.add_org_member((select id from public.organizations limit 1), '0800 000 0801', 'farm_manager') $$,
  'the owner adds a farm manager by phone number');
select throws_ok($$ select public.add_org_member((select id from public.organizations limit 1), '08000000801', 'worker') $$,
  'P0001', null, 'the same person is not added twice');
select is((select string_agg(member_role::text || ':' || coalesce(phone_hint, '-'), ',')
             from public.org_member_list((select id from public.organizations limit 1))),
  'owner:0800****802,farm_manager:0800****801', 'the staff list shows roles and masked numbers');

select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000001"}', true);
select throws_ok($$ select public.add_org_member((select id from public.organizations where name = 'Ade Farms Ltd'), '08000000803', 'worker') $$,
  '42501', null, 'a manager cannot add staff');
select is((select count(*)::int from public.org_member_list((select organization_id from public.org_members
             where profile_id = auth.uid()))), 2, 'staff can see who else works for the business');

---------------------------------------------------------------- privacy
select lives_ok($$ select public.request_account_deletion('Moving away') $$, 'a user asks for account deletion');
select throws_ok($$ select public.request_account_deletion(null) $$, 'P0001', null, 'only one open deletion request');
select is((select public.export_my_data() -> 'profile' ->> 'full_name'), 'Ada Obi', 'the export holds the profile');
select ok((select jsonb_array_length(public.export_my_data() -> 'consents') = 4), 'the export holds the consent history');
select ok((select not (public.export_my_data() -> 'identity_checks')::text like '%id_hash%'), 'ID fingerprints are not exported');
select throws_ok($$ insert into public.data_requests (kind) values ('deletion') $$, '42501', null,
  'requests are made through the functions only');
select throws_ok($$ select public.admin_resolve_data_request((select id from public.data_requests where kind = 'deletion'), 'completed', 'Deleted everything') $$,
  '42501', null, 'users cannot resolve requests');

select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000005"}', true);
select is((select count(*)::int from public.data_requests where status = 'open'), 1, 'support sees the open request');
select lives_ok($$ select public.admin_resolve_data_request((select id from public.data_requests where kind = 'deletion'), 'completed', 'Account and farm records deleted') $$,
  'support resolves the deletion request');

---------------------------------------------------------------- staff tools
select is((public.admin_dashboard() ->> 'open_data_requests')::int, 0, 'support sees the privacy queue');
select ok((public.admin_dashboard() -> 'pending_role_requests') = 'null'::jsonb, 'support does not see the approval queue size');

select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000001"}', true);
select throws_ok($$ select public.admin_dashboard() $$, '42501', null, 'non-staff cannot open the dashboard');

select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000003"}', true);
select is((public.admin_dashboard() ->> 'pending_role_requests')::int, 2, 'the officer sees two requests waiting');
select throws_ok($$ select public.admin_grant_admin_role('80000000-0000-0000-0000-000000000001', 'verification_officer', 'Helping out') $$,
  '42501', null, 'an officer cannot hand out staff roles');

-- Field agent approval needs tier 1 (a verified NIN).
reset role;
insert into public.role_requests (profile_id, role) values ('80000000-0000-0000-0000-000000000001', 'field_agent');
insert into public.verification_documents (profile_id, role_request_id, document_type, storage_path, mime_type, size_bytes, status)
select profile_id, id, 'national_id', profile_id::text || '/agent-id-card-0001.jpg', 'image/jpeg', 1000, 'accepted'
  from public.role_requests where role = 'field_agent' and profile_id = '80000000-0000-0000-0000-000000000001';
set local role authenticated;
select throws_ok($$ select public.approve_role_request((select id from public.role_requests where role = 'field_agent'
                     and profile_id = '80000000-0000-0000-0000-000000000001')) $$,
  '22023', 'The applicant must reach verification tier 1 first.', 'a field agent needs a verified NIN first');

select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000004"}', true);
select lives_ok($$ select public.admin_grant_admin_role('80000000-0000-0000-0000-000000000001', 'verification_officer', 'Second reviewer') $$,
  'a super admin grants a staff role');
select throws_ok($$ select public.admin_revoke_admin_role('80000000-0000-0000-0000-000000000004', 'super_admin', 'Stepping down') $$,
  'P0001', 'The platform needs at least one super admin.', 'the last super admin cannot be removed');
select lives_ok($$ select public.admin_revoke_admin_role('80000000-0000-0000-0000-000000000001', 'verification_officer', 'Cover finished') $$,
  'a super admin removes a staff role');
select is((select count(*)::int from public.admin_actions where permission = 'admin.manage'), 2,
  'staff role changes are recorded as admin actions');

reset role;
insert into public.contact_messages (full_name, phone, message) values ('Visitor', '2348000000999', 'Hello there');
set local role authenticated;
select throws_ok($$ update public.contact_messages set handled_at = now() $$, '42501', null,
  'contact messages are marked through the function only');
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000005"}', true);
select lives_ok($$ select public.admin_set_contact_handled((select id from public.contact_messages limit 1), true) $$,
  'support marks a message handled');

---------------------------------------------------------------- field-agent assisted onboarding
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000006"}', true);
select throws_ok($$ select public.agent_onboarding_start('80000000-0000-0000-0000-000000000006', '08011112222', repeat('a', 64)) $$,
  '42501', null, 'the app cannot call the agent functions directly');

reset role;
set local role service_role;
select throws_ok($$ select public.agent_onboarding_start('80000000-0000-0000-0000-000000000001', '08011112222', repeat('a', 64)) $$,
  '42501', 'not_field_agent', 'only field agents can register farmers');
select throws_ok($$ select public.agent_onboarding_start('80000000-0000-0000-0000-000000000006', '08000000801', repeat('a', 64)) $$,
  'P0001', 'already_registered', 'an existing account cannot be registered again');
select is((public.agent_onboarding_start('80000000-0000-0000-0000-000000000006', '0801 111 2222', repeat('a', 64)) ->> 'phone'),
  '2348011112222', 'the agent starts registration and a code is stored');
select is((public.agent_onboarding_verify('80000000-0000-0000-0000-000000000006', '08011112222', repeat('b', 64)) ->> 'ok'),
  'false', 'a wrong code is refused');
select is((public.agent_onboarding_verify('80000000-0000-0000-0000-000000000006', '08011112222', repeat('a', 64)) ->> 'ok'),
  'true', 'the farmer''s code is accepted');
reset role;
insert into auth.users (id, phone) values ('80000000-0000-0000-0000-000000000007', '2348011112222');
set local role service_role;
select lives_ok($$ select public.agent_onboarding_complete('80000000-0000-0000-0000-000000000006',
  '80000000-0000-0000-0000-000000000007', 'Gbenga Farmer', 'Oyo', 'Iseyin', 'yo', '[{"role":"crop_farmer"}]',
  '{"terms_of_use":true,"privacy_policy":true,"data_processing":true}', 'v1') $$,
  'the agent completes the farmer''s registration');
select is((select onboarded_by::text || '|' || (select string_agg(distinct channel, ',') from public.consents c where c.profile_id = p.id)
             from public.profiles p where id = '80000000-0000-0000-0000-000000000007'),
  '80000000-0000-0000-0000-000000000006|field_agent', 'the farmer is linked to the agent and consents are marked as agent-collected');

select * from finish();
rollback;
