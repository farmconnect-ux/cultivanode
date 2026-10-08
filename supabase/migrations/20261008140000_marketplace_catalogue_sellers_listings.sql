-- CultivaNode Marketplace Module: Migration 1 of 4
-- Catalogue, Sellers, Listings, Produce Provenance & Concurrency-Safe Inventory Lots

------------------------------------------------------------------------------------------------
-- 1. Catalogue: Categories, Products, Variants & Dynamic Fee Rules
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_categories (
  id                  uuid primary key default gen_random_uuid(),
  parent_id           uuid references public.marketplace_categories (id) on delete set null,
  slug                text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name                text not null check (char_length(name) between 2 and 100),
  description         text check (description is null or char_length(description) <= 1000),
  icon                text check (icon is null or char_length(icon) <= 50),
  sort_order          integer not null default 0,
  attributes_schema   jsonb not null default '{}'::jsonb,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists mkt_cat_parent_idx on public.marketplace_categories (parent_id);
create index if not exists mkt_cat_active_idx on public.marketplace_categories (is_active, sort_order);

create table if not exists public.marketplace_products (
  id                  uuid primary key default gen_random_uuid(),
  category_id         uuid not null references public.marketplace_categories (id) on delete cascade,
  name                text not null check (char_length(name) between 2 and 120),
  slug                text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description         text check (description is null or char_length(description) <= 2000),
  standard_attributes jsonb not null default '{}'::jsonb,
  default_unit        text not null check (default_unit in ('kg', 'g', 'tonne', 'bag', 'crate', 'basket', 'piece', 'litre', 'hectare', 'hour', 'day', 'job')),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists mkt_prod_category_idx on public.marketplace_products (category_id);
create index if not exists mkt_prod_slug_idx on public.marketplace_products (slug);

create table if not exists public.marketplace_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.marketplace_products (id) on delete cascade,
  name                text not null check (char_length(name) between 2 and 120),
  sku                 text unique check (sku is null or char_length(sku) <= 60),
  attributes          jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists mkt_var_product_idx on public.marketplace_variants (product_id);

create table if not exists public.marketplace_fee_rules (
  id                  uuid primary key default gen_random_uuid(),
  category_id         uuid references public.marketplace_categories (id) on delete cascade,
  seller_type         text check (seller_type is null or seller_type in ('farmer', 'external_farmer', 'agro_dealer', 'machinery_owner', 'labour_provider', 'service_provider', 'aggregator', 'processor', 'cooperative')),
  min_order_kobo      bigint not null default 0 check (min_order_kobo >= 0),
  max_order_kobo      bigint check (max_order_kobo is null or max_order_kobo > min_order_kobo),
  commission_bps      integer not null default 500 check (commission_bps between 0 and 5000), -- 500 bps = 5%, up to 50%
  escrow_fee_bps      integer not null default 150 check (escrow_fee_bps between 0 and 2000), -- 150 bps = 1.5%
  fixed_fee_kobo      bigint not null default 0 check (fixed_fee_kobo >= 0),
  effective_from      timestamptz not null default now(),
  effective_until     timestamptz check (effective_until is null or effective_until > effective_from),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create index if not exists mkt_fee_rules_active_idx on public.marketplace_fee_rules (is_active, category_id, seller_type);

------------------------------------------------------------------------------------------------
-- 2. Sellers & Verification
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_sellers (
  id                      uuid primary key default gen_random_uuid(),
  profile_id              uuid not null references public.profiles (id) on delete cascade,
  organization_id         uuid references public.organizations (id) on delete set null,
  seller_type             text not null check (seller_type in ('farmer', 'external_farmer', 'agro_dealer', 'machinery_owner', 'labour_provider', 'service_provider', 'aggregator', 'processor', 'cooperative')),
  business_name           text not null check (char_length(business_name) between 2 and 120),
  description             text check (description is null or char_length(description) <= 2000),
  logo_url                text check (logo_url is null or char_length(logo_url) <= 500),
  cover_url               text check (cover_url is null or char_length(cover_url) <= 500),
  rating_avg              numeric(3, 2) not null default 0.00 check (rating_avg between 0.00 and 5.00),
  rating_count            integer not null default 0 check (rating_count >= 0),
  verification_status     text not null default 'pending' check (verification_status in ('pending', 'verified', 'trusted', 'rejected')),
  is_suspended            boolean not null default false,
  suspension_reason       text check (suspension_reason is null or char_length(suspension_reason) <= 500),
  payout_bank_account_id  uuid references public.bank_accounts (id) on delete set null,
  commission_rate_bps     integer check (commission_rate_bps is null or commission_rate_bps between 0 and 5000),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint mkt_seller_unique_identity unique (profile_id, organization_id)
);

create index if not exists mkt_sellers_profile_idx on public.marketplace_sellers (profile_id);
create index if not exists mkt_sellers_status_idx on public.marketplace_sellers (verification_status, is_suspended);

------------------------------------------------------------------------------------------------
-- 3. Listings
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_listings (
  id                      uuid primary key default gen_random_uuid(),
  seller_id               uuid not null references public.marketplace_sellers (id) on delete cascade,
  category_id             uuid not null references public.marketplace_categories (id) on delete restrict,
  product_id              uuid references public.marketplace_products (id) on delete set null,
  variant_id              uuid references public.marketplace_variants (id) on delete set null,
  listing_type            text not null check (listing_type in ('produce', 'input', 'machinery', 'labour', 'service')),
  title                   text not null check (char_length(title) between 3 and 140),
  description             text check (description is null or char_length(description) <= 3000),
  images                  text[] not null default array[]::text[],
  unit                    text not null check (unit in ('kg', 'g', 'tonne', 'bag', 'crate', 'basket', 'piece', 'litre', 'hectare', 'hour', 'day', 'job')),
  price_model             text not null check (price_model in ('fixed', 'negotiable', 'per_unit', 'tiered', 'quotation')),
  base_price_kobo         bigint not null check (base_price_kobo >= 0 and base_price_kobo <= 100000000000),
  min_order_quantity      numeric(12, 2) not null default 1.00 check (min_order_quantity > 0),
  max_order_quantity      numeric(12, 2) check (max_order_quantity is null or max_order_quantity >= min_order_quantity),
  available_quantity      numeric(12, 2) not null default 0.00 check (available_quantity >= 0),
  location                extensions.geography(Point, 4326) not null,
  location_address        text check (location_address is null or char_length(location_address) <= 200),
  location_state          text check (location_state is null or char_length(location_state) <= 60),
  location_lga            text check (location_lga is null or char_length(location_lga) <= 60),
  delivery_options        text[] not null default array['pickup']::text[],
  delivery_radius_km      numeric(6, 1) not null default 30.0 check (delivery_radius_km >= 0 and delivery_radius_km <= 500),
  delivery_flat_rate_kobo bigint not null default 0 check (delivery_flat_rate_kobo >= 0),
  status                  text not null default 'draft' check (status in ('draft', 'active', 'paused', 'sold_out', 'suspended')),
  is_verified             boolean not null default false,
  metadata                jsonb not null default '{}'::jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists mkt_listings_seller_idx on public.marketplace_listings (seller_id);
create index if not exists mkt_listings_category_idx on public.marketplace_listings (category_id);
create index if not exists mkt_listings_type_status_idx on public.marketplace_listings (listing_type, status);
create index if not exists mkt_listings_location_gix on public.marketplace_listings using gist (location);

------------------------------------------------------------------------------------------------
-- 4. Produce Provenance (Farm & Harvest Batch Integration)
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_produce_provenance (
  id                      uuid primary key default gen_random_uuid(),
  listing_id              uuid not null unique references public.marketplace_listings (id) on delete cascade,
  farm_id                 uuid references public.farms (id) on delete set null,
  plot_id                 uuid references public.plots (id) on delete set null,
  crop_cycle_id           uuid references public.crop_cycles (id) on delete set null,
  harvest_id              uuid references public.crop_harvests (id) on delete set null,
  batch_code              text check (batch_code is null or char_length(batch_code) <= 80),
  harvest_date            date,
  expected_harvest_date   date,
  grade                   text check (grade is null or grade in ('grade_a', 'grade_b', 'grade_c', 'processing_grade')),
  moisture_pct            numeric(5, 2) check (moisture_pct is null or (moisture_pct between 0 and 100)),
  quality_notes           text check (quality_notes is null or char_length(quality_notes) <= 1000),
  is_organic              boolean not null default false,
  certifications          text[] not null default array[]::text[],
  created_at              timestamptz not null default now()
);

create index if not exists mkt_provenance_farm_idx on public.marketplace_produce_provenance (farm_id);
create index if not exists mkt_provenance_harvest_idx on public.marketplace_produce_provenance (harvest_id);

------------------------------------------------------------------------------------------------
-- 5. Concurrency-Safe Inventory Lots
------------------------------------------------------------------------------------------------

create table if not exists public.marketplace_inventory_lots (
  id                      uuid primary key default gen_random_uuid(),
  listing_id              uuid not null references public.marketplace_listings (id) on delete cascade,
  lot_number              text not null check (char_length(lot_number) between 1 and 80),
  physical_quantity       numeric(12, 2) not null check (physical_quantity >= 0),
  reserved_quantity       numeric(12, 2) not null default 0.00 check (reserved_quantity >= 0),
  allocated_quantity      numeric(12, 2) not null default 0.00 check (allocated_quantity >= 0),
  sold_quantity           numeric(12, 2) not null default 0.00 check (sold_quantity >= 0),
  storage_location        text check (storage_location is null or char_length(storage_location) <= 120),
  expiry_date             date,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint inv_lots_available_non_negative check (physical_quantity >= (reserved_quantity + allocated_quantity))
);

create index if not exists mkt_inv_lots_listing_idx on public.marketplace_inventory_lots (listing_id);

-- Keep available_quantity in marketplace_listings synchronized with inventory lots sum
create or replace function public.sync_marketplace_listing_available_qty()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing_id uuid;
  v_total_avail numeric(12, 2);
begin
  v_listing_id := coalesce(new.listing_id, old.listing_id);
  select coalesce(sum(physical_quantity - reserved_quantity - allocated_quantity), 0.00)
    into v_total_avail
    from public.marketplace_inventory_lots
   where listing_id = v_listing_id;

  update public.marketplace_listings
     set available_quantity = v_total_avail,
         status = case
           when v_total_avail <= 0 and status = 'active' then 'sold_out'
           when v_total_avail > 0 and status = 'sold_out' then 'active'
           else status
         end,
         updated_at = now()
   where id = v_listing_id;

  return null;
end;
$$;

drop trigger if exists trg_sync_marketplace_listing_qty on public.marketplace_inventory_lots;
create trigger trg_sync_marketplace_listing_qty
after insert or update or delete on public.marketplace_inventory_lots
for each row execute function public.sync_marketplace_listing_available_qty();

------------------------------------------------------------------------------------------------
-- 6. Row Level Security (RLS)
------------------------------------------------------------------------------------------------

alter table public.marketplace_categories enable row level security;
alter table public.marketplace_products enable row level security;
alter table public.marketplace_variants enable row level security;
alter table public.marketplace_fee_rules enable row level security;
alter table public.marketplace_sellers enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_produce_provenance enable row level security;
alter table public.marketplace_inventory_lots enable row level security;

-- Categories, Products, Variants: Read for all, Admin write
create policy "marketplace_categories_read_all" on public.marketplace_categories
  for select using (is_active or public.is_admin());
create policy "marketplace_categories_admin_all" on public.marketplace_categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "marketplace_products_read_all" on public.marketplace_products
  for select using (is_active or public.is_admin());
create policy "marketplace_products_admin_all" on public.marketplace_products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "marketplace_variants_read_all" on public.marketplace_variants
  for select using (true);
create policy "marketplace_variants_admin_all" on public.marketplace_variants
  for all using (public.is_admin()) with check (public.is_admin());

create policy "marketplace_fee_rules_read_all" on public.marketplace_fee_rules
  for select using (is_active or public.is_admin());
create policy "marketplace_fee_rules_admin_all" on public.marketplace_fee_rules
  for all using (public.is_admin()) with check (public.is_admin());

-- Sellers: Public read for active verified sellers, owner manage
create policy "marketplace_sellers_read" on public.marketplace_sellers
  for select using (not is_suspended or profile_id = auth.uid() or public.is_admin());

create policy "marketplace_sellers_insert" on public.marketplace_sellers
  for insert with check (profile_id = auth.uid());

create policy "marketplace_sellers_update" on public.marketplace_sellers
  for update using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- Listings: Public read for active listings, owner manage
create policy "marketplace_listings_read" on public.marketplace_listings
  for select using (status = 'active' or exists (
    select 1 from public.marketplace_sellers s
    where s.id = seller_id and (s.profile_id = auth.uid() or public.is_admin())
  ));

create policy "marketplace_listings_insert" on public.marketplace_listings
  for insert with check (exists (
    select 1 from public.marketplace_sellers s
    where s.id = seller_id and s.profile_id = auth.uid() and not s.is_suspended
  ));

create policy "marketplace_listings_update" on public.marketplace_listings
  for update using (exists (
    select 1 from public.marketplace_sellers s
    where s.id = seller_id and (s.profile_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.marketplace_sellers s
    where s.id = seller_id and (s.profile_id = auth.uid() or public.is_admin())
  ));

create policy "marketplace_listings_delete" on public.marketplace_listings
  for delete using (exists (
    select 1 from public.marketplace_sellers s
    where s.id = seller_id and (s.profile_id = auth.uid() or public.is_admin())
  ));

-- Provenance: Read follows listing visibility, owner manage
create policy "marketplace_provenance_read" on public.marketplace_produce_provenance
  for select using (exists (
    select 1 from public.marketplace_listings l
    where l.id = listing_id
  ));

create policy "marketplace_provenance_owner_all" on public.marketplace_produce_provenance
  for all using (exists (
    select 1 from public.marketplace_listings l
    join public.marketplace_sellers s on s.id = l.seller_id
    where l.id = listing_id and (s.profile_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.marketplace_listings l
    join public.marketplace_sellers s on s.id = l.seller_id
    where l.id = listing_id and (s.profile_id = auth.uid() or public.is_admin())
  ));

-- Inventory Lots: Owner and admin manage
create policy "marketplace_inv_lots_owner_all" on public.marketplace_inventory_lots
  for all using (exists (
    select 1 from public.marketplace_listings l
    join public.marketplace_sellers s on s.id = l.seller_id
    where l.id = listing_id and (s.profile_id = auth.uid() or public.is_admin())
  ))
  with check (exists (
    select 1 from public.marketplace_listings l
    join public.marketplace_sellers s on s.id = l.seller_id
    where l.id = listing_id and (s.profile_id = auth.uid() or public.is_admin())
  ));

------------------------------------------------------------------------------------------------
-- 7. Seed Initial Agricultural Categories & Products
------------------------------------------------------------------------------------------------

insert into public.marketplace_categories (slug, name, description, icon, sort_order)
values
  ('produce', 'Farm Produce', 'Fresh crops, grains, roots, tubers and vegetables direct from farms', 'sprout', 1),
  ('inputs', 'Farm Inputs', 'Certified seeds, fertilisers, agrochemicals, tools and irrigation equipment', 'package', 2),
  ('machinery', 'Machinery Hire', 'Tractors, planters, harvesters, boom sprayers and tillage equipment', 'tractor', 3),
  ('labour', 'Farm Labour', 'Skilled and casual farm hands, harvesting crews, sprayers and scouting teams', 'users', 4),
  ('services', 'Agricultural Services', 'Agronomy consultations, soil testing, drone spraying and mechanics', 'wrench', 5)
on conflict (slug) do nothing;

-- Subcategories for Produce
insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'cereals-grains', 'Cereals & Grains', 'Maize, rice, sorghum, millet and wheat', 1
from public.marketplace_categories where slug = 'produce'
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'roots-tubers', 'Roots & Tubers', 'Cassava, white yam, sweet potato and cocoyam', 2
from public.marketplace_categories where slug = 'produce'
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'vegetables', 'Vegetables', 'Tomatoes, peppers, onions, okra and leafy greens', 3
from public.marketplace_categories where slug = 'produce'
on conflict (slug) do nothing;

-- Subcategories for Inputs
insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'seeds-seedlings', 'Seeds & Seedlings', 'Certified hybrid and open-pollinated seed varieties', 1
from public.marketplace_categories where slug = 'inputs'
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'fertilisers', 'Fertilisers', 'NPK blends, Urea, organic compost and micronutrients', 2
from public.marketplace_categories where slug = 'inputs'
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'crop-protection', 'Crop Protection', 'Selective herbicides, insecticides, and fungicides', 3
from public.marketplace_categories where slug = 'inputs'
on conflict (slug) do nothing;

-- Products
insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Yellow Maize (Grain)', 'yellow-maize-grain', 'Clean dried yellow maize grain, grade A or standard grade', 'kg'
from public.marketplace_categories where slug = 'cereals-grains'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'White Yam (Tubers)', 'white-yam-tubers', 'Freshly harvested large ware yams, suitable for consumption and storage', 'piece'
from public.marketplace_categories where slug = 'roots-tubers'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Cassava Tubers', 'cassava-tubers', 'High starch industrial and processing cassava roots', 'tonne'
from public.marketplace_categories where slug = 'roots-tubers'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Roma Tomatoes', 'roma-tomatoes', 'Fresh firm red processing and table Roma tomatoes', 'crate'
from public.marketplace_categories where slug = 'vegetables'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'NPK 15-15-15 Fertiliser', 'npk-15-15-15', 'Standard balanced agricultural basal fertilizer (50kg bag)', 'bag'
from public.marketplace_categories where slug = 'fertilisers'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Granular Urea 46% N', 'granular-urea-46', 'Nitrogenous top-dressing fertilizer for high tillering (50kg bag)', 'bag'
from public.marketplace_categories where slug = 'fertilisers'
on conflict (slug) do nothing;
