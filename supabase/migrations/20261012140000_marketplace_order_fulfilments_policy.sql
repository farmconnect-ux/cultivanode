-- Buyers create fulfilment records for their own orders at checkout; anyone can read the stock lots of
-- active listings so the marketplace can show availability. (Payment webhooks stay service-role only.)
create policy marketplace_fulfilments_buyer_insert on public.marketplace_fulfilments
  for insert to authenticated with check (
    exists (select 1 from public.marketplace_orders o where o.id = order_id and o.buyer_id = (select auth.uid()))
    or (select public.is_admin())
  );
create policy marketplace_inv_lots_public_read on public.marketplace_inventory_lots
  for select to anon, authenticated using (
    exists (select 1 from public.marketplace_listings l where l.id = listing_id and l.status = 'active')
  );
