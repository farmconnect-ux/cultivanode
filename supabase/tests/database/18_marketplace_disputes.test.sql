-- Test suite 18: Marketplace Disputes, Direct-Payment Arbitration, and Seller RLS
begin;
select plan(24);

-- Fixtures: Create user profiles, roles, seller profile, and orders
insert into auth.users (id, phone) values
  ('b4000000-0000-0000-0000-000000000001', '2348000005001'), -- Buyer (Farmer Tunde)
  ('b4000000-0000-0000-0000-000000000002', '2348000005002'), -- Seller Profile (Ibadan Agro Agrochemicals)
  ('b4000000-0000-0000-0000-000000000003', '2348000005003'), -- Outsider
  ('b4000000-0000-0000-0000-000000000009', '2348000005009')  -- Support Disputes Staff
on conflict (id) do nothing;

update public.profiles set onboarded_at = now(), full_name = v.n, phone = v.ph
  from (values
    ('b4000000-0000-0000-0000-000000000001'::uuid, 'Tunde Buyer', '2348000005001'),
    ('b4000000-0000-0000-0000-000000000002'::uuid, 'Segun Seller', '2348000005002'),
    ('b4000000-0000-0000-0000-000000000003'::uuid, 'Outsider Person', '2348000005003'),
    ('b4000000-0000-0000-0000-000000000009'::uuid, 'Bisi Staff Disputes', '2348000005009')
  ) v(i, n, ph)
 where id = v.i;

insert into public.admin_roles (profile_id, admin_role) values
  ('b4000000-0000-0000-0000-000000000009', 'support_disputes')
on conflict do nothing;

-- Create Seller record
insert into public.marketplace_sellers (id, profile_id, business_name, seller_type, verification_status)
values
  ('b4000000-0000-0000-0000-000000000020', 'b4000000-0000-0000-0000-000000000002', 'Ibadan Farm Supplies Ltd', 'agro_dealer', 'verified')
on conflict (id) do nothing;

-- Seller Payout bank account
insert into public.marketplace_seller_payout_accounts (seller_id, bank_name, account_number, account_name)
values
  ('b4000000-0000-0000-0000-000000000020', 'First Bank of Nigeria', '0123456789', 'Ibadan Farm Supplies')
on conflict (seller_id) do nothing;

-- Two Direct-Payment Orders
insert into public.marketplace_orders (
  id, order_number, buyer_id, status, payment_mode, payment_status,
  items_subtotal_kobo, total_amount_kobo, delivery_address
)
values
  (
    'b4000000-0000-0000-0000-0000000000d1', 'ORD-2026-TEST-001',
    'b4000000-0000-0000-0000-000000000001', 'placed', 'direct', 'pending',
    5000000, 5000000, '{"state":"Oyo","lga":"Ibadan North"}'::jsonb
  ),
  (
    'b4000000-0000-0000-0000-0000000000d2', 'ORD-2026-TEST-002',
    'b4000000-0000-0000-0000-000000000001', 'placed', 'direct', 'pending',
    3000000, 3000000, '{"state":"Oyo","lga":"Ibadan North"}'::jsonb
  )
on conflict (id) do nothing;

insert into public.marketplace_fulfilments (
  id, order_id, seller_id, fulfilment_number, status, subtotal_kobo, delivery_method
)
values
  (
    'b4000000-0000-0000-0000-0000000000f1',
    'b4000000-0000-0000-0000-0000000000d1',
    'b4000000-0000-0000-0000-000000000020',
    'FUL-TEST-001', 'placed', 5000000, 'seller_delivery'
  ),
  (
    'b4000000-0000-0000-0000-0000000000f2',
    'b4000000-0000-0000-0000-0000000000d2',
    'b4000000-0000-0000-0000-000000000020',
    'FUL-TEST-002', 'placed', 3000000, 'seller_delivery'
  )
on conflict (id) do nothing;

create table pg_temp.mkt_test (k text primary key, id uuid);
grant all on pg_temp.mkt_test to authenticated;

-- Helper functions for JWT switching
create or replace function pg_temp.as_buyer() returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"b4000000-0000-0000-0000-000000000001"}', true);
$$;
create or replace function pg_temp.as_seller() returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"b4000000-0000-0000-0000-000000000002"}', true);
$$;
create or replace function pg_temp.as_outsider() returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"b4000000-0000-0000-0000-000000000003"}', true);
$$;
create or replace function pg_temp.as_staff() returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"b4000000-0000-0000-0000-000000000009"}', true);
$$;

update public.feature_flags set enabled = false where key = 'marketplace_disputes';

set local role authenticated;

-- Test 1: Dispute opening fails when feature flag marketplace_disputes is disabled
select pg_temp.as_buyer();

