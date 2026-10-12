-- Migration: 20261012040000_plots_and_crops_dedicated_columns.sql
-- 1. Dedicated first-class agronomic and operational columns for public.plots
alter table public.plots
  add column if not exists plot_code text,
  add column if not exists code text,
  add column if not exists size_hectares numeric(12, 4),
  add column if not exists soil_texture text,
  add column if not exists soil_type text,
  add column if not exists slope text,
  add column if not exists irrigation_type text,
  add column if not exists irrigation_status text,
  add column if not exists accessibility text,
  add column if not exists drainage text,
  add column if not exists current_crop text,
  add column if not exists previous_crop text;

-- 2. Dedicated & compatibility columns for public.crop_cycles
alter table public.crop_cycles
  add column if not exists crop_name text,
  add column if not exists variety text,
  add column if not exists planted_area_hectares numeric(10, 2),
  add column if not exists start_date date,
  add column if not exists target_harvest_date date,
  add column if not exists budget_cap_minor bigint;

-- 3. Dedicated & compatibility columns for public.crop_cycle_operations
alter table public.crop_cycle_operations
  add column if not exists planned_inputs jsonb,
  add column if not exists direct_cost_minor bigint;

-- 4. Open table-level grants on farm management tables to authenticated users
grant select, insert, update, delete on public.plots to authenticated;
grant select, insert, update, delete on public.crop_cycles to authenticated;
grant select, insert, update, delete on public.crop_cycle_operations to authenticated;
grant select, insert, update, delete on public.crop_observations to authenticated;
grant select, insert, update, delete on public.farm_agronomic_standards to authenticated;
grant select, insert, update, delete on public.farm_livestock_groups to authenticated;
grant select, insert, update, delete on public.farm_livestock_animals to authenticated;
grant select, insert, update, delete on public.farm_livestock_health_events to authenticated;
grant select, insert, update, delete on public.farm_livestock_feedings to authenticated;
grant select, insert, update, delete on public.farm_livestock_production_logs to authenticated;
grant select, insert, update, delete on public.farm_workers to authenticated;
grant select, insert, update, delete on public.farm_attendance_records to authenticated;
grant select, insert, update, delete on public.farm_operational_tasks to authenticated;
grant select, insert, update, delete on public.farm_machinery_assets to authenticated;
grant select, insert, update, delete on public.farm_machinery_usage_logs to authenticated;
grant select, insert, update, delete on public.farm_equipment_assets to authenticated;
grant select, insert, update, delete on public.farm_inventory_locations to authenticated;
grant select, insert, update, delete on public.farm_inventory to authenticated;
grant select, insert, update, delete on public.farm_inventory_transactions to authenticated;
grant select, insert, update, delete on public.farm_budgets to authenticated;
grant select, insert, update, delete on public.farm_budget_lines to authenticated;
grant select, insert, update, delete on public.farm_plan_actual_variances to authenticated;

-- 5. Harmonize farms insert policy so any authenticated owner can create a farm
alter policy "farms: farmers or their field agents create" on public.farms
  with check (
    (
      owner_id = (select auth.uid())
      and (organization_id is null or public.org_role(organization_id) in ('owner', 'farm_manager'))
    )
    or (
      onboarded_by = (select auth.uid())
      and private.is_my_onboarded_profile(owner_id)
      and private.is_farmer_profile(owner_id)
      and organization_id is null
    )
  );
