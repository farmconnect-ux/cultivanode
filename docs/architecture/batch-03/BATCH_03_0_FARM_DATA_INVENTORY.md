# Batch 03.0 — Farm Data Architecture & 35-Table Inventory

**Date:** 2026-11-19  
**Scope:** Complete schema, provenance, temporal, RLS, and cross-table integrity assessment across the 35 core farm, identity, IoT, and audit tables in `supabase/migrations/`.

---

## 1. Schema Inventory by Domain

### A. Identity, Organisation & Governance
| Table | Defining / Key Migrations | Key FKs & Scope | Temporal Columns | Provenance / Status | RLS Boundary |
|---|---|---|---|---|---|
| `profiles` | `20260926021050:16-31`, `20261118020000:3-9`, `20261118030000:8-10` | PK `id` (`auth.users` FK dropped for soft-delete); `onboarded_by` | `created_at`, `updated_at`, `deleted_at` | `account_type`, `verification_tier`, `deletion_status` | Self, `onboarded_by`, or `has_permission('users.read')` |
| `organizations` | `20260926021050:34-41`, `20261118030000:12-13` | `owner_id`, `created_by` -> `profiles` | `created_at`, `updated_at`, `archived_at` | Active vs archived | `org_role(id) is not null` or `users.read` |
| `org_members` | `20260926021050:44-51` | `(organization_id, profile_id)`, `added_by` | `created_at` *(no `updated_at`)* | `member_role` (1 `'owner'` partial index) | `org_role(organization_id) is not null` or `users.read` |
| `audit_log` | `20260926021050:120-128`, `20260926091849:166-204` | `actor_id` -> `profiles`; `entity_id` (no FK) | `created_at` (append-only `forbid_change()`) | `ip`, `user_agent`, `old/new_values`, `metadata` | Select `has_permission('audit.read')`; write via `write_audit()` |
| `notifications` | `20260929090000:123-132` | `profile_id` -> `profiles`; `booking_id` -> `bookings` | `created_at`, `read_at` | `kind` | Select `profile_id = auth.uid()` |

### B. Farm, Plots, Zones, Soil & Agronomy Standards
| Table | Defining / Key Migrations | Key FKs & Scope | Temporal Columns | Provenance / Status | RLS Boundary |
|---|---|---|---|---|---|
| `farms` | `20260926021117:7-25`, `20261008130000:66-85` | `owner_id`, `organization_id`, `onboarded_by`, `created_by` | `created_at`, `updated_at`, `zone_corrected_at` | `source` (`record_source`), `status`, `zone` | `private.can_view_farm(id)` / `can_edit_farm(id)` |
| `plots` | `20260926021117:30-41`, `20261017200000:107-123` | `farm_id` -> `farms`; `created_by` | `created_at`, `updated_at` | *(No `source` or `status`)* | `can_view_farm(farm_id)` / `can_edit_farm(farm_id)` |
| `farm_zones` | `20260926091849:637-645` | PK `zone` (`farm_zone` enum) | `created_at`, `updated_at` | PostGIS `MultiPolygon` reference | Public read (`anon, authenticated`) |
| `soil_records` | `20260926021117:44-58`, `20260926091849:600` | `plot_id` -> `plots`; `created_by` | `tested_on` (`date`), `created_at` *(no `updated_at`)* | `source` (`record_source`), `lab_name` | `can_view_farm(plot_farm_id(plot_id))` / `can_edit_farm(...)` |
| `farm_agronomic_standards` | `20261008130000:102-116`, `20261103120000:28-43` | `supersedes_id`, `author_id`, `reviewer_id`, `approved_by_id` | `created_at`, `approved_at`, `published_at`, `effective_from/to` | `source_authority`, `status` (immutable when published) | `status = 'published'` or `has_permission('standards.publish')` |

