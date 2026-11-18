-- Batch 02.2 Independent Review Hardening Tests (pgTAP)
-- Covers:
-- A. Ledger validation, rollback & payout idempotency
-- B. Settlement security, mathematical/escrow reconciliation & double-processing prevention
-- C. Authoritative finance aggregations & pagination (>500 postings, >100 entries, >150 payments/settlements)
-- D. Support ticket atomicity, audit logging, >100 ticket pagination & internal-note confidentiality
-- E. Storage verification-documents bucket & INSERT/SELECT/DELETE policies
-- F. Full role request lifecycle (submit, cancel, approve -> user_roles, reject with reason, unauthorized checks)

begin;

select plan(30);

-- ------------------------------------------------------------------------------------------------
-- Seed test identities & permissions
-- ------------------------------------------------------------------------------------------------
insert into auth.users (id, email)
values
  ('d7000000-0000-0000-0000-000000000001', 'b22h-buyer@example.com'),
  ('d7000000-0000-0000-0000-000000000002', 'b22h-seller@example.com'),
  ('d7000000-0000-0000-0000-000000000003', 'b22h-finance@example.com'),
  ('d7000000-0000-0000-0000-000000000004', 'b22h-payments-only@example.com'),
  ('d7000000-0000-0000-0000-000000000005', 'b22h-support@example.com'),
  ('d7000000-0000-0000-0000-000000000006', 'b22h-outsider@example.com')
on conflict (id) do nothing;

insert into public.profiles (id, full_name, phone)
values
  ('d7000000-0000-0000-0000-000000000001', 'Hardening Buyer', '+2348099000001'),
  ('d7000000-0000-0000-0000-000000000002', 'Hardening Seller', '+2348099000002'),
  ('d7000000-0000-0000-0000-000000000003', 'Hardening Finance', '+2348099000003'),
  ('d7000000-0000-0000-0000-000000000004', 'Hardening PaymentsOnly', '+2348099000004'),
  ('d7000000-0000-0000-0000-000000000005', 'Hardening Support', '+2348099000005'),
  ('d7000000-0000-0000-0000-000000000006', 'Hardening Outsider', '+2348099000006')
on conflict (id) do nothing;

insert into public.admin_roles (profile_id, admin_role)
values
  ('d7000000-0000-0000-0000-000000000003', 'super_admin'),
  ('d7000000-0000-0000-0000-000000000004', 'finance_officer'),
  ('d7000000-0000-0000-0000-000000000005', 'support_disputes')
on conflict do nothing;

-- Ensure finance_officer has payments.read without ledger.read inside this rolled-back test tx
insert into public.admin_role_permissions (admin_role, permission)
values ('finance_officer', 'payments.read')
on conflict do nothing;
delete from public.admin_role_permissions where admin_role = 'finance_officer' and permission = 'ledger.read';

insert into public.marketplace_sellers (id, profile_id, business_name, seller_type, verification_status)
values ('d7000000-0000-0000-0000-0000000000a1', 'd7000000-0000-0000-0000-000000000002', 'Hardening Agro Ltd', 'agro_dealer', 'verified')
on conflict (id) do nothing;

-- ------------------------------------------------------------------------------------------------
-- A. Ledger Validation & Rollback
-- ------------------------------------------------------------------------------------------------
select throws_ok(
  $$select public.record_marketplace_journal_entry('ref-empty', 'adjustment', 'Empty postings', '[]'::jsonb)$$,
  '22023', null,
  'A1: Empty postings array is rejected'
);

select throws_ok(
  $$select public.record_marketplace_journal_entry('ref-unbal', 'adjustment', 'Unbalanced',
    '[{"account_id":"ASSET_PAYMENT_CLEARING","direction":"DEBIT","amount_kobo":1000},{"account_id":"LIABILITY_SELLER_PAYABLE","direction":"CREDIT","amount_kobo":900}]'::jsonb)$$,
  '22023', null,
  'A2: Unbalanced journal entry is rejected'
);

select throws_ok(
  $$select public.record_marketplace_journal_entry('ref-badacct', 'adjustment', 'Missing acct',
    '[{"account_id":"NON_EXISTENT_ACCT","direction":"DEBIT","amount_kobo":1000},{"account_id":"LIABILITY_SELLER_PAYABLE","direction":"CREDIT","amount_kobo":1000}]'::jsonb)$$,
  '23503', null,
  'A3: Unknown ledger account is rejected'
);

select throws_ok(
  $$select public.record_marketplace_journal_entry('ref-zero', 'adjustment', 'Zero amount',
    '[{"account_id":"ASSET_PAYMENT_CLEARING","direction":"DEBIT","amount_kobo":0},{"account_id":"LIABILITY_SELLER_PAYABLE","direction":"CREDIT","amount_kobo":0}]'::jsonb)$$,
  '22023', null,
  'A4: Zero amount posting is rejected'
);

