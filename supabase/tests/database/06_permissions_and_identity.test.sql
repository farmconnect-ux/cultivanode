-- Permission-based admin access, audit log integrity, role settings, verification documents,
-- bank accounts, consents, record provenance and farm-zone correction.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(40);

insert into auth.users (id, phone, raw_user_meta_data) values
  ('10000000-0000-0000-0000-000000000001', '2348000000301', '{"full_name":"Farmer Tolu"}'),
  ('20000000-0000-0000-0000-000000000002', '2348000000302', '{"full_name":"Farmer Uche"}'),
  ('30000000-0000-0000-0000-000000000003', '2348000000303', '{"full_name":"Verifier Vera"}'),
  ('40000000-0000-0000-0000-000000000004', '2348000000304', '{"full_name":"Agronomist Wale"}'),
  ('50000000-0000-0000-0000-000000000005', '2348000000305', '{"full_name":"Super Yemi"}'),
  ('60000000-0000-0000-0000-000000000006', '2348000000306', '{"full_name":"Agent Zainab"}');
insert into public.admin_roles (profile_id, admin_role) values
  ('30000000-0000-0000-0000-000000000003', 'verification_officer'),
  ('40000000-0000-0000-0000-000000000004', 'agronomy_editor'),
  ('50000000-0000-0000-0000-000000000005', 'super_admin');
insert into public.user_roles (profile_id, role) values
  ('10000000-0000-0000-0000-000000000001', 'crop_farmer'),
  ('60000000-0000-0000-0000-000000000006', 'field_agent');

select ok(exists (select 1 from public.audit_log where action = 'admin_roles_insert'
                    and new_values ->> 'admin_role' = 'super_admin'),
  'granting an admin sub-role is written to the audit log');

---------------------------------------------------------------- permissions
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001"}', true);
select ok(not public.has_permission('users.read'), 'a farmer has no staff permissions');
select is((select count(*)::int from public.my_permissions()), 0, 'a farmer''s permission list is empty');

select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000003"}', true);
select ok(public.has_permission('roles.review'), 'a verification officer can review roles');
select ok(not public.has_permission('audit.read'), 'a verification officer cannot read the audit log');
select ok(not public.has_permission('payouts.approve'), 'a verification officer cannot approve payouts');
select is((select count(*)::int from public.audit_log), 0, 'the audit log is hidden without audit.read');
select is((select count(*)::int from public.profiles), 6, 'users.read lets the officer see profiles');

select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000004"}', true);
select ok(public.has_permission('standards.publish'), 'an agronomy editor can publish standards');
select ok(not public.has_permission('roles.review'), 'an agronomy editor cannot review roles');

select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000005"}', true);
select ok(public.has_permission('payouts.approve') and public.has_permission('admin.manage'),
  'a super admin has every permission');
select ok((select count(*) from public.audit_log) > 0, 'a super admin can read the audit log');

---------------------------------------------------------------- audit log is append-only
reset role;
select throws_ok($$ update public.audit_log set action = 'forged' $$, '42501', null,
  'audit entries cannot be edited, even by the database owner');
select throws_ok($$ delete from public.audit_log $$, '42501', null, 'audit entries cannot be deleted');

---------------------------------------------------------------- role settings
select throws_ok($$ update public.roles set auto_approve = true where role = 'machinery_owner' $$, '23514', null,
  'sensitive roles can never be set to automatic approval');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001"}', true);
update public.roles set requires_documents = false where role = 'machinery_owner';
select ok((select requires_documents from public.roles where role = 'machinery_owner'),
  'a normal user cannot change role settings');
select ok((select not available from public.roles where role = 'investor'),
  'Phase 2 roles are recorded but not yet offered');

---------------------------------------------------------------- verification documents
insert into public.role_requests (role) values ('machinery_owner');
select lives_ok($$
  insert into public.verification_documents (role_request_id, document_type, storage_path, mime_type, size_bytes)
  select id, 'equipment_ownership', '10000000-0000-0000-0000-000000000001/tractor-receipt.pdf', 'application/pdf', 250000
    from public.role_requests where role = 'machinery_owner'
$$, 'an applicant can attach a document to their own request');
select throws_ok($$
  insert into public.verification_documents (document_type, storage_path, mime_type, size_bytes)
  values ('national_id', '20000000-0000-0000-0000-000000000002/someone-else.jpg', 'image/jpeg', 1000)
$$, '23514', null, 'a document must live in the uploader''s own folder');
select throws_ok($$
  insert into public.verification_documents (document_type, storage_path, mime_type, size_bytes)
  values ('national_id', '10000000-0000-0000-0000-000000000001/virus.exe', 'application/x-msdownload', 1000)
$$, '23514', null, 'only images and PDFs are accepted');
select throws_ok($$
  insert into public.verification_documents (document_type, storage_path, mime_type, size_bytes)
  values ('national_id', '10000000-0000-0000-0000-000000000001/huge.pdf', 'application/pdf', 6000000)
$$, '23514', null, 'files over 5 MB are rejected');
select lives_ok($$
  insert into storage.objects (bucket_id, name) values ('verification-documents', '10000000-0000-0000-0000-000000000001/tractor-receipt.pdf')
$$, 'an applicant can upload into their own private folder');
select throws_ok($$
  insert into storage.objects (bucket_id, name) values ('verification-documents', '20000000-0000-0000-0000-000000000002/planted.pdf')
$$, '42501', null, 'nobody can upload into another person''s folder');
select throws_ok($$
  select public.review_verification_document((select id from public.verification_documents limit 1), 'accepted')
$$, '42501', null, 'an applicant cannot review their own document');

