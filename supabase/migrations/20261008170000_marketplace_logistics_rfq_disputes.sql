-- CultivaNode Marketplace Module: Migration 4 of 4
-- Logistics & Delivery Proofs, Bulk RFQ Procurement, Verified Reviews & Disputes

------------------------------------------------------------------------------------------------
-- 1. Logistics & Shipments
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_shipments (
  id                      uuid primary key default gen_random_uuid(),
  fulfilment_id           uuid not null references public.marketplace_fulfilments (id) on delete cascade,
  carrier_type            text not null check (carrier_type in ('seller', 'buyer', 'cultivanode_fleet', '3pl')),
  carrier_profile_id      uuid references public.profiles (id) on delete set null,
  vehicle_type            text check (vehicle_type is null or char_length(vehicle_type) <= 60),
  tracking_code           text unique check (char_length(tracking_code) between 6 and 60),
  pickup_location         extensions.geography(Point, 4326) not null,
  dropoff_location        extensions.geography(Point, 4326) not null,
  status                  text not null default 'created' check (status in ('created', 'assigned', 'pickup_pending', 'picked_up', 'in_transit', 'arrived', 'delivered', 'failed', 'cancelled')),
  pickup_time             timestamptz,
  delivery_time           timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists mkt_shipments_fulfilment_idx on public.marketplace_shipments (fulfilment_id);
create index if not exists mkt_shipments_carrier_idx on public.marketplace_shipments (carrier_profile_id);
create index if not exists mkt_shipments_status_idx on public.marketplace_shipments (status);

create table if not exists public.marketplace_delivery_proofs (
  id                  uuid primary key default gen_random_uuid(),
  shipment_id         uuid not null references public.marketplace_shipments (id) on delete cascade,
  location            extensions.geography(Point, 4326) not null,
  recipient_name      text not null check (char_length(recipient_name) between 2 and 120),
  recipient_phone     text check (recipient_phone is null or char_length(recipient_phone) <= 30),
  confirmation_otp    text check (confirmation_otp is null or char_length(confirmation_otp) <= 10),
  photo_urls          text[] not null default array[]::text[],
  signature_url       text check (signature_url is null or char_length(signature_url) <= 500),
  recorded_at         timestamptz not null default now(),
  recorded_by         uuid default auth.uid() references public.profiles (id) on delete set null
);

create index if not exists mkt_delivery_proofs_shipment_idx on public.marketplace_delivery_proofs (shipment_id);

------------------------------------------------------------------------------------------------
-- 2. Bulk RFQ & Procurement
------------------------------------------------------------------------------------------------

create table if not exists public.buyer_requests (
  id                          uuid primary key default gen_random_uuid(),
  buyer_id                    uuid not null references public.profiles (id) on delete cascade,
  buyer_org_id                uuid references public.organizations (id) on delete set null,
  request_number              text not null unique check (char_length(request_number) between 6 and 40),
  title                       text not null check (char_length(title) between 3 and 140),
  category_id                 uuid not null references public.marketplace_categories (id) on delete restrict,
  target_crop_or_commodity    text not null check (char_length(target_crop_or_commodity) between 2 and 100),
  required_quantity           numeric(12, 2) not null check (required_quantity > 0),
  unit                        text not null check (unit in ('kg', 'g', 'tonne', 'bag', 'crate', 'basket', 'piece', 'litre', 'hectare', 'hour', 'day', 'job')),
  target_grade                text check (target_grade is null or target_grade in ('grade_a', 'grade_b', 'grade_c', 'processing_grade')),
  delivery_location           text not null check (char_length(delivery_location) between 2 and 200),
  delivery_coordinates        extensions.geography(Point, 4326),
  deadline_date               date not null,
  target_budget_kobo          bigint check (target_budget_kobo is null or target_budget_kobo > 0),
  status                      text not null default 'open' check (status in ('open', 'evaluating', 'awarded', 'fulfilled', 'cancelled', 'expired')),
  notes                       text check (notes is null or char_length(notes) <= 2000),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists buyer_requests_buyer_idx on public.buyer_requests (buyer_id);
create index if not exists buyer_requests_status_idx on public.buyer_requests (status, deadline_date);

create table if not exists public.buyer_request_responses (
  id                          uuid primary key default gen_random_uuid(),
  request_id                  uuid not null references public.buyer_requests (id) on delete cascade,
  seller_id                   uuid not null references public.marketplace_sellers (id) on delete cascade,
  offered_quantity            numeric(12, 2) not null check (offered_quantity > 0),
  unit_price_kobo             bigint not null check (unit_price_kobo > 0),
  delivery_fee_kobo           bigint not null default 0 check (delivery_fee_kobo >= 0),
  total_quote_kobo            bigint not null check (total_quote_kobo > 0),
  offered_grade               text check (offered_grade is null or offered_grade in ('grade_a', 'grade_b', 'grade_c', 'processing_grade')),
  estimated_delivery_date     date not null,
  valid_until                 timestamptz not null,
  status                      text not null default 'submitted' check (status in ('submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
  seller_notes                text check (seller_notes is null or char_length(seller_notes) <= 1500),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists buyer_responses_request_idx on public.buyer_request_responses (request_id);
create index if not exists buyer_responses_seller_idx on public.buyer_request_responses (seller_id);

------------------------------------------------------------------------------------------------
-- 3. Verified Reviews (Transaction-Linked Only)
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_reviews (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.marketplace_orders (id) on delete cascade,
  order_item_id           uuid references public.marketplace_order_items (id) on delete set null,
  seller_id               uuid not null references public.marketplace_sellers (id) on delete cascade,
  reviewer_id             uuid not null references public.profiles (id) on delete cascade,
  rating                  integer not null check (rating between 1 and 5),
  comment                 text check (comment is null or char_length(comment) <= 1000),
  response                text check (response is null or char_length(response) <= 1000),
  is_verified_purchase    boolean not null default true,
  created_at              timestamptz not null default now(),
  constraint mkt_review_unique_order_reviewer unique (order_id, reviewer_id, seller_id)
);

create index if not exists mkt_reviews_seller_idx on public.marketplace_reviews (seller_id);

-- Recalculate seller rating upon review submission
create or replace function public.update_seller_rating_aggregate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.marketplace_sellers
     set rating_avg = (
           select round(coalesce(avg(rating), 0.00), 2)
             from public.marketplace_reviews
            where seller_id = new.seller_id
         ),
         rating_count = (
           select count(*)
             from public.marketplace_reviews
            where seller_id = new.seller_id
         ),
         updated_at = now()
   where id = new.seller_id;

  return null;
end;
$$;

drop trigger if exists trg_seller_rating_update on public.marketplace_reviews;
create trigger trg_seller_rating_update
after insert or update on public.marketplace_reviews
for each row execute function public.update_seller_rating_aggregate();

------------------------------------------------------------------------------------------------
-- 4. Disputes & Escrow Freeze
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_disputes (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.marketplace_orders (id) on delete cascade,
  fulfilment_id       uuid references public.marketplace_fulfilments (id) on delete set null,
  initiator_id        uuid not null references public.profiles (id) on delete cascade,
  seller_id           uuid not null references public.marketplace_sellers (id) on delete cascade,
  reason              text not null check (reason in ('damaged_goods', 'quality_not_as_described', 'quantity_shortage', 'not_delivered', 'late_delivery', 'wrong_item', 'other')),
  description         text not null check (char_length(description) between 5 and 2000),
  evidence_urls       text[] not null default array[]::text[],
  status              text not null default 'opened' check (status in ('opened', 'under_review', 'evidence_required', 'decision_pending', 'resolved', 'escalated', 'closed')),
  resolution          text check (resolution is null or char_length(resolution) <= 2000),
  resolution_type     text check (resolution_type is null or resolution_type in ('refund_buyer', 'release_seller', 'partial_refund', 'replacement')),
  refund_amount_kobo  bigint check (refund_amount_kobo is null or refund_amount_kobo >= 0),
  resolved_by         uuid references public.profiles (id) on delete set null,
  resolved_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists mkt_disputes_order_idx on public.marketplace_disputes (order_id);
create index if not exists mkt_disputes_status_idx on public.marketplace_disputes (status);

-- Freezes escrow when a dispute is opened
create or replace function public.freeze_escrow_on_dispute()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.marketplace_escrows
     set status = 'disputed',
         disputed_at = now()
   where order_id = new.order_id
     and (new.fulfilment_id is null or fulfilment_id = new.fulfilment_id)
     and status in ('held', 'awaiting_confirmation');

  update public.marketplace_orders
     set status = 'disputed',
         updated_at = now()
   where id = new.order_id;

  return null;
end;
$$;

drop trigger if exists trg_freeze_escrow_on_dispute on public.marketplace_disputes;
create trigger trg_freeze_escrow_on_dispute
after insert on public.marketplace_disputes
for each row execute function public.freeze_escrow_on_dispute();

------------------------------------------------------------------------------------------------
-- 5. Geospatial Radius Marketplace Search RPC
------------------------------------------------------------------------------------------------

create or replace function public.search_marketplace_listings(
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km numeric default 100,
  p_category_slug text default null,
  p_query text default null,
  p_listing_type text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  listing_type text,
  category_name text,
  category_slug text,
  base_price_kobo bigint,
  unit text,
  available_quantity numeric,
  images text[],
  seller_id uuid,
  seller_name text,
  seller_type text,
  seller_rating numeric,
  distance_km double precision,
  location_state text,
  location_lga text
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_point extensions.geography;
begin
  if p_lat is not null and p_lng is not null then
    v_point := extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography;
  end if;

  return query
  select
    l.id,
    l.title,
    l.listing_type,
    c.name as category_name,
    c.slug as category_slug,
    l.base_price_kobo,
    l.unit,
    l.available_quantity,
    l.images,
    s.id as seller_id,
    s.business_name as seller_name,
    s.seller_type,
    s.rating_avg as seller_rating,
    case
      when v_point is not null then round((extensions.ST_Distance(l.location, v_point) / 1000.0)::numeric, 1)::double precision
      else null
    end as distance_km,
    l.location_state,
    l.location_lga
  from public.marketplace_listings l
  join public.marketplace_sellers s on s.id = l.seller_id
  join public.marketplace_categories c on c.id = l.category_id
  where l.status = 'active'
    and not s.is_suspended
    and (p_category_slug is null or c.slug = p_category_slug or exists (
      select 1 from public.marketplace_categories sub where sub.id = l.category_id and sub.slug = p_category_slug
    ))
    and (p_listing_type is null or l.listing_type = p_listing_type)
    and (p_query is null or l.title ilike '%' || p_query || '%' or l.description ilike '%' || p_query || '%')
    and (v_point is null or extensions.ST_DWithin(l.location, v_point, coalesce(p_radius_km, 100) * 1000))
  order by
    case when v_point is not null then extensions.ST_Distance(l.location, v_point) else null end asc,
    l.created_at desc
  limit least(coalesce(p_limit, 20), 100)
  offset coalesce(p_offset, 0);
end;
$$;

------------------------------------------------------------------------------------------------
-- 6. Row Level Security (RLS)
------------------------------------------------------------------------------------------------

alter table public.marketplace_shipments enable row level security;
alter table public.marketplace_delivery_proofs enable row level security;
alter table public.buyer_requests enable row level security;
alter table public.buyer_request_responses enable row level security;
alter table public.marketplace_reviews enable row level security;
alter table public.marketplace_disputes enable row level security;

-- Shipments: Fulfilment seller, order buyer, carrier, and admin
create policy "marketplace_shipments_select" on public.marketplace_shipments
  for select using (
    carrier_profile_id = auth.uid()
    or exists (
      select 1 from public.marketplace_fulfilments f
      join public.marketplace_orders o on o.id = f.order_id
      join public.marketplace_sellers s on s.id = f.seller_id
      where f.id = fulfilment_id and (o.buyer_id = auth.uid() or s.profile_id = auth.uid() or public.is_admin())
    )
  );

-- Delivery Proofs: Viewable with shipment
create policy "marketplace_proofs_select" on public.marketplace_delivery_proofs
  for select using (
    exists (
      select 1 from public.marketplace_shipments s
      where s.id = shipment_id and exists (
        select 1 from public.marketplace_fulfilments f
        join public.marketplace_orders o on o.id = f.order_id
        join public.marketplace_sellers sel on sel.id = f.seller_id
        where f.id = s.fulfilment_id and (o.buyer_id = auth.uid() or sel.profile_id = auth.uid() or s.carrier_profile_id = auth.uid() or public.is_admin())
      )
    )
  );

create policy "marketplace_proofs_insert" on public.marketplace_delivery_proofs
  for insert with check (
    exists (
      select 1 from public.marketplace_shipments s
      where s.id = shipment_id and (s.carrier_profile_id = auth.uid() or public.is_admin())
    )
  );

-- Buyer Requests (RFQ): Public view for open, Buyer manage
create policy "buyer_requests_select" on public.buyer_requests
  for select using (status = 'open' or buyer_id = auth.uid() or public.is_admin());

create policy "buyer_requests_insert" on public.buyer_requests
  for insert with check (buyer_id = auth.uid());

create policy "buyer_requests_update" on public.buyer_requests
  for update using (buyer_id = auth.uid() or public.is_admin())
  with check (buyer_id = auth.uid() or public.is_admin());

-- Buyer Request Responses: Buyer, Responding Seller, and Admin
create policy "buyer_responses_select" on public.buyer_request_responses
  for select using (
    exists (
      select 1 from public.buyer_requests r
      where r.id = request_id and r.buyer_id = auth.uid()
    )
    or exists (
      select 1 from public.marketplace_sellers s
      where s.id = seller_id and s.profile_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "buyer_responses_insert" on public.buyer_request_responses
  for insert with check (
    exists (
      select 1 from public.marketplace_sellers s
      where s.id = seller_id and s.profile_id = auth.uid() and not s.is_suspended
    )
  );

-- Reviews: Public select, Authenticated buyer insert if they purchased
create policy "marketplace_reviews_select" on public.marketplace_reviews
  for select using (true);

create policy "marketplace_reviews_insert" on public.marketplace_reviews
  for insert with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.marketplace_orders o
      where o.id = order_id and o.buyer_id = auth.uid() and o.status = 'completed'
    )
  );

-- Disputes: Order buyer, Fulfilment seller, and Admin
create policy "marketplace_disputes_select" on public.marketplace_disputes
  for select using (
    initiator_id = auth.uid()
    or exists (
      select 1 from public.marketplace_sellers s
      where s.id = seller_id and s.profile_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "marketplace_disputes_insert" on public.marketplace_disputes
  for insert with check (
    initiator_id = auth.uid()
    and exists (
      select 1 from public.marketplace_orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

create policy "marketplace_disputes_update_admin" on public.marketplace_disputes
  for update using (public.is_admin('support_officer'))
  with check (public.is_admin('support_officer'));
