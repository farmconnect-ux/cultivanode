-- Placing a marketplace order from the mobile app.
--
-- The website prices a cart on the server before it writes the order. The app has no server of its own,
-- so this function does the same inside the database: prices, units, sellers and stock come from the
-- listings, never from the phone. It writes the order, its lines and one fulfilment per seller, reserves
-- the stock, and returns the order id.
--
-- Payment follows the admin switch: with escrow_payments off the order is "direct" (the buyer pays each
-- seller's bank account and the seller confirms), and every seller must have added that account.
-- Errors carry a stable code in HINT for the app to translate.

create or replace function public.place_marketplace_order(
  p_lines   jsonb,
  p_address jsonb,
  p_notes   text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_escrow    boolean := public.feature_on('escrow_payments');
  v_line      jsonb;
  v_listing   record;
  v_qty       numeric(12, 2);
  v_avail     numeric;
  v_has_lots  boolean;
  v_subtotal  bigint := 0;
  v_sellers   uuid[] := '{}';
  v_order     uuid;
  v_number    text;
  v_line_sub  bigint;
  v_i         integer := 0;
  v_seller    uuid;
  v_address   text := left(trim(coalesce(p_address ->> 'line', '')), 200);
  v_state     text := left(trim(coalesce(p_address ->> 'state', '')), 60);
  v_lga       text := left(trim(coalesce(p_address ->> 'lga', '')), 60);
  v_phone     text := left(regexp_replace(coalesce(p_address ->> 'phone', ''), '[^0-9+]', '', 'g'), 20);
  c_delivery  constant bigint := 300000;  -- ₦3,000 per seller, the same flat fee as the website
  c_bps       constant integer := 500;    -- 5% from the seller's side
begin
  if v_uid is null then
    raise exception 'Sign in first.' using errcode = '42501', hint = 'not_signed_in';
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 or jsonb_array_length(p_lines) > 30 then
    raise exception 'Your order is empty.' using errcode = 'P0001', hint = 'empty';
  end if;
  if char_length(v_address) < 5 or v_state = '' or char_length(v_phone) < 10 then
    raise exception 'Enter a delivery address, state and phone number.' using errcode = 'P0001', hint = 'bad_address';
  end if;

  create temporary table if not exists pg_temp.order_lines (
    listing_id uuid, seller_id uuid, title text, unit text, qty numeric(12, 2), price bigint
  ) on commit drop;
  delete from pg_temp.order_lines;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_qty := round(coalesce((v_line ->> 'quantity')::numeric, 0), 2);
    select l.id, l.seller_id, l.title, l.unit, l.base_price_kobo, l.min_order_quantity, l.status, s.profile_id
      into v_listing
      from public.marketplace_listings l
      join public.marketplace_sellers s on s.id = l.seller_id
     where l.id = (v_line ->> 'listing_id')::uuid and not coalesce(s.is_suspended, false);
    if not found or v_listing.status <> 'active' then
      raise exception 'This item is no longer on sale.' using errcode = 'P0001', hint = 'listing_unavailable';
    end if;
    if v_listing.profile_id = v_uid then
      raise exception 'You can''t buy your own listing.' using errcode = 'P0001', hint = 'own_listing';
    end if;
    if v_qty <= 0 or v_qty < coalesce(v_listing.min_order_quantity, 1) then
      raise exception 'Minimum order is % %.', coalesce(v_listing.min_order_quantity, 1), v_listing.unit using errcode = 'P0001', hint = 'min_order';
    end if;
    select count(*) > 0, coalesce(sum(physical_quantity - reserved_quantity - allocated_quantity), 0)
      into v_has_lots, v_avail
      from public.marketplace_inventory_lots where listing_id = v_listing.id;
    if v_has_lots and v_qty > v_avail then
      raise exception 'Only % % available.', v_avail, v_listing.unit using errcode = 'P0001', hint = 'not_enough';
    end if;
    insert into pg_temp.order_lines values (v_listing.id, v_listing.seller_id, v_listing.title, v_listing.unit, v_qty, v_listing.base_price_kobo);
    if not (v_listing.seller_id = any (v_sellers)) then
      v_sellers := v_sellers || v_listing.seller_id;
    end if;
  end loop;

  if not v_escrow and exists (
    select 1 from unnest(v_sellers) sid
     where not exists (select 1 from public.marketplace_seller_payout_accounts a where a.seller_id = sid)
  ) then
    raise exception 'A seller hasn''t added the bank account buyers pay into yet.' using errcode = 'P0001', hint = 'no_payout_account';
  end if;

  select coalesce(sum(round(price * qty)), 0)::bigint into v_subtotal from pg_temp.order_lines;
  v_number := 'ORD-' || to_char(now(), 'YYYY-MM') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.marketplace_orders (
    order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo, platform_fee_kobo, total_amount_kobo,
    status, payment_status, payment_mode, delivery_address, buyer_notes, placed_at)
  values (
    v_number, v_uid, case when v_subtotal >= 50000000 then 'bulk' else 'retail' end, v_subtotal,
    c_delivery * array_length(v_sellers, 1), 0, v_subtotal + c_delivery * array_length(v_sellers, 1),
    'placed', 'pending', case when v_escrow then 'escrow' else 'direct' end,
    jsonb_build_object('line', v_address, 'state', v_state, 'lga', v_lga, 'phone', v_phone),
    nullif(left(trim(coalesce(p_notes, '')), 1000), ''), now())
  returning id into v_order;

  insert into public.marketplace_order_items (
    order_id, listing_id, seller_id, title, unit, quantity, unit_price_kobo, subtotal_kobo,
    commission_bps, commission_kobo, seller_earnings_kobo)
  select v_order, listing_id, seller_id, left(title, 140), unit, qty, price, round(price * qty)::bigint,
         c_bps, round(round(price * qty) * c_bps / 10000.0)::bigint,
         round(price * qty)::bigint - round(round(price * qty) * c_bps / 10000.0)::bigint
    from pg_temp.order_lines;

  foreach v_seller in array v_sellers loop
    v_i := v_i + 1;
    select coalesce(sum(round(price * qty)), 0)::bigint into v_line_sub from pg_temp.order_lines where seller_id = v_seller;
    insert into public.marketplace_fulfilments (
      order_id, seller_id, fulfilment_number, status, subtotal_kobo, delivery_fee_kobo, delivery_method, direct_payment_status)
    values (v_order, v_seller, v_number || '-F' || v_i, 'placed', v_line_sub, c_delivery, 'seller_delivery',
            case when v_escrow then null else 'awaiting_payment' end);
  end loop;

  perform public.reserve_inventory_for_order(v_order);
  return v_order;
end;
$$;

revoke execute on function public.place_marketplace_order(jsonb, jsonb, text) from public, anon;
grant execute on function public.place_marketplace_order(jsonb, jsonb, text) to authenticated;