select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000002"}', true);
select is((select count(*)::int from public.verification_documents), 0, 'other users cannot see someone''s documents');
select is((select count(*)::int from storage.objects where bucket_id = 'verification-documents'), 0,
  'other users cannot see someone''s uploaded files');

select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000003"}', true);
select is((select (public.review_verification_document(id, 'accepted')).status::text
             from public.verification_documents limit 1), 'accepted', 'a verification officer accepts the document');
reset role;
select ok(exists (select 1 from public.admin_actions where action = 'verification_document_accepted'
                    and permission = 'verification.review' and actor_id = '30000000-0000-0000-0000-000000000003'),
  'the decision is recorded as an admin action');

---------------------------------------------------------------- bank accounts and consents
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001"}', true);
select throws_ok($$
  insert into public.bank_accounts (profile_id, bank_code, bank_name, account_name, account_number_last4, provider)
  values (auth.uid(), '058', 'Test Bank', 'Tolu', '9999', 'test')
$$, '42501', null, 'apps cannot add or verify bank accounts directly (server only)');

select lives_ok($$
  insert into public.consents (consent_type, granted, document_version) values
    ('privacy_policy', true, '2026-09'), ('share_with_lenders', true, '2026-09')
$$, 'a user records their consents');
insert into public.consents (consent_type, granted, document_version) values ('share_with_lenders', false, '2026-09');
select is((select granted from public.current_consents where consent_type = 'share_with_lenders'), false,
  'consent can be withdrawn; the latest choice is the current one');
select throws_ok($$ update public.consents set granted = true $$, '42501', null, 'consent history cannot be rewritten');
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000002"}', true);
select is((select count(*)::int from public.consents), 0, 'other users cannot see someone''s consents');

---------------------------------------------------------------- provenance and farm zones
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001"}', true);
insert into public.farms (name, location) values ('Tolu Farm', 'SRID=4326;POINT(3.9 7.4)');
select is((select source::text from public.farms where name = 'Tolu Farm'), 'self_reported',
  'a farmer''s own record is marked self-reported');
select throws_ok($$
  insert into public.farms (name, location, source) values ('Fake verified', 'SRID=4326;POINT(3.9 7.4)', 'platform_verified')
$$, '42501', null, 'users cannot choose the provenance of their records');

reset role;
update public.profiles set onboarded_by = '60000000-0000-0000-0000-000000000006'
 where id = '20000000-0000-0000-0000-000000000002';
insert into public.user_roles (profile_id, role) values ('20000000-0000-0000-0000-000000000002', 'crop_farmer');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000006"}', true);
insert into public.farms (owner_id, name, location, onboarded_by)
  values ('20000000-0000-0000-0000-000000000002', 'Uche Farm', 'SRID=4326;POINT(3.95 7.45)', auth.uid());
select is((select source::text from public.farms where name = 'Uche Farm'), 'agent_verified',
  'a farm recorded by a field agent is marked agent-verified');

select throws_ok($$
  select public.correct_farm_zone((select id from public.farms where name = 'Uche Farm'), 'rainforest', 'Visited the site')
$$, '42501', null, 'a field agent cannot correct farm zones');
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000004"}', true);
select lives_ok($$
  select public.correct_farm_zone((select id from public.farms where name = 'Uche Farm'), 'rainforest', 'Site visit shows forest belt')
$$, 'an agronomy editor corrects the zone with a reason');
reset role;
select is((select zone::text || '/' || (zone_corrected_by = '40000000-0000-0000-0000-000000000004')::text
             from public.farms where name = 'Uche Farm'), 'rainforest/true', 'the correction and who made it are stored');

set local role anon;
select is((select count(*)::int from public.farm_zones), 3, 'anyone can read the farming zones');

reset role;
select * from finish();
rollback;
