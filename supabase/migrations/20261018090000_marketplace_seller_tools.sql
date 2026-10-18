-- Seller tools for farmers and providers: manage listings and fulfil orders safely. Applied on hosted 18 Oct 2026.
--
-- Before this, a seller could (through the API) mark their own shop verified, set their own commission and rating,
-- un-suspend a listing staff suspended, and set any order status (including the buyer's "accepted"). Stock reserved
-- by an order was also never released or deducted, so delivered goods stayed "reserved" forever.

-- 1. Seller profile: trust fields are staff-only. Writes made by app users (role authenticated) keep them as they were;
--    server code and SECURITY DEFINER functions (rating aggregate, staff tools) run as another role and are unaffected.
create or replace function private.guard_marketplace_seller()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.verification_status := 'pending';
    new.rating_avg := 0;
    new.rating_count := 0;
    new.commission_rate_bps := null;
    new.is_suspended := false;
    new.suspension_reason := null;
    new.is_demo := false;
  else
    new.profile_id := old.profile_id;
    new.verification_status := old.verification_status;
    new.rating_avg := old.rating_avg;
    new.rating_count := old.rating_count;
    new.commission_rate_bps := old.commission_rate_bps;
    new.is_suspended := old.is_suspended;
    new.suspension_reason := old.suspension_reason;
    new.is_demo := old.is_demo;
  end if;
  return new;
end $$;
revoke execute on function private.guard_marketplace_seller() from public, anon, authenticated;
drop trigger if exists marketplace_sellers_guard on public.marketplace_sellers;
create trigger marketplace_sellers_guard before insert or update on public.marketplace_sellers
  for each row execute function private.guard_marketplace_seller();

-- 2. Listings: sellers can't move a listing to another shop, lift or apply a staff suspension, or type in the
--    available quantity (it is derived from the inventory lots).
create or replace function private.guard_marketplace_listing()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  -- Photos: only files the seller uploaded to their own folder in the listing-photos bucket, at most 8.
  if coalesce(cardinality(new.images), 0) > 8 then
    raise exception 'A listing can have at most 8 photos.' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(coalesce(new.images, '{}')) u
             where u not like '%/storage/v1/object/public/listing-photos/' || auth.uid()::text || '/%'
               and (tg_op = 'INSERT' or not (u = any (coalesce(old.images, '{}'))))) then
    raise exception 'Listing photos must be uploaded through CultivaNode.' using errcode = '22023';
  end if;
  if tg_op = 'INSERT' then
    if new.status = 'suspended' then new.status := 'paused'; end if;
    return new;
  end if;
  new.seller_id := old.seller_id;
  new.available_quantity := old.available_quantity;
  if old.status = 'suspended' then
    new.status := 'suspended';
  elsif new.status = 'suspended' then
    raise exception 'Only CultivaNode staff can suspend a listing.' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function private.guard_marketplace_listing() from public, anon, authenticated;
drop trigger if exists marketplace_listings_guard on public.marketplace_listings;
create trigger marketplace_listings_guard before insert or update on public.marketplace_listings
  for each row execute function private.guard_marketplace_listing();

-- 3. Orders are moved along only through seller_update_fulfilment (below); no direct status edits by app users.
revoke update on public.marketplace_fulfilments from authenticated, anon;