select throws_ok(
  $$ select public.open_marketplace_dispute(
       'b4000000-0000-0000-0000-0000000000d1'::uuid,
       'b4000000-0000-0000-0000-0000000000f1'::uuid,
       'damaged_goods',
       'Received broken fertilizer containers.'
     ) $$,
  '42501',
  'Marketplace disputes are currently handled via customer support.',
  'Dispute rejected while marketplace_disputes feature switch is OFF'
);

-- Test 2: Enable marketplace_disputes switch
reset role;
update public.feature_flags set enabled = true where key = 'marketplace_disputes';
set local role authenticated;

-- Test 3: Outsider fails to open dispute on Order 1 (42501)
select pg_temp.as_outsider();
select throws_ok(
  $$ select public.open_marketplace_dispute(
       'b4000000-0000-0000-0000-0000000000d1'::uuid,
       'b4000000-0000-0000-0000-0000000000f1'::uuid,
       'damaged_goods',
       'Not my order but filing anyway'
     ) $$,
  '42501',
  'Permission denied: only order parties may open a dispute.',
  'Outsider non-party cannot open dispute'
);

-- Test 4: Buyer successfully opens dispute on Order 1
select pg_temp.as_buyer();
do $$
declare
  v_rec public.marketplace_disputes;
begin
  select * into v_rec from public.open_marketplace_dispute(
    'b4000000-0000-0000-0000-0000000000d1'::uuid,
    'b4000000-0000-0000-0000-0000000000f1'::uuid,
    'damaged_goods',
    'Fertilizer sacks torn open during delivery; 3 bags spoiled.',
    array['https://storage.example.com/proof1.jpg']
  );
  insert into pg_temp.mkt_test values ('disp_1', v_rec.id);
end $$;

select is(
  (select status from public.marketplace_disputes where id = (select id from pg_temp.mkt_test where k = 'disp_1')),
  'opened',
  'Dispute 1 is created in opened status'
);

-- Test 5: Order status transitioned to disputed
select is(
  (select status from public.marketplace_orders where id = 'b4000000-0000-0000-0000-0000000000d1'),
  'disputed',
  'Order 1 status changed to disputed'
);

-- Test 6: Notification sent to Seller
select pg_temp.as_seller();
select is(
  (select count(*)::int from public.notifications where profile_id = 'b4000000-0000-0000-0000-000000000002' and kind = 'mkt_dispute_opened'),
  1,
  'Counterparty seller received dispute notification'
);

-- Test 7: Double dispute on same order rejected
select pg_temp.as_buyer();
select throws_ok(
  $$ select public.open_marketplace_dispute(
       'b4000000-0000-0000-0000-0000000000d1'::uuid,
       'b4000000-0000-0000-0000-0000000000f1'::uuid,
       'wrong_item',
       'Trying to open a second dispute'
     ) $$,
  '22023',
  'Order cannot be disputed in current status: disputed.',
  'Cannot open second dispute on already disputed order'
);

-- Test 8: Seller opens dispute on Order 2 (Verifying Seller RLS Insert & Opening)
select pg_temp.as_seller();
do $$
declare
  v_rec public.marketplace_disputes;
begin
  select * into v_rec from public.open_marketplace_dispute(
    'b4000000-0000-0000-0000-0000000000d2'::uuid,
    'b4000000-0000-0000-0000-0000000000f2'::uuid,
    'other',
    'Buyer claimed they made bank transfer but 0 naira received in business account.'
  );
  insert into pg_temp.mkt_test values ('disp_2', v_rec.id);
end $$;

select is(
  (select status from public.marketplace_disputes where id = (select id from pg_temp.mkt_test where k = 'disp_2')),
  'opened',
  'Seller successfully opened dispute on Order 2'
);

-- Test 9: Buyer cannot resolve dispute directly (42501)
select pg_temp.as_buyer();
select throws_ok(
  $$ select public.resolve_marketplace_dispute(
       (select id from pg_temp.mkt_test where k = 'disp_1'),
       'uphold_buyer',
       'I want my money back please'
     ) $$,
  '42501',
  'Permission denied: disputes.decide required.',
  'Buyer cannot self-resolve dispute'
);

-- Test 10: Staff requests evidence from buyer
select pg_temp.as_staff();
select lives_ok(
  $$ select public.request_marketplace_dispute_evidence(
       (select id from pg_temp.mkt_test where k = 'disp_1'),
       'Please upload clear photos of waybill and torn sacks with batch numbers.',
       48,
       'buyer'
     ) $$,
  'Staff requests evidence from buyer'
);

select is(
  (select status || '/' || evidence_requested_from from public.marketplace_disputes where id = (select id from pg_temp.mkt_test where k = 'disp_1')),
  'evidence_required/buyer',
  'Dispute status moved to evidence_required for buyer'
);

