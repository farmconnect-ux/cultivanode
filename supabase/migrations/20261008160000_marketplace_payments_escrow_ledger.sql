-- CultivaNode Marketplace Module: Migration 3 of 4
-- Payments, Escrow State Machine, Double-Entry Cryptographic Ledger & Farm Books / Inventory Sync

------------------------------------------------------------------------------------------------
-- 1. Double-Entry Cryptographic Ledger
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_ledger_accounts (
  id                  text primary key check (id ~ '^[A-Z0-9_]{3,50}$'),
  name                text not null check (char_length(name) between 2 and 100),
  type                text not null check (type in ('asset', 'liability', 'equity', 'revenue', 'expense')),
  description         text check (description is null or char_length(description) <= 500),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

insert into public.marketplace_ledger_accounts (id, name, type, description)
values
  ('ASSET_PAYMENT_CLEARING', 'Payment Gateway Clearing Account', 'asset', 'Transit account for incoming card/transfer funds from Paystack/Flutterwave'),
  ('ASSET_ESCROW_HOLDING', 'Escrow Custody Funds', 'asset', 'Custody funds held on behalf of buyers pending successful delivery/inspection'),
  ('LIABILITY_ESCROW_DEPOSIT', 'Buyer Escrow Deposits Payable', 'liability', 'Platform liability representing customer deposits held in escrow'),
  ('LIABILITY_SELLER_PAYABLE', 'Seller Net Proceeds Payable', 'liability', 'Funds cleared and owed to sellers for completed orders'),
  ('REVENUE_MARKETPLACE_COMMISSION', 'Marketplace Platform Commission', 'revenue', 'Earned fee revenue from completed marketplace transactions'),
  ('REVENUE_ESCROW_FEE', 'Escrow Processing Fee Revenue', 'revenue', 'Earned fees for providing dispute and escrow protection services'),
  ('EXPENSE_GATEWAY_FEES', 'Payment Gateway Processing Charges', 'expense', 'Processing fees incurred from payment service providers')
on conflict (id) do nothing;

create table if not exists public.marketplace_journal_entries (
  id                  uuid primary key default gen_random_uuid(),
  reference_id        text not null check (char_length(reference_id) between 1 and 100),
  reference_type      text not null check (reference_type in ('order_payment', 'escrow_release', 'refund', 'payout', 'adjustment')),
  description         text not null check (char_length(description) between 3 and 500),
  previous_hash       text not null,
  current_hash        text not null,
  created_at          timestamptz not null default now()
);

create index if not exists mkt_journal_ref_idx on public.marketplace_journal_entries (reference_id, reference_type);

create table if not exists public.marketplace_journal_postings (
  id                  uuid primary key default gen_random_uuid(),
  entry_id            uuid not null references public.marketplace_journal_entries (id) on delete cascade,
  account_id          text not null references public.marketplace_ledger_accounts (id),
  direction           text not null check (direction in ('DEBIT', 'CREDIT')),
  amount_kobo         bigint not null check (amount_kobo > 0),
  memo                text check (memo is null or char_length(memo) <= 300)
);

create index if not exists mkt_postings_entry_idx on public.marketplace_journal_postings (entry_id);
create index if not exists mkt_postings_account_idx on public.marketplace_journal_postings (account_id);

------------------------------------------------------------------------------------------------
-- 2. Payments
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.marketplace_orders (id) on delete cascade,
  payment_reference   text not null unique check (char_length(payment_reference) between 6 and 100),
  provider            text not null check (provider in ('paystack', 'flutterwave', 'direct_transfer', 'test_adapter')),
  amount_kobo         bigint not null check (amount_kobo > 0),
  currency            text not null default 'NGN',
  status              text not null default 'pending' check (status in ('pending', 'successful', 'failed', 'refunded')),
  gateway_response    jsonb not null default '{}'::jsonb,
  idempotency_key     text unique check (idempotency_key is null or char_length(idempotency_key) <= 100),
  verified_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists mkt_payments_order_idx on public.marketplace_payments (order_id);
create index if not exists mkt_payments_status_idx on public.marketplace_payments (status);

------------------------------------------------------------------------------------------------
-- 3. Escrow State Machine
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_escrows (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.marketplace_orders (id) on delete cascade,
  fulfilment_id           uuid references public.marketplace_fulfilments (id) on delete set null,
  buyer_id                uuid not null references public.profiles (id) on delete cascade,
  seller_id               uuid not null references public.marketplace_sellers (id) on delete cascade,
  amount_kobo             bigint not null check (amount_kobo > 0),
  commission_kobo         bigint not null default 0 check (commission_kobo >= 0),
  seller_net_kobo         bigint not null check (seller_net_kobo > 0),
  status                  text not null default 'held' check (status in ('held', 'awaiting_confirmation', 'disputed', 'released', 'refunded')),
  auto_release_deadline   timestamptz,
  held_at                 timestamptz not null default now(),
  released_at             timestamptz,
  refunded_at             timestamptz,
  disputed_at             timestamptz,
  settlement_reference    text check (settlement_reference is null or char_length(settlement_reference) <= 100),
  created_at              timestamptz not null default now()
);

create index if not exists mkt_escrows_order_idx on public.marketplace_escrows (order_id);
create index if not exists mkt_escrows_fulfilment_idx on public.marketplace_escrows (fulfilment_id);
create index if not exists mkt_escrows_status_idx on public.marketplace_escrows (status);

------------------------------------------------------------------------------------------------
-- 4. Settlements
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_settlements (
  id                  uuid primary key default gen_random_uuid(),
  escrow_id           uuid not null references public.marketplace_escrows (id) on delete cascade,
  seller_id           uuid not null references public.marketplace_sellers (id) on delete cascade,
  bank_account_id     uuid references public.bank_accounts (id) on delete set null,
  gross_amount_kobo   bigint not null check (gross_amount_kobo > 0),
  commission_kobo     bigint not null default 0 check (commission_kobo >= 0),
  net_payout_kobo     bigint not null check (net_payout_kobo > 0),
  payout_reference    text unique check (char_length(payout_reference) between 6 and 100),
  status              text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  processed_at        timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists mkt_settlements_seller_idx on public.marketplace_settlements (seller_id);
create index if not exists mkt_settlements_status_idx on public.marketplace_settlements (status);

------------------------------------------------------------------------------------------------
-- 5. Helper Function: Record Cryptographic Double-Entry Ledger Entry
------------------------------------------------------------------------------------------------

create or replace function public.record_marketplace_journal_entry(
  p_reference_id text,
  p_reference_type text,
  p_description text,
  p_postings jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_last_hash text;
  v_entry_id uuid;
  v_postings_digest text := '';
  v_current_hash text;
  v_posting record;
  v_total_debits bigint := 0;
  v_total_credits bigint := 0;
begin
  -- 1. Fetch previous hash or use genesis
  select current_hash into v_last_hash
    from public.marketplace_journal_entries
   order by created_at desc, id desc
   limit 1;

  if v_last_hash is null then
    v_last_hash := repeat('0', 64);
  end if;

  -- 2. Validate postings balance
  for v_posting in select * from jsonb_to_recordset(p_postings) as x(
    account_id text, direction text, amount_kobo bigint, memo text
  )
  loop
    if v_posting.direction = 'DEBIT' then
      v_total_debits := v_total_debits + v_posting.amount_kobo;
    elsif v_posting.direction = 'CREDIT' then
      v_total_credits := v_total_credits + v_posting.amount_kobo;
    else
      raise exception 'Invalid posting direction %', v_posting.direction;
    end if;

    v_postings_digest := v_postings_digest || '|' || v_posting.account_id || ':' || v_posting.direction || ':' || v_posting.amount_kobo;
  end loop;

  if v_total_debits <> v_total_credits then
    raise exception 'UNBALANCED JOURNAL ENTRY: Sum of Debits (%) does not equal sum of Credits (%)',
      v_total_debits, v_total_credits;
  end if;

  v_entry_id := gen_random_uuid();
  v_current_hash := encode(extensions.digest(v_last_hash || ':' || v_entry_id::text || ':' || p_reference_id || ':' || v_postings_digest || ':' || now()::text, 'sha256'), 'hex');

  -- 3. Insert Journal Entry
  insert into public.marketplace_journal_entries (id, reference_id, reference_type, description, previous_hash, current_hash)
  values (v_entry_id, p_reference_id, p_reference_type, p_description, v_last_hash, v_current_hash);

  -- 4. Insert Journal Postings
  for v_posting in select * from jsonb_to_recordset(p_postings) as x(
    account_id text, direction text, amount_kobo bigint, memo text
  )
  loop
    insert into public.marketplace_journal_postings (entry_id, account_id, direction, amount_kobo, memo)
    values (v_entry_id, v_posting.account_id, v_posting.direction, v_posting.amount_kobo, v_posting.memo);
  end loop;

  return v_entry_id;
end;
$$;

------------------------------------------------------------------------------------------------
-- 6. Payment Webhook Processor & Escrow Lock RPC
------------------------------------------------------------------------------------------------

create or replace function public.process_payment_webhook(
  p_reference text,
  p_provider text,
  p_amount_kobo bigint,
  p_order_id uuid,
  p_gateway_data jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_payment record;
  v_fulfilment record;
  v_item record;
  v_lot record;
  v_qty_to_deduct numeric(12, 2);
  v_comm_kobo bigint;
  v_seller_net bigint;
  v_escrow_id uuid;
begin
  -- 1. Idempotency check: see if payment is already recorded and successful
  select * into v_payment
    from public.marketplace_payments
   where payment_reference = p_reference;

  if found and v_payment.status = 'successful' then
    return jsonb_build_object('success', true, 'already_processed', true, 'order_id', p_order_id);
  end if;

  -- 2. Lock Order
  select * into v_order
    from public.marketplace_orders
   where id = p_order_id
     for update;

  if not found then
    raise exception 'Order % not found.', p_order_id;
  end if;

  -- Verify amount
  if p_amount_kobo <> v_order.total_amount_kobo then
    raise exception 'PAYMENT_AMOUNT_MISMATCH: Expected % kobo, received % kobo',
      v_order.total_amount_kobo, p_amount_kobo;
  end if;

  -- 3. Record or update payment record
  if v_payment.id is null then
    insert into public.marketplace_payments (order_id, payment_reference, provider, amount_kobo, status, gateway_response, verified_at)
    values (p_order_id, p_reference, p_provider, p_amount_kobo, 'successful', p_gateway_data, now())
    returning * into v_payment;
  else
    update public.marketplace_payments
       set status = 'successful',
           gateway_response = p_gateway_data,
           verified_at = now()
     where id = v_payment.id;
  end if;

  -- 4. Update Order Status
  update public.marketplace_orders
     set status = 'paid',
         payment_status = 'escrowed',
         paid_at = now(),
         updated_at = now()
   where id = p_order_id;

  -- 5. Finalize inventory from reserved to sold
  for v_item in select id, listing_id, quantity from public.marketplace_order_items where order_id = p_order_id loop
    v_qty_to_deduct := v_item.quantity;

    for v_lot in
      select id, reserved_quantity
        from public.marketplace_inventory_lots
       where listing_id = v_item.listing_id
         and reserved_quantity > 0
       order by created_at asc
         for update
    loop
      if v_qty_to_deduct <= 0 then exit; end if;

      declare
        v_lot_deduct numeric(12, 2) := least(v_qty_to_deduct, v_lot.reserved_quantity);
      begin
        update public.marketplace_inventory_lots
           set reserved_quantity = reserved_quantity - v_lot_deduct,
               sold_quantity = sold_quantity + v_lot_deduct,
               updated_at = now()
         where id = v_lot.id;

        v_qty_to_deduct := v_qty_to_deduct - v_lot_deduct;
      end;
    end loop;
  end loop;

  -- 6. Create Escrow records for each Fulfilment
  for v_fulfilment in
    select f.id as fulfilment_id, f.seller_id, f.subtotal_kobo, f.delivery_fee_kobo,
           coalesce(sum(oi.commission_kobo), 0) as total_commission
      from public.marketplace_fulfilments f
      join public.marketplace_order_items oi on oi.order_id = f.order_id and oi.seller_id = f.seller_id
     where f.order_id = p_order_id
     group by f.id, f.seller_id, f.subtotal_kobo, f.delivery_fee_kobo
  loop
    v_comm_kobo := v_fulfilment.total_commission;
    v_seller_net := (v_fulfilment.subtotal_kobo + v_fulfilment.delivery_fee_kobo) - v_comm_kobo;

    insert into public.marketplace_escrows (
      order_id, fulfilment_id, buyer_id, seller_id,
      amount_kobo, commission_kobo, seller_net_kobo,
      status, held_at
    )
    values (
      p_order_id, v_fulfilment.fulfilment_id, v_order.buyer_id, v_fulfilment.seller_id,
      (v_fulfilment.subtotal_kobo + v_fulfilment.delivery_fee_kobo), v_comm_kobo, v_seller_net,
      'held', now()
    )
    returning id into v_escrow_id;
  end loop;

  -- 7. Record Double-Entry Ledger Entry
  perform public.record_marketplace_journal_entry(
    p_order_id::text,
    'order_payment',
    'Customer payment received and placed into escrow for order ' || v_order.order_number,
    jsonb_build_array(
      jsonb_build_object(
        'account_id', 'ASSET_PAYMENT_CLEARING',
        'direction', 'DEBIT',
        'amount_kobo', p_amount_kobo,
        'memo', 'Funds cleared from gateway ' || p_provider
      ),
      jsonb_build_object(
        'account_id', 'LIABILITY_ESCROW_DEPOSIT',
        'direction', 'CREDIT',
        'amount_kobo', p_amount_kobo,
        'memo', 'Escrow liability held for order ' || v_order.order_number
      )
    )
  );

  return jsonb_build_object('success', true, 'order_id', p_order_id, 'payment_status', 'escrowed');
end;
$$;

------------------------------------------------------------------------------------------------
-- 7. Escrow Release RPC & Farm Books / Farm Inventory Synchronization
------------------------------------------------------------------------------------------------

create or replace function public.release_fulfilment_escrow(p_fulfilment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_escrow record;
  v_fulfilment record;
  v_order record;
  v_seller record;
  v_buyer record;
  v_item record;
  v_payout_ref text;
  v_farm_id uuid;
  v_buyer_farm_id uuid;
begin
  -- 1. Lock and fetch escrow
  select * into v_escrow
    from public.marketplace_escrows
   where fulfilment_id = p_fulfilment_id
     for update;

  if not found then
    raise exception 'Escrow for fulfilment % not found.', p_fulfilment_id;
  end if;
  if v_escrow.buyer_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Only the buyer can confirm delivery and release escrow.' using errcode = '42501';
  end if;

  if v_escrow.status <> 'held' and v_escrow.status <> 'awaiting_confirmation' then
    raise exception 'Escrow % cannot be released from status %.', v_escrow.id, v_escrow.status;
  end if;

  select * into v_fulfilment from public.marketplace_fulfilments where id = p_fulfilment_id;
  select * into v_order from public.marketplace_orders where id = v_escrow.order_id;
  select * into v_seller from public.marketplace_sellers where id = v_escrow.seller_id;
  select * into v_buyer from public.profiles where id = v_escrow.buyer_id;

  v_payout_ref := 'PAYOUT-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8));

  -- 2. Update Escrow status
  update public.marketplace_escrows
     set status = 'released',
         released_at = now(),
         settlement_reference = v_payout_ref
   where id = v_escrow.id;

  -- 3. Update Fulfilment status
  update public.marketplace_fulfilments
     set status = 'delivered',
         confirmed_at = now(),
         updated_at = now()
   where id = p_fulfilment_id;

  -- 4. Create Settlement Record
  insert into public.marketplace_settlements (
    escrow_id, seller_id, bank_account_id,
    gross_amount_kobo, commission_kobo, net_payout_kobo,
    payout_reference, status
  )
  values (
    v_escrow.id, v_escrow.seller_id, v_seller.payout_bank_account_id,
    v_escrow.amount_kobo, v_escrow.commission_kobo, v_escrow.seller_net_kobo,
    v_payout_ref, 'pending'
  );

  -- 5. Post to Double-Entry Ledger
  perform public.record_marketplace_journal_entry(
    p_fulfilment_id::text,
    'escrow_release',
    'Escrow released to seller for fulfilment ' || v_fulfilment.fulfilment_number,
    jsonb_build_array(
      jsonb_build_object(
        'account_id', 'LIABILITY_ESCROW_DEPOSIT',
        'direction', 'DEBIT',
        'amount_kobo', v_escrow.amount_kobo,
        'memo', 'Release escrow holding liability'
      ),
      jsonb_build_object(
        'account_id', 'LIABILITY_SELLER_PAYABLE',
        'direction', 'CREDIT',
        'amount_kobo', v_escrow.seller_net_kobo,
        'memo', 'Seller net payable for ' || v_fulfilment.fulfilment_number
      ),
      jsonb_build_object(
        'account_id', 'REVENUE_MARKETPLACE_COMMISSION',
        'direction', 'CREDIT',
        'amount_kobo', v_escrow.commission_kobo,
        'memo', 'Platform commission earned'
      )
    )
  );

  -- 6. Farm Books Integration: Seller side (Income)
  -- Find if any listing in this fulfillment is linked to a farm
  for v_item in
    select oi.*, pp.farm_id, pp.crop_cycle_id
      from public.marketplace_order_items oi
      left join public.marketplace_produce_provenance pp on pp.listing_id = oi.listing_id
     where oi.order_id = v_escrow.order_id and oi.seller_id = v_escrow.seller_id
  loop
    if v_item.farm_id is not null then
      -- Idempotently insert income into farm_financial_transactions
      insert into public.farm_financial_transactions (
        farm_id, crop_cycle_id, type, category,
        amount_kobo, transaction_date, receipt_number,
        payment_method, description, recorded_by
      )
      values (
        v_item.farm_id, v_item.crop_cycle_id, 'income', 'harvest_sale',
        v_item.seller_earnings_kobo, current_date, v_payout_ref,
        'escrow', 'Marketplace sale: ' || v_item.title || ' (' || v_item.quantity || ' ' || v_item.unit || ')',
        v_seller.profile_id
      );
    end if;
  end loop;

  -- 7. Farm Books & Inventory Integration: Buyer side (Expense & Stock Increase)
  -- If the buyer owns a farm and purchased inputs/supplies
  select id into v_buyer_farm_id from public.farms where owner_id = v_buyer.id limit 1;

  if v_buyer_farm_id is not null then
    for v_item in
      select oi.*, l.listing_type
        from public.marketplace_order_items oi
        join public.marketplace_listings l on l.id = oi.listing_id
       where oi.order_id = v_escrow.order_id and oi.seller_id = v_escrow.seller_id
    loop
      if v_item.listing_type = 'input' then
        -- Record Farm Expense
        insert into public.farm_financial_transactions (
          farm_id, type, category,
          amount_kobo, transaction_date, receipt_number,
          payment_method, description, recorded_by
        )
        values (
          v_buyer_farm_id, 'expense', 'fertilisers',
          v_item.subtotal_kobo, current_date, v_order.order_number,
          'escrow', 'Marketplace input purchase: ' || v_item.title,
          v_buyer.id
        );

        -- Update or add to Farm Inventory
        insert into public.farm_inventory (
          farm_id, item_name, category,
          quantity, unit, unit_cost_kobo
        )
        values (
          v_buyer_farm_id, v_item.title, 'fertiliser',
          v_item.quantity, case when v_item.unit in ('kg','liters','bags','units','tons','crates','bundles') then v_item.unit else 'units' end,
          (v_item.unit_price_kobo)::integer
        );
      end if;
    end loop;
  end if;

  return jsonb_build_object(
    'success', true,
    'fulfilment_id', p_fulfilment_id,
    'escrow_status', 'released',
    'payout_reference', v_payout_ref
  );
end;
$$;

------------------------------------------------------------------------------------------------
-- 8. Row Level Security (RLS)
------------------------------------------------------------------------------------------------

alter table public.marketplace_ledger_accounts enable row level security;
alter table public.marketplace_journal_entries enable row level security;
alter table public.marketplace_journal_postings enable row level security;
alter table public.marketplace_payments enable row level security;
alter table public.marketplace_escrows enable row level security;
alter table public.marketplace_settlements enable row level security;

-- Ledger: Admin/finance staff only
create policy "marketplace_ledger_accounts_read" on public.marketplace_ledger_accounts
  for select using (public.has_permission('ledger.read'));

create policy "marketplace_journal_entries_read" on public.marketplace_journal_entries
  for select using (public.has_permission('ledger.read'));

create policy "marketplace_journal_postings_read" on public.marketplace_journal_postings
  for select using (public.has_permission('ledger.read'));

-- Payments: Buyer, relevant seller, and admin
create policy "marketplace_payments_select" on public.marketplace_payments
  for select using (
    exists (
      select 1 from public.marketplace_orders o
      where o.id = order_id and (o.buyer_id = auth.uid() or public.is_admin())
    )
  );

-- Escrow: Buyer, seller, admin
create policy "marketplace_escrows_select" on public.marketplace_escrows
  for select using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.marketplace_sellers s
      where s.id = seller_id and s.profile_id = auth.uid()
    )
    or public.is_admin()
  );

-- Settlements: Seller, admin
create policy "marketplace_settlements_select" on public.marketplace_settlements
  for select using (
    exists (
      select 1 from public.marketplace_sellers s
      where s.id = seller_id and s.profile_id = auth.uid()
    )
    or public.is_admin()
  );

-- Money movement is server-side only: the payment webhook and the journal are callable by the
-- service role (Edge Functions) alone; buyers confirm delivery through release_fulfilment_escrow.
revoke all on function public.record_marketplace_journal_entry(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.process_payment_webhook(text, text, bigint, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.record_marketplace_journal_entry(text, text, text, jsonb) to service_role;
grant execute on function public.process_payment_webhook(text, text, bigint, uuid, jsonb) to service_role;
revoke all on function public.release_fulfilment_escrow(uuid) from public, anon;
grant execute on function public.release_fulfilment_escrow(uuid) to authenticated;
