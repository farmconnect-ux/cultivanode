-- CultivaNode: Farm management — one coherent schema.
--
-- Replaces 20261008200000_drop_all_farm_management_systems.sql and
-- 20261008210000_farm_management_modular_system.sql, which would have dropped tables that
-- already hold farmers' records (workers, inventory, livestock, farm books).
--
-- What it does:
--   * Keeps and extends the enterprise tables that hold live data (farm_workers,
--     farm_inventory, farm_financial_transactions, farm_livestock, farm_general_records).
--   * Rebuilds the crop-cycle tables on the farm-scoped design the app uses
--     (crop_cycles.farm_id, child tables keyed by crop_cycle_id). The earlier crop tables are
--     only dropped when they are empty, so no records are lost.
--   * Adds livestock groups/animals/health/feeding/production, attendance, operational tasks,
--     machinery fleet and usage, small equipment, inventory locations and movements,
--     budgets, standard→plan→actual variances and the agronomic standards catalogue.
-- Safe on a fresh database and on the live one (every step is guarded).

------------------------------------------------------------------------------------------------
-- 0. Guard: refuse to rebuild crop tables that already hold rows
------------------------------------------------------------------------------------------------
do $$
declare
  t text;
  n bigint;
begin
  foreach t in array array['crop_cycles','crop_cycle_operations','crop_observations','crop_alerts',
                           'crop_harvests','crop_measurements','crop_input_applications'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      if n > 0 then
        raise exception 'public.% has % rows; migrate them before rebuilding the crop tables', t, n;
      end if;
    end if;
  end loop;
end $$;

-- The earlier (empty) crop tables are kept, renamed *_legacy, together with their indexes and
-- helper functions, so nothing is destroyed. They can be removed by hand once no longer wanted.
do $$
declare
  t text;
  i record;
  f text;
begin
  foreach t in array array['crop_cycles','crop_cycle_operations','crop_observations','crop_alerts',
                           'crop_harvests','crop_measurements','crop_input_applications'] loop
    if to_regclass('public.' || t) is not null and to_regclass('public.' || t || '_legacy') is null then
      for i in select c.relname from pg_index x join pg_class c on c.oid = x.indexrelid
                where x.indrelid = ('public.' || t)::regclass loop
        execute format('alter index public.%I rename to %I', i.relname, left(i.relname, 56) || '_legacy');
      end loop;
      execute format('alter table public.%I rename to %I', t, t || '_legacy');
    end if;
  end loop;
  foreach f in array array['sync_crop_cycle_actual_cost()','sync_crop_cycle_actual_yield()','check_plot_cycle_overlap()',
                           'can_edit_cycle(uuid)','can_view_cycle(uuid)','cycle_farm_id(uuid)'] loop
    if to_regprocedure('public.' || f) is not null then
      execute format('alter function public.%s rename to %I', f, split_part(f, '(', 1) || '_legacy');
    end if;
  end loop;
end $$;

------------------------------------------------------------------------------------------------
-- 1. Farms and plots: extra descriptive columns
------------------------------------------------------------------------------------------------
alter table public.farms
  add column if not exists farm_code text,
  add column if not exists ownership_type text,
  add column if not exists water_sources text[] not null default '{}',
  add column if not exists irrigation_systems text[] not null default '{}',
  add column if not exists slope_type text,
  add column if not exists accessibility_level text,
  add column if not exists soil_information jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'active';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farms_ownership_type_check') then
    alter table public.farms add constraint farms_ownership_type_check
      check (ownership_type is null or ownership_type in ('owned','leased','family','partnership','community','managed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'farms_status_check') then
    alter table public.farms add constraint farms_status_check
      check (status in ('active','inactive','fallow','under_development'));
  end if;
end $$;

alter table public.plots
  add column if not exists plot_code text,
  add column if not exists soil_ph numeric(3,1),
  add column if not exists organic_matter_pct numeric(5,2),
  add column if not exists accessibility text,
  add column if not exists current_crop text,
  add column if not exists previous_crop text;

alter table public.soil_records
  add column if not exists recommendations text;

------------------------------------------------------------------------------------------------
-- 2. Agronomic standards (versioned advisory benchmarks)
------------------------------------------------------------------------------------------------
create table if not exists public.farm_agronomic_standards (
  id                    uuid primary key default gen_random_uuid(),
  standard_code         text not null,
  crop_or_livestock_id  text not null,
  variety_or_breed      text,
  agro_zone             text not null default 'all',
  version               text not null default '1.0',
  title                 text not null,
  description           text,
  source_authority      text not null default 'IITA_NIHORT_GAP',
  is_active             boolean not null default true,
  parameters            jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  unique (standard_code, version)
);
create index if not exists farm_standards_lookup_idx
  on public.farm_agronomic_standards (crop_or_livestock_id, agro_zone, is_active);

------------------------------------------------------------------------------------------------
-- 3. Crop cycles and their records
------------------------------------------------------------------------------------------------
create table public.crop_cycles (
  id                      uuid primary key default gen_random_uuid(),
  farm_id                 uuid not null references public.farms (id) on delete cascade,
  plot_id                 uuid references public.plots (id) on delete set null,
  standard_id             uuid references public.farm_agronomic_standards (id) on delete set null,
  crop_id                 text not null,
  variety_id              text,
  season                  text not null,
  status                  text not null default 'planning'
                          check (status in ('planning','land_preparation','planting','establishment','maintenance','harvesting','completed','abandoned')),
  current_stage           text not null default 'Planning',
  target_area_ha          numeric(10,2) not null check (target_area_ha > 0),
  actual_area_ha          numeric(10,2),
  planting_date           date not null,
  expected_harvest_date   date not null,
  actual_harvest_date     date,
  target_yield_kg         numeric(12,2) not null default 0 check (target_yield_kg >= 0),
  actual_yield_kg         numeric(12,2) not null default 0 check (actual_yield_kg >= 0),
  seed_quantity_kg        numeric(10,2),
  plant_population_per_ha integer,
  health_score            numeric(3,2) not null default 1.0 check (health_score between 0 and 1),
  health_status           text not null default 'healthy' check (health_status in ('healthy','watch','at_risk','critical')),
  estimated_budget_kobo   bigint not null default 0 check (estimated_budget_kobo >= 0),
  actual_cost_kobo        bigint not null default 0 check (actual_cost_kobo >= 0),
  notes                   text,
  created_by              uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (expected_harvest_date >= planting_date)
);
create index crop_cycles_farm_idx on public.crop_cycles (farm_id, status);
create index crop_cycles_plot_idx on public.crop_cycles (plot_id);

create table public.crop_cycle_operations (
  id                uuid primary key default gen_random_uuid(),
  crop_cycle_id     uuid not null references public.crop_cycles (id) on delete cascade,
  operation_type    text not null,
  name              text not null,
  stage             text not null,
  status            text not null default 'pending' check (status in ('pending','in_progress','completed','skipped','cancelled')),
  scheduled_date    date not null,
  completed_date    date,
  assigned_worker_id uuid references public.profiles (id) on delete set null,
  booking_id        uuid references public.bookings (id) on delete set null,
  required_machinery text,
  required_inputs   jsonb not null default '[]'::jsonb,
  actual_cost_kobo  bigint not null default 0 check (actual_cost_kobo >= 0),
  notes             text,
  evidence_urls     text[] not null default '{}',
  created_at        timestamptz not null default now()
);
create index crop_ops_cycle_idx on public.crop_cycle_operations (crop_cycle_id, status, scheduled_date);

create table public.crop_observations (
  id              uuid primary key default gen_random_uuid(),
  crop_cycle_id   uuid not null references public.crop_cycles (id) on delete cascade,
  observed_at     timestamptz not null default now(),
  category        text not null check (category in ('pest','disease','nutrient_deficiency','weed_infestation','water_stress','general')),
  severity        text not null default 'low' check (severity in ('low','medium','high','critical')),
  title           text not null,
  description     text not null,
  location        extensions.geography(Point, 4326),
  photo_urls      text[] not null default '{}',
  recommended_action text,
  resolved        boolean not null default false,
  resolved_at     timestamptz,
  created_by      uuid default auth.uid() references public.profiles (id) on delete set null
);
create index crop_obs_cycle_idx on public.crop_observations (crop_cycle_id, resolved);

create table public.crop_harvests (
  id               uuid primary key default gen_random_uuid(),
  crop_cycle_id    uuid not null references public.crop_cycles (id) on delete cascade,
  batch_code       text not null,
  harvest_date     date not null default current_date,
  quantity_kg      numeric(12,2) not null check (quantity_kg > 0),
  quality_grade    text check (quality_grade is null or quality_grade in ('A','B','C','reject')),
  moisture_pct     numeric(5,2) check (moisture_pct is null or moisture_pct between 0 and 100),
  loss_pct         numeric(5,2) check (loss_pct is null or loss_pct between 0 and 100),
  storage_location text,
  destination      text not null default 'store' check (destination in ('store','marketplace','offtaker','processing','home_use')),
  notes            text,
  recorded_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  unique (crop_cycle_id, batch_code)
);
create index crop_harvests_cycle_idx on public.crop_harvests (crop_cycle_id, harvest_date desc);

create table public.crop_alerts (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references public.farms (id) on delete cascade,
  crop_cycle_id uuid references public.crop_cycles (id) on delete cascade,
  category      text not null check (category in ('weather','pest','disease','irrigation','nutrient','market','operation')),
  severity      text not null default 'medium' check (severity in ('low','medium','high','critical')),
  title         text not null,
  message       text not null,
  action_url    text,
  is_dismissed  boolean not null default false,
  created_at    timestamptz not null default now()
);
create index crop_alerts_farm_idx on public.crop_alerts (farm_id, is_dismissed, created_at desc);

-- Keep a cycle's yield in step with its harvest records.
create or replace function private.sync_crop_cycle_yield()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cycle uuid := coalesce(new.crop_cycle_id, old.crop_cycle_id);
begin
  update public.crop_cycles c
     set actual_yield_kg = coalesce((select sum(h.quantity_kg) from public.crop_harvests h where h.crop_cycle_id = v_cycle), 0),
         updated_at = now()
   where c.id = v_cycle;
  return null;
end;
$$;
create trigger crop_harvests_sync_yield
  after insert or update or delete on public.crop_harvests
  for each row execute function private.sync_crop_cycle_yield();

-- Rebuild the FK from farm books to crop cycles (dropped with the old table).
-- Point farm books at the new crop_cycles (the old constraint referenced the legacy table).
do $$
begin
  if exists (select 1 from pg_constraint
              where conname = 'farm_financial_transactions_crop_cycle_id_fkey'
                and confrelid <> 'public.crop_cycles'::regclass) then
    alter table public.farm_financial_transactions drop constraint farm_financial_transactions_crop_cycle_id_fkey;
  end if;
  if to_regclass('public.farm_financial_transactions') is not null
     and not exists (select 1 from pg_constraint where conname = 'farm_financial_transactions_crop_cycle_id_fkey') then
    alter table public.farm_financial_transactions
      add constraint farm_financial_transactions_crop_cycle_id_fkey
      foreign key (crop_cycle_id) references public.crop_cycles (id) on delete set null;
  end if;
end $$;

------------------------------------------------------------------------------------------------
-- 4. Enterprise tables that already hold records: create if missing, then extend
------------------------------------------------------------------------------------------------
create table if not exists public.farm_workers (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms (id) on delete cascade,
  full_name         text not null check (char_length(full_name) between 2 and 120),
  phone             text check (phone is null or char_length(phone) <= 30),
  role              text not null,
  employment_type   text not null default 'permanent',
  daily_wage_kobo   bigint not null default 0 check (daily_wage_kobo >= 0),
  status            text not null default 'active' check (status in ('active','inactive','on_leave')),
  joined_date       date default current_date,
  emergency_contact text check (emergency_contact is null or char_length(emergency_contact) <= 120),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.farm_workers alter column daily_wage_kobo type bigint;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farm_workers_role_check') then
    alter table public.farm_workers add constraint farm_workers_role_check check (role in ('farm_manager','tractor_operator','field_worker','scout','harvester','livestock_keeper','security','casual'));
  end if;
end $$;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farm_workers_employment_type_check') then
    alter table public.farm_workers add constraint farm_workers_employment_type_check check (employment_type in ('permanent','seasonal','daily_casual'));
  end if;
end $$;
create index if not exists farm_workers_farm_idx on public.farm_workers (farm_id, status);

create table if not exists public.farm_inventory (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms (id) on delete cascade,
  item_name         text not null check (char_length(item_name) between 2 and 120),
  category          text not null,
  quantity          numeric(12,3) not null default 0 check (quantity >= 0),
  unit              text not null,
  reorder_threshold numeric(12,3) not null default 0 check (reorder_threshold >= 0),
  storage_location  text check (storage_location is null or char_length(storage_location) <= 120),
  unit_cost_kobo    bigint not null default 0 check (unit_cost_kobo >= 0),
  expiry_date       date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.farm_inventory
  add column if not exists reserved_quantity numeric(12,3) not null default 0,
  add column if not exists location_id uuid,
  add column if not exists sku text,
  add column if not exists lot_number text;
alter table public.farm_inventory alter column unit_cost_kobo type bigint;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farm_inventory_category_check') then
    alter table public.farm_inventory add constraint farm_inventory_category_check check (category in ('seed','fertiliser','chemical','feed','tool_equipment','harvest_produce','fuel','other'));
  end if;
end $$;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farm_inventory_unit_check') then
    alter table public.farm_inventory add constraint farm_inventory_unit_check check (unit in ('kg','liters','bags','units','tons','crates','bundles'));
  end if;
end $$;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farm_inventory_reserved_check') then
    alter table public.farm_inventory add constraint farm_inventory_reserved_check check (reserved_quantity >= 0 and reserved_quantity <= quantity);
  end if;
end $$;
create index if not exists farm_inventory_farm_idx on public.farm_inventory (farm_id, category);

create table if not exists public.farm_financial_transactions (
  id               uuid primary key default gen_random_uuid(),
  farm_id          uuid not null references public.farms (id) on delete cascade,
  crop_cycle_id    uuid references public.crop_cycles (id) on delete set null,
  type             text not null check (type in ('income','expense')),
  category         text not null,
  amount_kobo      bigint not null check (amount_kobo > 0),
  transaction_date date not null default current_date,
  receipt_number   text check (receipt_number is null or char_length(receipt_number) <= 60),
  payment_method   text not null default 'cash' check (payment_method in ('cash','bank_transfer','escrow','mobile_money')),
  description      text not null check (char_length(description) between 2 and 500),
  recorded_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now()
);
alter table public.farm_financial_transactions alter column amount_kobo type bigint;
alter table public.farm_financial_transactions
  add column if not exists budget_id uuid,
  add column if not exists counterparty text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farm_financial_transactions_category_check') then
    alter table public.farm_financial_transactions add constraint farm_financial_transactions_category_check check (category in ('harvest_sale','livestock_sale','machinery_service','seeds','fertilisers','chemicals','labour_wages','feed','fuel','repairs','other'));
  end if;
end $$;
create index if not exists farm_finances_farm_idx on public.farm_financial_transactions (farm_id, transaction_date desc);

create table if not exists public.farm_livestock (
  id               uuid primary key default gen_random_uuid(),
  farm_id          uuid not null references public.farms (id) on delete cascade,
  animal_type      text not null,
  breed            text not null,
  identifier       text not null,
  head_count       integer not null default 1 check (head_count >= 0),
  housing_location text,
  health_status    text not null default 'healthy',
  purpose          text not null default 'meat',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.farm_livestock is 'Legacy livestock register (one row per batch). New records go to farm_livestock_groups; rows here were copied there.';

create table if not exists public.farm_general_records (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references public.farms (id) on delete cascade,
  record_type   text not null check (record_type in ('land_title','lease_agreement','water_source','irrigation_system','environmental_audit','certification','inspection','general')),
  title         text not null check (char_length(title) between 2 and 150),
  details       text,
  document_url  text,
  recorded_date date not null default current_date,
  created_at    timestamptz not null default now()
);

------------------------------------------------------------------------------------------------
-- 5. Livestock enterprise
------------------------------------------------------------------------------------------------
create table if not exists public.farm_livestock_groups (
  id               uuid primary key default gen_random_uuid(),
  farm_id          uuid not null references public.farms (id) on delete cascade,
  group_name       text not null check (char_length(group_name) between 1 and 100),
  animal_type      text not null check (animal_type in ('cattle','goats','sheep','poultry','pigs','fish','rabbits','snails','other')),
  breed            text,
  purpose          text not null default 'meat' check (purpose in ('meat','dairy','eggs','breeding','multi')),
  population       integer not null check (population >= 0),
  housing_location text,
  age_weeks        integer check (age_weeks is null or age_weeks >= 0),
  health_status    text not null default 'healthy' check (health_status in ('healthy','monitoring','sick','quarantined')),
  legacy_livestock_id uuid unique,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists livestock_groups_farm_idx on public.farm_livestock_groups (farm_id);

-- Copy the legacy register into groups once.
insert into public.farm_livestock_groups (farm_id, group_name, animal_type, breed, purpose, population,
                                          housing_location, health_status, legacy_livestock_id, notes, created_at)
select l.farm_id,
       l.identifier,
       case l.animal_type when 'goat' then 'goats' when 'pig' then 'pigs' when 'snail' then 'snails'
                          when 'rabbit' then 'rabbits' else l.animal_type end,
       l.breed,
       case when l.purpose in ('meat','dairy','eggs','breeding','multi') then l.purpose else 'multi' end,
       l.head_count,
       l.housing_location,
       case l.health_status when 'treatment' then 'sick' when 'quarantine' then 'quarantined'
                            when 'critical' then 'sick' else 'healthy' end,
       l.id,
       l.notes,
       l.created_at
  from public.farm_livestock l
on conflict (legacy_livestock_id) do nothing;

create table if not exists public.farm_livestock_animals (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms (id) on delete cascade,
  group_id          uuid references public.farm_livestock_groups (id) on delete set null,
  tag_number        text not null,
  rfid_code         text,
  species           text not null,
  breed             text,
  sex               text not null check (sex in ('male','female','castrated')),
  birth_date        date,
  acquisition_date  date not null default current_date,
  acquisition_source text,
  current_weight_kg numeric(8,2),
  housing_location  text,
  health_status     text not null default 'healthy' check (health_status in ('healthy','treatment','quarantine','deceased','sold')),
  sire_tag          text,
  dam_tag           text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (farm_id, tag_number)
);
create index if not exists livestock_animals_farm_idx on public.farm_livestock_animals (farm_id, health_status);

create table if not exists public.farm_livestock_health_events (
  id                    uuid primary key default gen_random_uuid(),
  farm_id               uuid not null references public.farms (id) on delete cascade,
  animal_id             uuid references public.farm_livestock_animals (id) on delete set null,
  group_id              uuid references public.farm_livestock_groups (id) on delete set null,
  event_type            text not null check (event_type in ('vaccination','treatment','disease_diagnosis','vet_visit','routine_check','mortality')),
  disease_or_condition  text,
  medication_name       text,
  dosage                text,
  administered_on       date not null default current_date,
  vet_name              text,
  head_affected         integer,
  cost_kobo             bigint not null default 0 check (cost_kobo >= 0),
  withdrawal_period_days integer not null default 0,
  withdrawal_end_date   date,
  notes                 text,
  created_at            timestamptz not null default now()
);
create index if not exists livestock_health_farm_idx on public.farm_livestock_health_events (farm_id, administered_on desc);

create table if not exists public.farm_livestock_feedings (
  id           uuid primary key default gen_random_uuid(),
  farm_id      uuid not null references public.farms (id) on delete cascade,
  group_id     uuid references public.farm_livestock_groups (id) on delete set null,
  feed_type    text not null,
  quantity_kg  numeric(10,2) not null check (quantity_kg > 0),
  cost_kobo    bigint not null default 0 check (cost_kobo >= 0),
  feeding_date date not null default current_date,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists livestock_feeding_farm_idx on public.farm_livestock_feedings (farm_id, feeding_date desc);

create table if not exists public.farm_livestock_production_logs (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references public.farms (id) on delete cascade,
  group_id      uuid references public.farm_livestock_groups (id) on delete set null,
  product_type  text not null check (product_type in ('eggs','milk','meat','fish','honey','manure','other')),
  quantity      numeric(10,2) not null check (quantity > 0),
  unit          text not null,
  quality_grade text,
  log_date      date not null default current_date,
  destination   text not null default 'inventory' check (destination in ('inventory','marketplace','home_consumption','spoilage')),
  revenue_kobo  bigint not null default 0 check (revenue_kobo >= 0),
  created_at    timestamptz not null default now()
);
create index if not exists livestock_prod_farm_idx on public.farm_livestock_production_logs (farm_id, log_date desc);

------------------------------------------------------------------------------------------------
-- 6. Labour: attendance and operational tasks
------------------------------------------------------------------------------------------------
create table if not exists public.farm_attendance_records (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms (id) on delete cascade,
  worker_id         uuid not null references public.farm_workers (id) on delete cascade,
  clock_in_at       timestamptz not null default now(),
  clock_out_at      timestamptz,
  clock_in_location extensions.geography(Point, 4326),
  shift_name        text not null default 'Day shift',
  hours_worked      numeric(4,2),
  status            text not null default 'present' check (status in ('present','late','half_day','absent','on_leave')),
  overtime_hours    numeric(4,2) not null default 0,
  daily_pay_kobo    bigint not null default 0,
  notes             text,
  created_at        timestamptz not null default now()
);
create index if not exists farm_attendance_farm_idx on public.farm_attendance_records (farm_id, clock_in_at desc);

create table if not exists public.farm_operational_tasks (
  id                       uuid primary key default gen_random_uuid(),
  farm_id                  uuid not null references public.farms (id) on delete cascade,
  plot_id                  uuid references public.plots (id) on delete set null,
  crop_cycle_id            uuid references public.crop_cycles (id) on delete set null,
  title                    text not null check (char_length(title) between 2 and 160),
  description              text,
  category                 text not null default 'general',
  priority                 text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status                   text not null default 'planned' check (status in ('planned','assigned','in_progress','blocked','completed','cancelled','overdue')),
  assigned_worker_id       uuid references public.farm_workers (id) on delete set null,
  start_date               date not null default current_date,
  due_date                 date not null default current_date,
  completed_date           date,
  estimated_duration_hours numeric(6,2),
  actual_duration_hours    numeric(6,2),
  direct_cost_kobo         bigint not null default 0,
  evidence_urls            text[] not null default '{}',
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists farm_tasks_farm_idx on public.farm_operational_tasks (farm_id, status, due_date);

------------------------------------------------------------------------------------------------
-- 7. Machinery fleet, usage and small equipment
------------------------------------------------------------------------------------------------
create table if not exists public.farm_machinery_assets (
  id                        uuid primary key default gen_random_uuid(),
  farm_id                   uuid not null references public.farms (id) on delete cascade,
  asset_code                text not null,
  name                      text not null,
  category                  text not null check (category in ('tractor','plough','harrow','ridger','planter','harvester','boom_sprayer','water_pump','generator','trailer','truck','processor','drone','other')),
  manufacturer              text,
  model                     text,
  year_of_manufacture       integer,
  registration_number       text,
  fuel_type                 text not null default 'diesel' check (fuel_type in ('diesel','petrol','electric','manual','hybrid')),
  current_status            text not null default 'available' check (current_status in ('available','in_use','reserved','under_maintenance','out_of_service','hired_out')),
  engine_hours              numeric(10,2) not null default 0 check (engine_hours >= 0),
  next_service_hours        numeric(10,2),
  hourly_internal_rate_kobo bigint not null default 0,
  purchase_value_kobo       bigint,
  listing_id                uuid references public.listings (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (farm_id, asset_code)
);
create index if not exists machinery_assets_farm_idx on public.farm_machinery_assets (farm_id, current_status);

create table if not exists public.farm_machinery_usage_logs (
  id                    uuid primary key default gen_random_uuid(),
  farm_id               uuid not null references public.farms (id) on delete cascade,
  machinery_id          uuid not null references public.farm_machinery_assets (id) on delete cascade,
  operator_id           uuid references public.farm_workers (id) on delete set null,
  plot_id               uuid references public.plots (id) on delete set null,
  crop_cycle_id         uuid references public.crop_cycles (id) on delete set null,
  operation_name        text not null,
  start_time            timestamptz not null,
  end_time              timestamptz not null,
  hours_operated        numeric(6,2) not null check (hours_operated >= 0),
  area_covered_ha       numeric(8,2) not null default 0,
  fuel_litres_consumed  numeric(8,2) not null default 0,
  operational_cost_kobo bigint not null default 0,
  notes                 text,
  created_at            timestamptz not null default now(),
  check (end_time >= start_time)
);
create index if not exists machinery_usage_farm_idx on public.farm_machinery_usage_logs (farm_id, start_time desc);

create table if not exists public.farm_machinery_maintenance (
  id              uuid primary key default gen_random_uuid(),
  farm_id         uuid not null references public.farms (id) on delete cascade,
  machinery_id    uuid not null references public.farm_machinery_assets (id) on delete cascade,
  service_type    text not null check (service_type in ('routine_service','repair','inspection','tyre','overhaul')),
  description     text not null,
  service_date    date not null default current_date,
  engine_hours_at numeric(10,2),
  cost_kobo       bigint not null default 0 check (cost_kobo >= 0),
  vendor          text,
  status          text not null default 'completed' check (status in ('scheduled','in_progress','completed')),
  created_at      timestamptz not null default now()
);
create index if not exists machinery_maint_farm_idx on public.farm_machinery_maintenance (farm_id, service_date desc);

create table if not exists public.farm_equipment_assets (
  id                 uuid primary key default gen_random_uuid(),
  farm_id            uuid not null references public.farms (id) on delete cascade,
  equipment_name     text not null,
  category           text not null check (category in ('knapsack_sprayer','water_pump','scale','ppe','hand_tool','irrigation_fitting','testing_kit','other')),
  quantity           integer not null default 1 check (quantity >= 0),
  condition          text not null default 'good' check (condition in ('new','good','fair','needs_repair','damaged')),
  storage_location   text,
  assigned_worker_id uuid references public.farm_workers (id) on delete set null,
  created_at         timestamptz not null default now()
);
create index if not exists farm_equipment_farm_idx on public.farm_equipment_assets (farm_id);

------------------------------------------------------------------------------------------------
-- 8. Inventory locations and movements
------------------------------------------------------------------------------------------------
create table if not exists public.farm_inventory_locations (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references public.farms (id) on delete cascade,
  location_name text not null,
  location_type text not null check (location_type in ('main_warehouse','farm_store','field_shed','feed_store','cold_room','machinery_shed','livestock_store')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (farm_id, location_name)
);
create index if not exists inv_locations_farm_idx on public.farm_inventory_locations (farm_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farm_inventory_location_id_fkey') then
    alter table public.farm_inventory
      add constraint farm_inventory_location_id_fkey
      foreign key (location_id) references public.farm_inventory_locations (id) on delete set null;
  end if;
end $$;

create table if not exists public.farm_inventory_transactions (
  id                 uuid primary key default gen_random_uuid(),
  farm_id            uuid not null references public.farms (id) on delete cascade,
  inventory_id       uuid not null references public.farm_inventory (id) on delete cascade,
  transaction_type   text not null check (transaction_type in ('purchase','receipt','transfer','issue_to_field','consumption','adjustment','return','loss','damage','sale','reservation','release')),
  quantity           numeric(12,3) not null check (quantity > 0),
  unit_cost_kobo     bigint,
  source_location_id uuid references public.farm_inventory_locations (id) on delete set null,
  dest_location_id   uuid references public.farm_inventory_locations (id) on delete set null,
  batch_number       text,
  crop_cycle_id      uuid references public.crop_cycles (id) on delete set null,
  group_id           uuid references public.farm_livestock_groups (id) on delete set null,
  reference_order_id uuid,
  notes              text,
  recorded_by        uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now()
);
create index if not exists farm_inv_tx_farm_idx on public.farm_inventory_transactions (farm_id, created_at desc);

-- Atomic stock movement: row lock, no negative stock, audit row. Runs as the caller (RLS applies).
create or replace function public.record_farm_inventory_movement(
  p_farm_id uuid,
  p_inventory_id uuid,
  p_transaction_type text,
  p_quantity numeric,
  p_unit_cost_kobo bigint default null,
  p_crop_cycle_id uuid default null,
  p_group_id uuid default null,
  p_batch_number text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_stock numeric;
  v_reserved numeric;
  v_new numeric;
  v_tx uuid;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be more than zero.' using errcode = '22023';
  end if;

  select quantity, reserved_quantity into v_stock, v_reserved
    from public.farm_inventory
   where id = p_inventory_id and farm_id = p_farm_id
     for update;
  if not found then
    raise exception 'Inventory item not found on this farm.' using errcode = 'P0002';
  end if;

  if p_transaction_type in ('issue_to_field','consumption','loss','damage','sale') then
    if (v_stock - v_reserved) < p_quantity then
      raise exception 'Only % available (% reserved); cannot remove %.', v_stock - v_reserved, v_reserved, p_quantity
        using errcode = '23514';
    end if;
    v_new := v_stock - p_quantity;
  elsif p_transaction_type in ('purchase','receipt','return','adjustment') then
    v_new := v_stock + p_quantity;
  elsif p_transaction_type = 'reservation' then
    if (v_stock - v_reserved) < p_quantity then
      raise exception 'Cannot reserve more than the available stock.' using errcode = '23514';
    end if;
    update public.farm_inventory set reserved_quantity = reserved_quantity + p_quantity, updated_at = now()
     where id = p_inventory_id;
    v_new := v_stock;
  elsif p_transaction_type = 'release' then
    update public.farm_inventory set reserved_quantity = greatest(0, reserved_quantity - p_quantity), updated_at = now()
     where id = p_inventory_id;
    v_new := v_stock;
  else
    v_new := v_stock;
  end if;

  update public.farm_inventory
     set quantity = v_new,
         unit_cost_kobo = case when p_transaction_type in ('purchase','receipt') and p_unit_cost_kobo is not null
                               then p_unit_cost_kobo else unit_cost_kobo end,
         updated_at = now()
   where id = p_inventory_id;

  insert into public.farm_inventory_transactions (farm_id, inventory_id, transaction_type, quantity, unit_cost_kobo,
                                                  crop_cycle_id, group_id, batch_number, notes)
  values (p_farm_id, p_inventory_id, p_transaction_type, p_quantity, p_unit_cost_kobo,
          p_crop_cycle_id, p_group_id, p_batch_number, p_notes)
  returning id into v_tx;

  return jsonb_build_object('transaction_id', v_tx, 'new_quantity', v_new);
end;
$$;
revoke all on function public.record_farm_inventory_movement(uuid, uuid, text, numeric, bigint, uuid, uuid, text, text) from public, anon;
grant execute on function public.record_farm_inventory_movement(uuid, uuid, text, numeric, bigint, uuid, uuid, text, text) to authenticated;

------------------------------------------------------------------------------------------------
-- 9. Budgets and variances
------------------------------------------------------------------------------------------------
create table if not exists public.farm_budgets (
  id                uuid primary key default gen_random_uuid(),
  farm_id           uuid not null references public.farms (id) on delete cascade,
  title             text not null,
  fiscal_year       integer not null default extract(year from current_date)::integer,
  season            text,
  enterprise_type   text not null check (enterprise_type in ('crop','livestock','whole_farm','machinery','processing')),
  crop_cycle_id     uuid references public.crop_cycles (id) on delete set null,
  total_budget_kobo bigint not null default 0 check (total_budget_kobo >= 0),
  planned_revenue_kobo bigint not null default 0 check (planned_revenue_kobo >= 0),
  status            text not null default 'draft' check (status in ('draft','approved','active','closed')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists farm_budgets_farm_idx on public.farm_budgets (farm_id, fiscal_year);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farm_financial_transactions_budget_id_fkey') then
    alter table public.farm_financial_transactions
      add constraint farm_financial_transactions_budget_id_fkey
      foreign key (budget_id) references public.farm_budgets (id) on delete set null;
  end if;
end $$;

create table if not exists public.farm_budget_lines (
  id                   uuid primary key default gen_random_uuid(),
  budget_id            uuid not null references public.farm_budgets (id) on delete cascade,
  category             text not null,
  line_item            text not null,
  cost_type            text not null default 'variable' check (cost_type in ('fixed','variable')),
  budgeted_amount_kobo bigint not null default 0 check (budgeted_amount_kobo >= 0),
  actual_amount_kobo   bigint not null default 0 check (actual_amount_kobo >= 0),
  notes                text,
  created_at           timestamptz not null default now()
);
create index if not exists budget_lines_idx on public.farm_budget_lines (budget_id);

create table if not exists public.farm_plan_actual_variances (
  id                          uuid primary key default gen_random_uuid(),
  farm_id                     uuid not null references public.farms (id) on delete cascade,
  standard_id                 uuid references public.farm_agronomic_standards (id) on delete set null,
  crop_cycle_id               uuid references public.crop_cycles (id) on delete set null,
  group_id                    uuid references public.farm_livestock_groups (id) on delete set null,
  entity_type                 text not null check (entity_type in ('crop','livestock','machinery','labour','inventory')),
  metric_name                 text not null,
  unit                        text not null,
  standard_value              numeric(12,3) not null,
  plan_value                  numeric(12,3) not null,
  actual_value                numeric(12,3) not null,
  variance_standard_vs_actual numeric(12,3) generated always as (actual_value - standard_value) stored,
  variance_plan_vs_actual     numeric(12,3) generated always as (actual_value - plan_value) stored,
  is_farmer_override          boolean not null default false,
  farmer_deviation_reason     text,
  recorded_at                 timestamptz not null default now()
);
create index if not exists farm_variance_farm_idx on public.farm_plan_actual_variances (farm_id, entity_type);

------------------------------------------------------------------------------------------------
-- 10. updated_at triggers
------------------------------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['crop_cycles','farm_workers','farm_inventory','farm_livestock_groups','farm_livestock_animals',
                           'farm_operational_tasks','farm_machinery_assets','farm_budgets'] loop
    continue when exists (select 1 from pg_trigger where tgname = t || '_set_updated_at' and tgrelid = ('public.' || t)::regclass);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
                   t || '_set_updated_at', t);
  end loop;
end $$;

------------------------------------------------------------------------------------------------
-- 11. Row level security
------------------------------------------------------------------------------------------------
alter table public.farm_agronomic_standards enable row level security;
create policy farm_standards_read on public.farm_agronomic_standards
  for select to authenticated using (true);
create policy farm_standards_manage on public.farm_agronomic_standards
  for all to authenticated
  using ((select public.has_permission('standards.publish')))
  with check ((select public.has_permission('standards.publish')));

-- Tables with their own farm_id.
do $$
declare
  t text;
begin
  foreach t in array array[
    'crop_cycles','crop_alerts','farm_workers','farm_inventory','farm_financial_transactions','farm_livestock',
    'farm_general_records','farm_livestock_groups','farm_livestock_animals','farm_livestock_health_events',
    'farm_livestock_feedings','farm_livestock_production_logs','farm_attendance_records','farm_operational_tasks',
    'farm_machinery_assets','farm_machinery_usage_logs','farm_machinery_maintenance','farm_equipment_assets',
    'farm_inventory_locations','farm_inventory_transactions','farm_budgets','farm_plan_actual_variances'] loop
    execute format('alter table public.%I enable row level security', t);
        -- Tables that already carry policies (the earlier enterprise tables) keep them.
    continue when exists (select 1 from pg_policy where polrelid = ('public.' || t)::regclass);
    execute format('create policy %I on public.%I for select to authenticated using (public.can_view_farm(farm_id))', t || '_view', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_edit_farm(farm_id))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_edit_farm(farm_id)) with check (public.can_edit_farm(farm_id))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.can_edit_farm(farm_id))', t || '_delete', t);
  end loop;
end $$;
-- Policies named in the earlier enterprise migration.

-- Child tables reach the farm through their crop cycle or budget. Security invoker: the
-- lookup itself is subject to the caller's RLS on crop_cycles / farm_budgets.
create or replace function public.crop_cycle_farm_id(p_cycle uuid)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$ select farm_id from public.crop_cycles where id = p_cycle $$;

create or replace function public.budget_farm_id(p_budget uuid)
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$ select farm_id from public.farm_budgets where id = p_budget $$;

do $$
declare
  t text;
begin
  foreach t in array array['crop_cycle_operations','crop_observations','crop_harvests'] loop
    execute format('alter table public.%I enable row level security', t);
    continue when exists (select 1 from pg_policy where polrelid = ('public.' || t)::regclass);
    execute format('create policy %I on public.%I for select to authenticated using (public.can_view_farm(public.crop_cycle_farm_id(crop_cycle_id)))', t || '_view', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.can_edit_farm(public.crop_cycle_farm_id(crop_cycle_id))) with check (public.can_edit_farm(public.crop_cycle_farm_id(crop_cycle_id)))', t || '_modify', t);
  end loop;
end $$;

alter table public.farm_budget_lines enable row level security;
create policy farm_budget_lines_view on public.farm_budget_lines
  for select to authenticated using (public.can_view_farm(public.budget_farm_id(budget_id)));
create policy farm_budget_lines_modify on public.farm_budget_lines
  for all to authenticated
  using (public.can_edit_farm(public.budget_farm_id(budget_id)))
  with check (public.can_edit_farm(public.budget_farm_id(budget_id)));

------------------------------------------------------------------------------------------------
-- 12. Standards catalogue
------------------------------------------------------------------------------------------------
insert into public.farm_agronomic_standards (standard_code, crop_or_livestock_id, agro_zone, version, title, description, parameters)
values
  ('GAP_MAIZE_V1', 'maize', 'rainforest', '1.0', 'IITA GAP maize production standard',
   'Good Agricultural Practice benchmarks for grain maize in South-West Nigeria',
   '{"seed_rate_kg_ha":20,"plant_density_per_ha":53333,"spacing_cm":"75x25","basal_npk_15_15_15_kg_ha":250,"topdress_urea_kg_ha":150,"target_yield_kg_ha":4000}'),
  ('GAP_CASSAVA_V1', 'cassava', 'derived_savanna', '1.0', 'IITA cassava production standard',
   'Benchmarks for TME 419 and vitamin A yellow cassava',
   '{"stem_bundles_ha":50,"plant_density_per_ha":10000,"spacing_cm":"100x100","basal_npk_15_15_15_kg_ha":200,"target_yield_kg_ha":25000}'),
  ('GAP_SOYBEAN_V1', 'soybean', 'derived_savanna', '1.0', 'IITA soybean production standard',
   'Benchmarks for TGX soybean varieties',
   '{"seed_rate_kg_ha":60,"spacing_cm":"75x5","ssp_kg_ha":100,"target_yield_kg_ha":2000}'),
  ('LIVESTOCK_BROILER_FEED_V1', 'poultry', 'all', '1.0', 'Commercial broiler feeding standard',
   'Feed conversion ratio benchmarks across starter, grower and finisher phases',
   '{"target_fcr":1.65,"starter_feed_g_bird":1000,"grower_feed_g_bird":1500,"finisher_feed_g_bird":1800,"acceptable_mortality_pct":3.5}'),
  ('LIVESTOCK_LAYER_V1', 'poultry', 'all', '1.0', 'Commercial layer production standard',
   'Hen-day production and feed intake benchmarks',
   '{"target_hen_day_pct":85,"feed_g_bird_day":115,"acceptable_mortality_pct_month":1}')
on conflict (standard_code, version) do nothing;
