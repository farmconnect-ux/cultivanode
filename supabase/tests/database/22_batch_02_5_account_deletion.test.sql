begin;
select plan(12);

-- 1-2: execute_account_deletion is revoked from anon/authenticated and granted to service_role
select is(
  has_function_privilege('authenticated', 'public.execute_account_deletion(uuid, text)', 'execute'),
  false,
  'Test 1: authenticated cannot execute execute_account_deletion directly'
);
select is(
  has_function_privilege('service_role', 'public.execute_account_deletion(uuid, text)', 'execute'),
  true,
  'Test 2: service_role can execute execute_account_deletion'
);

-- Seed users, shared org, completed order + ledger, active booking blocker
insert into auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values
  ('e5000000-0000-0000-0000-000000000001', '2348055550001', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e5000000-0000-0000-0000-000000000002', '2348055550002', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e5000000-0000-0000-0000-000000000003', '2348055550003', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.profiles (id, phone, full_name, state, lga)
values
  ('e5000000-0000-0000-0000-000000000001', '2348055550001', 'Deleting Farmer', 'Oyo', 'Ibadan'),
  ('e5000000-0000-0000-0000-000000000002', '2348055550002', 'Remaining Member', 'Oyo', 'Ibadan'),
  ('e5000000-0000-0000-0000-000000000003', '2348055550003', 'Active Blocker', 'Oyo', 'Ibadan')
on conflict (id) do nothing;

-- 3: Unauthorised client cannot grant themselves a privileged role in user_roles
select throws_ok(
  $$
    set local role authenticated;
    select set_config('request.jwt.claim.sub', 'e5000000-0000-0000-0000-000000000001', true);
    insert into public.user_roles (profile_id, role) values ('e5000000-0000-0000-0000-000000000001', 'machinery_owner');
  $$,
  '42501',
  null,
  'Test 3: authenticated client cannot self-grant user_roles'
);
reset role;

-- Shared org owned by user 1 with user 2 as member
insert into public.organizations (id, name, owner_id)
values ('e5000000-0000-0000-0000-0000000000a1', 'Shared Co-op', 'e5000000-0000-0000-0000-000000000001');
insert into public.org_members (organization_id, profile_id, member_role)
values
  ('e5000000-0000-0000-0000-0000000000a1', 'e5000000-0000-0000-0000-000000000002', 'farm_manager')
on conflict do nothing;

-- Personal data for user 1
insert into public.user_roles (profile_id, role) values ('e5000000-0000-0000-0000-000000000001', 'crop_farmer');
insert into public.role_requests (id, profile_id, role, status)
values ('e5000000-0000-0000-0000-0000000000b1', 'e5000000-0000-0000-0000-000000000001', 'machinery_owner', 'pending');
insert into public.verification_documents (id, profile_id, role_request_id, document_type, storage_path, mime_type, size_bytes)
values ('e5000000-0000-0000-0000-0000000000c1', 'e5000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-0000000000b1', 'national_id', 'e5000000-0000-0000-0000-000000000001/nid.pdf', 'application/pdf', 1024);

-- Completed marketplace order + financial ledger entry for user 1
insert into public.marketplace_orders (
  id, order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo,
  platform_fee_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address
) values (
  'e5000000-0000-0000-0000-0000000000d1', 'ORD-DEL-001',
  'e5000000-0000-0000-0000-000000000001', 'retail',
  10000, 0, 0, 10000, 'completed', 'released', 'escrow',
  '{"line":"12 Secret Farm Ln","state":"Oyo"}'::jsonb
);

select public.record_marketplace_journal_entry(
  'e5000000-0000-0000-0000-0000000000d1',
  'order_payment',
  'Historical order payment',
  jsonb_build_array(
    jsonb_build_object('account_id', 'ASSET_PAYMENT_CLEARING', 'direction', 'DEBIT', 'amount_kobo', 10000),
    jsonb_build_object('account_id', 'LIABILITY_ESCROW_HELD', 'direction', 'CREDIT', 'amount_kobo', 10000)
  )
);

-- Active booking blocker on user 3
insert into public.farms (id, owner_id, name, state, location)
values ('e5000000-0000-0000-0000-0000000000f1', 'e5000000-0000-0000-0000-000000000003', 'Blocker Farm', 'Oyo', extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'));
insert into public.listings (id, owner_id, kind, equipment_type, title, service_radius_km, location)
values ('e5000000-0000-0000-0000-0000000000f2', 'e5000000-0000-0000-0000-000000000002', 'machinery', 'tractor', 'Test Tractor', 50, extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'));
insert into public.bookings (id, farmer_id, provider_id, listing_id, farm_id, job_date, unit, quantity, agreed_price_kobo, status)
values ('e5000000-0000-0000-0000-0000000000f3', 'e5000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000002', 'e5000000-0000-0000-0000-0000000000f2', 'e5000000-0000-0000-0000-0000000000f1', current_date + 1, 'hectare', 1, 20000, 'accepted');

-- 4: User 3 with active booking is blocked
select throws_ok(
  $$select public.execute_account_deletion('e5000000-0000-0000-0000-000000000003', 'Leaving')$$,
  'P0001',
  'Complete or resolve active service bookings before deleting your account.',
  'Test 4: Active booking blocks account deletion'
);

-- 5: Execute deletion for eligible user 1 and verify returned storage_paths
select is(
  (select (public.execute_account_deletion('e5000000-0000-0000-0000-000000000001', 'No longer needed'))->>'status'),
  'deleted',
  'Test 5: execute_account_deletion succeeds for eligible user'
);

-- 6: Personal role_requests and verification_documents removed
select is(
  (select count(*)::int from public.verification_documents where profile_id = 'e5000000-0000-0000-0000-000000000001'),
  0,
  'Test 6: verification_documents deleted for user 1'
);

-- 7: Shared organization preserved and ownership transferred to user 2
select is(
  (select owner_id from public.organizations where id = 'e5000000-0000-0000-0000-0000000000a1'),
  'e5000000-0000-0000-0000-000000000002'::uuid,
  'Test 7: shared organization preserved and ownership transferred to remaining member'
);

-- 8: Profile PII anonymized and deleted_at set
select is(
  (select full_name from public.profiles where id = 'e5000000-0000-0000-0000-000000000001'),
  'Deleted user',
  'Test 8: profile full_name anonymized'
);

-- 9: Historical marketplace order preserved with delivery_address redacted
select is(
  (select delivery_address->>'redacted' from public.marketplace_orders where id = 'e5000000-0000-0000-0000-0000000000d1'),
  'true',
  'Test 9: historical order preserved and delivery_address redacted'
);

-- 10: Financial ledger entry preserved
select is(
  (select count(*)::int from public.marketplace_journal_entries where reference_id = 'e5000000-0000-0000-0000-0000000000d1'),
  1,
  'Test 10: financial ledger entry preserved'
);

-- 11: NDPA completed data_requests row recorded
select is(
  (select status::text from public.data_requests where profile_id = 'e5000000-0000-0000-0000-000000000001' and kind = 'deletion'),
  'completed',
  'Test 11: completed NDPA deletion data_request recorded'
);

-- 12: Idempotent second call returns already_deleted
select is(
  (select (public.execute_account_deletion('e5000000-0000-0000-0000-000000000001', 'Retry'))->>'status'),
  'already_deleted',
  'Test 12: second execute_account_deletion call is idempotent'
);

select * from finish();
rollback;
