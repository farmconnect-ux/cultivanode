-- CultivaNode: admin feature switches for unfinished modules, and direct payment for marketplace orders.
--
--   1. More switches in public.feature_flags (changed only through admin_set_feature_flag()).
--      Everyone may read them, signed in or not: they decide what the website and apps show.
--   2. Direct payment (the pilot default while escrow_payments is off):
--      the buyer pays each seller's bank account directly, says so in the app, and the seller confirms
--      the money arrived. Turning escrow_payments on sends new orders through online checkout, where
--      CultivaNode holds the money until delivery (the existing escrow flow).
------------------------------------------------------------------------------------------------

------------------------------------------------------------------------------------------------
-- 1. Feature switches
------------------------------------------------------------------------------------------------
insert into public.feature_flags (key, description, enabled) values
  ('escrow_payments',     'Marketplace buyers pay online and CultivaNode holds the money until delivery is confirmed. Off: buyers pay the seller''s bank account directly and the seller confirms payment.', false),
  ('hiring_escrow',       'Farmers pay for tractor and farm-hand jobs through CultivaNode, held until the job is confirmed. Off: farmers pay the provider directly.', false),
  ('ecosystem_hubs',      'Show the partner workspaces (buyer, supplier, logistics, processing, cooperative, enterprise, lender, insurance, grants, investor, government, NGO, research, market intelligence) in the menu.', false),
  ('module_livestock',    'Livestock and aquaculture records.', true),
  ('module_farm_map',     'Farm map page.', true),
  ('module_fleet',        'Fleet and workshop records for machinery owners.', true),
  ('module_harvest',      'Produce and harvest commerce page.', true),
  ('module_telemetry',    'Machine telemetry and tracking.', false),
  ('module_iot',          'IoT sensors and smart-farm page.', false),
  ('module_irrigation',   'Smart irrigation page.', false),
  ('module_contracts',    'Off-take contracts.', false),
  ('module_credit_reports','Verified records and credit reports.', false),
  ('module_risk',         'Farm health and risk page.', false),
  ('module_logistics',    'Logistics and haulage page.', false),
  ('module_pow_log',      'Proof-of-work log for providers.', false),
  ('ai_photo_diagnosis',  'Diagnose a plant problem from a photo in the farm assistant.', false)
on conflict (key) do nothing;

-- The switches are not secret: the public website needs them too (for example, payment wording).
drop policy if exists "feature_flags: everyone signed in reads" on public.feature_flags;
create policy "feature_flags: everyone reads" on public.feature_flags
  for select to anon, authenticated using (true);
grant select on public.feature_flags to anon, authenticated;

