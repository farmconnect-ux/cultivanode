-- CultivaNode: Fix marketplace order checkout fulfilment RLS and inventory lot initialisation

-- 1. Allow buyers to insert fulfilment records during checkout
drop policy if exists "marketplace_fulfilments_insert" on public.marketplace_fulfilments;
create policy "marketplace_fulfilments_insert" on public.marketplace_fulfilments
  for insert with check (
    exists (
      select 1 from public.marketplace_orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
    or public.is_admin()
  );

-- 2. Allow reading inventory lots so available stock can be inspected and reserved
drop policy if exists "marketplace_inv_lots_read" on public.marketplace_inventory_lots;
create policy "marketplace_inv_lots_read" on public.marketplace_inventory_lots
  for select using (true);

-- 3. Initialise default inventory lot for any active listing that does not currently have one
insert into public.marketplace_inventory_lots (listing_id, lot_number, physical_quantity, reserved_quantity, allocated_quantity, sold_quantity)
select
  l.id,
  'LOT-INIT-' || substr(l.id::text, 1, 8),
  coalesce(l.available_quantity, 100),
  0,
  0,
  0
from public.marketplace_listings l
where not exists (
  select 1 from public.marketplace_inventory_lots il where il.listing_id = l.id
)
on conflict do nothing;

-- 4. Grant webhook payment processing permissions
grant execute on function public.process_payment_webhook(text, text, bigint, uuid, jsonb) to anon, authenticated, service_role;
