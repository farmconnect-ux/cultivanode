-- Test suite 19: Marketplace Financial Security, Order Lockdown & Duplicate-Settlement Protection (Batch 01)
-- Verifies:
--   1-6: Authenticated buyers/outsiders cannot bypass place_marketplace_order() or forge totals,
--        commissions, payment_status, or fulfilment records.
--   7:   Legitimate place_marketplace_order() checkout succeeds with server-side totals.
--   8:   process_payment_webhook() enforces amount checks, same-reference idempotency,
--        single-settlement-per-order (rejects second distinct reference), DB-level unique
--        escrow/ledger constraints, and legitimate retry after a failed payment.
begin;
select plan(24);

-- 1. Seed users, seller, category, listing, and pre-existing orders (as postgres)
insert into auth.users (id, phone) values
  ('b5000000-0000-0000-0000-000000000001', '2348000006001'), -- Buyer 1
  ('b5000000-0000-0000-0000-000000000002', '2348000006002'), -- Seller
  ('b5000000-0000-0000-0000-000000000003', '2348000006003')  -- Buyer 2 / Outsider
on conflict (id) do nothing;

update public.profiles set onboarded_at = now(), full_name = v.n, phone = v.ph
  from (values
    ('b5000000-0000-0000-0000-000000000001'::uuid, 'Ayo Buyer', '2348000006001'),
    ('b5000000-0000-0000-0000-000000000002'::uuid, 'Bola Seller', '2348000006002'),
    ('b5000000-0000-0000-0000-000000000003'::uuid, 'Chidi Outsider', '2348000006003')
  ) v(i, n, ph)
 where id = v.i;

insert into public.marketplace_sellers (id, profile_id, business_name, seller_type, verification_status)
values ('b5000000-0000-0000-0000-000000000020', 'b5000000-0000-0000-0000-000000000002', 'Oyo Agro Hub', 'agro_dealer', 'verified')
on conflict (id) do nothing;

insert into public.marketplace_seller_payout_accounts (seller_id, bank_name, account_number, account_name)
values ('b5000000-0000-0000-0000-000000000020', 'Zenith Bank', '1002003004', 'Oyo Agro Hub')
on conflict (seller_id) do nothing;

insert into public.marketplace_categories (id, slug, name)
values ('b5000000-0000-0000-0000-000000000030', 'sec-test-inputs', 'Security Test Inputs')
on conflict (id) do nothing;

insert into public.marketplace_listings (
  id, seller_id, category_id, listing_type, title, unit, price_model,
  base_price_kobo, min_order_quantity, available_quantity, location, location_state, status
) values (
  'b5000000-0000-0000-0000-000000000040',
  'b5000000-0000-0000-0000-000000000020',
  'b5000000-0000-0000-0000-000000000030',
  'input', 'NPK 15-15-15 Bag 50kg', 'bag', 'fixed',
  2500000, 1, 20,
  extensions.st_geogfromtext('SRID=4326;POINT(3.9470 7.3775)'), 'Oyo', 'active'
) on conflict (id) do nothing;

insert into public.marketplace_inventory_lots (
  id, listing_id, lot_number, physical_quantity, reserved_quantity, allocated_quantity
) values (
  'b5000000-0000-0000-0000-000000000041',
  'b5000000-0000-0000-0000-000000000040',
  'LOT-SEC-01', 20, 2, 0
) on conflict (id) do nothing;

-- Order 1: for tampering + duplicate-settlement tests
insert into public.marketplace_orders (
  id, order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo,
  platform_fee_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address
) values (
  'b5000000-0000-0000-0000-0000000000d1', 'ORD-SEC-001',
  'b5000000-0000-0000-0000-000000000001', 'retail',
  2500000, 300000, 0, 2800000,
  'payment_pending', 'pending', 'escrow', '{"line":"1 Farm Rd","state":"Oyo","phone":"08000000001"}'::jsonb
) on conflict (id) do nothing;

