begin;
select plan(39);

-- 1-3: service_role-only privileges for account-deletion RPCs and queue table
select is(
  has_function_privilege('authenticated', 'public.execute_account_deletion(uuid, text)', 'execute'),
  false,
  'Test 1: authenticated cannot execute execute_account_deletion directly'
);
select is(
  has_function_privilege('authenticated', 'public.claim_account_deletion_storage_cleanup(uuid, integer)', 'execute'),
  false,
  'Test 2: authenticated cannot execute claim_account_deletion_storage_cleanup'
);
select is(
  has_table_privilege('authenticated', 'public.account_deletion_storage_cleanup', 'SELECT'),
  false,
  'Test 3: authenticated cannot read account_deletion_storage_cleanup'
);

-- Seed users:
-- u1: eligible buyer/member with shared org + completed order + ledger + verification doc
-- u2: remaining org member + active seller (dispatched fulfilment in multi-seller order)
-- u3: active booking blocker
-- u4: eligible seller with completed/accepted fulfilment in same multi-seller order + solo org
-- u5: seller with held escrow
-- u6: seller with processing settlement
insert into auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values
  ('e5000000-0000-0000-0000-000000000001', '2348055550001', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e5000000-0000-0000-0000-000000000002', '2348055550002', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e5000000-0000-0000-0000-000000000003', '2348055550003', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e5000000-0000-0000-0000-000000000004', '2348055550004', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e5000000-0000-0000-0000-000000000005', '2348055550005', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e5000000-0000-0000-0000-000000000006', '2348055550006', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated'),
  ('e5000000-0000-0000-0000-000000000007', '2348055550007', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.profiles (id, phone, full_name, state, lga)
values
  ('e5000000-0000-0000-0000-000000000001', '2348055550001', 'Deleting Farmer', 'Oyo', 'Ibadan'),
  ('e5000000-0000-0000-0000-000000000002', '2348055550002', 'Remaining Member', 'Oyo', 'Ibadan'),
  ('e5000000-0000-0000-0000-000000000003', '2348055550003', 'Booking Blocker', 'Oyo', 'Ibadan'),
  ('e5000000-0000-0000-0000-000000000004', '2348055550004', 'Completed Seller A', 'Oyo', 'Ibadan'),
  ('e5000000-0000-0000-0000-000000000005', '2348055550005', 'Escrow Blocker', 'Oyo', 'Ibadan'),
  ('e5000000-0000-0000-0000-000000000006', '2348055550006', 'Settlement Blocker', 'Oyo', 'Ibadan'),
  ('e5000000-0000-0000-0000-000000000007', '2348055550007', 'Active Seller B', 'Oyo', 'Ibadan')
on conflict (id) do nothing;

-- 4: Unauthorised client cannot grant themselves a privileged role in user_roles
select throws_ok(
  $$
    set local role authenticated;
    select set_config('request.jwt.claim.sub', 'e5000000-0000-0000-0000-000000000001', true);
    insert into public.user_roles (profile_id, role) values ('e5000000-0000-0000-0000-000000000001', 'machinery_owner');
  $$,
  '42501',
  null,
  'Test 4: authenticated client cannot self-grant user_roles'
);
reset role;

-- Shared org owned by u1 with u2 remaining; solo org owned by u4 with no remaining members
insert into public.organizations (id, name, cac_number, owner_id)
values
  ('e5000000-0000-0000-0000-0000000000a1', 'Shared Co-op', 'RC-111', 'e5000000-0000-0000-0000-000000000001'),
  ('e5000000-0000-0000-0000-0000000000a2', 'Solo Seller Farm', 'RC-222', 'e5000000-0000-0000-0000-000000000004');

insert into public.org_members (organization_id, profile_id, member_role)
values ('e5000000-0000-0000-0000-0000000000a1', 'e5000000-0000-0000-0000-000000000002', 'farm_manager')
on conflict do nothing;

-- Personal data for u1
insert into public.user_roles (profile_id, role) values ('e5000000-0000-0000-0000-000000000001', 'crop_farmer');
insert into public.role_requests (id, profile_id, role, status)
values ('e5000000-0000-0000-0000-0000000000b1', 'e5000000-0000-0000-0000-000000000001', 'machinery_owner', 'pending');
insert into public.verification_documents (id, profile_id, role_request_id, document_type, storage_path, mime_type, size_bytes)
values ('e5000000-0000-0000-0000-0000000000c1', 'e5000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-0000000000b1', 'national_id', 'e5000000-0000-0000-0000-000000000001/nid.pdf', 'application/pdf', 1024);

-- Completed marketplace order + financial ledger entry for u1
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
    jsonb_build_object('account_id', 'LIABILITY_ESCROW_DEPOSIT', 'direction', 'CREDIT', 'amount_kobo', 10000)
  )
);