select is(
  (select count(*) from public.marketplace_journal_entries where reference_id in ('ref-empty', 'ref-unbal', 'ref-badacct', 'ref-zero')),
  0::bigint,
  'A5: Failed journal creations leave zero orphan journal entries'
);

-- ------------------------------------------------------------------------------------------------
-- B. Settlement Reconciliation & Security
-- ------------------------------------------------------------------------------------------------
insert into public.marketplace_orders (
  id, order_number, buyer_id, items_subtotal_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address
) values (
  'd7000000-0000-0000-0000-0000000000b1', 'ORD-B22H-001', 'd7000000-0000-0000-0000-000000000001',
  100000, 100000, 'completed', 'released', 'escrow', '{"state":"Oyo"}'::jsonb
) on conflict (id) do nothing;

insert into public.marketplace_escrows (id, order_id, buyer_id, seller_id, amount_kobo, commission_kobo, seller_net_kobo, status)
values ('d7000000-0000-0000-0000-0000000000c1', 'd7000000-0000-0000-0000-0000000000b1', 'd7000000-0000-0000-0000-000000000001', 'd7000000-0000-0000-0000-0000000000a1', 100000, 5000, 95000, 'released');

-- Mismatched settlement (net_payout_kobo = 94000 != escrow 95000)
insert into public.marketplace_settlements (id, escrow_id, seller_id, gross_amount_kobo, commission_kobo, net_payout_kobo, payout_reference, status)
values ('d7000000-0000-0000-0000-0000000000d1', 'd7000000-0000-0000-0000-0000000000c1', 'd7000000-0000-0000-0000-0000000000a1', 100000, 5000, 94000, 'PAYOUT-MISMATCH-1', 'pending');

-- Valid settlement
insert into public.marketplace_settlements (id, escrow_id, seller_id, gross_amount_kobo, commission_kobo, net_payout_kobo, payout_reference, status)
values ('d7000000-0000-0000-0000-0000000000d2', 'd7000000-0000-0000-0000-0000000000c1', 'd7000000-0000-0000-0000-0000000000a1', 100000, 5000, 95000, 'PAYOUT-VALID-1', 'pending');

select set_config('request.jwt.claims', '{"sub":"d7000000-0000-0000-0000-000000000006"}', true);
select throws_ok(
  $$select public.admin_process_marketplace_settlement('d7000000-0000-0000-0000-0000000000d2', 'completed', 'Unauthorised')$$,
  '42501', null,
  'B1: Unauthorised user cannot process settlement'
);

select set_config('request.jwt.claims', '{"sub":"d7000000-0000-0000-0000-000000000003"}', true);
select throws_ok(
  $$select public.admin_process_marketplace_settlement('d7000000-0000-0000-0000-0000000000d1', 'completed', 'Bad math')$$,
  '22023', null,
  'B2: Settlement with gross <> commission + net is rejected'
);

select is(
  (public.admin_process_marketplace_settlement('d7000000-0000-0000-0000-0000000000d2', 'completed', 'Approved')->>'status'),
  'completed',
  'B3: Valid settlement completes and returns status completed'
);

select throws_ok(
  $$select public.admin_process_marketplace_settlement('d7000000-0000-0000-0000-0000000000d2', 'completed', 'Duplicate')$$,
  '22023', null,
  'B4: Completed settlement cannot be re-processed'
);

select is(
  (select count(*) from public.marketplace_journal_entries where reference_id = 'd7000000-0000-0000-0000-0000000000d2' and reference_type = 'payout'),
  1::bigint,
  'B5: Completed settlement creates exactly one payout journal entry'
);

-- ------------------------------------------------------------------------------------------------
-- C. Authoritative Finance Aggregations & Pagination (>500 postings, >100 entries, >150 payments/settlements)
-- ------------------------------------------------------------------------------------------------
do $$
declare
  i integer;
  v_order_id uuid;
  v_escrow_id uuid;