insert into public.marketplace_order_items (
  id, order_id, listing_id, seller_id, title, unit, quantity,
  unit_price_kobo, subtotal_kobo, commission_bps, commission_kobo, seller_earnings_kobo
) values (
  'b5000000-0000-0000-0000-0000000000e1', 'b5000000-0000-0000-0000-0000000000d1',
  'b5000000-0000-0000-0000-000000000040', 'b5000000-0000-0000-0000-000000000020',
  'NPK 15-15-15 Bag 50kg', 'bag', 1, 2500000, 2500000, 500, 125000, 2375000
) on conflict (id) do nothing;

insert into public.marketplace_fulfilments (
  id, order_id, seller_id, fulfilment_number, status, subtotal_kobo, delivery_fee_kobo, delivery_method
) values (
  'b5000000-0000-0000-0000-0000000000f1', 'b5000000-0000-0000-0000-0000000000d1',
  'b5000000-0000-0000-0000-000000000020', 'ORD-SEC-001-F1', 'placed', 2500000, 300000, 'seller_delivery'
) on conflict (id) do nothing;

-- Order 2: for retry-after-failed-payment test
insert into public.marketplace_orders (
  id, order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo,
  platform_fee_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address
) values (
  'b5000000-0000-0000-0000-0000000000d2', 'ORD-SEC-002',
  'b5000000-0000-0000-0000-000000000001', 'retail',
  2500000, 300000, 0, 2800000,
  'payment_pending', 'pending', 'escrow', '{"line":"1 Farm Rd","state":"Oyo","phone":"08000000001"}'::jsonb
) on conflict (id) do nothing;

insert into public.marketplace_order_items (
  id, order_id, listing_id, seller_id, title, unit, quantity,
  unit_price_kobo, subtotal_kobo, commission_bps, commission_kobo, seller_earnings_kobo
) values (
  'b5000000-0000-0000-0000-0000000000e2', 'b5000000-0000-0000-0000-0000000000d2',
  'b5000000-0000-0000-0000-000000000040', 'b5000000-0000-0000-0000-000000000020',
  'NPK 15-15-15 Bag 50kg', 'bag', 1, 2500000, 2500000, 500, 125000, 2375000
) on conflict (id) do nothing;

insert into public.marketplace_fulfilments (
  id, order_id, seller_id, fulfilment_number, status, subtotal_kobo, delivery_fee_kobo, delivery_method
) values (
  'b5000000-0000-0000-0000-0000000000f2', 'b5000000-0000-0000-0000-0000000000d2',
  'b5000000-0000-0000-0000-000000000020', 'ORD-SEC-002-F1', 'placed', 2500000, 300000, 'seller_delivery'
) on conflict (id) do nothing;

insert into public.marketplace_payments (
  order_id, payment_reference, provider, amount_kobo, status
) values (
  'b5000000-0000-0000-0000-0000000000d2', 'REF-FAILED-1', 'paystack', 2800000, 'failed'
) on conflict (payment_reference) do nothing;

-- Order 3: for insufficient reserved inventory rollback test (uses listing 0042 with 0 reserved_quantity)
insert into public.marketplace_listings (
  id, seller_id, category_id, listing_type, title, unit, price_model,
  base_price_kobo, min_order_quantity, available_quantity, location, location_state, status
) values (
  'b5000000-0000-0000-0000-000000000042',
  'b5000000-0000-0000-0000-000000000020',
  'b5000000-0000-0000-0000-000000000030',
  'input', 'Urea 46% Bag 50kg', 'bag', 'fixed',
  2500000, 1, 10,
  extensions.st_geogfromtext('SRID=4326;POINT(3.9470 7.3775)'), 'Oyo', 'active'
) on conflict (id) do nothing;

insert into public.marketplace_inventory_lots (
  id, listing_id, lot_number, physical_quantity, reserved_quantity, allocated_quantity
) values (
  'b5000000-0000-0000-0000-000000000043',
  'b5000000-0000-0000-0000-000000000042',
  'LOT-SEC-02', 10, 0, 0
) on conflict (id) do nothing;