-- Sellers & multi-seller order with multiple fulfilments
insert into public.marketplace_sellers (id, profile_id, business_name, seller_type, verification_status)
values
  ('e5000000-0000-0000-0000-000000000022', 'e5000000-0000-0000-0000-000000000007', 'Seller B Agro', 'agro_dealer', 'verified'),
  ('e5000000-0000-0000-0000-000000000024', 'e5000000-0000-0000-0000-000000000004', 'Seller A Agro', 'agro_dealer', 'verified'),
  ('e5000000-0000-0000-0000-000000000025', 'e5000000-0000-0000-0000-000000000005', 'Seller E Agro', 'agro_dealer', 'verified'),
  ('e5000000-0000-0000-0000-000000000026', 'e5000000-0000-0000-0000-000000000006', 'Seller S Agro', 'agro_dealer', 'verified');

insert into public.marketplace_orders (
  id, order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo,
  platform_fee_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address
) values (
  'e5000000-0000-0000-0000-0000000000d2', 'ORD-MULTI-002',
  'e5000000-0000-0000-0000-000000000003', 'retail',
  20000, 0, 0, 20000, 'completed', 'released', 'escrow',
  '{"line":"9 Market Rd","state":"Oyo"}'::jsonb
);

-- Multi-seller fulfilments on ORD-MULTI-002: Seller A (accepted/terminal) vs Seller B (dispatched/active)
insert into public.marketplace_fulfilments (id, order_id, seller_id, fulfilment_number, status, subtotal_kobo, delivery_fee_kobo, delivery_method)
values
  ('e5000000-0000-0000-0000-000000000f01', 'e5000000-0000-0000-0000-0000000000d2', 'e5000000-0000-0000-0000-000000000024', 'FUL-MULTI-1', 'accepted', 10000, 0, 'seller_delivery'),
  ('e5000000-0000-0000-0000-000000000f02', 'e5000000-0000-0000-0000-0000000000d2', 'e5000000-0000-0000-0000-000000000022', 'FUL-MULTI-2', 'dispatched', 10000, 0, 'seller_delivery');

-- Held escrow for u5 (Seller E) & processing settlement for u6 (Seller S)
insert into public.marketplace_fulfilments (id, order_id, seller_id, fulfilment_number, status, subtotal_kobo, delivery_fee_kobo, delivery_method)
values
  ('e5000000-0000-0000-0000-000000000f05', 'e5000000-0000-0000-0000-0000000000d1', 'e5000000-0000-0000-0000-000000000025', 'FUL-ESC-5', 'accepted', 10000, 0, 'seller_delivery'),
  ('e5000000-0000-0000-0000-000000000f06', 'e5000000-0000-0000-0000-0000000000d1', 'e5000000-0000-0000-0000-000000000026', 'FUL-SET-6', 'accepted', 10000, 0, 'seller_delivery');

insert into public.marketplace_escrows (id, order_id, fulfilment_id, buyer_id, seller_id, amount_kobo, commission_kobo, seller_net_kobo, status)
values
  ('e5000000-0000-0000-0000-000000000e05', 'e5000000-0000-0000-0000-0000000000d2', 'e5000000-0000-0000-0000-000000000f05', 'e5000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000025', 10000, 500, 9500, 'held'),
  ('e5000000-0000-0000-0000-000000000e06', 'e5000000-0000-0000-0000-0000000000d2', 'e5000000-0000-0000-0000-000000000f06', 'e5000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000026', 10000, 500, 9500, 'released');

insert into public.marketplace_settlements (id, escrow_id, seller_id, gross_amount_kobo, commission_kobo, net_payout_kobo, payout_reference, status)
values ('e5000000-0000-0000-0000-000000000a06', 'e5000000-0000-0000-0000-000000000e06', 'e5000000-0000-0000-0000-000000000026', 10000, 500, 9500, 'PAYOUT-DEL-6', 'processing');

