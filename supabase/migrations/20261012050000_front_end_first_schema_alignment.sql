-- ==============================================================================
-- CultivaNode — Comprehensive Front-End First Schema Alignment Migration
-- Baseline: 12 October 2026
-- Standing Order: Front-End Primacy & Backend Accommodation
-- ==============================================================================

-- 1. CROP CYCLES & PRODUCTION
alter table if exists public.crop_cycles
  add column if not exists crop_name text,
  add column if not exists variety text,
  add column if not exists planted_area_hectares numeric(10, 2),
  add column if not exists start_date date,
  add column if not exists target_harvest_date date,
  add column if not exists budget_cap_minor bigint default 0;

update public.crop_cycles
set crop_name = crop_id
where crop_name is null and crop_id is not null;

update public.crop_cycles
set variety = variety_id
where variety is null and variety_id is not null;

update public.crop_cycles
set planted_area_hectares = target_area_ha
where planted_area_hectares is null and target_area_ha is not null;

update public.crop_cycles
set start_date = planting_date
where start_date is null and planting_date is not null;

update public.crop_cycles
set target_harvest_date = expected_harvest_date
where target_harvest_date is null and expected_harvest_date is not null;

update public.crop_cycles
set budget_cap_minor = coalesce(estimated_budget_kobo, 0)
where budget_cap_minor is null or budget_cap_minor = 0;

-- 2. CROP CYCLE OPERATIONS & ADVISORY
alter table if exists public.crop_cycle_operations
  add column if not exists cycle_id uuid references public.crop_cycles(id) on delete cascade,
  add column if not exists planned_inputs jsonb default '[]'::jsonb,
  add column if not exists actual_inputs jsonb default '[]'::jsonb,
  add column if not exists direct_cost_minor bigint default 0;

update public.crop_cycle_operations
set cycle_id = crop_cycle_id
where cycle_id is null and crop_cycle_id is not null;

update public.crop_cycle_operations
set direct_cost_minor = coalesce(actual_cost_kobo, 0)
where direct_cost_minor is null or direct_cost_minor = 0;

-- 3. CROP OBSERVATIONS & SCOUTING
alter table if exists public.crop_observations
  add column if not exists observation_type text,
  add column if not exists recommended_action text;

update public.crop_observations
set observation_type = category
where observation_type is null and category is not null;

-- 4. PLOTS & LAND DELINEATION
alter table if exists public.plots
  add column if not exists plot_code text,
  add column if not exists code text,
  add column if not exists size_hectares numeric(10, 4),
  add column if not exists soil_texture text,
  add column if not exists soil_type text,
  add column if not exists slope text,
  add column if not exists irrigation_type text,
  add column if not exists irrigation_status text,
  add column if not exists accessibility text;

update public.plots
set size_hectares = area_ha
where size_hectares is null and area_ha is not null;

update public.plots
set code = plot_code
where code is null and plot_code is not null;

update public.plots
set soil_texture = soil_type
where soil_texture is null and soil_type is not null;

update public.plots
set irrigation_type = irrigation_status
where irrigation_type is null and irrigation_status is not null;

-- 5. FARM WORKERS & LABOUR
alter table if exists public.farm_workers
  add column if not exists daily_rate_minor bigint default 0;

update public.farm_workers
set daily_rate_minor = coalesce(daily_wage_kobo, 0)
where daily_rate_minor is null or daily_rate_minor = 0;

-- 6. OPERATIONAL TASKS
alter table if exists public.farm_operational_tasks
  add column if not exists direct_cost_minor bigint default 0;

alter table if exists public.farm_operational_tasks
  drop constraint if exists farm_operational_tasks_status_check;

alter table if exists public.farm_operational_tasks
  add constraint farm_operational_tasks_status_check
  check (status in ('todo', 'planned', 'assigned', 'in_progress', 'blocked', 'completed', 'cancelled', 'overdue'));

update public.farm_operational_tasks
set direct_cost_minor = coalesce(direct_cost_kobo, 0)
where direct_cost_minor is null or direct_cost_minor = 0;

