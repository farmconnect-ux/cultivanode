-- CultivaNode Marketplace Module: Migration 2 of 4
-- Orders, Order Items, Multi-Seller Fulfilments & Atomic Concurrency-Safe Inventory Reservation

------------------------------------------------------------------------------------------------
-- 1. Orders
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_orders (
  id                      uuid primary key default gen_random_uuid(),
  order_number            text not null unique check (char_length(order_number) between 6 and 40),
  buyer_id                uuid not null references public.profiles (id) on delete cascade,
  buyer_org_id            uuid references public.organizations (id) on delete set null,
  order_type              text not null default 'retail' check (order_type in ('retail', 'business', 'bulk', 'rfq_contract', 'service_booking')),
  currency                text not null default 'NGN',
  items_subtotal_kobo     bigint not null check (items_subtotal_kobo >= 0),
  delivery_fee_kobo       bigint not null default 0 check (delivery_fee_kobo >= 0),
  platform_fee_kobo       bigint not null default 0 check (platform_fee_kobo >= 0),
  total_amount_kobo       bigint not null check (total_amount_kobo >= 0),
  status                  text not null default 'draft' check (status in ('draft', 'placed', 'payment_pending', 'paid', 'processing', 'partially_fulfilled', 'fulfilled', 'delivered', 'completed', 'cancelled', 'disputed', 'refunded')),
  payment_status          text not null default 'pending' check (payment_status in ('pending', 'paid', 'escrowed', 'released', 'refunded', 'failed')),
  delivery_address        jsonb not null default '{}'::jsonb,
  buyer_notes             text check (buyer_notes is null or char_length(buyer_notes) <= 1000),
  idempotency_key         text unique check (idempotency_key is null or char_length(idempotency_key) <= 100),
  placed_at               timestamptz,
  paid_at                 timestamptz,
  completed_at            timestamptz,
  cancelled_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists mkt_orders_buyer_idx on public.marketplace_orders (buyer_id);
create index if not exists mkt_orders_status_idx on public.marketplace_orders (status, payment_status);

------------------------------------------------------------------------------------------------
-- 2. Order Items
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_order_items (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.marketplace_orders (id) on delete cascade,
  listing_id              uuid not null references public.marketplace_listings (id) on delete restrict,
  seller_id               uuid not null references public.marketplace_sellers (id) on delete restrict,
  title                   text not null check (char_length(title) between 2 and 140),
  unit                    text not null check (unit in ('kg', 'g', 'tonne', 'bag', 'crate', 'basket', 'piece', 'litre', 'hectare', 'hour', 'day', 'job')),
  quantity                numeric(12, 2) not null check (quantity > 0),
  unit_price_kobo         bigint not null check (unit_price_kobo >= 0),
  subtotal_kobo           bigint not null check (subtotal_kobo >= 0),
  commission_bps          integer not null default 500 check (commission_bps between 0 and 5000),
  commission_kobo         bigint not null default 0 check (commission_kobo >= 0),
  seller_earnings_kobo    bigint not null check (seller_earnings_kobo >= 0),
  snapshot_data           jsonb not null default '{}'::jsonb,
  created_at              timestamptz not null default now()
);

create index if not exists mkt_order_items_order_idx on public.marketplace_order_items (order_id);
create index if not exists mkt_order_items_seller_idx on public.marketplace_order_items (seller_id);
create index if not exists mkt_order_items_listing_idx on public.marketplace_order_items (listing_id);

------------------------------------------------------------------------------------------------
-- 3. Multi-Seller Fulfilments
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_fulfilments (
  id                      uuid primary key default gen_random_uuid(),
  fulfilment_number       text not null unique check (char_length(fulfilment_number) between 6 and 40),
  order_id                uuid not null references public.marketplace_orders (id) on delete cascade,
  seller_id               uuid not null references public.marketplace_sellers (id) on delete restrict,
  status                  text not null default 'placed' check (status in ('placed', 'confirmed', 'preparing', 'ready_for_pickup', 'dispatched', 'in_transit', 'delivered', 'accepted', 'rejected', 'cancelled', 'disputed')),
  subtotal_kobo           bigint not null check (subtotal_kobo >= 0),
  delivery_fee_kobo       bigint not null default 0 check (delivery_fee_kobo >= 0),
  delivery_method         text not null default 'pickup' check (delivery_method in ('pickup', 'seller_delivery', 'platform_logistics', 'buyer_arranged')),
  tracking_number         text check (tracking_number is null or char_length(tracking_number) <= 80),
  dispatched_at           timestamptz,
  delivered_at            timestamptz,
  confirmed_at            timestamptz,
  notes                   text check (notes is null or char_length(notes) <= 1000),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists mkt_fulfilments_order_idx on public.marketplace_fulfilments (order_id);
create index if not exists mkt_fulfilments_seller_idx on public.marketplace_fulfilments (seller_id);
create index if not exists mkt_fulfilments_status_idx on public.marketplace_fulfilments (status);

------------------------------------------------------------------------------------------------
-- 4. Atomic Concurrency-Safe Inventory Reservation Function
------------------------------------------------------------------------------------------------

create or replace function public.reserve_inventory_for_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_item record;
  v_lot record;
  v_qty_needed numeric(12, 2);
  v_qty_to_reserve numeric(12, 2);
  v_avail_in_lot numeric(12, 2);
begin
  -- 1. Lock and fetch the order
  select * into v_order
    from public.marketplace_orders
   where id = p_order_id
     for update;

  if not found then
    raise exception 'Order with ID % not found.', p_order_id;
  end if;

  if v_order.status not in ('draft', 'placed') then
    raise exception 'Order % is in status % and cannot reserve inventory.', v_order.order_number, v_order.status;
  end if;

  -- 2. Loop over order items and atomically reserve inventory from lots
  for v_item in
    select id, listing_id, title, quantity
      from public.marketplace_order_items
     where order_id = p_order_id
  loop
    v_qty_needed := v_item.quantity;

    -- Iterate over active lots for this listing with row locking (FIFO or by availability)
    for v_lot in
      select id, physical_quantity, reserved_quantity, allocated_quantity,
             (physical_quantity - reserved_quantity - allocated_quantity) as available_qty
        from public.marketplace_inventory_lots
       where listing_id = v_item.listing_id
         and (physical_quantity - reserved_quantity - allocated_quantity) > 0
       order by created_at asc
         for update
    loop
      if v_qty_needed <= 0 then
        exit;
      end if;

      v_avail_in_lot := v_lot.available_qty;
      v_qty_to_reserve := least(v_qty_needed, v_avail_in_lot);

      update public.marketplace_inventory_lots
         set reserved_quantity = reserved_quantity + v_qty_to_reserve,
             updated_at = now()
       where id = v_lot.id;

      v_qty_needed := v_qty_needed - v_qty_to_reserve;
    end loop;

    -- If we still need quantity after inspecting all available lots, raise stock error
    if v_qty_needed > 0 then
      raise exception 'INSUFFICIENT_STOCK: Item "%" requires % more units than available in current inventory.',
        v_item.title, v_qty_needed;
    end if;
  end loop;

  -- 3. Transition order status to payment_pending
  update public.marketplace_orders
     set status = 'payment_pending',
         placed_at = coalesce(placed_at, now()),
         updated_at = now()
   where id = p_order_id;

  return jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'status', 'payment_pending'
  );
end;
$$;

------------------------------------------------------------------------------------------------
-- 5. Release Reserved Inventory (e.g. on order cancellation / payment timeout)
------------------------------------------------------------------------------------------------

create or replace function public.release_order_inventory(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item record;
  v_lot record;
  v_qty_to_release numeric(12, 2);
  v_released_from_lot numeric(12, 2);
begin
  for v_item in
    select id, listing_id, quantity
      from public.marketplace_order_items
     where order_id = p_order_id
  loop
    v_qty_to_release := v_item.quantity;

    for v_lot in
      select id, reserved_quantity
        from public.marketplace_inventory_lots
       where listing_id = v_item.listing_id
         and reserved_quantity > 0
       order by created_at desc
         for update
    loop
      if v_qty_to_release <= 0 then
        exit;
      end if;

      v_released_from_lot := least(v_qty_to_release, v_lot.reserved_quantity);

      update public.marketplace_inventory_lots
         set reserved_quantity = reserved_quantity - v_released_from_lot,
             updated_at = now()
       where id = v_lot.id;

      v_qty_to_release := v_qty_to_release - v_released_from_lot;
    end loop;
  end loop;

  update public.marketplace_orders
     set status = 'cancelled',
         cancelled_at = now(),
         updated_at = now()
   where id = p_order_id;

  return jsonb_build_object('success', true, 'order_id', p_order_id, 'status', 'cancelled');
end;
$$;

------------------------------------------------------------------------------------------------
-- 6. Row Level Security (RLS)
------------------------------------------------------------------------------------------------

alter table public.marketplace_orders enable row level security;
alter table public.marketplace_order_items enable row level security;
alter table public.marketplace_fulfilments enable row level security;

-- Orders
create policy "marketplace_orders_buyer_select" on public.marketplace_orders
  for select using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.marketplace_fulfilments f
      join public.marketplace_sellers s on s.id = f.seller_id
      where f.order_id = public.marketplace_orders.id and s.profile_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "marketplace_orders_buyer_insert" on public.marketplace_orders
  for insert with check (buyer_id = auth.uid());

create policy "marketplace_orders_update_admin_or_buyer" on public.marketplace_orders
  for update using (buyer_id = auth.uid() or public.is_admin())
  with check (buyer_id = auth.uid() or public.is_admin());

-- Order Items
create policy "marketplace_order_items_select" on public.marketplace_order_items
  for select using (
    exists (
      select 1 from public.marketplace_orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
    or exists (
      select 1 from public.marketplace_sellers s
      where s.id = seller_id and s.profile_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "marketplace_order_items_insert" on public.marketplace_order_items
  for insert with check (
    exists (
      select 1 from public.marketplace_orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

-- Fulfilments
create policy "marketplace_fulfilments_select" on public.marketplace_fulfilments
  for select using (
    exists (
      select 1 from public.marketplace_orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
    or exists (
      select 1 from public.marketplace_sellers s
      where s.id = seller_id and s.profile_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "marketplace_fulfilments_seller_update" on public.marketplace_fulfilments
  for update using (
    exists (
      select 1 from public.marketplace_sellers s
      where s.id = seller_id and (s.profile_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.marketplace_sellers s
      where s.id = seller_id and (s.profile_id = auth.uid() or public.is_admin())
    )
  );
