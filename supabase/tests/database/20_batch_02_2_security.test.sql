-- Test suite 20: Batch 02.2 Security & Integration Tests
-- Covers:
--   1. Admin Finance: admin_process_marketplace_settlement() permission, state transitions, balanced payout ledger entry
--   2. Admin Support: support_tickets & support_ticket_messages RLS (internal notes hidden from users)
--   3. Mobile Role Requests & Verification Documents: duplicate pending, non-self-approval, path/size/owner checks
begin;
select plan(12);

-- Seed test profiles & admin roles
insert into auth.users (id, phone) values
  ('c6000000-0000-0000-0000-000000000001', '2348000007001'), -- Regular user / requester / buyer
  ('c6000000-0000-0000-0000-000000000002', '2348000007002'), -- Seller
  ('c6000000-0000-0000-0000-000000000003', '2348000007003'), -- Outsider
  ('c6000000-0000-0000-0000-000000000008', '2348000007008'), -- Finance Officer (payouts.approve)
  ('c6000000-0000-0000-0000-000000000009', '2348000007009')  -- Support Staff (website_inbox.manage)
on conflict (id) do nothing;

update public.profiles set onboarded_at = now(), full_name = v.n, phone = v.ph, verification_tier = 2
  from (values
    ('c6000000-0000-0000-0000-000000000001'::uuid, 'Requester User', '2348000007001'),
    ('c6000000-0000-0000-0000-000000000002'::uuid, 'Seller User', '2348000007002'),
    ('c6000000-0000-0000-0000-000000000003'::uuid, 'Outsider User', '2348000007003'),
    ('c6000000-0000-0000-0000-000000000008'::uuid, 'Finance Staff', '2348000007008'),
    ('c6000000-0000-0000-0000-000000000009'::uuid, 'Support Staff', '2348000007009')
  ) v(i, n, ph)
 where id = v.i;

insert into public.admin_roles (profile_id, admin_role) values
  ('c6000000-0000-0000-0000-000000000008', 'finance_officer'),
  ('c6000000-0000-0000-0000-000000000009', 'support_disputes')
on conflict do nothing;

-- Seed marketplace order, fulfilment, escrow, and pending settlement
insert into public.marketplace_sellers (id, profile_id, business_name, seller_type, verification_status)
values ('c6000000-0000-0000-0000-000000000020', 'c6000000-0000-0000-0000-000000000002', 'Batch22 Agro', 'agro_dealer', 'verified')
on conflict (id) do nothing;

insert into public.marketplace_orders (
  id, order_number, buyer_id, items_subtotal_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address
) values (
  'c6000000-0000-0000-0000-0000000000d1', 'ORD-B22-001', 'c6000000-0000-0000-0000-000000000001',
  1000000, 1000000, 'completed', 'released', 'escrow', '{"state":"Oyo"}'::jsonb
) on conflict (id) do nothing;

insert into public.marketplace_fulfilments (
  id, order_id, seller_id, fulfilment_number, status, subtotal_kobo, delivery_method
) values (
  'c6000000-0000-0000-0000-0000000000f1', 'c6000000-0000-0000-0000-0000000000d1',
  'c6000000-0000-0000-0000-000000000020', 'FUL-B22-001', 'accepted', 1000000, 'seller_delivery'
) on conflict (id) do nothing;

insert into public.marketplace_escrows (
  id, order_id, fulfilment_id, buyer_id, seller_id, amount_kobo, commission_kobo, seller_net_kobo, status
) values (
  'c6000000-0000-0000-0000-0000000000e1', 'c6000000-0000-0000-0000-0000000000d1',
  'c6000000-0000-0000-0000-0000000000f1', 'c6000000-0000-0000-0000-000000000001',
  'c6000000-0000-0000-0000-000000000020', 1000000, 50000, 950000, 'released'
) on conflict (id) do nothing;

insert into public.marketplace_settlements (
  id, escrow_id, seller_id, gross_amount_kobo, commission_kobo, net_payout_kobo, payout_reference, status
) values (
  'c6000000-0000-0000-0000-0000000000a1', 'c6000000-0000-0000-0000-0000000000e1',
  'c6000000-0000-0000-0000-000000000020', 1000000, 50000, 950000, 'PAYOUT-B22-001', 'pending'
) on conflict (id) do nothing;

-- 1. Admin Finance Settlement Tests
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c6000000-0000-0000-0000-000000000009"}', true);

-- Support staff lacks payouts.approve
select throws_ok(
  $$select public.admin_process_marketplace_settlement('c6000000-0000-0000-0000-0000000000a1', 'completed', 'Unauthorized')$$,
  '42501',
  null,
  'Test 1: Staff without payouts.approve cannot process settlement'
);

-- Finance officer succeeds and posts balanced payout journal entry
select set_config('request.jwt.claims', '{"sub":"c6000000-0000-0000-0000-000000000008"}', true);
select is(
  (select (public.admin_process_marketplace_settlement('c6000000-0000-0000-0000-0000000000a1', 'completed', 'Settled via NIBSS'))->>'status'),
  'completed',
  'Test 2: Finance officer with payouts.approve can complete settlement'
);