-- 7. ATTENDANCE RECORDS
alter table if exists public.farm_attendance_records
  add column if not exists work_date date default current_date,
  add column if not exists labor_cost_minor bigint default 0;

alter table if exists public.farm_attendance_records
  alter column farm_id drop not null;

update public.farm_attendance_records
set labor_cost_minor = coalesce(daily_pay_kobo, 0)
where labor_cost_minor is null or labor_cost_minor = 0;

-- 8. INVENTORY STORAGE LOCATIONS
alter table if exists public.farm_inventory_locations
  add column if not exists name text;

update public.farm_inventory_locations
set name = location_name
where name is null and location_name is not null;

-- 9. INVENTORY ITEMS & TRANSACTIONS
alter table if exists public.farm_inventory
  add column if not exists location_id uuid references public.farm_inventory_locations(id) on delete set null,
  add column if not exists item_category text,
  add column if not exists current_quantity numeric(12, 3) default 0,
  add column if not exists average_cost_minor bigint default 0,
  add column if not exists reorder_level numeric(12, 3) default 0,
  add column if not exists lot_number text;

update public.farm_inventory
set item_category = category
where item_category is null and category is not null;

update public.farm_inventory
set current_quantity = quantity
where current_quantity = 0 and quantity > 0;

update public.farm_inventory
set average_cost_minor = coalesce(unit_cost_kobo, 0)
where average_cost_minor = 0 and unit_cost_kobo > 0;

update public.farm_inventory
set reorder_level = coalesce(reorder_threshold, 0)
where reorder_level = 0 and reorder_threshold > 0;

-- 10. FARM BUDGETS
alter table if exists public.farm_budgets
  add column if not exists enterprise_name text,
  add column if not exists season text,
  add column if not exists year integer,
  add column if not exists planned_revenue_minor bigint default 0,
  add column if not exists planned_cost_minor bigint default 0;

alter table if exists public.farm_budgets
  alter column enterprise_type set default 'crop';

update public.farm_budgets
set enterprise_name = title
where enterprise_name is null and title is not null;

update public.farm_budgets
set year = fiscal_year
where year is null and fiscal_year is not null;

update public.farm_budgets
set planned_cost_minor = coalesce(total_budget_kobo, 0)
where planned_cost_minor = 0 and total_budget_kobo > 0;

-- 11. BUDGET LINES
alter table if exists public.farm_budget_lines
  add column if not exists cost_type text default 'variable',
  add column if not exists description text,
  add column if not exists planned_minor bigint default 0,
  add column if not exists actual_minor bigint default 0;

update public.farm_budget_lines
set description = line_item
where description is null and line_item is not null;

update public.farm_budget_lines
set planned_minor = coalesce(budgeted_amount_kobo, 0)
where planned_minor = 0 and budgeted_amount_kobo > 0;

update public.farm_budget_lines
set actual_minor = coalesce(actual_amount_kobo, 0)
where actual_minor = 0 and actual_amount_kobo > 0;

-- 12. PLAN ACTUAL VARIANCES
alter table if exists public.farm_plan_actual_variances
  add column if not exists metric text,
  add column if not exists planned_value numeric(12, 3),
  add column if not exists variance_percentage numeric(8, 2),
  add column if not exists variance_nature text,
  add column if not exists root_cause text,
  add column if not exists corrective_action text;

alter table if exists public.farm_plan_actual_variances
  alter column entity_type set default 'crop',
  alter column unit set default 'unit',
  alter column standard_value set default 0,
  alter column plan_value drop not null;

update public.farm_plan_actual_variances
set metric = metric_name
where metric is null and metric_name is not null;

update public.farm_plan_actual_variances
set planned_value = plan_value
where planned_value is null and plan_value is not null;

update public.farm_plan_actual_variances
set root_cause = farmer_deviation_reason
where root_cause is null and farmer_deviation_reason is not null;

-- 13. MACHINERY ASSETS
alter table if exists public.farm_machinery_assets
  add column if not exists make text,
  add column if not exists serial_number text,
  add column if not exists status text default 'operational',
  add column if not exists total_operating_hours numeric(10, 2) default 0,
  add column if not exists fuel_consumption_rate numeric(8, 2),
  add column if not exists next_service_hours numeric(10, 2);

