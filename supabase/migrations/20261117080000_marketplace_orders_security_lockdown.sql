-- Batch 01: Marketplace financial security lockdown, duplicate-settlement protection & IoT device_commands hardening.
--
-- 1. Lock down direct table writes on marketplace_orders, marketplace_order_items, and
--    marketplace_fulfilments. All order creation and state transitions must go through
--    validated SECURITY DEFINER RPCs or service_role.
--
-- 2. Enforce single-settlement-per-order in process_payment_webhook() and via partial unique
--    indexes on marketplace_payments, marketplace_escrows, and marketplace_journal_entries.
--
-- 3. Explicitly revoke anon/authenticated privileges on public.device_commands (RLS-enabled
--    table intentionally reserved for service_role until physical actuator failsafes exist).

-- ----------------------------------------------------------------------------------------------
-- 1. Revoke direct write permissions & drop permissive direct-write policies
-- ----------------------------------------------------------------------------------------------
revoke insert, update, delete on public.marketplace_orders from anon, authenticated;
revoke insert, update, delete on public.marketplace_order_items from anon, authenticated;
revoke insert, update, delete on public.marketplace_fulfilments from anon, authenticated;

drop policy if exists marketplace_orders_buyer_insert on public.marketplace_orders;
drop policy if exists marketplace_orders_update_admin_or_buyer on public.marketplace_orders;
drop policy if exists marketplace_order_items_insert on public.marketplace_order_items;
drop policy if exists marketplace_fulfilments_buyer_insert on public.marketplace_fulfilments;
drop policy if exists marketplace_fulfilments_seller_update on public.marketplace_fulfilments;

-- ----------------------------------------------------------------------------------------------
-- 2. Database-level duplicate settlement protection
-- ----------------------------------------------------------------------------------------------
-- Only one successful payment per order (failed/pending retries remain allowed)
create unique index if not exists mkt_payments_one_successful_per_order_idx
  on public.marketplace_payments (order_id)
  where status = 'successful';

-- Only one escrow record per fulfilment
create unique index if not exists mkt_escrows_one_per_fulfilment_idx
  on public.marketplace_escrows (fulfilment_id)
  where fulfilment_id is not null;

-- Only one order_payment journal entry per order
create unique index if not exists mkt_journal_one_order_payment_idx
  on public.marketplace_journal_entries (reference_id)
  where reference_type = 'order_payment';

-- Serialize order lock BEFORE payment lookup so concurrent webhooks cannot race, and reject
-- any second distinct payment reference once an order is already settled or cancelled.
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
  -- 1. Lock the order row first to serialize concurrent webhook deliveries for the same order
  select * into v_order
    from public.marketplace_orders
   where id = p_order_id
     for update;

  if not found then
    raise exception 'Order % not found.', p_order_id;
  end if;

  -- 2. Idempotency check by payment reference (safe under the order lock)
  select * into v_payment
    from public.marketplace_payments
   where payment_reference = p_reference;

  if found then
    if v_payment.order_id <> p_order_id then
      raise exception 'PAYMENT_REFERENCE_ORDER_MISMATCH: Reference % belongs to another order', p_reference;
    end if;
    if v_payment.status = 'successful' then
      return jsonb_build_object('success', true, 'already_processed', true, 'order_id', p_order_id);
    end if;
  end if;

  -- 3. Reject duplicate settlement from a different reference or on an already-settled/cancelled order
  if v_order.payment_status in ('paid', 'escrowed', 'released', 'refunded')
     or v_order.status in ('paid', 'processing', 'fulfilled', 'delivered', 'completed', 'refunded', 'cancelled')
     or exists (
       select 1 from public.marketplace_payments
        where order_id = p_order_id and status = 'successful'
     )
  then
    raise exception 'ORDER_ALREADY_SETTLED: Order % cannot be settled again (status=%, payment_status=%)',
      p_order_id, v_order.status, v_order.payment_status;
  end if;

  -- 4. Verify amount
  if p_amount_kobo <> v_order.total_amount_kobo then
    raise exception 'PAYMENT_AMOUNT_MISMATCH: Expected % kobo, received % kobo',
      v_order.total_amount_kobo, p_amount_kobo;
  end if;

  -- 5. Record or update payment record (preserves prior failed/pending history for other refs)
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

  -- 6. Update Order Status
  update public.marketplace_orders
     set status = 'paid',
         payment_status = 'escrowed',
         paid_at = now(),
         updated_at = now()
   where id = p_order_id;

  -- 7. Finalize inventory from reserved to sold
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

  -- 8. Create Escrow records for each Fulfilment
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

  -- 9. Record Double-Entry Ledger Entry
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

revoke all on function public.process_payment_webhook(text, text, bigint, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.process_payment_webhook(text, text, bigint, uuid, jsonb) to service_role;

-- ----------------------------------------------------------------------------------------------
-- 3. Task 5: Explicit deny-all posture for device_commands (service_role only)
-- ----------------------------------------------------------------------------------------------
revoke all on public.device_commands from anon, authenticated;
comment on table public.device_commands is
  'Actuator commands (pump/valve control). Intentionally service_role-only (no anon/authenticated policies or grants) until physical failsafes are implemented.';