-- Moves this seller's reservation for one order out of stock (goods handed over) or back to available (rejected).
create or replace function private.settle_fulfilment_stock(p_order uuid, p_seller uuid, p_ship boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_item record; v_lot record; v_left numeric; v_take numeric;
begin
  for v_item in
    select listing_id, quantity from public.marketplace_order_items where order_id = p_order and seller_id = p_seller
  loop
    v_left := v_item.quantity;
    for v_lot in
      select id, reserved_quantity from public.marketplace_inventory_lots
       where listing_id = v_item.listing_id and reserved_quantity > 0 order by created_at for update
    loop
      exit when v_left <= 0;
      v_take := least(v_left, v_lot.reserved_quantity);
      update public.marketplace_inventory_lots
         set reserved_quantity = reserved_quantity - v_take,
             physical_quantity = physical_quantity - case when p_ship then v_take else 0 end,
             sold_quantity = sold_quantity + case when p_ship then v_take else 0 end,
             updated_at = now()
       where id = v_lot.id;
      v_left := v_left - v_take;
    end loop;
  end loop;
end $$;
revoke execute on function private.settle_fulfilment_stock(uuid, uuid, boolean) from public, anon, authenticated;

-- The seller's order workflow: confirm → preparing → ready for pickup / dispatched → in transit → delivered,
-- or reject before anything leaves. Goods leave only after the buyer has paid. The buyer then confirms receipt
-- (release_fulfilment_escrow), which is what releases the money.
create or replace function public.seller_update_fulfilment(p_fulfilment uuid, p_status text, p_note text default null, p_tracking text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  f record; o record; v_allowed text[]; v_rollup text;
begin
  select fu.*, s.profile_id as seller_profile into f
    from public.marketplace_fulfilments fu join public.marketplace_sellers s on s.id = fu.seller_id
   where fu.id = p_fulfilment for update of fu;
  if not found then raise exception 'Order not found.' using errcode = 'P0002'; end if;
  if f.seller_profile is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Only the seller can update this order.' using errcode = '42501';
  end if;
  select * into o from public.marketplace_orders where id = f.order_id for update;

  v_allowed := case f.status
    when 'placed' then array['confirmed', 'rejected']
    when 'confirmed' then array['preparing', 'ready_for_pickup', 'dispatched', 'rejected']
    when 'preparing' then array['ready_for_pickup', 'dispatched', 'rejected']
    when 'ready_for_pickup' then array['delivered']
    when 'dispatched' then array['in_transit', 'delivered']
    when 'in_transit' then array['delivered']
    else array[]::text[] end;
  if not (p_status = any (v_allowed)) then
    raise exception 'This order can''t go from % to %.', f.status, p_status using errcode = '22023';
  end if;
  if p_status in ('ready_for_pickup', 'dispatched', 'in_transit', 'delivered') and o.payment_status not in ('paid', 'escrowed', 'released') then
    raise exception 'Wait for the buyer''s payment before handing over the goods.' using errcode = 'P0001';
  end if;
  if p_status = 'rejected' and coalesce(btrim(p_note), '') = '' then
    raise exception 'Tell the buyer why you can''t fulfil this order.' using errcode = '22023';
  end if;

  -- Stock: handed over → deducted; rejected → back on sale.
  if p_status in ('ready_for_pickup', 'dispatched') then
    perform private.settle_fulfilment_stock(f.order_id, f.seller_id, true);
  elsif p_status = 'rejected' then
    perform private.settle_fulfilment_stock(f.order_id, f.seller_id, false);
  end if;

  update public.marketplace_fulfilments
     set status = p_status,
         notes = case when coalesce(btrim(p_note), '') = '' then notes else left(concat_ws(E'\n', notes, to_char(now(), 'YYYY-MM-DD') || ': ' || btrim(p_note)), 1000) end,
         tracking_number = coalesce(nullif(btrim(p_tracking), ''), tracking_number),
         updated_at = now()
   where id = p_fulfilment;

  -- Order status follows its fulfilments (unless staff or a dispute already took it elsewhere).
  if o.status not in ('completed', 'cancelled', 'disputed', 'refunded') then
    select case
      when bool_and(status in ('rejected', 'cancelled')) then 'cancelled'
      when bool_and(status in ('delivered', 'accepted', 'rejected', 'cancelled')) then 'delivered'
      when bool_and(status in ('dispatched', 'in_transit', 'ready_for_pickup', 'delivered', 'accepted', 'rejected', 'cancelled')) then 'fulfilled'
      when bool_or(status in ('dispatched', 'in_transit', 'ready_for_pickup', 'delivered', 'accepted')) then 'partially_fulfilled'
      when bool_or(status in ('confirmed', 'preparing')) then 'processing'
      else o.status end
      into v_rollup
      from public.marketplace_fulfilments where order_id = f.order_id;
    if v_rollup is distinct from o.status and not (v_rollup = 'processing' and o.status in ('placed', 'payment_pending') and o.payment_status = 'pending') then
      update public.marketplace_orders set status = v_rollup, updated_at = now() where id = o.id;
    end if;
  end if;

  -- Tell the buyer.
  insert into public.notifications (profile_id, kind, data)
  values (o.buyer_id, 'marketplace_order_' || p_status,
          jsonb_build_object('order_id', o.id, 'order_number', o.order_number, 'fulfilment_number', f.fulfilment_number,
                             'status', p_status, 'note', nullif(btrim(p_note), ''), 'tracking', nullif(btrim(p_tracking), '')));

  return jsonb_build_object('fulfilment_id', p_fulfilment, 'status', p_status, 'order_status', coalesce(v_rollup, o.status));
end $$;
revoke execute on function public.seller_update_fulfilment(uuid, text, text, text) from public, anon;
grant execute on function public.seller_update_fulfilment(uuid, text, text, text) to authenticated;

-- 4. Listing photos: a public bucket; sellers write only inside a folder named after their user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists "listing photos: sellers upload to their own folder" on storage.objects;
create policy "listing photos: sellers upload to their own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "listing photos: sellers delete their own" on storage.objects;
create policy "listing photos: sellers delete their own" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Storage needs SELECT as well as DELETE to remove a file; sellers see only their own folder.
drop policy if exists "listing photos: sellers see their own" on storage.objects;
create policy "listing photos: sellers see their own" on storage.objects for select to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