alter table if exists public.farm_machinery_assets
  alter column asset_code set default 'MACH-' || substr(gen_random_uuid()::text, 1, 8);

update public.farm_machinery_assets
set make = manufacturer
where make is null and manufacturer is not null;

update public.farm_machinery_assets
set serial_number = registration_number
where serial_number is null and registration_number is not null;

update public.farm_machinery_assets
set total_operating_hours = coalesce(engine_hours, 0)
where total_operating_hours = 0 and engine_hours > 0;

-- 14. MACHINERY USAGE LOGS
alter table if exists public.farm_machinery_usage_logs
  add column if not exists crop_cycle_id uuid references public.crop_cycles(id) on delete set null,
  add column if not exists activity text,
  add column if not exists hours_run numeric(6, 2) default 0,
  add column if not exists fuel_litres_used numeric(8, 2) default 0,
  add column if not exists fuel_cost_minor bigint default 0,
  add column if not exists operator_labor_cost_minor bigint default 0,
  add column if not exists log_date date default current_date;

alter table if exists public.farm_machinery_usage_logs
  alter column farm_id drop not null,
  alter column start_time set default now(),
  alter column end_time set default now(),
  alter column hours_operated set default 0;

update public.farm_machinery_usage_logs
set activity = operation_name
where activity is null and operation_name is not null;

update public.farm_machinery_usage_logs
set hours_run = coalesce(hours_operated, 0)
where hours_run = 0 and hours_operated > 0;

update public.farm_machinery_usage_logs
set fuel_litres_used = coalesce(fuel_litres_consumed, 0)
where fuel_litres_used = 0 and fuel_litres_consumed > 0;

update public.farm_machinery_usage_logs
set fuel_cost_minor = coalesce(operational_cost_kobo, 0)
where fuel_cost_minor = 0 and operational_cost_kobo > 0;

-- 15. LIVESTOCK ANIMALS
alter table if exists public.farm_livestock_animals
  add column if not exists rfid_tag text,
  add column if not exists status text default 'active';

update public.farm_livestock_animals
set rfid_tag = rfid_code
where rfid_tag is null and rfid_code is not null;

-- 16. LIVESTOCK HEALTH EVENTS
alter table if exists public.farm_livestock_health_events
  add column if not exists treatment_type text,
  add column if not exists treatment_name text,
  add column if not exists cost_minor bigint default 0,
  add column if not exists withdrawal_days integer default 0,
  add column if not exists administered_at timestamptz default now();

alter table if exists public.farm_livestock_health_events
  alter column farm_id drop not null;

update public.farm_livestock_health_events
set treatment_type = event_type
where treatment_type is null and event_type is not null;

update public.farm_livestock_health_events
set treatment_name = disease_or_condition
where treatment_name is null and disease_or_condition is not null;

update public.farm_livestock_health_events
set cost_minor = coalesce(cost_kobo, 0)
where cost_minor = 0 and cost_kobo > 0;

update public.farm_livestock_health_events
set withdrawal_days = coalesce(withdrawal_period_days, 0)
where withdrawal_days = 0 and withdrawal_period_days > 0;

-- 17. LIVESTOCK FEEDINGS
alter table if exists public.farm_livestock_feedings
  add column if not exists animal_id uuid references public.farm_livestock_animals(id) on delete set null,
  add column if not exists cost_minor bigint default 0;

alter table if exists public.farm_livestock_feedings
  alter column farm_id drop not null;

update public.farm_livestock_feedings
set cost_minor = coalesce(cost_kobo, 0)
where cost_minor = 0 and cost_kobo > 0;

-- 18. PERMISSIONS & SCHEMA NOTIFY
grant all on all tables in schema public to authenticated, anon, service_role;
grant all on all sequences in schema public to authenticated, anon, service_role;

-- Notify PostgREST to immediately refresh its schema cache
notify pgrst, 'reload schema';
