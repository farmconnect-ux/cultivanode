-- Orders and fulfilments referenced each other in their SELECT policies, which Postgres rejects as infinite
-- recursion (42P17) the moment a query embeds one in the other. Ownership checks now go through two
-- security-definer helpers that read the base tables directly.
create or replace function private.order_buyer(p_order uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select o.buyer_id from public.marketplace_orders o where o.id = p_order;
$$;
create or replace function private.is_order_seller(p_order uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.marketplace_fulfilments f join public.marketplace_sellers s on s.id = f.seller_id
    where f.order_id = p_order and s.profile_id = (select auth.uid())
  ) or exists (
    select 1 from public.marketplace_order_items i join public.marketplace_sellers s on s.id = i.seller_id
    where i.order_id = p_order and s.profile_id = (select auth.uid())
  );
$$;
revoke all on function private.order_buyer(uuid), private.is_order_seller(uuid) from public, anon;
grant execute on function private.order_buyer(uuid), private.is_order_seller(uuid) to authenticated;

alter policy marketplace_orders_buyer_select on public.marketplace_orders
  using (buyer_id = (select auth.uid()) or private.is_order_seller(id) or (select public.is_admin()));
alter policy marketplace_fulfilments_select on public.marketplace_fulfilments
  using (private.order_buyer(order_id) = (select auth.uid())
         or exists (select 1 from public.marketplace_sellers s where s.id = seller_id and s.profile_id = (select auth.uid()))
         or (select public.is_admin()));
alter policy marketplace_fulfilments_buyer_insert on public.marketplace_fulfilments
  with check (private.order_buyer(order_id) = (select auth.uid()) or (select public.is_admin()));
alter policy marketplace_order_items_select on public.marketplace_order_items
  using (private.order_buyer(order_id) = (select auth.uid())
         or exists (select 1 from public.marketplace_sellers s where s.id = seller_id and s.profile_id = (select auth.uid()))
         or (select public.is_admin()));
alter policy marketplace_order_items_insert on public.marketplace_order_items
  with check (private.order_buyer(order_id) = (select auth.uid()));
alter policy marketplace_payments_select on public.marketplace_payments
  using (private.order_buyer(order_id) = (select auth.uid()) or (select public.is_admin()));
alter policy marketplace_shipments_select on public.marketplace_shipments
  using (carrier_profile_id = (select auth.uid()) or exists (
    select 1 from public.marketplace_fulfilments f join public.marketplace_sellers s on s.id = f.seller_id
    where f.id = fulfilment_id and (private.order_buyer(f.order_id) = (select auth.uid()) or s.profile_id = (select auth.uid()) or (select public.is_admin()))));