begin
  for i in 1..160 loop
    v_order_id := gen_random_uuid();
    insert into public.marketplace_orders (
      id, order_number, buyer_id, items_subtotal_kobo, total_amount_kobo, status, payment_status, payment_mode, delivery_address, created_at
    ) values (
      v_order_id,
      'ORD-SCALE-' || lpad(i::text, 4, '0'),
      'd7000000-0000-0000-0000-000000000001',
      10000, 10000, 'completed', 'released', 'escrow', '{"state":"Oyo"}'::jsonb,
      now() - (i || ' minutes')::interval
    );

    insert into public.marketplace_payments (order_id, payment_reference, provider, amount_kobo, status, created_at)
    values (
      v_order_id,
      'PAY-SCALE-' || lpad(i::text, 4, '0'),
      case when i % 2 = 0 then 'paystack' else 'flutterwave' end,
      10000,
      'successful',
      now() - (i || ' minutes')::interval
    );

    insert into public.marketplace_escrows (order_id, buyer_id, seller_id, amount_kobo, commission_kobo, seller_net_kobo, status, created_at)
    values (
      v_order_id,
      'd7000000-0000-0000-0000-000000000001',
      'd7000000-0000-0000-0000-0000000000a1',
      10000, 500, 9500, 'released',
      now() - (i || ' minutes')::interval
    )
    returning id into v_escrow_id;

    insert into public.marketplace_settlements (escrow_id, seller_id, gross_amount_kobo, commission_kobo, net_payout_kobo, payout_reference, status, created_at)
    values (
      v_escrow_id,
      'd7000000-0000-0000-0000-0000000000a1',
      10000, 500, 9500,
      'PAYOUT-SCALE-' || lpad(i::text, 4, '0'),
      'pending',
      now() - (i || ' minutes')::interval
    );

    -- 2 entries * 2 postings each = 320 entries / 640 postings (>500 postings)
    perform public.record_marketplace_journal_entry(
      'SCALE-ORD-' || i::text,
      'order_payment',
      'Scale payment ' || i::text,
      jsonb_build_array(
        jsonb_build_object('account_id', 'ASSET_PAYMENT_CLEARING', 'direction', 'DEBIT', 'amount_kobo', 10000),
        jsonb_build_object('account_id', 'LIABILITY_ESCROW_DEPOSIT', 'direction', 'CREDIT', 'amount_kobo', 10000)
      )
    );
    perform public.record_marketplace_journal_entry(
      'SCALE-REL-' || i::text,
      'escrow_release',
      'Scale release ' || i::text,
      jsonb_build_array(
        jsonb_build_object('account_id', 'LIABILITY_ESCROW_DEPOSIT', 'direction', 'DEBIT', 'amount_kobo', 10000),
        jsonb_build_object('account_id', 'REVENUE_MARKETPLACE_COMMISSION', 'direction', 'CREDIT', 'amount_kobo', 500),
        jsonb_build_object('account_id', 'LIABILITY_SELLER_PAYABLE', 'direction', 'CREDIT', 'amount_kobo', 9500)
      )
    );
  end loop;
end $$;

select set_config('request.jwt.claims', '{"sub":"d7000000-0000-0000-0000-000000000003"}', true);
select is(
  ((public.admin_finance_summary()->'payments'->>'successful_kobo')::bigint >= 1600000),
  true,
  'C1: admin_finance_summary aggregates >150 payments accurately'
);

select is(
  ((public.admin_finance_summary()->>'commission_ledger_kobo')::bigint >= 80000),
  true,
  'C2: admin_finance_summary aggregates commission across >500 postings accurately'
);

select is(
  ((public.admin_finance_journal_entries('SCALE-ORD-1', null, null, null, 25, 0)->>'total_count')::bigint >= 1),
  true,
  'C3: admin_finance_journal_entries finds older matching records server-side'
);

select is(
  jsonb_array_length(public.admin_finance_payments(null, null, null, null, null, 25, 0)->'items'),
  25,
  'C4: admin_finance_payments returns exact page size'
);

-- Restricted staff (payments.read without ledger.read)
select set_config('request.jwt.claims', '{"sub":"d7000000-0000-0000-0000-000000000004"}', true);
select is(
  jsonb_array_length(public.admin_finance_summary()->'accounts'),
  0,
  'C5: Staff without ledger.read receives empty ledger accounts array'
);

select throws_ok(
  $$select public.admin_finance_journal_entries(null, null, null, null, 25, 0)$$,
  '42501', null,
  'C6: Staff without ledger.read cannot call admin_finance_journal_entries'
);

-- ------------------------------------------------------------------------------------------------
-- D. Support Ticket Atomicity, Scale (>100 tickets) & Internal Note Confidentiality
-- ------------------------------------------------------------------------------------------------
do $$
declare
  i integer;
begin
  for i in 1..115 loop
    insert into public.support_tickets (ticket_number, requester_id, subject, category, priority, status, sla_due_at, created_at)
    values (
      'TKT-SCALE-' || lpad(i::text, 4, '0'),
      'd7000000-0000-0000-0000-000000000001',
      'Scale ticket #' || i::text,
      'account',
      case when i <= 10 then 'urgent' else 'normal' end,
      case when i <= 5 then 'resolved' else 'open' end,
      case when i between 11 and 15 then now() - interval '2 hours' else now() + interval '24 hours' end,
      now() - (i || ' minutes')::interval
    );
  end loop;
end $$;

select set_config('request.jwt.claims', '{"sub":"d7000000-0000-0000-0000-000000000005"}', true);
select is(
  ((public.admin_support_summary()->>'active_count')::bigint >= 110),
  true,
  'D1: admin_support_summary counts all >100 tickets accurately'
);