select is(
  (select count(*) from public.marketplace_journal_entries where reference_id = 'c6000000-0000-0000-0000-0000000000a1' and reference_type = 'payout'),
  1::bigint,
  'Test 3: Completing settlement records 1 payout journal entry'
);

select throws_ok(
  $$select public.admin_process_marketplace_settlement('c6000000-0000-0000-0000-0000000000a1', 'completed', 'Retry')$$,
  '22023',
  null,
  'Test 4: Already completed settlement cannot be re-completed'
);

-- 2. Support Ticket & Internal Note Isolation Tests
select set_config('request.jwt.claims', '{"sub":"c6000000-0000-0000-0000-000000000001"}', true);
insert into public.support_tickets (id, ticket_number, requester_id, subject, category, priority)
values ('c6000000-0000-0000-0000-0000000000b1', 'TCK-B22-001', 'c6000000-0000-0000-0000-000000000001', 'Need help with KYC', 'verification', 'normal');

-- Requester cannot post an internal note
select throws_ok(
  $$insert into public.support_ticket_messages (ticket_id, author_id, body, is_internal)
    values ('c6000000-0000-0000-0000-0000000000b1', 'c6000000-0000-0000-0000-000000000001', 'Fake internal note', true)$$,
  '42501',
  null,
  'Test 5: Ordinary user cannot insert is_internal=true support message'
);

-- Support staff posts both an internal note and a public reply
select set_config('request.jwt.claims', '{"sub":"c6000000-0000-0000-0000-000000000009"}', true);
insert into public.support_ticket_messages (ticket_id, author_id, body, is_internal) values
  ('c6000000-0000-0000-0000-0000000000b1', 'c6000000-0000-0000-0000-000000000009', 'Internal fraud check note', true),
  ('c6000000-0000-0000-0000-0000000000b1', 'c6000000-0000-0000-0000-000000000009', 'We are reviewing your ID now.', false);

-- Requester sees ONLY the public reply, never the internal note
select set_config('request.jwt.claims', '{"sub":"c6000000-0000-0000-0000-000000000001"}', true);
select is(
  (select count(*) from public.support_ticket_messages where ticket_id = 'c6000000-0000-0000-0000-0000000000b1'),
  1::bigint,
  'Test 6: Requester sees only public support messages, not internal notes'
);

-- Outsider cannot view requester's ticket
select set_config('request.jwt.claims', '{"sub":"c6000000-0000-0000-0000-000000000003"}', true);
select is(
  (select count(*) from public.support_tickets where id = 'c6000000-0000-0000-0000-0000000000b1'),
  0::bigint,
  'Test 7: Outsider cannot read another user support ticket'
);

-- 3. Role Requests & Verification Documents Tests
select set_config('request.jwt.claims', '{"sub":"c6000000-0000-0000-0000-000000000001"}', true);
insert into public.role_requests (id, role, details)
values ('c6000000-0000-0000-0000-0000000000c1', 'machinery_owner', '{"note":"2 tractors"}'::jsonb);

select throws_ok(
  $$insert into public.role_requests (role) values ('machinery_owner')$$,
  '23505',
  null,
  'Test 8: Duplicate pending role request is rejected'
);

select throws_ok(
  $$select public.approve_role_request('c6000000-0000-0000-0000-0000000000c1', 'Self approve')$$,
  '42501',
  null,
  'Test 9: User cannot approve their own role request'
);

-- Verification document: valid own-folder insert succeeds; wrong-owner path & >5MiB rejected
insert into public.verification_documents (role_request_id, document_type, storage_path, mime_type, size_bytes)
values (
  'c6000000-0000-0000-0000-0000000000c1',
  'national_id',
  'c6000000-0000-0000-0000-000000000001/doc-001.jpg',
  'image/jpeg',
  102400
);

select is(
  (select count(*) from public.verification_documents where role_request_id = 'c6000000-0000-0000-0000-0000000000c1'),
  1::bigint,
  'Test 10: User can attach valid verification document to own role request'
);

select throws_ok(
  $$insert into public.verification_documents (role_request_id, document_type, storage_path, mime_type, size_bytes)
    values ('c6000000-0000-0000-0000-0000000000c1', 'national_id', 'c6000000-0000-0000-0000-000000000003/evil.jpg', 'image/jpeg', 1024)$$,
  '23514',
  null,
  'Test 11: Storage path outside user folder is rejected by constraint'
);

select throws_ok(
  $$insert into public.verification_documents (role_request_id, document_type, storage_path, mime_type, size_bytes)
    values ('c6000000-0000-0000-0000-0000000000c1', 'national_id', 'c6000000-0000-0000-0000-000000000001/huge.pdf', 'application/pdf', 6000000)$$,
  '23514',
  null,
  'Test 12: Oversized (>5 MiB) verification document is rejected'
);

select * from finish();
rollback;
