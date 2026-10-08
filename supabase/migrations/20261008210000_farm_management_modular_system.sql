-- ==============================================================================
-- CULTIVANODE FARM MANAGEMENT MODULAR DOMAIN ARCHITECTURE
-- ==============================================================================
-- Modular, relational architecture for complete farm operations:
-- 1. Farms, Fields & Plots
-- 2. Agronomic GAP Standards & Versioning
-- 3. Crop Planning & Production Cycles
-- 4. Livestock Enterprise (Groups, Individual Animals, Health Withdrawal, Feeding, Production)
-- 5. Staff, Labour Roster, Attendance & Operational Tasks
-- 6. Machinery Fleet, Usage Logs & Small Equipment
-- 7. Multi-Location Concurrency-Safe Inventory & Transactions
-- 8. Farm Budgets & Financial Ledger Allocations
-- 9. Standard -> Plan -> Actual Variance Tracking
-- 10. IoT Interface
-- ==============================================================================

-- 1. EXTEND FARMS & PLOTS
alter table public.farms
  add column if not exists farm_code text,
  add column if not exists ownership_type text check (ownership_type in ('owned', 'leased', 'family', 'partnership', 'community', 'managed')),
  add column if not exists water_sources text[] default '{}',
  add column if not exists irrigation_systems text[] default '{}',
  add column if not exists slope_type text,
  add column if not exists accessibility_level text,
  add column if not exists soil_information jsonb default '{}'::jsonb,
  add column if not exists status text not null default 'active' check (status in ('active', 'inactive', 'fallow', 'under_development'));

create table if not exists public.plots (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  plot_code text,
  boundary extensions.geography(Polygon, 4326),
  area_ha numeric(12, 4) check (area_ha is null or area_ha > 0),
  area_is_measured boolean not null default false,
  soil_texture text,
  soil_ph numeric(3, 1),
  organic_matter_pct numeric(5, 2),
  irrigation_type text,
  drainage text,
  slope text,
  accessibility text,
  current_crop text,
  previous_crop text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, name)
);
create index if not exists plots_farm_idx on public.plots(farm_id);
create index if not exists plots_boundary_gix on public.plots using gist (boundary);