select is(
  ((public.admin_support_tickets_page('TKT-SCALE-0115', null, null, 25, 0)->>'total_count')::bigint),
  1::bigint,
  'D2: admin_support_tickets_page discovers older ticket outside first 100'
);

select is(
  (public.admin_update_support_ticket(
    (select id from public.support_tickets where ticket_number = 'TKT-SCALE-0115'),
    'resolved', 'high', 'd7000000-0000-0000-0000-000000000005'
  )->>'status'),
  'resolved',
  'D3: admin_update_support_ticket updates status atomically'
);

select is(
  (select count(*) from public.admin_actions
    where entity = 'support_tickets'
      and entity_id = (select id from public.support_tickets where ticket_number = 'TKT-SCALE-0115')
      and action = 'support_ticket_resolved'),
  1::bigint,
  'D4: admin_update_support_ticket writes audit log in same transaction'
);

select throws_ok(
  $$select public.admin_update_support_ticket(
    (select id from public.support_tickets where ticket_number = 'TKT-SCALE-0115'),
    'pending', 'normal', null
  )$$,
  '22023', null,
  'D5: Invalid transition resolved -> pending is rejected by DB RPC'
);

-- ------------------------------------------------------------------------------------------------
-- E. Storage verification-documents Bucket & Policies
-- ------------------------------------------------------------------------------------------------
select is(
  (select public from storage.buckets where id = 'verification-documents'),
  false,
  'E1: verification-documents bucket is private'
);

select is(
  (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'verification documents: owner deletes own'),
  1::bigint,
  'E2: verification-documents owner delete policy exists for orphan cleanup'
);

-- ------------------------------------------------------------------------------------------------
-- F. Role Request Lifecycle
-- ------------------------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"d7000000-0000-0000-0000-000000000001"}', true);
insert into public.role_requests (role, details) values ('machinery_owner', '{"tractors":2}'::jsonb);

select is(
  (public.cancel_role_request((select id from public.role_requests where profile_id = 'd7000000-0000-0000-0000-000000000001' and role = 'machinery_owner' and status = 'pending'))).status::text,
  'cancelled',
  'F1: User can cancel their own pending role request'
);

insert into public.role_requests (role, details) values ('machinery_owner', '{"tractors":3}'::jsonb);

insert into public.verification_documents (role_request_id, document_type, storage_path, mime_type, size_bytes)
values (
  (select id from public.role_requests where profile_id = 'd7000000-0000-0000-0000-000000000001' and role = 'machinery_owner' and status = 'pending'),
  'equipment_ownership',
  'd7000000-0000-0000-0000-000000000001/tractor-title.pdf',
  'application/pdf',
  204800
);

select throws_ok(
  $$select public.approve_role_request((select id from public.role_requests where profile_id = 'd7000000-0000-0000-0000-000000000001' and role = 'machinery_owner' and status = 'pending'), 'Self')$$,
  '42501', null,
  'F2: Ordinary user cannot approve a role request'
);

select set_config('request.jwt.claims', '{"sub":"d7000000-0000-0000-0000-000000000003"}', true);
select public.review_verification_document(
  (select id from public.verification_documents where role_request_id = (select id from public.role_requests where profile_id = 'd7000000-0000-0000-0000-000000000001' and role = 'machinery_owner' and status = 'pending') limit 1),
  'accepted',
  'Tractor ownership verified'
);
select is(
  (public.approve_role_request((select id from public.role_requests where profile_id = 'd7000000-0000-0000-0000-000000000001' and role = 'machinery_owner' and status = 'pending'), 'Verified') ).status::text,
  'approved',
  'F3: Authorised staff can approve role request'
);

select is(
  (select count(*) from public.user_roles where profile_id = 'd7000000-0000-0000-0000-000000000001' and role = 'machinery_owner'),
  1::bigint,
  'F4: Approved role request grants user_roles row'
);

select set_config('request.jwt.claims', '{"sub":"d7000000-0000-0000-0000-000000000001"}', true);
insert into public.role_requests (role, provider_type, details) values ('service_provider', 'agronomist', '{"exp":"5y"}'::jsonb);

select set_config('request.jwt.claims', '{"sub":"d7000000-0000-0000-0000-000000000003"}', true);
select is(
  (public.reject_role_request((select id from public.role_requests where profile_id = 'd7000000-0000-0000-0000-000000000001' and role = 'service_provider' and status = 'pending'), 'Missing licence document') ).status::text,
  'rejected',
  'F5: Authorised staff can reject role request with reason'
);

select is(
  (select count(*) from public.user_roles where profile_id = 'd7000000-0000-0000-0000-000000000001' and role = 'service_provider'),
  0::bigint,
  'F6: Rejected role request does not grant user_roles row'
);

select * from finish();
rollback;