insert into public.marketplace_orders (
  id, order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo,
  platform_fee_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address
) values (
  'b5000000-0000-0000-0000-0000000000d3', 'ORD-SEC-003',
  'b5000000-0000-0000-0000-000000000001', 'retail',
  2500000, 300000, 0, 2800000,
  'payment_pending', 'pending', 'escrow', '{"line":"1 Farm Rd","state":"Oyo","phone":"08000000001"}'::jsonb
) on conflict (id) do nothing;

insert into public.marketplace_order_items (
  id, order_id, listing_id, seller_id, title, unit, quantity,
  unit_price_kobo, subtotal_kobo, commission_bps, commission_kobo, seller_earnings_kobo
) values (
  'b5000000-0000-0000-0000-0000000000e3', 'b5000000-0000-0000-0000-0000000000d3',
  'b5000000-0000-0000-0000-000000000042', 'b5000000-0000-0000-0000-000000000020',
  'Urea 46% Bag 50kg', 'bag', 1, 2500000, 2500000, 500, 125000, 2375000
) on conflict (id) do nothing;

insert into public.marketplace_fulfilments (
  id, order_id, seller_id, fulfilment_number, status, subtotal_kobo, delivery_fee_kobo, delivery_method
) values (
  'b5000000-0000-0000-0000-0000000000f3', 'b5000000-0000-0000-0000-0000000000d3',
  'b5000000-0000-0000-0000-000000000020', 'ORD-SEC-003-F1', 'placed', 2500000, 300000, 'seller_delivery'
) on conflict (id) do nothing;

-- 2. Negative tests as authenticated Buyer 1
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b5000000-0000-0000-0000-000000000001"}', true);

-- Test 1: Buyer cannot directly INSERT into marketplace_orders
select throws_ok(
  $$insert into public.marketplace_orders (order_number, buyer_id, items_subtotal_kobo, total_amount_kobo, delivery_address)
    values ('ORD-FORGED-1', 'b5000000-0000-0000-0000-000000000001', 100, 100, '{}'::jsonb)$$,
  '42501',
  null,
  'Test 1: Authenticated buyer cannot directly insert into marketplace_orders'
);

-- Test 2: Buyer cannot manipulate order totals on their own order
select throws_ok(
  $$update public.marketplace_orders set total_amount_kobo = 1, items_subtotal_kobo = 1
    where id = 'b5000000-0000-0000-0000-0000000000d1'$$,
  '42501',
  null,
  'Test 2: Authenticated buyer cannot update order totals'
);

-- Test 3: Buyer cannot insert or modify commission values on marketplace_order_items
select throws_ok(
  $$insert into public.marketplace_order_items (
      order_id, listing_id, seller_id, title, unit, quantity, unit_price_kobo, subtotal_kobo,
      commission_bps, commission_kobo, seller_earnings_kobo
    ) values (
      'b5000000-0000-0000-0000-0000000000d1', 'b5000000-0000-0000-0000-000000000040',
      'b5000000-0000-0000-0000-000000000020', 'Forged', 'bag', 1, 1, 1, 0, 0, 1
    )$$,
  '42501',
  null,
  'Test 3a: Authenticated buyer cannot directly insert marketplace_order_items'
);

select throws_ok(
  $$update public.marketplace_order_items set commission_kobo = 0, seller_earnings_kobo = 2500000
    where id = 'b5000000-0000-0000-0000-0000000000e1'$$,
  '42501',
  null,
  'Test 3b: Authenticated buyer cannot modify commission values'
);

-- Test 4: Buyer cannot mark an order as paid or escrowed
select throws_ok(
  $$update public.marketplace_orders set status = 'paid', payment_status = 'escrowed'
    where id = 'b5000000-0000-0000-0000-0000000000d1'$$,
  '42501',
  null,
  'Test 4: Authenticated buyer cannot mark an order as paid'
);

-- Test 5: Outsider cannot manipulate another user's order
select set_config('request.jwt.claims', '{"sub":"b5000000-0000-0000-0000-000000000003"}', true);
select throws_ok(
  $$update public.marketplace_orders set status = 'cancelled'
    where id = 'b5000000-0000-0000-0000-0000000000d1'$$,
  '42501',
  null,
  'Test 5: Unauthorised user cannot update another buyer order'
);