create table if not exists public.soil_records (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references public.plots(id) on delete cascade,
  tested_on date not null default current_date,
  soil_type text,
  ph numeric(3, 1),
  organic_matter_pct numeric(5, 2),
  nitrogen_pct numeric(5, 3),
  phosphorus_ppm numeric(8, 2),
  potassium_cmol_kg numeric(8, 3),
  lab_name text,
  recommendations text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists soil_records_plot_idx on public.soil_records(plot_id, tested_on desc);

-- 2. AGRONOMIC STANDARDS & BENCHMARKS (VERSIONED ADVISORY)
create table if not exists public.farm_agronomic_standards (
  id uuid primary key default gen_random_uuid(),
  standard_code text not null,
  crop_or_livestock_id text not null,
  variety_or_breed text,
  agro_zone text not null default 'all',
  version text not null default '1.0',
  title text not null,
  description text,
  source_authority text not null default 'IITA_NIHORT_GAP',
  is_active boolean not null default true,
  parameters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (standard_code, version)
);
create index if not exists farm_standards_lookup_idx on public.farm_agronomic_standards(crop_or_livestock_id, agro_zone, is_active);

-- 3. CROP CYCLES & OPERATIONS (FULL LIFECYCLE)
create table if not exists public.crop_cycles (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  plot_id uuid references public.plots(id) on delete set null,
  standard_id uuid references public.farm_agronomic_standards(id) on delete set null,
  crop_id text not null,
  variety_id text,
  season text not null,
  status text not null default 'planning' check (status in ('planning', 'land_preparation', 'planting', 'establishment', 'maintenance', 'harvesting', 'completed', 'abandoned')),
  current_stage text not null default 'Planning',
  target_area_ha numeric(10, 2) not null check (target_area_ha > 0),
  actual_area_ha numeric(10, 2),
  planting_date date not null,
  expected_harvest_date date not null,
  actual_harvest_date date,
  target_yield_kg numeric(12, 2) not null check (target_yield_kg >= 0),
  actual_yield_kg numeric(12, 2) default 0,
  seed_quantity_kg numeric(10, 2),
  plant_population_per_ha integer,
  health_score numeric(3, 2) default 1.0 check (health_score between 0 and 1),
  health_status text default 'healthy',
  estimated_budget_kobo bigint default 0 check (estimated_budget_kobo >= 0),
  actual_cost_kobo bigint default 0 check (actual_cost_kobo >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crop_cycles_farm_idx on public.crop_cycles(farm_id, status);
create index if not exists crop_cycles_plot_idx on public.crop_cycles(plot_id);

create table if not exists public.crop_cycle_operations (
  id uuid primary key default gen_random_uuid(),
  crop_cycle_id uuid not null references public.crop_cycles(id) on delete cascade,
  operation_type text not null,
  name text not null,
  stage text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'skipped', 'cancelled')),
  scheduled_date date not null,
  completed_date date,
  assigned_worker_id uuid references public.profiles(id) on delete set null,
  required_machinery text,
  required_inputs jsonb default '[]'::jsonb,
  actual_cost_kobo bigint default 0,
  notes text,
  evidence_urls text[] default '{}',
  created_at timestamptz not null default now()
);
create index if not exists crop_ops_cycle_idx on public.crop_cycle_operations(crop_cycle_id, status);

create table if not exists public.crop_observations (
  id uuid primary key default gen_random_uuid(),
  crop_cycle_id uuid not null references public.crop_cycles(id) on delete cascade,
  observed_at timestamptz not null default now(),
  category text not null check (category in ('pest', 'disease', 'nutrient_deficiency', 'weed_infestation', 'water_stress', 'general')),
  severity text not null default 'low' check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null,
  description text not null,
  location extensions.geography(Point, 4326),
  photo_urls text[] default '{}',
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null
);
create index if not exists crop_obs_cycle_idx on public.crop_observations(crop_cycle_id, resolved);

-- 4. LIVESTOCK ENTERPRISE
create table if not exists public.farm_livestock_groups (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  group_name text not null,
  animal_type text not null check (animal_type in ('cattle', 'goats', 'sheep', 'poultry', 'pigs', 'fish', 'rabbits', 'snails', 'other')),
  breed text,
  population integer not null check (population >= 0),
  housing_location text,
  age_weeks integer,
  health_status text not null default 'healthy' check (health_status in ('healthy', 'monitoring', 'sick', 'quarantined')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists livestock_groups_farm_idx on public.farm_livestock_groups(farm_id);

create table if not exists public.farm_livestock_animals (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  group_id uuid references public.farm_livestock_groups(id) on delete set null,
  tag_number text not null,
  rfid_code text,
  species text not null,
  breed text,
  sex text not null check (sex in ('male', 'female', 'castrated')),
  birth_date date,
  acquisition_date date not null default current_date,
  acquisition_source text,
  current_weight_kg numeric(8, 2),
  housing_location text,
  health_status text not null default 'healthy' check (health_status in ('healthy', 'treatment', 'quarantine', 'deceased', 'sold')),
  sire_tag text,
  dam_tag text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, tag_number)
);
create index if not exists livestock_animals_farm_idx on public.farm_livestock_animals(farm_id, health_status);

create table if not exists public.farm_livestock_health_events (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid references public.farm_livestock_animals(id) on delete set null,
  group_id uuid references public.farm_livestock_groups(id) on delete set null,
  event_type text not null check (event_type in ('vaccination', 'treatment', 'disease_diagnosis', 'vet_visit', 'routine_check')),
  disease_or_condition text,
  medication_name text,
  dosage text,
  administered_on date not null default current_date,
  vet_name text,
  cost_kobo bigint default 0 check (cost_kobo >= 0),
  withdrawal_period_days integer default 0,
  withdrawal_end_date date,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists livestock_health_farm_idx on public.farm_livestock_health_events(farm_id, withdrawal_end_date);

create table if not exists public.farm_livestock_feedings (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  group_id uuid references public.farm_livestock_groups(id) on delete set null,
  feed_type text not null,
  quantity_kg numeric(10, 2) not null check (quantity_kg > 0),
  cost_kobo bigint default 0 check (cost_kobo >= 0),
  feeding_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists livestock_feeding_farm_idx on public.farm_livestock_feedings(farm_id, feeding_date desc);

create table if not exists public.farm_livestock_production_logs (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  product_type text not null check (product_type in ('eggs', 'milk', 'meat', 'fish', 'honey', 'manure', 'other')),
  quantity numeric(10, 2) not null check (quantity > 0),
  unit text not null,
  quality_grade text,
  log_date date not null default current_date,
  destination text not null default 'inventory' check (destination in ('inventory', 'marketplace', 'home_consumption', 'spoilage')),
  revenue_kobo bigint default 0,
  created_at timestamptz not null default now()
);
create index if not exists livestock_prod_farm_idx on public.farm_livestock_production_logs(farm_id, log_date desc);

-- 5. STAFF, LABOUR, ATTENDANCE & TASKS
create table if not exists public.farm_workers (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (role in ('farm_manager', 'agronomist', 'operator', 'storekeeper', 'labourer', 'vet_assistant', 'other')),
  employment_type text not null default 'permanent' check (employment_type in ('permanent', 'casual', 'seasonal', 'contractor')),
  daily_wage_kobo bigint default 0 check (daily_wage_kobo >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'on_leave')),
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists farm_workers_farm_idx on public.farm_workers(farm_id, status);

create table if not exists public.farm_attendance_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  worker_id uuid not null references public.farm_workers(id) on delete cascade,
  clock_in_at timestamptz not null default now(),
  clock_out_at timestamptz,
  clock_in_location extensions.geography(Point, 4326),
  shift_name text default 'Day Shift',
  hours_worked numeric(4, 2),
  status text not null default 'present' check (status in ('present', 'late', 'half_day', 'absent', 'on_leave')),
  overtime_hours numeric(4, 2) default 0,
  daily_pay_kobo bigint default 0,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists farm_attendance_farm_idx on public.farm_attendance_records(farm_id, clock_in_at desc);

create table if not exists public.farm_operational_tasks (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  plot_id uuid references public.plots(id) on delete set null,
  crop_cycle_id uuid references public.crop_cycles(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'general',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'planned' check (status in ('planned', 'assigned', 'in_progress', 'blocked', 'completed', 'cancelled', 'overdue')),
  assigned_worker_id uuid references public.farm_workers(id) on delete set null,
  start_date date not null default current_date,
  due_date date not null default current_date,
  completed_date date,
  estimated_duration_hours numeric(6, 2),
  actual_duration_hours numeric(6, 2),
  direct_cost_kobo bigint default 0,
  evidence_urls text[] default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists farm_tasks_farm_idx on public.farm_operational_tasks(farm_id, status, due_date);

-- 6. MACHINERY FLEET, USAGE & EQUIPMENT
create table if not exists public.farm_machinery_assets (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  asset_code text not null,
  name text not null,
  category text not null check (category in ('tractor', 'plough', 'harrow', 'ridger', 'planter', 'harvester', 'boom_sprayer', 'water_pump', 'generator', 'trailer', 'truck', 'processor', 'other')),
  manufacturer text,
  model text,
  registration_number text,
  fuel_type text not null default 'diesel' check (fuel_type in ('diesel', 'petrol', 'electric', 'manual', 'hybrid')),
  current_status text not null default 'available' check (current_status in ('available', 'in_use', 'reserved', 'under_maintenance', 'out_of_service', 'hired_out')),
  engine_hours numeric(10, 2) not null default 0 check (engine_hours >= 0),
  hourly_internal_rate_kobo bigint default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, asset_code)
);
create index if not exists machinery_assets_farm_idx on public.farm_machinery_assets(farm_id, current_status);

create table if not exists public.farm_machinery_usage_logs (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  machinery_id uuid not null references public.farm_machinery_assets(id) on delete cascade,
  operator_id uuid references public.farm_workers(id) on delete set null,
  plot_id uuid references public.plots(id) on delete set null,
  operation_name text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  hours_operated numeric(6, 2) not null check (hours_operated >= 0),
  area_covered_ha numeric(8, 2) default 0,
  fuel_litres_consumed numeric(8, 2) default 0,
  operational_cost_kobo bigint default 0,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists machinery_usage_farm_idx on public.farm_machinery_usage_logs(farm_id, start_time desc);

create table if not exists public.farm_equipment_assets (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  equipment_name text not null,
  category text not null check (category in ('knapsack_sprayer', 'water_pump', 'scale', 'ppe', 'hand_tool', 'irrigation_fitting', 'testing_kit', 'other')),
  quantity integer not null default 1 check (quantity >= 0),
  condition text not null default 'good' check (condition in ('new', 'good', 'fair', 'needs_repair', 'damaged')),
  storage_location text,
  assigned_worker_id uuid references public.farm_workers(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists farm_equipment_farm_idx on public.farm_equipment_assets(farm_id);

-- 7. MULTI-LOCATION CONCURRENCY-SAFE INVENTORY
create table if not exists public.farm_inventory_locations (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  location_name text not null,
  location_type text not null check (location_type in ('main_warehouse', 'farm_store', 'field_shed', 'feed_store', 'cold_room', 'machinery_shed', 'livestock_store')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (farm_id, location_name)
);
create index if not exists inv_locations_farm_idx on public.farm_inventory_locations(farm_id);

create table if not exists public.farm_inventory (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  item_name text not null,
  category text not null check (category in ('seeds', 'fertiliser', 'chemicals', 'livestock_feed', 'veterinary_medicine', 'supplies', 'spare_parts', 'produce', 'other')),
  quantity numeric(12, 3) not null default 0 check (quantity >= 0),
  reserved_quantity numeric(12, 3) not null default 0 check (reserved_quantity >= 0 and reserved_quantity <= quantity),
  unit text not null,
  reorder_threshold numeric(12, 3) not null default 0,
  unit_cost_kobo bigint default 0 check (unit_cost_kobo >= 0),
  storage_location text,
  expiry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists farm_inv_farm_idx on public.farm_inventory(farm_id, category);

create table if not exists public.farm_inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  inventory_id uuid not null references public.farm_inventory(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('purchase', 'receipt', 'transfer', 'issue_to_field', 'consumption', 'adjustment', 'return', 'loss', 'damage', 'sale', 'reservation', 'release')),
  quantity numeric(12, 3) not null,
  source_location_id uuid references public.farm_inventory_locations(id) on delete set null,
  dest_location_id uuid references public.farm_inventory_locations(id) on delete set null,
  batch_number text,
  crop_cycle_id uuid references public.crop_cycles(id) on delete set null,
  group_id uuid references public.farm_livestock_groups(id) on delete set null,
  reference_order_id uuid,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists farm_inv_tx_farm_idx on public.farm_inventory_transactions(farm_id, created_at desc);

-- CONCURRENCY-SAFE ATOMIC INVENTORY MOVEMENT RPC
create or replace function public.record_farm_inventory_movement(
  p_farm_id uuid,
  p_inventory_id uuid,
  p_transaction_type text,
  p_quantity numeric,
  p_source_location_id uuid default null,
  p_dest_location_id uuid default null,
  p_batch_number text default null,
  p_notes text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_current_stock numeric;
  v_current_reserved numeric;
  v_new_quantity numeric;
  v_tx_id uuid;
begin
  -- 1. Row-level lock to prevent race conditions
  select quantity, reserved_quantity
    into v_current_stock, v_current_reserved
    from public.farm_inventory
   where id = p_inventory_id and farm_id = p_farm_id
     for update;

  if not found then
    raise exception 'Inventory item not found on this farm.';
  end if;

  -- 2. Validate zero negative stock invariant
  if p_transaction_type in ('issue_to_field', 'consumption', 'loss', 'damage', 'sale') then
    if (v_current_stock - v_current_reserved) < p_quantity then
      raise exception 'Zero negative stock invariant violated: Available stock (% minus reserved %) is insufficient for requested deduction (%).',
        v_current_stock, v_current_reserved, p_quantity;
    end if;
    v_new_quantity := v_current_stock - p_quantity;
  elsif p_transaction_type in ('purchase', 'receipt', 'return', 'adjustment') then
    v_new_quantity := v_current_stock + p_quantity;
  elsif p_transaction_type = 'reservation' then
    if (v_current_stock - v_current_reserved) < p_quantity then
      raise exception 'Cannot reserve: Available stock is insufficient.';
    end if;
    update public.farm_inventory
       set reserved_quantity = reserved_quantity + p_quantity,
           updated_at = now()
     where id = p_inventory_id;
    return jsonb_build_object('success', true, 'action', 'reserved', 'reserved_quantity', v_current_reserved + p_quantity);
  elsif p_transaction_type = 'release' then
    update public.farm_inventory
       set reserved_quantity = greatest(0, reserved_quantity - p_quantity),
           updated_at = now()
     where id = p_inventory_id;
    return jsonb_build_object('success', true, 'action', 'released');
  else
    v_new_quantity := v_current_stock;
  end if;

  -- 3. Update physical stock
  update public.farm_inventory
     set quantity = v_new_quantity,
         updated_at = now()
   where id = p_inventory_id;

  -- 4. Record audit transaction
  insert into public.farm_inventory_transactions (
    farm_id, inventory_id, transaction_type, quantity,
    source_location_id, dest_location_id, batch_number, notes, recorded_by
  ) values (
    p_farm_id, p_inventory_id, p_transaction_type, p_quantity,
    p_source_location_id, p_dest_location_id, p_batch_number, p_notes, auth.uid()
  ) returning id into v_tx_id;

  return jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'new_quantity', v_new_quantity
  );
end;
$$;

-- 8. FARM BUDGETS & FINANCIAL ACCOUNTS
create table if not exists public.farm_budgets (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  title text not null,
  fiscal_year integer not null default extract(year from current_date)::integer,
  enterprise_type text not null check (enterprise_type in ('crop', 'livestock', 'whole_farm', 'machinery', 'processing')),
  crop_cycle_id uuid references public.crop_cycles(id) on delete set null,
  total_budget_kobo bigint not null default 0 check (total_budget_kobo >= 0),
  status text not null default 'draft' check (status in ('draft', 'approved', 'active', 'closed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists farm_budgets_farm_idx on public.farm_budgets(farm_id, fiscal_year);

create table if not exists public.farm_budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.farm_budgets(id) on delete cascade,
  category text not null,
  line_item text not null,
  budgeted_amount_kobo bigint not null default 0 check (budgeted_amount_kobo >= 0),
  actual_amount_kobo bigint not null default 0 check (actual_amount_kobo >= 0),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists budget_lines_idx on public.farm_budget_lines(budget_id);

-- 9. STANDARD -> PLAN -> ACTUAL VARIANCE TRACKING
create table if not exists public.farm_plan_actual_variances (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  standard_id uuid references public.farm_agronomic_standards(id) on delete set null,
  crop_cycle_id uuid references public.crop_cycles(id) on delete set null,
  group_id uuid references public.farm_livestock_groups(id) on delete set null,
  entity_type text not null check (entity_type in ('crop', 'livestock', 'machinery', 'labour', 'inventory')),
  metric_name text not null,
  unit text not null,
  standard_value numeric(12, 3) not null,
  plan_value numeric(12, 3) not null,
  actual_value numeric(12, 3) not null,
  variance_standard_vs_actual numeric(12, 3) generated always as (actual_value - standard_value) stored,
  variance_plan_vs_actual numeric(12, 3) generated always as (actual_value - plan_value) stored,
  is_farmer_override boolean not null default false,
  farmer_deviation_reason text,
  recorded_at timestamptz not null default now()
);
create index if not exists farm_variance_farm_idx on public.farm_plan_actual_variances(farm_id, entity_type);

-- 10. IOT TELEMETRY INTERFACE
create table if not exists public.farm_iot_telemetry (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  device_id text not null,
  device_type text not null check (device_type in ('soil_sensor', 'weather_station', 'gps_tracker', 'rfid_gate', 'water_flow', 'storage_temp')),
  plot_id uuid references public.plots(id) on delete set null,
  telemetry_data jsonb not null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists farm_iot_farm_idx on public.farm_iot_telemetry(farm_id, recorded_at desc);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.plots enable row level security;
alter table public.soil_records enable row level security;
alter table public.farm_agronomic_standards enable row level security;
alter table public.crop_cycles enable row level security;
alter table public.crop_cycle_operations enable row level security;
alter table public.crop_observations enable row level security;
alter table public.farm_livestock_groups enable row level security;
alter table public.farm_livestock_animals enable row level security;
alter table public.farm_livestock_health_events enable row level security;
alter table public.farm_livestock_feedings enable row level security;
alter table public.farm_livestock_production_logs enable row level security;
alter table public.farm_workers enable row level security;
alter table public.farm_attendance_records enable row level security;
alter table public.farm_operational_tasks enable row level security;
alter table public.farm_machinery_assets enable row level security;
alter table public.farm_machinery_usage_logs enable row level security;
alter table public.farm_equipment_assets enable row level security;
alter table public.farm_inventory_locations enable row level security;
alter table public.farm_inventory enable row level security;
alter table public.farm_inventory_transactions enable row level security;
alter table public.farm_budgets enable row level security;
alter table public.farm_budget_lines enable row level security;
alter table public.farm_plan_actual_variances enable row level security;
alter table public.farm_iot_telemetry enable row level security;

-- Agronomic standards are public read to all authenticated users
create policy "Standards are readable by all authenticated users"
  on public.farm_agronomic_standards for select to authenticated using (true);

-- Plots policies
create policy "Plots viewable by farm members" on public.plots
  for select to authenticated using (public.can_view_farm(farm_id));
create policy "Plots editable by farm members" on public.plots
  for insert to authenticated with check (public.can_edit_farm(farm_id));
create policy "Plots updatable by farm members" on public.plots
  for update to authenticated using (public.can_edit_farm(farm_id));
create policy "Plots deletable by farm members" on public.plots
  for delete to authenticated using (public.can_edit_farm(farm_id));

-- Helper macro policies for farm-scoped tables
do $$
declare
  tbl text;
  tables text[] := array[
    'crop_cycles', 'farm_livestock_groups', 'farm_livestock_animals',
    'farm_livestock_health_events', 'farm_livestock_feedings', 'farm_livestock_production_logs',
    'farm_workers', 'farm_attendance_records', 'farm_operational_tasks',
    'farm_machinery_assets', 'farm_machinery_usage_logs', 'farm_equipment_assets',
    'farm_inventory_locations', 'farm_inventory', 'farm_inventory_transactions',
    'farm_budgets', 'farm_plan_actual_variances', 'farm_iot_telemetry'
  ];
begin
  foreach tbl in array tables loop
    execute format('
      create policy "%s_view" on public.%I for select to authenticated using (public.can_view_farm(farm_id));
      create policy "%s_insert" on public.%I for insert to authenticated with check (public.can_edit_farm(farm_id));
      create policy "%s_update" on public.%I for update to authenticated using (public.can_edit_farm(farm_id));
      create policy "%s_delete" on public.%I for delete to authenticated using (public.can_edit_farm(farm_id));
    ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
  end loop;
end $$;

-- Crop cycle sub-tables
create policy "crop_ops_select" on public.crop_cycle_operations for select to authenticated
  using (exists (select 1 from public.crop_cycles c where c.id = crop_cycle_id and public.can_view_farm(c.farm_id)));
create policy "crop_ops_modify" on public.crop_cycle_operations for all to authenticated
  using (exists (select 1 from public.crop_cycles c where c.id = crop_cycle_id and public.can_edit_farm(c.farm_id)));

create policy "crop_obs_select" on public.crop_observations for select to authenticated
  using (exists (select 1 from public.crop_cycles c where c.id = crop_cycle_id and public.can_view_farm(c.farm_id)));
create policy "crop_obs_modify" on public.crop_observations for all to authenticated
  using (exists (select 1 from public.crop_cycles c where c.id = crop_cycle_id and public.can_edit_farm(c.farm_id)));

create policy "budget_lines_select" on public.farm_budget_lines for select to authenticated
  using (exists (select 1 from public.farm_budgets b where b.id = budget_id and public.can_view_farm(b.farm_id)));
create policy "budget_lines_modify" on public.farm_budget_lines for all to authenticated
  using (exists (select 1 from public.farm_budgets b where b.id = budget_id and public.can_edit_farm(b.farm_id)));

-- 12. SEED STANDARDS
insert into public.farm_agronomic_standards (
  standard_code, crop_or_livestock_id, agro_zone, version, title, description, parameters
) values
(
  'GAP_MAIZE_V1',
  'maize',
  'rainforest',
  '1.0',
  'IITA GAP Maize Production Standard',
  'Calibrated Good Agricultural Practices for grain maize in South-West Nigeria',
  '{
    "seed_rate_kg_ha": 20.0,
    "plant_density_per_ha": 53333,
    "spacing_cm": "75x25",
    "basal_npk_15_15_15_kg_ha": 250.0,
    "topdress_urea_kg_ha": 150.0,
    "target_yield_kg_ha": 4000.0,
    "primary_tillage_l_ha": 20.0,
    "secondary_tillage_l_ha": 12.0
  }'::jsonb
),
(
  'GAP_CASSAVA_V1',
  'cassava',
  'derived_savanna',
  '1.0',
  'IITA Cassava Production Standard',
  'Calibrated GAP for TME 419 and Vitamin A yellow cassava',
  '{
    "stem_bundles_ha": 50,
    "plant_density_per_ha": 10000,
    "spacing_cm": "100x100",
    "basal_npk_15_15_15_kg_ha": 200.0,
    "target_yield_kg_ha": 25000.0
  }'::jsonb
),
(
  'LIVESTOCK_BROILER_FEED_V1',
  'poultry',
  'all',
  '1.0',
  'Commercial Broiler Feeding Standard',
  'Target Feed Conversion Ratio (FCR) benchmarks across starter, grower, and finisher phases',
  '{
    "target_fcr": 1.65,
    "starter_feed_g_bird": 1000,
    "grower_feed_g_bird": 1500,
    "finisher_feed_g_bird": 1800,
    "acceptable_mortality_pct": 3.5
  }'::jsonb
)
on conflict (standard_code, version) do nothing;