-- Is a switch on (ignores per-state limits; marketplace_live keeps its own check)?
create or replace function public.feature_on(p_key text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((select f.enabled from public.feature_flags f where f.key = p_key), false);
$$;
grant execute on function public.feature_on(text) to anon, authenticated;

------------------------------------------------------------------------------------------------
-- 2. Direct payment
------------------------------------------------------------------------------------------------

-- The account a seller wants buyers to pay into. Shown only to buyers who have a direct-payment
-- order with that seller (and to staff). Separate from bank_accounts, which keeps only the last four
-- digits for verified payouts.
create table if not exists public.marketplace_seller_payout_accounts (
  seller_id       uuid primary key references public.marketplace_sellers (id) on delete cascade,
  bank_name       text not null check (char_length(bank_name) between 2 and 120),
  account_name    text not null check (char_length(account_name) between 2 and 160),
  account_number  text not null check (account_number ~ '^[0-9]{10}$'),
  updated_at      timestamptz not null default now()
);
comment on table public.marketplace_seller_payout_accounts is
  'Bank account buyers pay into while escrow_payments is off. Visible to the seller, to buyers with a direct-payment order from that seller, and to staff.';

alter table public.marketplace_seller_payout_accounts enable row level security;

create policy "payout_accounts: seller manages own" on public.marketplace_seller_payout_accounts
  for all to authenticated
  using (exists (select 1 from public.marketplace_sellers s where s.id = seller_id and s.profile_id = auth.uid()))
  with check (exists (select 1 from public.marketplace_sellers s where s.id = seller_id and s.profile_id = auth.uid()));

create policy "payout_accounts: buyers of direct orders read" on public.marketplace_seller_payout_accounts
  for select to authenticated
  using (exists (
    select 1
    from public.marketplace_fulfilments f
    join public.marketplace_orders o on o.id = f.order_id
    where f.seller_id = marketplace_seller_payout_accounts.seller_id
      and o.buyer_id = auth.uid()
      and o.payment_mode = 'direct'
  ) or public.is_admin());

grant select, insert, update, delete on public.marketplace_seller_payout_accounts to authenticated;

alter table public.marketplace_orders
  add column if not exists payment_mode text not null default 'escrow' check (payment_mode in ('escrow', 'direct'));

alter table public.marketplace_fulfilments
  add column if not exists direct_payment_status text check (direct_payment_status in ('awaiting_payment', 'buyer_reported', 'confirmed')),
  add column if not exists buyer_payment_reference text check (buyer_payment_reference is null or char_length(buyer_payment_reference) <= 120),
  add column if not exists buyer_reported_paid_at timestamptz,
  add column if not exists seller_confirmed_paid_at timestamptz;

-- Which of these sellers can take a direct payment (have a payout account)? Used at checkout.
create or replace function public.sellers_with_payout_account(p_seller_ids uuid[])
returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select seller_id from public.marketplace_seller_payout_accounts where seller_id = any (p_seller_ids);
$$;
grant execute on function public.sellers_with_payout_account(uuid[]) to authenticated;

-- Buyer: "I've sent the money" for one seller's part of the order.
create or replace function public.buyer_report_direct_payment(p_fulfilment_id uuid, p_reference text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_ok boolean;
begin
  select true into v_ok
  from public.marketplace_fulfilments f
  join public.marketplace_orders o on o.id = f.order_id
  where f.id = p_fulfilment_id and o.buyer_id = auth.uid() and o.payment_mode = 'direct'
  for update of f;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;
  update public.marketplace_fulfilments
     set direct_payment_status = 'buyer_reported',
         buyer_payment_reference = nullif(trim(left(coalesce(p_reference, ''), 120)), ''),
         buyer_reported_paid_at = now(),
         updated_at = now()
   where id = p_fulfilment_id and direct_payment_status in ('awaiting_payment', 'buyer_reported');
end;
$$;
grant execute on function public.buyer_report_direct_payment(uuid, text) to authenticated;

-- Seller: "Payment received". When every seller on the order has confirmed, the order is paid.
create or replace function public.seller_confirm_direct_payment(p_fulfilment_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_order uuid;
begin
  select f.order_id into v_order
  from public.marketplace_fulfilments f
  join public.marketplace_sellers s on s.id = f.seller_id
  join public.marketplace_orders o on o.id = f.order_id
  where f.id = p_fulfilment_id and s.profile_id = auth.uid() and o.payment_mode = 'direct'
  for update of f;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;
  update public.marketplace_fulfilments
     set direct_payment_status = 'confirmed', seller_confirmed_paid_at = now(), updated_at = now()
   where id = p_fulfilment_id;
  if not exists (
    select 1 from public.marketplace_fulfilments
    where order_id = v_order and coalesce(direct_payment_status, '') <> 'confirmed'
  ) then
    update public.marketplace_orders
       set payment_status = 'paid', status = case when status in ('placed', 'payment_pending') then 'paid' else status end,
           paid_at = coalesce(paid_at, now()), updated_at = now()
     where id = v_order;
  end if;
end;
$$;
grant execute on function public.seller_confirm_direct_payment(uuid) to authenticated;

-- Buyer: "I received it" for a direct-payment order (no escrow to release).
create or replace function public.buyer_confirm_direct_delivery(p_fulfilment_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.marketplace_fulfilments f
     set status = 'accepted', confirmed_at = now(), updated_at = now()
   from public.marketplace_orders o
   where f.id = p_fulfilment_id and o.id = f.order_id and o.buyer_id = auth.uid()
     and o.payment_mode = 'direct' and f.direct_payment_status = 'confirmed'
     and f.status in ('ready_for_pickup', 'dispatched', 'in_transit', 'delivered');
  if not found then
    raise exception 'You can confirm delivery once the seller has confirmed your payment and sent the goods.' using errcode = 'P0001';
  end if;
end;
$$;
grant execute on function public.buyer_confirm_direct_delivery(uuid) to authenticated;


-- Direct payment is per seller: a seller who has confirmed the buyer's transfer may hand over their part of
-- the order even while another seller on the same order is still waiting. Same function as before, with
-- that one extra condition on the payment check.
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
  if p_status in ('ready_for_pickup', 'dispatched', 'in_transit', 'delivered') and o.payment_status not in ('paid', 'escrowed', 'released')
     and coalesce(f.direct_payment_status, '') <> 'confirmed' then
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
