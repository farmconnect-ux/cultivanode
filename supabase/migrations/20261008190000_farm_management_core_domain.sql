-- CultivaNode: Farm Management Core Domain Migration
-- Master Build: Farm & Fields, Standard -> Plan -> Actual, Livestock Deep Domain,
-- Staff, Attendance, Tasks, Machinery, Equipment, Multi-Location Inventory & Budgets

------------------------------------------------------------------------------------------------
-- 1. Standard -> Plan -> Actual Architecture & Agronomic Standards
------------------------------------------------------------------------------------------------

create table if not exists public.farm_agronomic_standards (
  id                    text primary key check (id ~ '^[A-Z0-9_]{3,80}$'),
  category              text not null check (category in ('planting', 'fertiliser', 'spray', 'irrigation', 'livestock_feed', 'vaccination', 'machinery_benchmark', 'yield_benchmark', 'cost_benchmark', 'general')),
  crop_id               text check (crop_id is null or char_length(crop_id) <= 60),
  livestock_type        text check (livestock_type is null or char_length(livestock_type) <= 60),
  title                 text not null check (char_length(title) between 3 and 160),
  version               integer not null default 1 check (version >= 1),
  effective_from        date not null default current_date,
  effective_to          date,
  baseline_parameters   jsonb not null default '{}'::jsonb,
  mandated_operations   text[] not null default '{}'::text[],
  restricted_inputs     text[] not null default '{}'::text[],
  approved_by           text not null check (char_length(approved_by) between 2 and 120),
  status                text not null default 'published' check (status in ('draft', 'published', 'superseded', 'deprecated')),
  created_at            timestamptz not null default now()
);