-- Active booking blocker on u3
insert into public.farms (id, owner_id, name, state, location)
values ('e5000000-0000-0000-0000-0000000000f1', 'e5000000-0000-0000-0000-000000000003', 'Blocker Farm', 'Oyo', extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'));
insert into public.listings (id, owner_id, kind, equipment_type, title, service_radius_km, location)
values ('e5000000-0000-0000-0000-0000000000f2', 'e5000000-0000-0000-0000-000000000002', 'equipment', 'tractor', 'Test Tractor', 50, extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'));
insert into public.bookings (
  id, farmer_id, provider_id, listing_id, farm_id,
  listing_title, listing_kind, farm_name, job_location, distance_km,
  job_date, unit, quantity, rate_kobo, total_kobo, status, expires_at
) values (
  'e5000000-0000-0000-0000-0000000000f3', 'e5000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000002',
  'e5000000-0000-0000-0000-0000000000f2', 'e5000000-0000-0000-0000-0000000000f1',
  'Test Tractor', 'equipment', 'Blocker Farm', extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'), 0,
  current_date + 1, 'hectare', 1, 20000, 20000, 'accepted', now() + interval '1 day'
);

-- 5-8: Operational & financial blockers
select throws_ok(
  $$select public.execute_account_deletion('e5000000-0000-0000-0000-000000000003', 'Leaving')$$,
  'P0001',
  'Complete or resolve active service bookings before deleting your account.',
  'Test 5: Active booking blocks account deletion'
);

select throws_ok(
  $$select public.execute_account_deletion('e5000000-0000-0000-0000-000000000007', 'Leaving')$$,
  'P0001',
  'Complete or resolve active seller fulfilments before deleting your account.',
  'Test 6: Active seller fulfilment (dispatched) blocks deletion in multi-seller order'
);

select throws_ok(
  $$select public.execute_account_deletion('e5000000-0000-0000-0000-000000000005', 'Leaving')$$,
  'P0001',
  'Resolve held marketplace escrows before deleting your account.',
  'Test 7: Held marketplace escrow blocks seller deletion'
);

select throws_ok(
  $$select public.execute_account_deletion('e5000000-0000-0000-0000-000000000006', 'Leaving')$$,
  'P0001',
  'Wait for pending seller settlements to complete before deleting your account.',
  'Test 8: Processing settlement blocks seller deletion'
);

-- 9: Seller A with only terminal (accepted) fulfilment succeeds & solo org is archived/anonymised
select is(
  (select (public.execute_account_deletion('e5000000-0000-0000-0000-000000000004', 'Done selling'))->>'status'),
  'anonymized',
  'Test 9: Seller with terminal (accepted) fulfilment can delete account'
);

select is(
  (select name || '|' || (archived_at is not null)::text from public.organizations where id = 'e5000000-0000-0000-0000-0000000000a2'),
  'Deleted organization|true',
  'Test 10: Organization with no remaining members is explicitly archived and anonymised'
);

-- Batch 03.1B: AI actor mapping must be stable and inaccessible to application roles.
select is(
  private.resolve_or_create_ai_actor('e5000000-0000-0000-0000-000000000001'),
  private.resolve_or_create_ai_actor('e5000000-0000-0000-0000-000000000001'),
  'Test 10a: repeated actor resolution returns the same pseudonymous subject'
);

select is(
  (select count(*)::int from private.ai_actor_directory
   where profile_id = 'e5000000-0000-0000-0000-000000000001'
     and actor_kind = 'user' and deleted_at is null),
  1,
  'Test 10b: one active user actor mapping exists per profile'
);

select ok(
  not has_table_privilege('anon', 'private.ai_actor_directory', 'SELECT')
  and not has_table_privilege('authenticated', 'private.ai_actor_directory', 'SELECT')
  and not has_table_privilege('service_role', 'private.ai_actor_directory', 'SELECT')
  and not has_function_privilege('service_role', 'private.resolve_or_create_ai_actor(uuid)', 'EXECUTE')
  and not has_function_privilege('service_role', 'private.anonymise_ai_actor(uuid)', 'EXECUTE')
  and not has_function_privilege('service_role', 'private.lookup_ai_actor_subject(uuid)', 'EXECUTE'),
  'Test 10c: actor directory and internal functions are inaccessible to application roles'
);

select set_config('test.ai_actor_subject_id', private.resolve_or_create_ai_actor('e5000000-0000-0000-0000-000000000001')::text, true);

-- 11-18: Execute deletion for u1 -> durable Storage queue populated, data_requests stays open until finalized
select is(
  (select (public.execute_account_deletion('e5000000-0000-0000-0000-000000000001', 'No longer needed'))->>'deletion_status'),
  'storage_pending',
  'Test 11: u1 enters storage_pending when verification documents exist'
);

select is(
  (select status || '|' || storage_path from public.account_deletion_storage_cleanup where profile_id = 'e5000000-0000-0000-0000-000000000001'),
  'pending|e5000000-0000-0000-0000-000000000001/nid.pdf',
  'Test 12: Storage path preserved in durable queue before verification_documents metadata deletion'
);

select is(
  (select status::text from public.data_requests where profile_id = 'e5000000-0000-0000-0000-000000000001' and kind = 'deletion'),
  'open',
  'Test 13: data_request remains open while Storage cleanup is pending'
);

select is(
  (select owner_id from public.organizations where id = 'e5000000-0000-0000-0000-0000000000a1'),
  'e5000000-0000-0000-0000-000000000002'::uuid,
  'Test 14: shared organization ownership transferred to remaining member'
);

select is(
  (select delivery_address->>'redacted' from public.marketplace_orders where id = 'e5000000-0000-0000-0000-0000000000d1'),
  'true',
  'Test 15: historical order preserved with delivery_address redacted'
);

select is(
  (select count(*)::int from public.marketplace_journal_entries where reference_id = 'e5000000-0000-0000-0000-0000000000d1'),
  1,
  'Test 16: financial ledger entry preserved'
);

select is(
  (select (d.profile_id is null and d.deleted_at is not null)::text
   from private.ai_actor_directory d
   where d.actor_subject_id = current_setting('test.ai_actor_subject_id')::uuid),
  'true',
  'Test 18a: account deletion anonymises the existing AI actor mapping while retaining its subject ID'
);

select is(
  (select (profile_id is null and deleted_at is not null)
   from private.lookup_ai_actor_subject(current_setting('test.ai_actor_subject_id')::uuid)),
  true,
  'Test 18b: internal actor lookup returns the anonymised subject without profile attribution'
);

select throws_ok(
  $select private.resolve_or_create_ai_actor('e5000000-0000-0000-0000-000000000001')$,
  'P0001',
  'Deleted profiles cannot be mapped to an AI actor.',
  'Test 18c: deleted profiles cannot receive a new or restored actor mapping'
);

select throws_ok(
  $select private.resolve_or_create_ai_actor('e5000000-0000-0000-0000-000000000099')$,
  'P0002',
  'Profile not found.',
  'Test 18d: actor resolver rejects nonexistent profiles'
);

-- 17: New orders/bookings against deleting/deleted u1 are blocked by trigger
select throws_ok(
  $$
    insert into public.marketplace_orders (
      order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo,
      platform_fee_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address
    ) values (
      'ORD-BLK-999', 'e5000000-0000-0000-0000-000000000001', 'retail',
      1000, 0, 0, 1000, 'placed', 'pending', 'escrow', '{"state":"Oyo"}'::jsonb
    );
  $$,
  'P0001',
  'Cannot place or reassign order for a deleted or deleting account.',
  'Test 17: Cannot place new order for deleted/deleting account'
);

-- 18-22: Claim, fail, retry, complete Storage cleanup, and finalize
select is(
  (select count(*)::int from public.claim_account_deletion_storage_cleanup('e5000000-0000-0000-0000-000000000001')),
  1,
  'Test 18: claim_account_deletion_storage_cleanup claims 1 pending item'
);

select is(
  (select (public.record_account_deletion_storage_result(
    (select id from public.account_deletion_storage_cleanup where profile_id = 'e5000000-0000-0000-0000-000000000001'),
    'failed',
    'Simulated 503',
    (select lease_token from public.account_deletion_storage_cleanup where profile_id = 'e5000000-0000-0000-0000-000000000001')
  ))->>'remaining_count'),
  '1',
  'Test 19: failed Storage cleanup keeps remaining_count = 1'
);

select is(
  (select (public.finalize_account_deletion('e5000000-0000-0000-0000-000000000001', true))->>'deletion_status'),
  'storage_pending',
  'Test 20: finalize_account_deletion refuses to mark completed while Storage cleanup is failed/pending'
);

-- Retry claim -> succeed -> finalize
select is(
  (select count(*)::int from public.claim_account_deletion_storage_cleanup('e5000000-0000-0000-0000-000000000001')),
  1,
  'Test 21: retry claims failed Storage cleanup item'
);

select public.record_account_deletion_storage_result(
  (select id from public.account_deletion_storage_cleanup where profile_id = 'e5000000-0000-0000-0000-000000000001'),
  'completed',
  null,
  (select lease_token from public.account_deletion_storage_cleanup where profile_id = 'e5000000-0000-0000-0000-000000000001')
);

select is(
  (select (public.finalize_account_deletion('e5000000-0000-0000-0000-000000000001', true))->>'deletion_status'),
  'completed',
  'Test 22a: finalize_account_deletion marks profile completed once Storage and Auth succeed'
);

select is(
  (select status::text from public.data_requests where profile_id = 'e5000000-0000-0000-0000-000000000001' and kind = 'deletion'),
  'completed',
  'Test 22b: data_request is marked completed after finalize_account_deletion'
);

-- 23: list_incomplete_account_deletions privilege check
select is(
  has_function_privilege('authenticated', 'public.list_incomplete_account_deletions(integer)', 'execute'),
  false,
  'Test 23: authenticated cannot execute list_incomplete_account_deletions'
);

-- 24-25: Lease-based stale processing claim recovery
insert into public.account_deletion_storage_cleanup (profile_id, bucket_id, storage_path, status, attempts, lease_expires_at)
values ('e5000000-0000-0000-0000-000000000001', 'verification-documents', 'e5000000/stale.pdf', 'processing', 1, clock_timestamp() + interval '5 minutes');

select is(
  (select count(*)::int from public.claim_account_deletion_storage_cleanup('e5000000-0000-0000-0000-000000000001', 300)),
  0,
  'Test 24: active processing lease is not re-claimed'
);

update public.account_deletion_storage_cleanup
   set lease_expires_at = clock_timestamp() - interval '1 second'
 where profile_id = 'e5000000-0000-0000-0000-000000000001'
   and storage_path = 'e5000000/stale.pdf';

select is(
  (select attempts from public.claim_account_deletion_storage_cleanup('e5000000-0000-0000-0000-000000000001', 300) limit 1),
  2,
  'Test 25: expired processing lease is reclaimed and increments attempts'
);

-- 26-28: Party-reassignment UPDATE guards on bookings, marketplace_orders, marketplace_fulfilments
insert into public.bookings (
  id, farmer_id, provider_id, listing_id, farm_id,
  listing_title, listing_kind, farm_name, job_location, distance_km,
  job_date, unit, quantity, rate_kobo, total_kobo, status, expires_at
) values (
  'e5000000-0000-0000-0000-000000000401',
  'e5000000-0000-0000-0000-000000000002',
  'e5000000-0000-0000-0000-000000000003',
  null,
  null,
  'Harvester', 'equipment', 'Green Acre', extensions.st_geogfromtext('SRID=4326;POINT(3.9 7.3)'), 0,
  current_date + 2, 'hectare', 1, 15000, 15000, 'requested', now() + interval '1 day'
);

select lives_ok(
  $$update public.bookings set farmer_note = 'Updated note' where id = 'e5000000-0000-0000-0000-000000000401'$$,
  'Test 26a: legitimate booking lifecycle update is not blocked'
);

select throws_ok(
  $$update public.bookings set provider_id = 'e5000000-0000-0000-0000-000000000001' where id = 'e5000000-0000-0000-0000-000000000401'$$,
  'P0001',
  'Cannot create or update booking for a deleted or deleting account.',
  'Test 26b: reassigning booking provider_id to deleted account is rejected'
);

select throws_ok(
  $$update public.marketplace_orders set buyer_id = 'e5000000-0000-0000-0000-000000000001' where id = 'e5000000-0000-0000-0000-0000000000d2'$$,
  'P0001',
  'Cannot place or reassign order for a deleted or deleting account.',
  'Test 27: reassigning marketplace_order buyer_id to deleted account is rejected'
);

select throws_ok(
  $$update public.marketplace_fulfilments set seller_id = 'e5000000-0000-0000-0000-000000000024' where id = 'e5000000-0000-0000-0000-000000000f02'$$,
  'P0001',
  'Cannot create or reassign fulfilment for a deleted or deleting seller account.',
  'Test 28: reassigning marketplace_fulfilment seller_id to deleted seller is rejected'
);

-- 29-30: Lease token fencing & terminal 'completed' state protection
select throws_ok(
  $$
    select public.record_account_deletion_storage_result(
      (select id from public.account_deletion_storage_cleanup where profile_id = 'e5000000-0000-0000-0000-000000000001' and storage_path = 'e5000000/stale.pdf'),
      'failed',
      'Stale worker error',
      '00000000-0000-0000-0000-000000000000'::uuid
    );
  $$,
  'P0001',
  'Storage cleanup lease token mismatch or superseded by another worker.',
  'Test 29: mismatched lease_token is rejected by record_account_deletion_storage_result'
);

select is(
  (select (public.finalize_account_deletion('e5000000-0000-0000-0000-000000000001', false, 'Stale retry'))->>'deletion_status'),
  'completed',
  'Test 30: finalize_account_deletion never regresses a terminal completed profile'
);

select * from finish();
rollback;
