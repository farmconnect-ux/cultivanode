-- CultivaNode: Farm Enterprise Subsections
-- 1. Livestock Management
-- 2. Farm Workers Management
-- 3. Farm Inventory Management
-- 4. Farm Financials (Farm Books / Account)
-- 5. Farm Records & Tenure Documentation

-- -----------------------------------------------------------------------------
-- 1. Livestock Management
-- -----------------------------------------------------------------------------
create table if not exists public.farm_livestock (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms (id) on delete cascade,
  animal_type       text not null check (animal_type in ('cattle', 'poultry', 'goat', 'sheep', 'pig', 'fish', 'snail', 'rabbit', 'other')),
  breed             text not null,
  identifier        text not null check (char_length(identifier) between 1 and 80),
  head_count        integer not null default 1 check (head_count >= 0),
  housing_location  text check (housing_location is null or char_length(housing_location) <= 120),
  health_status     text not null default 'healthy' check (health_status in ('healthy', 'treatment', 'quarantine', 'critical')),
  purpose           text not null default 'meat' check (purpose in ('meat', 'dairy', 'eggs', 'breeding', 'multi')),
  notes             text check (notes is null or char_length(notes) <= 1000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists farm_livestock_farm_idx on public.farm_livestock (farm_id);
create index if not exists farm_livestock_type_idx on public.farm_livestock (farm_id, animal_type);

-- -----------------------------------------------------------------------------
-- 2. Farm Workers Management
-- -----------------------------------------------------------------------------
create table if not exists public.farm_workers (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms (id) on delete cascade,
  full_name         text not null check (char_length(full_name) between 2 and 120),
  phone             text check (phone is null or char_length(phone) <= 30),
  role              text not null check (role in ('farm_manager', 'tractor_operator', 'field_worker', 'scout', 'harvester', 'livestock_keeper', 'security', 'casual')),
  employment_type   text not null default 'permanent' check (employment_type in ('permanent', 'seasonal', 'daily_casual')),
  daily_wage_kobo   integer not null default 0 check (daily_wage_kobo >= 0),
  status            text not null default 'active' check (status in ('active', 'inactive', 'on_leave')),
  joined_date       date default current_date,
  emergency_contact text check (emergency_contact is null or char_length(emergency_contact) <= 120),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists farm_workers_farm_idx on public.farm_workers (farm_id);
create index if not exists farm_workers_role_idx on public.farm_workers (farm_id, role);

-- -----------------------------------------------------------------------------
-- 3. Farm Inventory Management
-- -----------------------------------------------------------------------------
create table if not exists public.farm_inventory (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms (id) on delete cascade,
  item_name         text not null check (char_length(item_name) between 2 and 120),
  category          text not null check (category in ('seed', 'fertiliser', 'chemical', 'feed', 'tool_equipment', 'harvest_produce', 'fuel', 'other')),
  quantity          numeric(12, 2) not null default 0 check (quantity >= 0),
  unit              text not null check (unit in ('kg', 'liters', 'bags', 'units', 'tons', 'crates', 'bundles')),
  reorder_threshold numeric(12, 2) default 0 check (reorder_threshold >= 0),
  storage_location  text check (storage_location is null or char_length(storage_location) <= 120),
  unit_cost_kobo    integer not null default 0 check (unit_cost_kobo >= 0),
  expiry_date       date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists farm_inventory_farm_idx on public.farm_inventory (farm_id);
create index if not exists farm_inventory_category_idx on public.farm_inventory (farm_id, category);

-- -----------------------------------------------------------------------------
-- 4. Farm Financials (Farm Books / Account)
-- -----------------------------------------------------------------------------
create table if not exists public.farm_financial_transactions (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms (id) on delete cascade,
  crop_cycle_id     uuid references public.crop_cycles (id) on delete set null,
  type              text not null check (type in ('income', 'expense')),
  category          text not null check (category in ('harvest_sale', 'livestock_sale', 'machinery_service', 'seeds', 'fertilisers', 'chemicals', 'labour_wages', 'feed', 'fuel', 'repairs', 'other')),
  amount_kobo       integer not null check (amount_kobo > 0),
  transaction_date  date not null default current_date,
  receipt_number    text check (receipt_number is null or char_length(receipt_number) <= 60),
  payment_method    text not null default 'cash' check (payment_method in ('cash', 'bank_transfer', 'escrow', 'mobile_money')),
  description       text not null check (char_length(description) between 2 and 500),
  recorded_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists farm_finances_farm_idx on public.farm_financial_transactions (farm_id, transaction_date desc);
create index if not exists farm_finances_type_idx on public.farm_financial_transactions (farm_id, type);

-- -----------------------------------------------------------------------------
-- 5. Farm Records & Tenure Documentation
-- -----------------------------------------------------------------------------
create table if not exists public.farm_general_records (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms (id) on delete cascade,
  record_type       text not null check (record_type in ('land_title', 'lease_agreement', 'water_source', 'irrigation_system', 'environmental_audit', 'certification', 'inspection', 'general')),
  title             text not null check (char_length(title) between 2 and 150),
  details           text check (details is null or char_length(details) <= 2000),
  document_url      text check (document_url is null or char_length(document_url) <= 500),
  recorded_date     date not null default current_date,
  created_at        timestamptz not null default now()
);

create index if not exists farm_general_records_farm_idx on public.farm_general_records (farm_id, recorded_date desc);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------
alter table public.farm_livestock              enable row level security;
alter table public.farm_workers                enable row level security;
alter table public.farm_inventory              enable row level security;
alter table public.farm_financial_transactions enable row level security;
alter table public.farm_general_records        enable row level security;

-- Livestock
create policy farm_livestock_select on public.farm_livestock
  for select using (public.can_view_farm(farm_id));
create policy farm_livestock_all on public.farm_livestock
  for all using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Workers
create policy farm_workers_select on public.farm_workers
  for select using (public.can_view_farm(farm_id));
create policy farm_workers_all on public.farm_workers
  for all using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Inventory
create policy farm_inventory_select on public.farm_inventory
  for select using (public.can_view_farm(farm_id));
create policy farm_inventory_all on public.farm_inventory
  for all using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Financials
create policy farm_finances_select on public.farm_financial_transactions
  for select using (public.can_view_farm(farm_id));
create policy farm_finances_all on public.farm_financial_transactions
  for all using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Records
create policy farm_general_records_select on public.farm_general_records
  for select using (public.can_view_farm(farm_id));
create policy farm_general_records_all on public.farm_general_records
  for all using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));