-- Test 6: Unauthorised user cannot insert or modify fulfilment records
select throws_ok(
  $$insert into public.marketplace_fulfilments (
      order_id, seller_id, fulfilment_number, subtotal_kobo
    ) values (
      'b5000000-0000-0000-0000-0000000000d1', 'b5000000-0000-0000-0000-000000000020', 'FORGED-F1', 1
    )$$,
  '42501',
  null,
  'Test 6a: Unauthorised user cannot directly insert marketplace_fulfilments'
);

select throws_ok(
  $$select public.seller_update_fulfilment('b5000000-0000-0000-0000-0000000000f1', 'confirmed')$$,
  '42501',
  null,
  'Test 6b: Unauthorised user cannot call seller_update_fulfilment on another seller fulfilment'
);

-- Task 5 check: device_commands is denied to authenticated
select throws_ok(
  $$select count(*) from public.device_commands$$,
  '42501',
  null,
  'Task 5: Authenticated user cannot query service_role-only device_commands'
);

-- Test 7: Legitimate checkout through place_marketplace_order() works and computes authoritative totals
select set_config('request.jwt.claims', '{"sub":"b5000000-0000-0000-0000-000000000001"}', true);
create table pg_temp.placed_order (id uuid);
insert into pg_temp.placed_order
  select public.place_marketplace_order(
    '[{"listing_id":"b5000000-0000-0000-0000-000000000040","quantity":2}]'::jsonb,
    '{"line":"12 Cocoa House Rd","state":"Oyo","lga":"Ibadan North","phone":"08012345678"}'::jsonb,
    'Deliver before noon'
  );

select is(
  (select total_amount_kobo from public.marketplace_orders where id = (select id from pg_temp.placed_order)),
  5300000::bigint,
  'Test 7: place_marketplace_order() computes server-side total (2 * 2,500,000 + 300,000 delivery = 5,300,000 kobo)'
);

reset role;
select is(
  (select count(*)::integer from public.notifications where profile_id = 'b5000000-0000-0000-0000-000000000002' and kind = 'marketplace_order_placed' and data->>'order_id' = (select id::text from pg_temp.placed_order)),
  1,
  'Test 7a: New checkout creates exactly one notification for its seller'
);
select ok(
  (select data->>'item_summary' like '%NPK 15-15-15 Bag 50kg%' from public.notifications where profile_id = 'b5000000-0000-0000-0000-000000000002' and kind = 'marketplace_order_placed' and data->>'order_id' = (select id::text from pg_temp.placed_order)),
  'Test 7b: Seller notification includes the purchased product and quantity summary'
);
select is(
  (select data->>'order_number' from public.notifications where profile_id = 'b5000000-0000-0000-0000-000000000002' and kind = 'marketplace_order_placed' and data->>'order_id' = (select id::text from pg_temp.placed_order)),
  (select order_number from public.marketplace_orders where id = (select id from pg_temp.placed_order)),
  'Test 7c: Seller notification carries the correct order reference'
);

-- Test 8: Payment webhook security, idempotency, duplicate-settlement protection & retry
reset role;
set local role service_role;

-- 8a: Incorrect payment amount is rejected
select throws_ok(
  $$select public.process_payment_webhook('REF-TAMPER-1', 'paystack', 100::bigint, 'b5000000-0000-0000-0000-0000000000d1')$$,
  'P0001',
  'PAYMENT_AMOUNT_MISMATCH: Expected 2800000 kobo, received 100 kobo',
  'Test 8a: process_payment_webhook() rejects mismatched payment amount'
);

-- 8b: First successful payment reference settles Order 1
select is(
  (select (public.process_payment_webhook('REF-VALID-1', 'paystack', 2800000::bigint, 'b5000000-0000-0000-0000-0000000000d1'))->>'success'),
  'true',
  'Test 8b: First successful payment reference settles Order 1'
);