### C. Crops, Inventory, Financials, Livestock, Tasks, Machinery & Irrigation
- **Crops (`20261008130000`):** `crop_cycles` (`farm_id`, `plot_id`, `standard_id`), `crop_cycle_operations` (`crop_cycle_id`, `assigned_worker_id` -> `profiles`, `booking_id`), `crop_observations` (+ `20261025130000` `ai_diagnosis`, `ai_model`, `ai_analysed_at`), `crop_harvests` (`recorded_by`), `crop_alerts` (`farm_id`, `crop_cycle_id`).
- **Inventory & Finance (`20261008130000`):** `farm_inventory`, `farm_inventory_transactions` (`reference_order_id` has no FK), `farm_financial_transactions` (`farm_id`, `crop_cycle_id`, `budget_id`, `recorded_by`).
- **Livestock (`20261008130000`):** `farm_livestock_groups`, `farm_livestock_animals`, `farm_livestock_health_events`, `farm_livestock_feedings`, `farm_livestock_production_logs`.
- **Tasks & Machinery (`20261008130000`, `20261011100000`, `20261011121000`):** `farm_operational_tasks` (`assigned_worker_id` -> `farm_workers`), `farm_machinery_assets`, `farm_machinery_usage_logs` (`operator_id` -> `farm_workers`), `farm_machinery_maintenance`, and `public.machinery_telemetry` (`20261011100000:62-77, 480-486`; `farm_id`, `machinery_id` -> `farm_machinery_assets`, `recorded_at`, `engine_hours`, `status`; RLS via `can_view_farm`/`can_edit_farm`; view `public.machinery_telemetry_points` in `20261011121000:3-14`). *(Note: `machinery_telemetry` lacks a `quality_flag` column and lacks a same-farm trigger checking `machinery_id`'s `farm_id`.)*
- **Irrigation (`20261011100000`):** `irrigation_zones` (missing `updated_at` trigger), `irrigation_events` (`trigger`: `manual|schedule|sensor|weather`).
- **IoT (`20261009100000`):** `sensor_channels`, `device_installations` (`installed_by` -> `auth.users`, `crop_cycle_id` has no FK), `telemetry_readings` (no `farm_id`; RLS requires `plot_id is not null`), `telemetry_rollups`, `device_alerts` (`acknowledged_by` -> `auth.users`, `sync_to_crop_alert_id` has no FK), `device_commands` (`created_by` -> `auth.users` nullable `ON DELETE SET NULL`; RLS enabled, **no policies / `service_role` only**).

---

## 2. Critical Cross-Table Gaps & Conflicting Sources of Truth

1. **Broken IoT-to-Crop Bridge:** `sync_approved_iot_to_crop_measurements()` is a no-op stub (`20261009100000:899-909`) because `crop_measurements` was retired to `crop_measurements_legacy` (`20261008130000:45-53`).
2. **Duplicated / Conflicting Truths:**
   - **Soil:** `soil_records` vs `plots` (`soil_texture`, `soil_ph`, `organic_matter_pct`) vs `farms.soil_information` (JSONB) vs `device_installations.soil_texture`.
   - **Irrigation & Moisture:** `farms` (`water_sources[]`, `irrigation_systems[]`) vs `plots` (`irrigation_type`, `water_source`) vs `irrigation_zones` (`method`, `water_source`, manual `current_moisture_pct`) vs live `telemetry_rollups` (`soil_moisture_pct`).
   - **Current Crop:** `plots.current_crop` / `previous_crop` vs active `crop_cycles`.
   - **Machinery Hours:** `farm_machinery_assets.engine_hours` vs `farm_machinery_usage_logs.hours_operated` vs `machinery_telemetry.engine_hours`.
   - **Livestock Counts:** `farm_livestock` (legacy) vs `farm_livestock_groups.population` vs `farm_livestock_animals`.
   - **Crop Cycle Cost:** `crop_cycles.actual_cost_kobo` is unsynced (`sync_crop_cycle_actual_cost` retired to `*_legacy`).
   - **Alerts:** `crop_alerts` (`is_dismissed`) vs `device_alerts` (`status`, unlinked `sync_to_crop_alert_id`).
3. **Missing FKs & Cross-Farm Drift:**
   - `device_installations.crop_cycle_id`, `device_alerts.sync_to_crop_alert_id`, `farm_inventory_transactions.reference_order_id`, and `crop_cycles.crop_id` lack FKs.
   - `farm_workers` has no `profile_id` FK (splitting worker assignments between `profiles` in `crop_cycle_operations` and `farm_workers` in `farm_operational_tasks`).
   - `check_plot_cycle_overlap` was retired (`*_legacy`), allowing overlapping active cycles on one plot.
4. **Provenance & Temporal Gaps:**
   - `record_source` exists only on `farms` and `soil_records`.
   - `created_by`/`recorded_by` is absent on `crop_cycle_operations`, `crop_alerts`, `farm_inventory`, all 5 livestock tables, `farm_operational_tasks`, all 3 machinery tables, and both irrigation tables.
   - Multiple mutable tables lack `updated_at`; operational/financial/health dates use `date` instead of `timestamptz`.
5. **Mixed User FKs:** IoT tables reference `auth.users(id)` (`ON DELETE SET NULL`), whereas farm/identity tables reference `public.profiles(id)` (retained across account deletion).
