-- CultivaNode: Complete Teardown of Farm Management Systems
-- Preserving Platform Core: Auth, Profiles, Organizations, Marketplace, Escrow, Payments, Bookings

-- 1. Drop IoT, Variances, Budgets, and Standards
drop table if exists public.farm_iot_telemetry cascade;
drop table if exists public.farm_budget_lines cascade;
drop table if exists public.farm_budgets cascade;
drop table if exists public.farm_plan_actual_variances cascade;
drop table if exists public.farm_agronomic_standards cascade;

-- 2. Drop Farm Inventory & Storage
drop function if exists public.record_farm_inventory_movement(uuid, uuid, text, numeric, uuid, uuid, text, text, text) cascade;
drop table if exists public.farm_inventory_transactions cascade;
drop table if exists public.farm_inventory_locations cascade;
drop table if exists public.farm_inventory cascade;

-- 3. Drop Machinery, Fleet, and Equipment
drop table if exists public.farm_equipment_assets cascade;
drop table if exists public.farm_machinery_maintenance_records cascade;
drop table if exists public.farm_machinery_usage_logs cascade;
drop table if exists public.farm_machinery_assets cascade;

-- 4. Drop Labour, Tasks, and Attendance
drop table if exists public.farm_operational_tasks cascade;
drop table if exists public.farm_attendance_records cascade;
drop table if exists public.farm_workers cascade;

-- 5. Drop Farm Financial Transactions (legacy)
drop table if exists public.farm_financial_transactions cascade;

-- 6. Drop Livestock Domain
drop table if exists public.farm_livestock_production_logs cascade;
drop table if exists public.farm_livestock_breeding_records cascade;
drop table if exists public.farm_livestock_feedings cascade;
drop table if exists public.farm_livestock_health_events cascade;
drop table if exists public.farm_livestock_animals cascade;
drop table if exists public.farm_livestock cascade;

-- 7. Drop Crop Cycles & Observations
drop table if exists public.crop_alerts cascade;
drop table if exists public.crop_observations cascade;
drop table if exists public.crop_cycle_operations cascade;
drop table if exists public.crop_cycles cascade;

-- 8. Drop Soil Records & Plots
drop table if exists public.soil_records cascade;
drop table if exists public.plots cascade;
drop function if exists public.plot_farm_id(uuid) cascade;

-- 9. Revert farms table extra columns added in farm management migration
alter table if exists public.farms
  drop column if exists farm_code,
  drop column if exists ownership_type,
  drop column if exists water_sources,
  drop column if exists irrigation_systems,
  drop column if exists slope_type,
  drop column if exists accessibility_level,
  drop column if exists soil_information,
  drop column if exists status;
