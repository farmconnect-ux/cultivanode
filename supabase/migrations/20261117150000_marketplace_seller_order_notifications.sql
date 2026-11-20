-- Create one durable seller notification per seller fulfilment, atomically with checkout.
create or replace function private.notify_marketplace_seller_new_order()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_buyer_id uuid;
  v_buyer_name text;
  v_order_number text;
  v_seller_profile uuid;
  v_item_summary text;
begin
  select o.buyer_id, p.full_name, o.order_number into v_buyer_id, v_buyer_name, v_order_number
    from public.marketplace_orders o left join public.profiles p on p.id = o.buyer_id where o.id = new.order_id;
  select s.profile_id into v_seller_profile from public.marketplace_sellers s where s.id = new.seller_id;
  if v_seller_profile is null or v_seller_profile = v_buyer_id then return new; end if;
  select string_agg(format('%s %s × %s', i.quantity, i.unit, i.title), ', ' order by i.title)
    into v_item_summary from public.marketplace_order_items i where i.order_id = new.order_id and i.seller_id = new.seller_id;
  insert into public.notifications (profile_id, kind, data)
  values (v_seller_profile, 'marketplace_order_placed',
    jsonb_build_object('order_id',new.order_id,'order_number',v_order_number,'fulfilment_id',new.id,
      'fulfilment_number',new.fulfilment_number,'buyer_id',v_buyer_id,
      'name',coalesce(nullif(btrim(v_buyer_name),''),'A CultivaNode buyer'),
      'item_summary',coalesce(v_item_summary,'New marketplace items'),'status',new.status,'action','review_order'));
  return new;
end;
$$;
revoke all on function private.notify_marketplace_seller_new_order() from public, anon, authenticated;
drop trigger if exists marketplace_fulfilment_seller_order_notification on public.marketplace_fulfilments;
create trigger marketplace_fulfilment_seller_order_notification after insert on public.marketplace_fulfilments
for each row execute function private.notify_marketplace_seller_new_order();
