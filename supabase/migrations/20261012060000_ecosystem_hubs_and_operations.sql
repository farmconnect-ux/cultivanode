-- ==============================================================================
-- CultivaNode — Phase 2 to Phase 7: Ecosystem Hubs & Operations Schema Migration
-- Baseline: 12 October 2026
-- Standing Order: Front-End Primacy & Backend Accommodation
-- ==============================================================================

-- 1. HARVEST COMMERCE & PRODUCE INVENTORY
create table if not exists public.farm_harvest_batches (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  crop_cycle_id uuid references public.crop_cycles(id) on delete set null,
  plot_id uuid references public.plots(id) on delete set null,
  crop_name text not null,
  parcel_name text,
  quantity_metric_tons numeric(10, 2) not null check (quantity_metric_tons > 0),
  certified_moisture_brix text,
  quality_grade text not null default 'Grade A' check (quality_grade in ('Grade A', 'Grade B', 'Grade C', 'Industrial')),
  asking_price_per_mt_minor bigint not null default 0 check (asking_price_per_mt_minor >= 0),
  pickup_window_date date,
  storage_location text,
  status text not null default 'available' check (status in ('available', 'listed_marketplace', 'contracted', 'dispatched', 'sold', 'spoiled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists farm_harvest_farm_idx on public.farm_harvest_batches(farm_id, status);

-- 2. OFFTAKE CONTRACTS & FORWARD AGREEMENTS (§6.7)
create table if not exists public.farm_offtake_contracts (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  buyer_id uuid references public.profiles(id) on delete set null,
  buyer_name text not null,
  buyer_company text,
  commodity text not null,
  contracted_quantity_mt numeric(10, 2) not null check (contracted_quantity_mt > 0),
  contract_value_minor bigint not null check (contract_value_minor >= 0),
  price_per_mt_minor bigint not null check (price_per_mt_minor >= 0),
  target_delivery_date date not null,
  delivery_location text not null,
  escrow_custody_bank text not null default 'Zenith Bank Tripartite Custody',
  quality_specifications text,
  contract_status text not null default 'proposed' check (contract_status in ('proposed', 'negotiating', 'active_escrow', 'delivered', 'settled', 'cancelled', 'disputed')),
  farmer_signed_at timestamptz,
  buyer_signed_at timestamptz,
  contract_pdf_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists farm_offtake_farm_idx on public.farm_offtake_contracts(farm_id, contract_status);

-- 3. COOPERATIVE ROSTERS & BULK ORDERS
create table if not exists public.farm_cooperative_members (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete cascade,
  cooperative_name text not null,
  cluster_zone text not null default 'Oyo Agro-Cluster',
  member_name text not null,
  phone text not null,
  nin text,
  farm_size_hectares numeric(8, 2) default 0,
  shares_count integer default 1,
  dues_status text not null default 'current' check (dues_status in ('current', 'overdue', 'exempt')),
  voting_eligibility boolean not null default true,
  joined_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists coop_members_idx on public.farm_cooperative_members(cooperative_name);

create table if not exists public.farm_cooperative_orders (
  id uuid primary key default gen_random_uuid(),
  cooperative_name text not null,
  order_type text not null check (order_type in ('bulk_inputs', 'equipment_hire', 'produce_aggregation')),
  title text not null,
  target_quantity text not null,
  participating_members_count integer default 0,
  target_closing_date date not null,
  estimated_discount_percentage numeric(5, 2) default 15.0,
  status text not null default 'open' check (status in ('open', 'fulfilling', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

-- 4. LOGISTICS, WAYBILLS & FREIGHT FLEET
create table if not exists public.farm_logistics_waybills (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete cascade,
  waybill_number text not null unique default 'WB-' || substr(gen_random_uuid()::text, 1, 8),
  origin text not null,
  destination text not null,
  commodity text not null,
  quantity_mt numeric(10, 2) not null,
  carrier_company text not null,
  driver_name text not null,
  driver_phone text not null,
  truck_plate_number text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'loaded', 'in_transit', 'delivered', 'delayed', 'exception')),
  temperature_celsius numeric(4, 1),
  dispatch_at timestamptz default now(),
  delivered_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists farm_logistics_farm_idx on public.farm_logistics_waybills(farm_id, status);

-- 5. CREDIT READINESS & LENDER HUB DOSSIERS
create table if not exists public.farm_credit_assessments (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  risk_score integer not null default 75 check (risk_score between 0 and 100),
  credit_readiness_tier text not null default 'Tier 2 - Bank Eligible' check (credit_readiness_tier in ('Tier 1 - Prime', 'Tier 2 - Bank Eligible', 'Tier 3 - Microfinance Only', 'Tier 4 - High Risk')),
  verified_cadastral_hectares numeric(10, 2) not null default 0,
  historical_cycles_count integer not null default 0,
  historical_revenue_minor bigint not null default 0,
  repayment_probability_percent numeric(5, 2) not null default 92.5,
  loan_requested_minor bigint default 0,
  loan_purpose text,
  lender_institution text,
  lender_review_status text not null default 'eligible' check (lender_review_status in ('eligible', 'application_submitted', 'underwriting', 'approved', 'disbursed', 'declined')),
  last_evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists credit_assessment_farm_idx on public.farm_credit_assessments(farm_id);

-- 6. AGRO-PROCESSING & VALUE ADDITION
create table if not exists public.farm_processing_batches (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  batch_number text not null default 'PRC-' || substr(gen_random_uuid()::text, 1, 8),
  commodity_intake text not null,
  intake_weight_kg numeric(10, 2) not null check (intake_weight_kg > 0),
  processing_facility text not null,
  processed_output_product text not null,
  output_quantity_kg numeric(10, 2) not null default 0,
  extraction_efficiency_rate numeric(5, 2) default 0,
  quality_lab_test_status text not null default 'pending' check (quality_lab_test_status in ('pending', 'passed', 'flagged', 'rejected')),
  status text not null default 'intake_queued' check (status in ('intake_queued', 'processing', 'completed', 'packaging')),
  notes text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 7. PARAMETRIC INSURANCE & UNDERWRITING
create table if not exists public.farm_insurance_policies (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  policy_number text not null default 'POL-' || substr(gen_random_uuid()::text, 1, 8),
  insurance_underwriter text not null default 'Leadway Assurance Agricultural Underwriting',
  coverage_type text not null check (coverage_type in ('drought_parametric', 'flood_index', 'multi_peril_crop', 'livestock_mortality')),
  insured_area_ha numeric(10, 2) not null default 0,
  sum_insured_minor bigint not null check (sum_insured_minor > 0),
  premium_paid_minor bigint not null check (premium_paid_minor >= 0),
  status text not null default 'active' check (status in ('active', 'expired', 'claim_pending', 'settled', 'cancelled')),
  start_date date not null default current_date,
  end_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.farm_insurance_claims (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.farm_insurance_policies(id) on delete cascade,
  farm_id uuid not null references public.farms(id) on delete cascade,
  trigger_reason text not null check (trigger_reason in ('drought_satellite_deficit', 'flood_ndvi_anomaly', 'pest_epidemic', 'excessive_rainfall')),
  claim_amount_minor bigint not null check (claim_amount_minor > 0),
  satellite_ndvi_verification text,
  status text not null default 'under_review' check (status in ('under_review', 'verified_auto', 'approved', 'settled', 'rejected')),
  payout_date date,
  notes text,
  created_at timestamptz not null default now()
);

-- 8. AGRICULTURAL GRANTS & INPUT SUBSIDIES
create table if not exists public.farm_grant_applications (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  programme_name text not null,
  sponsor_agency text not null,
  grant_type text not null check (grant_type in ('subsidized_fertilizer_voucher', 'solar_irrigation_subsidy', 'mechanization_grant', 'women_agri_fund')),
  requested_value_minor bigint not null check (requested_value_minor > 0),
  disbursed_value_minor bigint default 0,
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'voucher_issued', 'disbursed', 'redeemed', 'rejected')),
  voucher_code text,
  impact_verified boolean not null default false,
  applied_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- 9. SMART IRRIGATION CONTROL & WATER INFRASTRUCTURE
create table if not exists public.farm_water_infrastructure (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  asset_name text not null,
  asset_type text not null check (asset_type in ('borehole_pump', 'overhead_tank', 'drip_manifold', 'solar_pump', 'canal_gate')),
  storage_capacity_litres numeric(10, 2) default 0,
  current_water_level_percentage numeric(5, 2) default 85.0 check (current_water_level_percentage between 0 and 100),
  flow_rate_litres_per_hour numeric(8, 2) default 1200,
  status text not null default 'operational' check (status in ('operational', 'pumping', 'low_water', 'maintenance')),
  created_at timestamptz not null default now()
);

create table if not exists public.farm_irrigation_events (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  plot_id uuid references public.plots(id) on delete set null,
  irrigation_zone text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  water_volume_litres numeric(10, 2) not null check (water_volume_litres > 0),
  soil_moisture_before_percent numeric(5, 2),
  soil_moisture_after_percent numeric(5, 2),
  trigger_reason text not null default 'sensor_deficit_threshold',
  status text not null default 'completed' check (status in ('scheduled', 'in_progress', 'completed', 'interrupted')),
  executed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 10. REAL-TIME COMMODITY MARKET PRICES
create table if not exists public.farm_market_commodity_prices (
  id uuid primary key default gen_random_uuid(),
  trading_hub text not null,
  state text not null,
  commodity text not null,
  variety text,
  wholesale_price_per_mt_minor bigint not null,
  daily_change_percentage numeric(5, 2) default 0.0,
  supply_volume_level text not null default 'Moderate' check (supply_volume_level in ('Scarce', 'Moderate', 'Abundant')),
  effective_date date not null default current_date,
  unique (trading_hub, commodity, effective_date)
);

-- Seed initial Nigerian commodity market baseline prices
insert into public.farm_market_commodity_prices (trading_hub, state, commodity, variety, wholesale_price_per_mt_minor, daily_change_percentage, supply_volume_level)
values
  ('Bodija Market', 'Oyo', 'Yellow Maize', 'DMR-LSR-Y', 38500000, 2.4, 'Moderate'),
  ('Bodija Market', 'Oyo', 'White Garri', 'TME 419 Processed', 31000000, -1.2, 'Abundant'),
  ('Mile 12 Market', 'Lagos', 'Roma Tomato', 'Roma VF', 46000000, 4.8, 'Scarce'),
  ('Mile 12 Market', 'Lagos', 'Habanero Pepper', 'Rodo', 68000000, 3.1, 'Scarce'),
  ('Dawanau International', 'Kano', 'Soybean', 'TGX 1448-2E', 52000000, 0.8, 'Moderate'),
  ('Dawanau International', 'Kano', 'Cowpea (Brown Beans)', 'SAMPEA-14', 74000000, 1.5, 'Moderate')
on conflict do nothing;

-- 11. ROW-LEVEL SECURITY & PERMISSIONS
alter table public.farm_harvest_batches enable row level security;
alter table public.farm_offtake_contracts enable row level security;
alter table public.farm_cooperative_members enable row level security;
alter table public.farm_cooperative_orders enable row level security;
alter table public.farm_logistics_waybills enable row level security;
alter table public.farm_credit_assessments enable row level security;
alter table public.farm_processing_batches enable row level security;
alter table public.farm_insurance_policies enable row level security;
alter table public.farm_insurance_claims enable row level security;
alter table public.farm_grant_applications enable row level security;
alter table public.farm_water_infrastructure enable row level security;
alter table public.farm_irrigation_events enable row level security;
alter table public.farm_market_commodity_prices enable row level security;

-- Permissive authenticated policies
create policy "farm_harvest_batches_authenticated" on public.farm_harvest_batches for all to authenticated using (true) with check (true);
create policy "farm_offtake_contracts_authenticated" on public.farm_offtake_contracts for all to authenticated using (true) with check (true);
create policy "farm_cooperative_members_authenticated" on public.farm_cooperative_members for all to authenticated using (true) with check (true);
create policy "farm_cooperative_orders_authenticated" on public.farm_cooperative_orders for all to authenticated using (true) with check (true);
create policy "farm_logistics_waybills_authenticated" on public.farm_logistics_waybills for all to authenticated using (true) with check (true);
create policy "farm_credit_assessments_authenticated" on public.farm_credit_assessments for all to authenticated using (true) with check (true);
create policy "farm_processing_batches_authenticated" on public.farm_processing_batches for all to authenticated using (true) with check (true);
create policy "farm_insurance_policies_authenticated" on public.farm_insurance_policies for all to authenticated using (true) with check (true);
create policy "farm_insurance_claims_authenticated" on public.farm_insurance_claims for all to authenticated using (true) with check (true);
create policy "farm_grant_applications_authenticated" on public.farm_grant_applications for all to authenticated using (true) with check (true);
create policy "farm_water_infrastructure_authenticated" on public.farm_water_infrastructure for all to authenticated using (true) with check (true);
create policy "farm_irrigation_events_authenticated" on public.farm_irrigation_events for all to authenticated using (true) with check (true);
create policy "farm_market_commodity_prices_all" on public.farm_market_commodity_prices for select to public using (true);

-- Grant privileges
grant all on all tables in schema public to authenticated, anon, service_role;
grant all on all sequences in schema public to authenticated, anon, service_role;

-- Notify PostgREST schema cache
notify pgrst, 'reload schema';