create table if not exists public.farm_plan_actual_variances (
  id                          uuid primary key default gen_random_uuid(),
  farm_id                     uuid not null references public.farms (id) on delete cascade,
  entity_type                 text not null check (entity_type in ('crop_cycle', 'crop_operation', 'livestock_event', 'machinery_usage', 'input_application', 'budget_line')),
  entity_id                   uuid not null,
  standard_id                 text references public.farm_agronomic_standards (id) on delete set null,
  standard_version            integer default 1,
  is_farmer_override          boolean not null default false,
  metric_name                 text not null check (char_length(metric_name) between 2 and 60),
  unit                        text not null check (char_length(unit) between 1 and 30),
  standard_value              numeric(12, 2) not null default 0,
  plan_value                  numeric(12, 2) not null default 0,
  actual_value                numeric(12, 2) not null default 0,
  standard_vs_plan_variance   numeric(12, 2) generated always as (plan_value - standard_value) stored,
  standard_vs_actual_variance numeric(12, 2) generated always as (actual_value - standard_value) stored,
  plan_vs_actual_variance     numeric(12, 2) generated always as (actual_value - plan_value) stored,
  farmer_deviation_reason     text check (farmer_deviation_reason is null or char_length(farmer_deviation_reason) <= 1000),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists farm_variances_farm_idx on public.farm_plan_actual_variances (farm_id, entity_type);

------------------------------------------------------------------------------------------------
-- 2. Farm & Field Management Enhancements
------------------------------------------------------------------------------------------------

alter table public.farms
  add column if not exists farm_code text unique check (farm_code is null or char_length(farm_code) <= 40),
  add column if not exists ownership_type text not null default 'owned' check (ownership_type in ('owned', 'leased', 'family', 'partnership', 'community_land', 'managed')),
  add column if not exists manager_id uuid references public.profiles (id) on delete set null,
  add column if not exists water_source text check (water_source is null or char_length(water_source) <= 120),
  add column if not exists irrigation_system text check (irrigation_system is null or char_length(irrigation_system) <= 120),
  add column if not exists photos jsonb not null default '[]'::jsonb,
  add column if not exists notes text check (notes is null or char_length(notes) <= 2000);

alter table public.plots
  add column if not exists plot_code text check (plot_code is null or char_length(plot_code) <= 40),
  add column if not exists accessibility text check (accessibility is null or char_length(accessibility) <= 80),
  add column if not exists current_crop text check (current_crop is null or char_length(current_crop) <= 80),
  add column if not exists previous_crop text check (previous_crop is null or char_length(previous_crop) <= 80),
  add column if not exists slope text check (slope is null or slope in ('flat', 'gentle', 'moderate', 'steep')),
  add column if not exists photos jsonb not null default '[]'::jsonb;

------------------------------------------------------------------------------------------------
-- 3. Livestock Deep Domain (Individual Animals, Health, Feeding, Breeding, Production)
------------------------------------------------------------------------------------------------

create table if not exists public.farm_livestock_animals (
  id                    uuid primary key default gen_random_uuid(),
  farm_id               uuid not null references public.farms (id) on delete cascade,
  tag_number            text not null check (char_length(tag_number) between 1 and 60),
  rfid_number           text check (rfid_number is null or char_length(rfid_number) <= 60),
  animal_type           text not null check (animal_type in ('cattle', 'goat', 'sheep', 'pig', 'poultry', 'fish', 'rabbit', 'snail', 'other')),
  breed                 text not null check (char_length(breed) between 1 and 80),
  sex                   text not null check (sex in ('male', 'female')),
  date_of_birth         date,
  acquisition_date      date not null default current_date,
  acquisition_source    text not null default 'born_on_farm' check (acquisition_source in ('born_on_farm', 'purchased', 'gifted', 'leased')),
  sire_tag              text check (sire_tag is null or char_length(sire_tag) <= 60),
  dam_tag               text check (dam_tag is null or char_length(dam_tag) <= 60),
  current_weight_kg     numeric(8, 2) check (current_weight_kg is null or current_weight_kg >= 0),
  housing_location      text check (housing_location is null or char_length(housing_location) <= 120),
  status                text not null default 'active' check (status in ('active', 'sold', 'slaughtered', 'deceased', 'quarantined')),
  notes                 text check (notes is null or char_length(notes) <= 1000),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (farm_id, tag_number)
);

create index if not exists livestock_animals_farm_idx on public.farm_livestock_animals (farm_id, animal_type);

create table if not exists public.farm_livestock_health_events (
  id                      uuid primary key default gen_random_uuid(),
  farm_id                 uuid not null references public.farms (id) on delete cascade,
  animal_id               uuid references public.farm_livestock_animals (id) on delete cascade,
  group_id                uuid references public.farm_livestock (id) on delete cascade,
  event_type              text not null check (event_type in ('vaccination', 'treatment', 'disease_symptom', 'vet_visit', 'routine_check')),
  disease_or_condition    text check (disease_or_condition is null or char_length(disease_or_condition) <= 120),
  symptoms                text check (symptoms is null or char_length(symptoms) <= 500),
  medication_name         text check (medication_name is null or char_length(medication_name) <= 120),
  dosage                  text check (dosage is null or char_length(dosage) <= 80),
  administered_on         date not null default current_date,
  withdrawal_period_days  integer not null default 0 check (withdrawal_period_days >= 0),
  withdrawal_end_date     date,
  vet_name                text check (vet_name is null or char_length(vet_name) <= 120),
  cost_kobo               integer not null default 0 check (cost_kobo >= 0),
  notes                   text check (notes is null or char_length(notes) <= 1000),
  recorded_by             uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now()
);

create index if not exists livestock_health_farm_idx on public.farm_livestock_health_events (farm_id, administered_on desc);

create table if not exists public.farm_livestock_feedings (
  id                      uuid primary key default gen_random_uuid(),
  farm_id                 uuid not null references public.farms (id) on delete cascade,
  group_id                uuid references public.farm_livestock (id) on delete cascade,
  animal_id               uuid references public.farm_livestock_animals (id) on delete cascade,
  feed_item_id            uuid references public.farm_inventory (id) on delete set null,
  feed_name               text not null check (char_length(feed_name) between 2 and 120),
  quantity_kg             numeric(10, 2) not null check (quantity_kg > 0),
  cost_kobo               integer not null default 0 check (cost_kobo >= 0),
  feeding_date            date not null default current_date,
  waste_kg                numeric(10, 2) not null default 0 check (waste_kg >= 0),
  notes                   text check (notes is null or char_length(notes) <= 500),
  recorded_by             uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now()
);

create index if not exists livestock_feedings_farm_idx on public.farm_livestock_feedings (farm_id, feeding_date desc);

create table if not exists public.farm_livestock_breeding_records (
  id                      uuid primary key default gen_random_uuid(),
  farm_id                 uuid not null references public.farms (id) on delete cascade,
  dam_id                  uuid not null references public.farm_livestock_animals (id) on delete cascade,
  sire_tag                text check (sire_tag is null or char_length(sire_tag) <= 60),
  breeding_method         text not null default 'natural' check (breeding_method in ('natural', 'artificial_insemination')),
  service_date            date not null,
  pregnancy_check_date    date,
  pregnancy_status        text not null default 'pending' check (pregnancy_status in ('pending', 'confirmed', 'not_pregnant')),
  expected_birth_date     date,
  actual_birth_date       date,
  offspring_count         integer not null default 0 check (offspring_count >= 0),
  notes                   text check (notes is null or char_length(notes) <= 1000),
  created_at              timestamptz not null default now()
);

create index if not exists livestock_breeding_farm_idx on public.farm_livestock_breeding_records (farm_id, service_date desc);

create table if not exists public.farm_livestock_production_logs (
  id                      uuid primary key default gen_random_uuid(),
  farm_id                 uuid not null references public.farms (id) on delete cascade,
  group_id                uuid references public.farm_livestock (id) on delete set null,
  animal_id               uuid references public.farm_livestock_animals (id) on delete set null,
  product_type            text not null check (product_type in ('eggs', 'milk', 'meat', 'fish', 'honey', 'wool', 'manure', 'other')),
  quantity                numeric(12, 2) not null check (quantity > 0),
  unit                    text not null check (unit in ('liters', 'crates', 'kg', 'units', 'pieces', 'tons')),
  production_date         date not null default current_date,
  quality_grade           text not null default 'standard' check (quality_grade in ('grade_a', 'grade_b', 'standard')),
  storage_location        text check (storage_location is null or char_length(storage_location) <= 120),
  inventory_item_id       uuid references public.farm_inventory (id) on delete set null,
  marketplace_listing_id  uuid references public.marketplace_listings (id) on delete set null,
  recorded_by             uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now()
);

create index if not exists livestock_production_farm_idx on public.farm_livestock_production_logs (farm_id, production_date desc);

------------------------------------------------------------------------------------------------
-- 4. Staff, Attendance & Unified Task Management
------------------------------------------------------------------------------------------------

create table if not exists public.farm_attendance_records (
  id                      uuid primary key default gen_random_uuid(),
  farm_id                 uuid not null references public.farms (id) on delete cascade,
  worker_id               uuid not null references public.farm_workers (id) on delete cascade,
  attendance_date         date not null default current_date,
  clock_in_time           timestamptz,
  clock_out_time          timestamptz,
  clock_in_lat            numeric(9, 6),
  clock_in_lng            numeric(9, 6),
  status                  text not null default 'present' check (status in ('present', 'absent', 'late', 'excused_leave', 'half_day')),
  overtime_minutes        integer not null default 0 check (overtime_minutes >= 0),
  daily_wage_kobo         integer not null default 0 check (daily_wage_kobo >= 0),
  notes                   text check (notes is null or char_length(notes) <= 500),
  recorded_by             uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now(),
  unique (worker_id, attendance_date)
);

create index if not exists farm_attendance_farm_idx on public.farm_attendance_records (farm_id, attendance_date desc);

create table if not exists public.farm_operational_tasks (
  id                        uuid primary key default gen_random_uuid(),
  farm_id                   uuid not null references public.farms (id) on delete cascade,
  plot_id                   uuid references public.plots (id) on delete set null,
  crop_cycle_id             uuid references public.crop_cycles (id) on delete set null,
  livestock_group_id        uuid references public.farm_livestock (id) on delete set null,
  title                     text not null check (char_length(title) between 2 and 140),
  description               text check (description is null or char_length(description) <= 1000),
  assigned_worker_id        uuid references public.farm_workers (id) on delete set null,
  priority                  text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status                    text not null default 'PLANNED' check (status in ('PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED', 'OVERDUE')),
  start_date                date not null,
  due_date                  date not null check (due_date >= start_date),
  completed_at              timestamptz,
  estimated_duration_hours  numeric(5, 1) not null default 0 check (estimated_duration_hours >= 0),
  actual_duration_hours     numeric(5, 1) not null default 0 check (actual_duration_hours >= 0),
  estimated_cost_kobo       integer not null default 0 check (estimated_cost_kobo >= 0),
  actual_cost_kobo          integer not null default 0 check (actual_cost_kobo >= 0),
  evidence_photo_url        text check (evidence_photo_url is null or char_length(evidence_photo_url) <= 500),
  notes                     text check (notes is null or char_length(notes) <= 1000),
  created_by                uuid references public.profiles (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists farm_tasks_farm_idx on public.farm_operational_tasks (farm_id, status, due_date);

------------------------------------------------------------------------------------------------
-- 5. Machinery & Equipment Management (Assets, Usage Logs, Maintenance)
------------------------------------------------------------------------------------------------

create table if not exists public.farm_machinery_assets (
  id                    uuid primary key default gen_random_uuid(),
  farm_id               uuid not null references public.farms (id) on delete cascade,
  asset_code            text not null check (char_length(asset_code) between 2 and 40),
  machinery_type        text not null check (machinery_type in ('tractor', 'plough', 'harrow', 'ridger', 'planter', 'harvester', 'sprayer', 'pump', 'generator', 'trailer', 'truck', 'processing')),
  make                  text not null check (char_length(make) between 2 and 80),
  model                 text not null check (char_length(model) between 2 and 80),
  registration_number   text check (registration_number is null or char_length(registration_number) <= 40),
  serial_number         text check (serial_number is null or char_length(serial_number) <= 60),
  year_manufactured     integer check (year_manufactured is null or year_manufactured between 1950 and 2050),
  purchase_date         date,
  purchase_cost_kobo    bigint not null default 0 check (purchase_cost_kobo >= 0),
  current_status        text not null default 'AVAILABLE' check (current_status in ('AVAILABLE', 'IN_USE', 'RESERVED', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'HIRED_OUT', 'SOLD', 'LOST')),
  engine_hours          numeric(8, 1) not null default 0 check (engine_hours >= 0),
  fuel_type             text not null default 'diesel' check (fuel_type in ('diesel', 'petrol', 'electric', 'manual')),
  default_operator_id   uuid references public.farm_workers (id) on delete set null,
  photo_url             text check (photo_url is null or char_length(photo_url) <= 500),
  notes                 text check (notes is null or char_length(notes) <= 1000),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (farm_id, asset_code)
);

create index if not exists farm_machinery_farm_idx on public.farm_machinery_assets (farm_id, current_status);

create table if not exists public.farm_machinery_usage_logs (
  id                    uuid primary key default gen_random_uuid(),
  machinery_id          uuid not null references public.farm_machinery_assets (id) on delete cascade,
  farm_id               uuid not null references public.farms (id) on delete cascade,
  plot_id               uuid references public.plots (id) on delete set null,
  operation_id          uuid references public.crop_cycle_operations (id) on delete set null,
  operator_id           uuid references public.farm_workers (id) on delete set null,
  log_date              date not null default current_date,
  start_engine_hours    numeric(8, 1) not null check (start_engine_hours >= 0),
  end_engine_hours      numeric(8, 1) not null check (end_engine_hours >= start_engine_hours),
  hours_operated        numeric(6, 2) generated always as (end_engine_hours - start_engine_hours) stored,
  area_covered_ha       numeric(8, 2) not null default 0 check (area_covered_ha >= 0),
  fuel_consumed_liters  numeric(8, 2) not null default 0 check (fuel_consumed_liters >= 0),
  cost_kobo             integer not null default 0 check (cost_kobo >= 0),
  notes                 text check (notes is null or char_length(notes) <= 500),
  recorded_by           uuid references public.profiles (id) on delete set null,
  created_at            timestamptz not null default now()
);

create index if not exists farm_machinery_usage_idx on public.farm_machinery_usage_logs (farm_id, machinery_id, log_date desc);

create table if not exists public.farm_machinery_maintenance_records (
  id                      uuid primary key default gen_random_uuid(),
  machinery_id            uuid not null references public.farm_machinery_assets (id) on delete cascade,
  farm_id                 uuid not null references public.farms (id) on delete cascade,
  maintenance_type        text not null default 'preventive' check (maintenance_type in ('preventive', 'corrective', 'inspection', 'breakdown_repair')),
  service_date            date not null default current_date,
  engine_hours_at_service numeric(8, 1) not null check (engine_hours_at_service >= 0),
  parts_replaced          text check (parts_replaced is null or char_length(parts_replaced) <= 500),
  service_provider        text check (service_provider is null or char_length(service_provider) <= 120),
  parts_cost_kobo         integer not null default 0 check (parts_cost_kobo >= 0),
  labour_cost_kobo        integer not null default 0 check (labour_cost_kobo >= 0),
  total_cost_kobo         integer not null default 0 check (total_cost_kobo >= 0),
  downtime_hours          numeric(6, 1) not null default 0 check (downtime_hours >= 0),
  next_service_due_date   date,
  next_service_due_hours  numeric(8, 1) check (next_service_due_hours is null or next_service_due_hours >= engine_hours_at_service),
  notes                   text check (notes is null or char_length(notes) <= 1000),
  created_at              timestamptz not null default now()
);

create index if not exists farm_machinery_maint_idx on public.farm_machinery_maintenance_records (farm_id, machinery_id, service_date desc);

create table if not exists public.farm_equipment_assets (
  id                    uuid primary key default gen_random_uuid(),
  farm_id               uuid not null references public.farms (id) on delete cascade,
  equipment_name        text not null check (char_length(equipment_name) between 2 and 120),
  category              text not null check (category in ('sprayer', 'pump', 'scale', 'ppe', 'hand_tool', 'irrigation_part', 'testing_instrument', 'other')),
  quantity              integer not null default 1 check (quantity >= 0),
  storage_location      text check (storage_location is null or char_length(storage_location) <= 120),
  condition             text not null default 'good' check (condition in ('new', 'good', 'fair', 'needs_repair', 'condemned')),
  assigned_to_worker_id uuid references public.farm_workers (id) on delete set null,
  purchase_cost_kobo    integer not null default 0 check (purchase_cost_kobo >= 0),
  status                text not null default 'available' check (status in ('available', 'assigned', 'in_use', 'under_repair', 'lost')),
  notes                 text check (notes is null or char_length(notes) <= 500),
  created_at            timestamptz not null default now()
);

create index if not exists farm_equipment_farm_idx on public.farm_equipment_assets (farm_id, category);

------------------------------------------------------------------------------------------------
-- 6. Multi-Location Concurrency-Safe Inventory Engine
------------------------------------------------------------------------------------------------

create table if not exists public.farm_inventory_locations (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references public.farms (id) on delete cascade,
  location_code text not null check (char_length(location_code) between 2 and 40),
  name          text not null check (char_length(name) between 2 and 100),
  location_type text not null default 'farm_store' check (location_type in ('main_warehouse', 'farm_store', 'field_store', 'feed_store', 'cold_room', 'machinery_store', 'livestock_store')),
  notes         text check (notes is null or char_length(notes) <= 500),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (farm_id, location_code)
);

create index if not exists farm_inv_locations_farm_idx on public.farm_inventory_locations (farm_id);

create table if not exists public.farm_inventory_transactions (
  id                      uuid primary key default gen_random_uuid(),
  farm_id                 uuid not null references public.farms (id) on delete cascade,
  inventory_id            uuid not null references public.farm_inventory (id) on delete cascade,
  location_id             uuid references public.farm_inventory_locations (id) on delete set null,
  transaction_type        text not null check (transaction_type in ('PURCHASE', 'RECEIPT', 'TRANSFER', 'ISSUE', 'CONSUMPTION', 'ADJUSTMENT', 'RETURN', 'LOSS', 'DAMAGE', 'SALE', 'RESERVATION', 'RELEASE')),
  quantity                numeric(12, 2) not null,
  balance_before          numeric(12, 2) not null,
  balance_after           numeric(12, 2) not null check (balance_after >= 0),
  unit_cost_kobo          integer not null default 0 check (unit_cost_kobo >= 0),
  total_cost_kobo         bigint not null default 0 check (total_cost_kobo >= 0),
  destination_entity_type text check (destination_entity_type is null or destination_entity_type in ('crop_cycle', 'livestock_group', 'machinery', 'field', 'marketplace_order')),
  destination_entity_id   uuid,
  idempotency_key         text unique check (idempotency_key is null or char_length(idempotency_key) <= 100),
  notes                   text check (notes is null or char_length(notes) <= 500),
  recorded_by             uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now()
);

create index if not exists farm_inv_tx_farm_idx on public.farm_inventory_transactions (farm_id, inventory_id, created_at desc);

-- Concurrency-safe atomic inventory transaction procedure
create or replace function public.record_farm_inventory_movement(
  p_farm_id uuid,
  p_inventory_id uuid,
  p_transaction_type text,
  p_quantity numeric,
  p_unit_cost_kobo integer default 0,
  p_location_id uuid default null,
  p_dest_entity_type text default null,
  p_dest_entity_id uuid default null,
  p_notes text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item record;
  v_new_qty numeric(12, 2);
  v_tx_id uuid;
  v_total_cost bigint;
begin
  -- 1. Idempotency check
  if p_idempotency_key is not null then
    select id into v_tx_id
      from public.farm_inventory_transactions
     where idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object('success', true, 'already_processed', true, 'transaction_id', v_tx_id);
    end if;
  end if;

  -- 2. Lock inventory row FOR UPDATE
  select * into v_item
    from public.farm_inventory
   where id = p_inventory_id and farm_id = p_farm_id
     for update;

  if not found then
    raise exception 'Inventory item % not found in farm %.', p_inventory_id, p_farm_id;
  end if;

  -- 3. Calculate new quantity based on transaction type
  if p_transaction_type in ('PURCHASE', 'RECEIPT', 'RETURN', 'ADJUSTMENT_ADD') then
    v_new_qty := v_item.quantity + abs(p_quantity);
  elsif p_transaction_type in ('ISSUE', 'CONSUMPTION', 'LOSS', 'DAMAGE', 'SALE', 'ADJUSTMENT_SUB') then
    if v_item.quantity < abs(p_quantity) then
      raise exception 'INSUFFICIENT_STOCK: Requested % % but only % % available in stock.',
        abs(p_quantity), v_item.unit, v_item.quantity, v_item.unit;
    end if;
    v_new_qty := v_item.quantity - abs(p_quantity);
  else
    raise exception 'Unsupported inventory transaction type %', p_transaction_type;
  end if;

  v_total_cost := (abs(p_quantity) * coalesce(nullif(p_unit_cost_kobo, 0), v_item.unit_cost_kobo))::bigint;

  -- 4. Update balance on inventory item
  update public.farm_inventory
     set quantity = v_new_qty,
         updated_at = now()
   where id = p_inventory_id;

  -- 5. Record transaction ledger
  insert into public.farm_inventory_transactions (
    farm_id, inventory_id, location_id, transaction_type,
    quantity, balance_before, balance_after,
    unit_cost_kobo, total_cost_kobo, destination_entity_type, destination_entity_id,
    idempotency_key, notes, recorded_by
  )
  values (
    p_farm_id, p_inventory_id, p_location_id, p_transaction_type,
    abs(p_quantity), v_item.quantity, v_new_qty,
    coalesce(nullif(p_unit_cost_kobo, 0), v_item.unit_cost_kobo), v_total_cost,
    p_dest_entity_type, p_dest_entity_id,
    p_idempotency_key, p_notes, auth.uid()
  )
  returning id into v_tx_id;

  return jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'inventory_id', p_inventory_id,
    'balance_before', v_item.quantity,
    'balance_after', v_new_qty
  );
end;
$$;

------------------------------------------------------------------------------------------------
-- 7. Budgets & Cost Allocation
------------------------------------------------------------------------------------------------

create table if not exists public.farm_budgets (
  id                            uuid primary key default gen_random_uuid(),
  farm_id                       uuid not null references public.farms (id) on delete cascade,
  name                          text not null check (char_length(name) between 2 and 120),
  fiscal_year                   integer not null check (fiscal_year between 2020 and 2050),
  enterprise_type               text not null default 'whole_farm' check (enterprise_type in ('whole_farm', 'crop', 'livestock', 'machinery', 'department')),
  entity_id                     uuid,
  total_budgeted_expense_kobo   bigint not null default 0 check (total_budgeted_expense_kobo >= 0),
  total_budgeted_income_kobo    bigint not null default 0 check (total_budgeted_income_kobo >= 0),
  status                        text not null default 'active' check (status in ('draft', 'approved', 'active', 'archived')),
  created_by                    uuid references public.profiles (id) on delete set null,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create index if not exists farm_budgets_farm_idx on public.farm_budgets (farm_id, fiscal_year);

create table if not exists public.farm_budget_lines (
  id                    uuid primary key default gen_random_uuid(),
  budget_id             uuid not null references public.farm_budgets (id) on delete cascade,
  category              text not null check (char_length(category) between 2 and 60),
  description           text not null check (char_length(description) between 2 and 200),
  budgeted_amount_kobo  bigint not null default 0 check (budgeted_amount_kobo >= 0),
  actual_amount_kobo    bigint not null default 0 check (actual_amount_kobo >= 0),
  created_at            timestamptz not null default now()
);

create index if not exists farm_budget_lines_budget_idx on public.farm_budget_lines (budget_id);

------------------------------------------------------------------------------------------------
-- 8. Future IoT Telemetry Interface
------------------------------------------------------------------------------------------------

create table if not exists public.farm_iot_telemetry (
  id              uuid primary key default gen_random_uuid(),
  farm_id         uuid not null references public.farms (id) on delete cascade,
  device_id       text not null check (char_length(device_id) between 2 and 60),
  device_type     text not null check (device_type in ('soil_moisture', 'weather_station', 'gps_tracker', 'rfid_scanner', 'cold_storage_temp', 'water_flow')),
  plot_id         uuid references public.plots (id) on delete set null,
  telemetry_data  jsonb not null default '{}'::jsonb,
  battery_pct     numeric(4, 1) check (battery_pct is null or (battery_pct >= 0 and battery_pct <= 100)),
  recorded_at     timestamptz not null,
  created_at      timestamptz not null default now()
);

create index if not exists farm_iot_telemetry_farm_idx on public.farm_iot_telemetry (farm_id, device_type, recorded_at desc);

------------------------------------------------------------------------------------------------
-- 9. Row Level Security (RLS) Configuration
------------------------------------------------------------------------------------------------

alter table public.farm_agronomic_standards           enable row level security;
alter table public.farm_plan_actual_variances         enable row level security;
alter table public.farm_livestock_animals             enable row level security;
alter table public.farm_livestock_health_events       enable row level security;
alter table public.farm_livestock_feedings            enable row level security;
alter table public.farm_livestock_breeding_records    enable row level security;
alter table public.farm_livestock_production_logs     enable row level security;
alter table public.farm_attendance_records            enable row level security;
alter table public.farm_operational_tasks             enable row level security;
alter table public.farm_machinery_assets              enable row level security;
alter table public.farm_machinery_usage_logs          enable row level security;
alter table public.farm_machinery_maintenance_records enable row level security;
alter table public.farm_equipment_assets              enable row level security;
alter table public.farm_inventory_locations           enable row level security;
alter table public.farm_inventory_transactions        enable row level security;
alter table public.farm_budgets                       enable row level security;
alter table public.farm_budget_lines                  enable row level security;
alter table public.farm_iot_telemetry                 enable row level security;

-- Agronomic Standards: publicly readable, modifiable only by admins
create policy standards_read on public.farm_agronomic_standards
  for select to authenticated using (true);

-- Variances
create policy variances_select on public.farm_plan_actual_variances
  for select to authenticated using (public.can_view_farm(farm_id));
create policy variances_all on public.farm_plan_actual_variances
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Livestock Animals
create policy livestock_animals_select on public.farm_livestock_animals
  for select to authenticated using (public.can_view_farm(farm_id));
create policy livestock_animals_all on public.farm_livestock_animals
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Health Events
create policy health_events_select on public.farm_livestock_health_events
  for select to authenticated using (public.can_view_farm(farm_id));
create policy health_events_all on public.farm_livestock_health_events
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Feedings
create policy feedings_select on public.farm_livestock_feedings
  for select to authenticated using (public.can_view_farm(farm_id));
create policy feedings_all on public.farm_livestock_feedings
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Breeding
create policy breeding_select on public.farm_livestock_breeding_records
  for select to authenticated using (public.can_view_farm(farm_id));
create policy breeding_all on public.farm_livestock_breeding_records
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Production Logs
create policy production_logs_select on public.farm_livestock_production_logs
  for select to authenticated using (public.can_view_farm(farm_id));
create policy production_logs_all on public.farm_livestock_production_logs
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Attendance
create policy attendance_select on public.farm_attendance_records
  for select to authenticated using (public.can_view_farm(farm_id));
create policy attendance_all on public.farm_attendance_records
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Operational Tasks
create policy tasks_select on public.farm_operational_tasks
  for select to authenticated using (public.can_view_farm(farm_id));
create policy tasks_all on public.farm_operational_tasks
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Machinery Assets
create policy machinery_select on public.farm_machinery_assets
  for select to authenticated using (public.can_view_farm(farm_id));
create policy machinery_all on public.farm_machinery_assets
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Machinery Usage
create policy machinery_usage_select on public.farm_machinery_usage_logs
  for select to authenticated using (public.can_view_farm(farm_id));
create policy machinery_usage_all on public.farm_machinery_usage_logs
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Machinery Maintenance
create policy machinery_maint_select on public.farm_machinery_maintenance_records
  for select to authenticated using (public.can_view_farm(farm_id));
create policy machinery_maint_all on public.farm_machinery_maintenance_records
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Equipment Assets
create policy equipment_select on public.farm_equipment_assets
  for select to authenticated using (public.can_view_farm(farm_id));
create policy equipment_all on public.farm_equipment_assets
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Inventory Locations
create policy inv_locations_select on public.farm_inventory_locations
  for select to authenticated using (public.can_view_farm(farm_id));
create policy inv_locations_all on public.farm_inventory_locations
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Inventory Transactions
create policy inv_tx_select on public.farm_inventory_transactions
  for select to authenticated using (public.can_view_farm(farm_id));
create policy inv_tx_all on public.farm_inventory_transactions
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Budgets
create policy budgets_select on public.farm_budgets
  for select to authenticated using (public.can_view_farm(farm_id));
create policy budgets_all on public.farm_budgets
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

-- Budget Lines
create policy budget_lines_select on public.farm_budget_lines
  for select to authenticated using (
    exists (
      select 1 from public.farm_budgets b
       where b.id = budget_id and public.can_view_farm(b.farm_id)
    )
  );
create policy budget_lines_all on public.farm_budget_lines
  for all to authenticated using (
    exists (
      select 1 from public.farm_budgets b
       where b.id = budget_id and public.can_edit_farm(b.farm_id)
    )
  )
  with check (
    exists (
      select 1 from public.farm_budgets b
       where b.id = budget_id and public.can_edit_farm(b.farm_id)
    )
  );

-- IoT Telemetry
create policy iot_telemetry_select on public.farm_iot_telemetry
  for select to authenticated using (public.can_view_farm(farm_id));
create policy iot_telemetry_all on public.farm_iot_telemetry
  for all to authenticated using (public.can_edit_farm(farm_id))
  with check (public.can_edit_farm(farm_id));

------------------------------------------------------------------------------------------------
-- 10. Seed Initial Agronomic Standards
------------------------------------------------------------------------------------------------

insert into public.farm_agronomic_standards (
  id, category, crop_id, title, version, baseline_parameters, mandated_operations, restricted_inputs, approved_by
)
values
(
  'GAP_MAIZE_V1',
  'planting',
  'maize',
  'Nigerian Good Agricultural Practices (GAP) for Commercial Maize',
  1,
  '{"seed_rate_kg_ha": 20, "basal_fertiliser_npk_kg_ha": 200, "topdress_urea_kg_ha": 100, "target_population_ha": 53333, "expected_yield_kg_ha": 4500}'::jsonb,
  array['Land clearing & ploughing', 'Basal fertilisation at planting', 'Pre-emergence herbicide', 'Top-dressing with Urea at 4-6 weeks', 'Harvesting at physiological maturity'],
  array['paraquat', 'carbofuran', 'ddt'],
  'Federal Ministry of Agriculture & IITA'
),
(
  'GAP_CASSAVA_V1',
  'planting',
  'cassava',
  'Commercial Cassava Production Standard - South-West Rainforest/Savannah',
  1,
  '{"stem_bundles_ha": 60, "planting_spacing_m": "1x1", "expected_yield_tons_ha": 25, "weed_control_cycles": 3}'::jsonb,
  array['Ridging/mounding', 'Stem treatment', 'Planting on ridges at 45 degree angle', 'Post-planting weed control'],
  array['paraquat'],
  'National Root Crops Research Institute (NRCRI)'
),
(
  'LIVESTOCK_BROILER_FEED_V1',
  'livestock_feed',
  null,
  'Commercial Broiler Feeding Standard & FCR Benchmarks',
  1,
  '{"starter_feed_g_bird": 1000, "finisher_feed_g_bird": 3200, "target_fcr": 1.65, "target_market_weight_kg": 2.2, "rearing_weeks": 6}'::jsonb,
  array['Brooding temperature control', 'Gumboro vaccination Day 10', 'Lasota vaccination Day 18', 'Pre-slaughter withdrawal period compliance'],
  array['growth_promoters_antibiotics'],
  'National Animal Production Research Institute (NAPRI)'
)
on conflict (id) do nothing;
