-- CultivaNode: Crop Management Module Migration
-- CM-02: Complete persistence, lifecycle constraints, RLS, triggers & PostGIS geospatial integration

------------------------------------------------------------------------------------------------
-- 1. Enums
------------------------------------------------------------------------------------------------

do $$ begin
  create type public.crop_cycle_status as enum ('planning', 'active', 'harvesting', 'completed', 'abandoned');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.crop_operation_status as enum ('pending', 'in_progress', 'completed', 'skipped', 'blocked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.crop_health_status as enum ('excellent', 'good', 'watch', 'critical');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.scouting_category as enum ('pest', 'disease', 'weed', 'nutrient_deficiency', 'water_stress', 'general');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.scouting_severity as enum ('low', 'medium', 'high', 'severe');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.crop_input_category as enum ('seed', 'fertiliser', 'herbicide', 'insecticide', 'fungicide', 'irrigation', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.crop_alert_category as enum ('weather', 'pest_outbreak', 'phi_violation', 'harvest_window', 'operation_overdue');
exception when duplicate_object then null;
end $$;

------------------------------------------------------------------------------------------------
-- 2. Alter Plots for Agronomic Telemetry
------------------------------------------------------------------------------------------------

alter table public.plots
  add column if not exists soil_texture text check (soil_texture is null or soil_texture in ('sandy', 'loamy_sand', 'sandy_loam', 'loam', 'silt_loam', 'clay_loam', 'clay')),
  add column if not exists drainage text check (drainage is null or drainage in ('well_drained', 'moderate', 'poor', 'waterlogged')),
  add column if not exists slope_pct numeric(5, 2) check (slope_pct is null or (slope_pct >= 0 and slope_pct <= 100)),
  add column if not exists irrigation_type text check (irrigation_type is null or irrigation_type in ('rainfed', 'drip', 'sprinkler', 'furrow', 'manual')) default 'rainfed',
  add column if not exists water_source text check (water_source is null or char_length(water_source) <= 120);

------------------------------------------------------------------------------------------------
-- 3. Crop Cycles Table
------------------------------------------------------------------------------------------------

create table if not exists public.crop_cycles (
  id                    uuid primary key default gen_random_uuid(),
  plot_id               uuid not null references public.plots (id) on delete cascade,
  crop_id               text not null check (char_length(crop_id) between 2 and 60),
  variety_id           text not null check (char_length(variety_id) between 2 and 60),
  season                text not null default 'early_rainy' check (season in ('early_rainy', 'late_rainy', 'dry_irrigation', 'all_year')),
  status                public.crop_cycle_status not null default 'planning',
  target_area_ha        numeric(12, 4) not null check (target_area_ha > 0),
  planting_date         date not null,
  expected_harvest_date date not null check (expected_harvest_date >= planting_date),
  actual_harvest_date   date check (actual_harvest_date is null or actual_harvest_date >= planting_date),
  target_yield_kg       numeric(12, 2) not null check (target_yield_kg >= 0),
  actual_yield_kg       numeric(12, 2) not null default 0 check (actual_yield_kg >= 0),
  current_stage         text not null default 'land_prep',
  health_score          numeric(4, 2) not null default 1.00 check (health_score between 0.00 and 1.00),
  health_status         public.crop_health_status not null default 'good',
  estimated_budget_kobo bigint not null default 0 check (estimated_budget_kobo >= 0),
  actual_cost_kobo      bigint not null default 0 check (actual_cost_kobo >= 0),
  created_by            uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists crop_cycles_plot_idx on public.crop_cycles (plot_id);
create index if not exists crop_cycles_status_idx on public.crop_cycles (status);
create index if not exists crop_cycles_crop_idx on public.crop_cycles (crop_id);

------------------------------------------------------------------------------------------------
-- 4. Crop Cycle Operations Table
------------------------------------------------------------------------------------------------

create table if not exists public.crop_cycle_operations (
  id                    uuid primary key default gen_random_uuid(),
  cycle_id              uuid not null references public.crop_cycles (id) on delete cascade,
  name                  text not null check (char_length(name) between 2 and 120),
  stage                 text not null check (char_length(stage) between 2 and 60),
  relative_start_day    integer not null,
  relative_end_day      integer not null check (relative_end_day >= relative_start_day),
  scheduled_start_date  date not null,
  scheduled_end_date    date not null check (scheduled_end_date >= scheduled_start_date),
  actual_date           date,
  status                public.crop_operation_status not null default 'pending',
  notes                 text check (notes is null or char_length(notes) <= 1000),
  booking_id            uuid references public.bookings (id) on delete set null,
  required_equipment    text check (required_equipment is null or char_length(required_equipment) <= 80),
  actual_cost_kobo      bigint not null default 0 check (actual_cost_kobo >= 0),
  completed_by          uuid references public.profiles (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists crop_cycle_ops_cycle_idx on public.crop_cycle_operations (cycle_id);
create index if not exists crop_cycle_ops_status_idx on public.crop_cycle_operations (status);
create index if not exists crop_cycle_ops_sched_date_idx on public.crop_cycle_operations (scheduled_start_date);

------------------------------------------------------------------------------------------------
-- 5. Crop Observations (Scouting & Field Logs)
------------------------------------------------------------------------------------------------

create table if not exists public.crop_observations (
  id                  uuid primary key default gen_random_uuid(),
  cycle_id            uuid not null references public.crop_cycles (id) on delete cascade,
  observer_id         uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category            public.scouting_category not null,
  severity            public.scouting_severity not null,
  description         text not null check (char_length(description) >= 3),
  photo_paths         text[] default array[]::text[],
  location            extensions.geography(Point, 4326),
  recommended_action  text check (recommended_action is null or char_length(recommended_action) <= 1000),
  resolved            boolean not null default false,
  resolved_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists crop_obs_cycle_idx on public.crop_observations (cycle_id);
create index if not exists crop_obs_resolved_idx on public.crop_observations (cycle_id, resolved);
create index if not exists crop_obs_location_gix on public.crop_observations using gist (location);

------------------------------------------------------------------------------------------------
-- 6. Crop Measurements (Telemetry & Stand Counts)
------------------------------------------------------------------------------------------------

create table if not exists public.crop_measurements (
  id            uuid primary key default gen_random_uuid(),
  cycle_id      uuid not null references public.crop_cycles (id) on delete cascade,
  metric_name   text not null check (char_length(metric_name) between 2 and 60),
  metric_value  numeric(10, 2) not null,
  recorded_at   timestamptz not null default now(),
  recorded_by   uuid default auth.uid() references public.profiles (id) on delete set null
);

create index if not exists crop_meas_cycle_metric_idx on public.crop_measurements (cycle_id, metric_name, recorded_at desc);

------------------------------------------------------------------------------------------------
-- 7. Crop Input Applications (Seeds, Fertiliser, Crop Protection)
------------------------------------------------------------------------------------------------

create table if not exists public.crop_input_applications (
  id                         uuid primary key default gen_random_uuid(),
  cycle_id                   uuid not null references public.crop_cycles (id) on delete cascade,
  operation_id               uuid references public.crop_cycle_operations (id) on delete set null,
  category                   public.crop_input_category not null,
  chemical_id                text check (chemical_id is null or char_length(chemical_id) <= 80),
  product_name               text not null check (char_length(product_name) between 2 and 120),
  active_ingredient          text check (active_ingredient is null or char_length(active_ingredient) <= 120),
  rate_per_ha                numeric(10, 2) not null check (rate_per_ha > 0),
  unit                       text not null check (unit in ('liters', 'kg', 'bags', 'grams')),
  area_applied_ha            numeric(10, 2) not null check (area_applied_ha > 0),
  total_quantity             numeric(10, 2) not null check (total_quantity > 0),
  cost_kobo                  bigint not null default 0 check (cost_kobo >= 0),
  pre_harvest_interval_days  integer default 0 check (pre_harvest_interval_days >= 0),
  re_entry_interval_hours    integer default 0 check (re_entry_interval_hours >= 0),
  applied_date               date not null,
  applied_by                 uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at                 timestamptz not null default now()
);

create index if not exists crop_input_apps_cycle_idx on public.crop_input_applications (cycle_id);

------------------------------------------------------------------------------------------------
-- 8. Crop Harvests
------------------------------------------------------------------------------------------------

create table if not exists public.crop_harvests (
  id                uuid primary key default gen_random_uuid(),
  cycle_id          uuid not null references public.crop_cycles (id) on delete cascade,
  batch_code        text not null unique check (char_length(batch_code) between 4 and 60),
  harvest_date      date not null,
  quantity_kg       numeric(12, 2) not null check (quantity_kg > 0),
  quality_grade     text not null check (quality_grade in ('grade_a', 'grade_b', 'grade_c', 'processing_grade')),
  moisture_pct      numeric(5, 2) check (moisture_pct is null or (moisture_pct between 0 and 100)),
  loss_pct          numeric(5, 2) check (loss_pct is null or (loss_pct between 0 and 100)),
  storage_location  text check (storage_location is null or char_length(storage_location) <= 120),
  notes             text check (notes is null or char_length(notes) <= 1000),
  recorded_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists crop_harvests_cycle_idx on public.crop_harvests (cycle_id);

------------------------------------------------------------------------------------------------
-- 9. Crop Alerts
------------------------------------------------------------------------------------------------

create table if not exists public.crop_alerts (
  id            uuid primary key default gen_random_uuid(),
  cycle_id      uuid not null references public.crop_cycles (id) on delete cascade,
  category      public.crop_alert_category not null,
  severity      text not null check (severity in ('info', 'warning', 'critical')),
  title         text not null check (char_length(title) between 2 and 120),
  message       text not null check (char_length(message) >= 5),
  action_url    text check (action_url is null or char_length(action_url) <= 300),
  is_dismissed  boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists crop_alerts_cycle_active_idx on public.crop_alerts (cycle_id) where not is_dismissed;

------------------------------------------------------------------------------------------------
-- 10. Triggers & Helpers
------------------------------------------------------------------------------------------------

create or replace function public.can_view_farm(p_farm uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.can_view_farm(p_farm);
$$;

create or replace function public.can_edit_farm(p_farm uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.can_edit_farm(p_farm);
$$;

create or replace function public.plot_farm_id(p_plot uuid)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.farm_id from public.plots p where p.id = p_plot;
$$;

create or replace function private.plot_farm_id(p_plot uuid)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.farm_id from public.plots p where p.id = p_plot;
$$;

grant execute on function public.can_view_farm(uuid) to authenticated, service_role;
grant execute on function public.can_edit_farm(uuid) to authenticated, service_role;
grant execute on function public.plot_farm_id(uuid) to authenticated, service_role;
grant execute on function private.plot_farm_id(uuid) to authenticated, service_role;

create or replace function public.cycle_farm_id(p_cycle uuid)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.farm_id
  from public.crop_cycles c
  join public.plots p on p.id = c.plot_id
  where c.id = p_cycle;
$$;

create or replace function public.can_view_cycle(p_cycle uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.crop_cycles c
    join public.plots p on p.id = c.plot_id
    where c.id = p_cycle
      and (public.can_view_farm(p.farm_id) or public.has_permission('crops.manage'))
  );
$$;

create or replace function public.can_edit_cycle(p_cycle uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.crop_cycles c
    join public.plots p on p.id = c.plot_id
    where c.id = p_cycle
      and (public.can_edit_farm(p.farm_id) or public.has_permission('crops.manage'))
  );
$$;

-- Overlap Invariant: A plot cannot host multiple concurrent active/planning/harvesting cycles
create or replace function public.check_plot_cycle_overlap()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('planning', 'active', 'harvesting') then
    if exists (
      select 1 from public.crop_cycles
      where plot_id = new.plot_id
        and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and status in ('planning', 'active', 'harvesting')
    ) then
      raise exception 'Plot already has an active or planned crop cycle. Complete or abandon the current cycle before starting a new one.'
        using errcode = '23505';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_check_plot_cycle_overlap
  before insert or update of plot_id, status on public.crop_cycles
  for each row execute function public.check_plot_cycle_overlap();

-- Harvest Yield Rollup Trigger
create or replace function public.sync_crop_cycle_actual_yield()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_cycle_id uuid;
  v_total_kg numeric(12, 2);
begin
  v_cycle_id := coalesce(new.cycle_id, old.cycle_id);
  select coalesce(sum(quantity_kg), 0) into v_total_kg
  from public.crop_harvests
  where cycle_id = v_cycle_id;

  update public.crop_cycles
  set actual_yield_kg = v_total_kg,
      updated_at = now()
  where id = v_cycle_id;

  return coalesce(new, old);
end;
$$;

create trigger trg_sync_crop_cycle_actual_yield
  after insert or update or delete on public.crop_harvests
  for each row execute function public.sync_crop_cycle_actual_yield();

-- Cost Rollup Trigger (Operations + Inputs)
create or replace function public.sync_crop_cycle_actual_cost()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_cycle_id uuid;
  v_ops_cost bigint;
  v_inputs_cost bigint;
begin
  v_cycle_id := coalesce(new.cycle_id, old.cycle_id);

  select coalesce(sum(actual_cost_kobo), 0) into v_ops_cost
  from public.crop_cycle_operations
  where cycle_id = v_cycle_id;

  select coalesce(sum(cost_kobo), 0) into v_inputs_cost
  from public.crop_input_applications
  where cycle_id = v_cycle_id;

  update public.crop_cycles
  set actual_cost_kobo = v_ops_cost + v_inputs_cost,
      updated_at = now()
  where id = v_cycle_id;

  return coalesce(new, old);
end;
$$;

create trigger trg_sync_ops_actual_cost
  after insert or update or delete on public.crop_cycle_operations
  for each row execute function public.sync_crop_cycle_actual_cost();

create trigger trg_sync_inputs_actual_cost
  after insert or update or delete on public.crop_input_applications
  for each row execute function public.sync_crop_cycle_actual_cost();

create trigger crop_cycles_updated_at before update on public.crop_cycles
  for each row execute function public.set_updated_at();

create trigger crop_cycle_ops_updated_at before update on public.crop_cycle_operations
  for each row execute function public.set_updated_at();

------------------------------------------------------------------------------------------------
-- 11. Row Level Security
------------------------------------------------------------------------------------------------

alter table public.crop_cycles              enable row level security;
alter table public.crop_cycle_operations   enable row level security;
alter table public.crop_observations        enable row level security;
alter table public.crop_measurements        enable row level security;
alter table public.crop_input_applications  enable row level security;
alter table public.crop_harvests            enable row level security;
alter table public.crop_alerts              enable row level security;

-- crop_cycles
create policy "crop_cycles: read with farm" on public.crop_cycles
  for select to authenticated
  using (public.can_view_farm(public.plot_farm_id(plot_id)) or public.has_permission('crops.manage'));

create policy "crop_cycles: insert with farm" on public.crop_cycles
  for insert to authenticated
  with check (public.can_edit_farm(public.plot_farm_id(plot_id)) or public.has_permission('crops.manage'));

create policy "crop_cycles: update with farm" on public.crop_cycles
  for update to authenticated
  using (public.can_edit_farm(public.plot_farm_id(plot_id)) or public.has_permission('crops.manage'))
  with check (public.can_edit_farm(public.plot_farm_id(plot_id)) or public.has_permission('crops.manage'));

create policy "crop_cycles: delete with farm" on public.crop_cycles
  for delete to authenticated
  using (public.can_edit_farm(public.plot_farm_id(plot_id)) or public.has_permission('crops.manage'));

-- crop_cycle_operations
create policy "crop_cycle_ops: read with cycle" on public.crop_cycle_operations
  for select to authenticated using (public.can_view_cycle(cycle_id));

create policy "crop_cycle_ops: edit with cycle (insert)" on public.crop_cycle_operations
  for insert to authenticated with check (public.can_edit_cycle(cycle_id));

create policy "crop_cycle_ops: edit with cycle (update)" on public.crop_cycle_operations
  for update to authenticated using (public.can_edit_cycle(cycle_id)) with check (public.can_edit_cycle(cycle_id));

create policy "crop_cycle_ops: edit with cycle (delete)" on public.crop_cycle_operations
  for delete to authenticated using (public.can_edit_cycle(cycle_id));

-- crop_observations
create policy "crop_observations: read with cycle" on public.crop_observations
  for select to authenticated using (public.can_view_cycle(cycle_id));

create policy "crop_observations: insert with cycle" on public.crop_observations
  for insert to authenticated with check (public.can_edit_cycle(cycle_id));

create policy "crop_observations: update with cycle" on public.crop_observations
  for update to authenticated using (public.can_edit_cycle(cycle_id)) with check (public.can_edit_cycle(cycle_id));

create policy "crop_observations: delete with cycle" on public.crop_observations
  for delete to authenticated using (public.can_edit_cycle(cycle_id));

-- crop_measurements
create policy "crop_measurements: read with cycle" on public.crop_measurements
  for select to authenticated using (public.can_view_cycle(cycle_id));

create policy "crop_measurements: insert with cycle" on public.crop_measurements
  for insert to authenticated with check (public.can_edit_cycle(cycle_id));

create policy "crop_measurements: update with cycle" on public.crop_measurements
  for update to authenticated using (public.can_edit_cycle(cycle_id)) with check (public.can_edit_cycle(cycle_id));

create policy "crop_measurements: delete with cycle" on public.crop_measurements
  for delete to authenticated using (public.can_edit_cycle(cycle_id));

-- crop_input_applications
create policy "crop_inputs: read with cycle" on public.crop_input_applications
  for select to authenticated using (public.can_view_cycle(cycle_id));

create policy "crop_inputs: insert with cycle" on public.crop_input_applications
  for insert to authenticated with check (public.can_edit_cycle(cycle_id));

create policy "crop_inputs: update with cycle" on public.crop_input_applications
  for update to authenticated using (public.can_edit_cycle(cycle_id)) with check (public.can_edit_cycle(cycle_id));

create policy "crop_inputs: delete with cycle" on public.crop_input_applications
  for delete to authenticated using (public.can_edit_cycle(cycle_id));

-- crop_harvests
create policy "crop_harvests: read with cycle" on public.crop_harvests
  for select to authenticated using (public.can_view_cycle(cycle_id));

create policy "crop_harvests: insert with cycle" on public.crop_harvests
  for insert to authenticated with check (public.can_edit_cycle(cycle_id));

create policy "crop_harvests: update with cycle" on public.crop_harvests
  for update to authenticated using (public.can_edit_cycle(cycle_id)) with check (public.can_edit_cycle(cycle_id));

create policy "crop_harvests: delete with cycle" on public.crop_harvests
  for delete to authenticated using (public.can_edit_cycle(cycle_id));

-- crop_alerts
create policy "crop_alerts: read with cycle" on public.crop_alerts
  for select to authenticated using (public.can_view_cycle(cycle_id));

create policy "crop_alerts: manage with cycle" on public.crop_alerts
  for all to authenticated using (public.can_edit_cycle(cycle_id)) with check (public.can_edit_cycle(cycle_id));

------------------------------------------------------------------------------------------------
-- 12. Grants
------------------------------------------------------------------------------------------------

revoke all on public.crop_cycles, public.crop_cycle_operations, public.crop_observations,
               public.crop_measurements, public.crop_input_applications, public.crop_harvests,
               public.crop_alerts from anon, authenticated;

grant select, insert, update, delete on
  public.crop_cycles,
  public.crop_cycle_operations,
  public.crop_observations,
  public.crop_measurements,
  public.crop_input_applications,
  public.crop_harvests,
  public.crop_alerts
to authenticated;