-- Test 11: Invalid evidence request deadline (<1 or >168) rejected
select throws_ok(
  $$ select public.request_marketplace_dispute_evidence(
       (select id from pg_temp.mkt_test where k = 'disp_1'),
       'Too long deadline note for testing',
       200,
       'buyer'
     ) $$,
  '22023',
  'Give 1 to 168 hours to answer.',
  'Deadlines > 168 hours rejected'
);

-- Test 12: Invalid decision choice rejected
select throws_ok(
  $$ select public.resolve_marketplace_dispute(
       (select id from pg_temp.mkt_test where k = 'disp_1'),
       'invalid_decision',
       'Reason long enough for test'
     ) $$,
  '22023',
  'Choose a decision: uphold_buyer, uphold_seller, or settlement.',
  'Invalid arbitration decision rejected'
);

-- Test 13: Settlement without amount rejected
select throws_ok(
  $$ select public.resolve_marketplace_dispute(
       (select id from pg_temp.mkt_test where k = 'disp_1'),
       'settlement',
       'Valid reason for test arbitration'
     ) $$,
  '22023',
  'The settlement amount must be greater than zero and at most the total order price.',
  'Settlement requires valid amount'
);

-- Test 14: Settlement exceeding order price rejected
select throws_ok(
  $$ select public.resolve_marketplace_dispute(
       (select id from pg_temp.mkt_test where k = 'disp_1'),
       'settlement',
       'Valid reason for test arbitration',
       'Term',
       999999999,
       'Instructions text'
     ) $$,
  '22023',
  'The settlement amount must be greater than zero and at most the total order price.',
  'Settlement cannot exceed total order price'
);

-- Test 15: Settlement without explicit direct instructions rejected
select throws_ok(
  $$ select public.resolve_marketplace_dispute(
       (select id from pg_temp.mkt_test where k = 'disp_1'),
       'settlement',
       'Valid reason for test arbitration',
       'Term',
       2000000,
       'short'
     ) $$,
  '22023',
  'Direct settlement requires explicit payment/restitution instructions (at least 10 characters).',
  'Direct settlement requires full instructions'
);

-- Test 16: Staff resolves Dispute 1 with uphold_buyer
select lives_ok(
  $$ select public.resolve_marketplace_dispute(
       (select id from pg_temp.mkt_test where k = 'disp_1'),
       'uphold_buyer',
       'Evidence confirmed damaged delivery. Seller instructed to reverse direct transfer.',
       'Upheld Buyer: goods severely damaged upon arrival.'
     ) $$,
  'Staff arbitrates dispute in favor of buyer'
);

select is(
  (select status || '/' || decision from public.marketplace_disputes where id = (select id from pg_temp.mkt_test where k = 'disp_1')),
  'resolved/uphold_buyer',
  'Dispute 1 is resolved with uphold_buyer'
);

select is(
  (select status from public.marketplace_orders where id = 'b4000000-0000-0000-0000-0000000000d1'),
  'cancelled',
  'Order 1 status changed to cancelled'
);

-- Test 17: Staff reopens dispute
select lives_ok(
  $$ select public.reopen_marketplace_dispute(
       (select id from pg_temp.mkt_test where k = 'disp_1'),
       'Seller provided delivery CCTV footage showing goods were accepted intact.'
     ) $$,
  'Staff reopens dispute upon appeal'
);

select is(
  (select status from public.marketplace_disputes where id = (select id from pg_temp.mkt_test where k = 'disp_1')),
  'under_review',
  'Reopened dispute returns to under_review status'
);

-- Test 18: Staff resolves reopened dispute with settlement
select lives_ok(
  $$ select public.resolve_marketplace_dispute(
       (select id from pg_temp.mkt_test where k = 'disp_1'),
       'settlement',
       'Partial damage agreed. Seller to refund ₦20,000 to buyer First Bank account.',
       'Mutual Partial Adjustment',
       2000000,
       'Seller transfer ₦20,000 to buyer account within 48h. Buyer keeps undamaged bags.'
     ) $$,
  'Staff resolves reopened dispute with mutual settlement'
);

select is(
  (select decision || '/' || refund_amount_kobo::text from public.marketplace_disputes where id = (select id from pg_temp.mkt_test where k = 'disp_1')),
  'settlement/2000000',
  'Settlement decision and amount persisted'
);

-- Test 19: Workstation detail RPC returns rich data structure
select is(
  (select (public.marketplace_dispute_detail((select id from pg_temp.mkt_test where k = 'disp_1')))->>'decision'),
  'settlement',
  'marketplace_dispute_detail returns decision as settlement'
);

-- Test 20: Non-party outsider cannot view dispute detail (42501)
select pg_temp.as_outsider();
select throws_ok(
  $$ select public.marketplace_dispute_detail((select id from pg_temp.mkt_test where k = 'disp_1')) $$,
  '42501',
  'Permission denied.',
  'Outsider denied access to marketplace dispute detail'
);

select * from finish();
rollback;
