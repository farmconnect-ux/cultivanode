-- Complete the marketplace fulfilment lifecycle with durable timestamps and parent-order completion.
create or replace function public.seller_update_fulfilment(p_fulfilment uuid, p_status text, p_note text default null, p_tracking text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  f record; o record; v_allowed text[]; v_rollup text; v_tracking text;
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
  if p_status in ('ready_for_pickup', 'dispatched', 'in_transit', 'delivered')
     and o.payment_status not in ('paid', 'escrowed', 'released')
     and coalesce(f.direct_payment_status, '') <> 'confirmed' then
    raise exception 'Wait for the buyer''s payment before handing over the goods.' using errcode = 'P0001';
  end if;
  if p_status = 'rejected' and coalesce(btrim(p_note), '') = '' then
    raise exception 'Tell the buyer why you can''t fulfil this order.' using errcode = '22023';
  end if;
  if p_status = 'dispatched' and f.delivery_method <> 'pickup'
     and coalesce(btrim(p_tracking), '') = '' and coalesce(btrim(f.tracking_number), '') = '' then
    raise exception 'Add a tracking number, vehicle registration or delivery contact before dispatch.' using errcode = '22023';
  end if;
  if p_status in ('ready_for_pickup', 'dispatched') then
    perform private.settle_fulfilment_stock(f.order_id, f.seller_id, true);
  elsif p_status = 'rejected' then
    perform private.settle_fulfilment_stock(f.order_id, f.seller_id, false);
  end if;
  v_tracking := coalesce(nullif(btrim(p_tracking), ''), f.tracking_number);
  update public.marketplace_fulfilments
     set status = p_status,
         notes = case when coalesce(btrim(p_note), '') = '' then notes else left(concat_ws(E'\n', notes, to_char(now(), 'YYYY-MM-DD') || ': ' || btrim(p_note)), 1000) end,
         tracking_number = v_tracking,
         dispatched_at = case when p_status = 'dispatched' then coalesce(dispatched_at, now()) else dispatched_at end,
         delivered_at = case when p_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end,
         updated_at = now()
   where id = p_fulfilment;
  if o.status not in ('completed', 'cancelled', 'disputed', 'refunded') then
    select case
      when bool_and(status in ('rejected', 'cancelled')) then 'cancelled'
      when bool_and(status in ('delivered', 'accepted', 'rejected', 'cancelled')) then 'delivered'
      when bool_and(status in ('dispatched', 'in_transit', 'ready_for_pickup', 'delivered', 'accepted', 'rejected', 'cancelled')) then 'fulfilled'
      when bool_or(status in ('dispatched', 'in_transit', 'ready_for_pickup', 'delivered', 'accepted')) then 'partially_fulfilled'
      when bool_or(status in ('confirmed', 'preparing')) then 'processing'
      else o.status end
      into v_rollup from public.marketplace_fulfilments where order_id = f.order_id;
    if v_rollup is distinct from o.status and not (v_rollup = 'processing' and o.status in ('placed', 'payment_pending') and o.payment_status = 'pending') then
      update public.marketplace_orders set status = v_rollup, updated_at = now() where id = o.id;
    end if;
  end if;
  insert into public.notifications (profile_id, kind, data)
  values (o.buyer_id, 'marketplace_order_' || p_status,
    jsonb_build_object('order_id', o.id, 'order_number', o.order_number, 'fulfilment_number', f.fulfilment_number,
      'status', p_status, 'note', nullif(btrim(p_note), ''), 'tracking', v_tracking));
  return jsonb_build_object('fulfilment_id', p_fulfilment, 'status', p_status, 'order_status', coalesce(v_rollup, o.status));
end $$;
revoke execute on function public.seller_update_fulfilment(uuid, text, text, text) from public, anon;
grant execute on function public.seller_update_fulfilment(uuid, text, text, text) to authenticated;

-- Direct payment completion: only complete an order after every seller fulfilment is confirmed by its buyer.
create or replace function public.buyer_confirm_direct_delivery(p_fulfilment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_order uuid;
begin
  select f.order_id into v_order
    from public.marketplace_fulfilments f
    join public.marketplace_orders o on o.id = f.order_id
   where f.id = p_fulfilment_id and o.buyer_id = auth.uid()
     and o.payment_mode = 'direct' and f.direct_payment_status = 'confirmed'
     and f.status in ('ready_for_pickup', 'dispatched', 'in_transit', 'delivered')
   for update of f;
  if not found then
    raise exception 'You can confirm delivery once the seller has confirmed your payment and sent the goods.' using errcode = 'P0001';
  end if;
  update public.marketplace_fulfilments
     set status = 'accepted', confirmed_at = coalesce(confirmed_at, now()), updated_at = now()
   where id = p_fulfilment_id;
  if not exists (select 1 from public.marketplace_fulfilments where order_id = v_order and (confirmed_at is null or status not in ('accepted','delivered'))) then
    update public.marketplace_orders set status = 'completed', completed_at = coalesce(completed_at, now()), updated_at = now() where id = v_order and status not in ('cancelled','disputed','refunded');
  end if;
end $$;
revoke execute on function public.buyer_confirm_direct_delivery(uuid) from public, anon;
grant execute on function public.buyer_confirm_direct_delivery(uuid) to authenticated;

-- Escrow confirmation also records buyer receipt; complete the parent order only after all seller parts are confirmed.
create or replace function private.complete_marketplace_order_after_receipt()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.confirmed_at is not null and (old.confirmed_at is null or new.status is distinct from old.status) then
    if not exists (
      select 1 from public.marketplace_fulfilments f
       where f.order_id = new.order_id
         and (f.confirmed_at is null or f.status not in ('accepted','delivered'))
    ) then
      update public.marketplace_orders
         set status = 'completed', completed_at = coalesce(completed_at, now()), updated_at = now()
       where id = new.order_id and status not in ('cancelled','disputed','refunded');
    end if;
  end if;
  return new;
end $$;
revoke all on function private.complete_marketplace_order_after_receipt() from public, anon, authenticated;
drop trigger if exists marketplace_complete_order_after_receipt on public.marketplace_fulfilments;
create trigger marketplace_complete_order_after_receipt
after update of status, confirmed_at on public.marketplace_fulfilments
for each row execute function private.complete_marketplace_order_after_receipt();