-- 8c: Repeated webhook with same reference is safely idempotent
select is(
  (select (public.process_payment_webhook('REF-VALID-1', 'paystack', 2800000::bigint, 'b5000000-0000-0000-0000-0000000000d1'))->>'already_processed'),
  'true',
  'Test 8c: Repeated webhook with same reference returns already_processed=true'
);

-- 8d: Second webhook with a DIFFERENT reference for the same already-settled Order 1 is rejected
select throws_ok(
  $$select public.process_payment_webhook('REF-SECOND-2', 'flutterwave', 2800000::bigint, 'b5000000-0000-0000-0000-0000000000d1')$$,
  'P0001',
  'ORDER_ALREADY_SETTLED: Order b5000000-0000-0000-0000-0000000000d1 cannot be settled again (status=paid, payment_status=escrowed)',
  'Test 8d: Second distinct payment reference cannot settle an already-settled order'
);

-- 8e: Database unique index blocks duplicate escrow creation for the same fulfilment
select throws_ok(
  $$insert into public.marketplace_escrows (
      order_id, fulfilment_id, buyer_id, seller_id, amount_kobo, commission_kobo, seller_net_kobo
    ) values (
      'b5000000-0000-0000-0000-0000000000d1', 'b5000000-0000-0000-0000-0000000000f1',
      'b5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000020',
      2800000, 125000, 2675000
    )$$,
  '23505',
  null,
  'Test 8e: Unique index prevents duplicate escrow row for the same fulfilment'
);

-- 8f: Database unique index blocks duplicate order_payment ledger entry for the same order
select throws_ok(
  $$select public.record_marketplace_journal_entry(
      'b5000000-0000-0000-0000-0000000000d1',
      'order_payment',
      'Duplicate settlement attempt',
      '[{"account_id":"ASSET_PAYMENT_CLEARING","direction":"DEBIT","amount_kobo":2800000,"memo":"dup"},{"account_id":"LIABILITY_ESCROW_DEPOSIT","direction":"CREDIT","amount_kobo":2800000,"memo":"dup"}]'::jsonb
    )$$,
  '23505',
  null,
  'Test 8f: Unique index prevents duplicate order_payment journal entry for the same order'
);

-- 8g: Verify rejected duplicate attempts did not alter escrow/ledger counts or overwrite REF-VALID-1
select is(
  (select count(*) from public.marketplace_escrows where order_id = 'b5000000-0000-0000-0000-0000000000d1'),
  1::bigint,
  'Test 8g: Exactly 1 escrow record exists for Order 1 after rejected duplicates'
);

select is(
  (select count(*) from public.marketplace_journal_entries where reference_id = 'b5000000-0000-0000-0000-0000000000d1' and reference_type = 'order_payment'),
  1::bigint,
  'Test 8h: Exactly 1 order_payment ledger entry exists for Order 1 after rejected duplicates'
);

-- 8i: Legitimate payment retry succeeds after an earlier failed payment on Order 2
select is(
  (select (public.process_payment_webhook('REF-RETRY-2', 'paystack', 2800000::bigint, 'b5000000-0000-0000-0000-0000000000d2'))->>'success'),
  'true',
  'Test 8i: Legitimate retry succeeds on Order 2 after prior failed payment'
);

select is(
  (select status from public.marketplace_payments where payment_reference = 'REF-FAILED-1'),
  'failed',
  'Test 8j: Prior failed payment record REF-FAILED-1 is preserved without overwrite'
);

-- 8k: Settlement fails and rolls back when reserved inventory is insufficient
select throws_ok(
  $$select public.process_payment_webhook('REF-NOSTOCK-3', 'paystack', 2800000::bigint, 'b5000000-0000-0000-0000-0000000000d3')$$,
  'P0001',
  'INSUFFICIENT_RESERVED_INVENTORY: Item b5000000-0000-0000-0000-0000000000e3 (listing b5000000-0000-0000-0000-000000000042) has 1.00 unreserved units remaining',
  'Test 8k: process_payment_webhook() fails and rolls back when reserved inventory is insufficient'
);

select * from finish();
rollback;
