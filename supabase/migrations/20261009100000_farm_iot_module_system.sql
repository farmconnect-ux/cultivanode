-- =============================================================================
-- CultivaNode Farm Intelligence: IoT Module Core Schema
-- Migration: 001_iot_core_schema.sql
-- Description: Core tables for device registry, channels, installations,
--              telemetry storage, rollups, events, and rules.
-- =============================================================================

-- Ensure extensions exist
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

--------------------------------------------------------------------------------
-- Enums
--------------------------------------------------------------------------------

do $$ begin
  create type public.device_status as enum (
    'registered',     -- Added to registry, factory keys stored
    'provisioned',    -- Assigned credentials and firmware verified
    'installed',      -- Physically deployed by field installer
    'assigned',       -- Attached to specific farm plot & crop cycle
    'active',         -- Actively transmitting telemetry within expectations
    'degraded',       -- Transmitting with low battery, high packet loss, or warning
    'offline',        -- Missed heartbeat / expected telemetry interval exceeded
    'maintenance',    -- Under inspection, recalibration, or probe replacement
    'retired'         -- Permanently decommissioned or damaged beyond repair
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.device_connectivity_type as enum (
    'lorawan',        -- LoRaWAN 868/915 MHz (farm gateway cluster)
    'cellular_nb_iot',-- NB-IoT / LTE-M cellular node
    'cellular_2g_4g', -- Standard GSM/GPRS or 4G LTE
    'ble_direct'      -- BLE used strictly for installer provisioning
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.power_source_type as enum (
    'solar_lifepo4',  -- Solar panel with LiFePO4 battery (preferred for field)
    'solar_li_ion',   -- Solar panel with 18650 Li-ion
    'primary_battery',-- High-capacity Lithium Thionyl Chloride (LiSOCl2)
    'mains_grid',     -- Fixed power for farm office/pump station
    'generator_backed'-- Powered during pump/irrigation cycles
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.telemetry_quality_flag as enum (
    'valid',          -- Value within validated physical & agronomic boundaries
    'suspicious',     -- Sudden abnormal delta or rate-of-change spike
    'out_of_range',   -- Exceeds physical sensor capability (e.g. VWC > 100%)
    'hardware_fault', -- Probe disconnected / short circuit / open loop detected
    'stale',          -- Reading cached or repeated without change
    'replayed'        -- Packet sequence number duplicate or re-transmitted
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.rollup_period as enum (
    '15m',
    '1h',
    '1d'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.device_event_type as enum (
    'offline',
    'online',
    'battery_low',
    'tamper_detected',
    'signal_loss',
    'calibration_needed',
    'firmware_updated',
    'gateway_failover',
    'probe_fault',
    'reboot'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.device_alert_severity as enum (
    'info',
    'warning',
    'critical'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.device_alert_status as enum (
    'open',
    'acknowledged',
    'resolved',
    'suppressed'
  );
exception
  when duplicate_object then null;
end $$;

--------------------------------------------------------------------------------
-- 1. Device Models
--------------------------------------------------------------------------------
create table if not exists public.device_models (
  id uuid primary key default gen_random_uuid(),
  model_code text not null unique,               -- e.g. 'CN-SOIL-PRO-V1', 'CN-WEATHER-V2'
  name text not null,                            -- 'CultivaNode Soil & Root Station'
  vendor text not null default 'CultivaNode Hardware Labs',
  connectivity public.device_connectivity_type not null,
  supported_power public.power_source_type[] not null default '{solar_lifepo4}',
  hardware_revision text not null default 'v1.0',
  default_firmware text not null default '1.0.0',
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

--------------------------------------------------------------------------------
-- 2. Sensor Channels Definition
--------------------------------------------------------------------------------
create table if not exists public.sensor_channels (
  id uuid primary key default gen_random_uuid(),
  device_model_id uuid not null references public.device_models (id) on delete cascade,
  channel_code text not null,                    -- e.g. 'soil_moisture_pct', 'air_temp_c'
  display_name text not null,
  unit text not null,                            -- '%', '°C', 'mm', 'lpm', 'V'
  min_valid_value numeric not null,              -- e.g. 0.0 for moisture
  max_valid_value numeric not null,              -- e.g. 100.0 for moisture
  precision_decimals integer not null default 1,
  measurement_priority integer not null default 1, -- 1=Priority 1, 2=Priority 2, 3=Later
  is_telemetry boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  unique (device_model_id, channel_code)
);

--------------------------------------------------------------------------------
-- 3. Devices Registry
--------------------------------------------------------------------------------
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  serial_number text not null unique,            -- Unique Hardware EUI or Serial, e.g. 'CN-NG-2026-00192'
  model_id uuid not null references public.device_models (id),
  status public.device_status not null default 'registered',
  firmware_version text not null default '1.0.0',
  battery_level_pct numeric(5, 2),               -- 0.00 to 100.00 %
  battery_voltage_mv integer,                    -- e.g. 3850 mV
  signal_rssi integer,                           -- e.g. -78 dBm
  signal_snr numeric(5, 2),                      -- e.g. 9.5 dB
  last_seen_at timestamptz,
  last_telemetry_seq bigint not null default 0,
  
  -- Security Credentials (Hashed, never stored plain-text)
  auth_token_hash text,                          -- SHA-256 hash of device pre-shared bearer token
  secret_key_hash text,                          -- Hash of HMAC-SHA256 signing secret
  encryption_key_ref text,                       -- Reference to KMS/Vault secret identifier
  revoked_at timestamptz,                        -- If revoked, all telemetry rejected immediately
  
  assigned_owner_id uuid references auth.users (id) on delete set null,
  assigned_org_id uuid,                          -- Organization ownership if corporate farm
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_devices_serial on public.devices (serial_number);
create index if not exists idx_devices_status on public.devices (status);
create index if not exists idx_devices_last_seen on public.devices (last_seen_at desc);

--------------------------------------------------------------------------------
-- 4. Device Installations (Physical Field Deployment Context)
--------------------------------------------------------------------------------
create table if not exists public.device_installations (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  farm_id uuid not null references public.farms (id) on delete cascade,
  plot_id uuid not null references public.plots (id) on delete cascade,
  crop_cycle_id uuid,                            -- Optional link to active planting/crop cycle
  
  -- Agronomic and Physical Context
  sensor_depth_cm integer,                       -- Root zone depth e.g. 15, 30, 45, 60 cm
  probe_installation_angle integer default 45,   -- Degrees relative to soil surface
  soil_texture text,                             -- 'sandy_loam', 'clay_loam', 'silt'
  location extensions.geography(point, 4326),    -- PostGIS exact GPS coordinate of probe
  power_method public.power_source_type not null default 'solar_lifepo4',
  
  -- Operational Details
  installed_by uuid references auth.users (id),  -- Field Agent / Installer user ID
  site_survey jsonb not null default '{}'::jsonb,-- Cellular signal, shade, flood, theft risk survey
  photo_url text,                                -- Photo of installed node in field
  is_active boolean not null default true,
  
  -- Calibration Discipline
  calibrated_at timestamptz,
  next_calibration_due timestamptz,
  calibration_notes text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_installations_device on public.device_installations (device_id);
create index if not exists idx_installations_plot on public.device_installations (plot_id);
create index if not exists idx_installations_farm on public.device_installations (farm_id);
create index if not exists idx_installations_active on public.device_installations (is_active);

--------------------------------------------------------------------------------
-- 5. Telemetry Readings (Immutable High-Frequency Raw Ingest)
--------------------------------------------------------------------------------
create table if not exists public.telemetry_readings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  installation_id uuid references public.device_installations (id) on delete set null,
  plot_id uuid references public.plots (id) on delete set null,
  
  channel_code text not null,                    -- e.g. 'soil_moisture_pct'
  raw_value numeric not null,
  calibrated_value numeric not null,
  unit text not null,
  
  source_timestamp timestamptz not null,         -- Timestamp recorded on sensor RTC
  received_timestamp timestamptz not null default now(), -- Server ingest time
  sequence_number bigint not null,               -- Anti-replay sequence counter
  
  quality_flag public.telemetry_quality_flag not null default 'valid',
  gateway_metadata jsonb not null default '{}'::jsonb, -- RSSI, SNR, Gateway ID, Battery
  created_at timestamptz not null default now()
);

-- Idempotency and Deduplication constraint
create unique index if not exists idx_telemetry_dedup
  on public.telemetry_readings (device_id, sequence_number, channel_code);

create index if not exists idx_telemetry_device_time
  on public.telemetry_readings (device_id, source_timestamp desc);

create index if not exists idx_telemetry_plot_channel_time
  on public.telemetry_readings (plot_id, channel_code, source_timestamp desc);

--------------------------------------------------------------------------------
-- 6. Telemetry Rollups (15-Minute, Hourly, Daily Aggregations)
--------------------------------------------------------------------------------
create table if not exists public.telemetry_rollups (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  plot_id uuid references public.plots (id) on delete cascade,
  channel_code text not null,
  period public.rollup_period not null,
  bucket_timestamp timestamptz not null,
  
  avg_value numeric(10, 3) not null,
  min_value numeric(10, 3) not null,
  max_value numeric(10, 3) not null,
  last_value numeric(10, 3) not null,
  sample_count integer not null default 1,
  valid_count integer not null default 1,
  
  created_at timestamptz not null default now(),
  unique (device_id, channel_code, period, bucket_timestamp)
);

create index if not exists idx_rollups_plot_query
  on public.telemetry_rollups (plot_id, channel_code, period, bucket_timestamp desc);

--------------------------------------------------------------------------------
-- 7. Device Events & Audit Trail
--------------------------------------------------------------------------------
create table if not exists public.device_events (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  installation_id uuid references public.device_installations (id) on delete set null,
  event_type public.device_event_type not null,
  severity public.device_alert_severity not null default 'info',
  details text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_device_events_device on public.device_events (device_id, created_at desc);

--------------------------------------------------------------------------------
-- 8. Alert Rules (Agronomist-Approved Thresholds & Hysteresis)
--------------------------------------------------------------------------------
create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null unique,                -- e.g. 'RULE_TOMATO_MOISTURE_STRESS'
  crop_type text,                                -- e.g. 'tomato', 'maize', or null for universal
  crop_stage text,                               -- e.g. 'flowering', 'fruit_setting', or null
  soil_type text,                                -- e.g. 'sandy_loam', 'clay'
  channel_code text not null,                    -- e.g. 'soil_moisture_pct'
  
  operator text not null check (operator in ('<', '>', '<=', '>=', 'sustained_below', 'sustained_above')),
  threshold_value numeric not null,              -- e.g. 22.0 % VWC
  hysteresis_delta numeric not null default 2.0, -- e.g. must recover to 24.0 % to clear
  sustained_duration_minutes integer not null default 0, -- e.g. 360 min (6 hours)
  cooldown_minutes integer not null default 720, -- 12 hours minimum between repeat notifications
  
  title text not null,
  observation_template text not null,            -- "Moisture has stayed below the crop-stage threshold ({threshold}%) for {duration} hours."
  suggested_action text not null,                -- "Inspect irrigation on Plot {plot_name} today."
  severity public.device_alert_severity not null default 'warning',
  
  is_active boolean not null default true,
  approved_by text not null default 'Lead Agronomist',
  version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

--------------------------------------------------------------------------------
-- 9. Device Alerts (Active Alerts Lifecycle)
--------------------------------------------------------------------------------
create table if not exists public.device_alerts (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  plot_id uuid not null references public.plots (id) on delete cascade,
  device_id uuid not null references public.devices (id) on delete cascade,
  rule_id uuid references public.alert_rules (id) on delete set null,
  
  channel_code text not null,
  observation text not null,                     -- Plain-language: "Moisture has stayed below threshold for 6 hours."
  confidence numeric(4, 2) not null default 0.95,-- 0.00 to 1.00
  suggested_action text not null,                -- "Inspect drip lines on Plot 2."
  source text not null default 'sensor reading', -- 'sensor reading' | 'weather forecast' | 'calculated recommendation' | 'device watchdog'
  
  severity public.device_alert_severity not null default 'warning',
  status public.device_alert_status not null default 'open',
  
  triggered_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users (id),
  resolved_at timestamptz,
  cooldown_until timestamptz,
  
  -- Link to generic crop alerts without duplicate schema
  sync_to_crop_alert_id uuid,
  
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_device_alerts_farm on public.device_alerts (farm_id, status);
create index if not exists idx_device_alerts_plot on public.device_alerts (plot_id, status);

--------------------------------------------------------------------------------
-- 10. Device Commands (Future-only Actuator Control - Safety Protected)
--------------------------------------------------------------------------------
create table if not exists public.device_commands (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  command_type text not null,                    -- e.g. 'valve_open', 'pump_test' (disabled in Phase 1)
  parameters jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'acknowledged', 'rejected', 'failsafe_blocked')),
  failsafe_conditions jsonb not null default '{"manual_override_required": true}'::jsonb,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  audit_note text
);
-- =============================================================================
-- CultivaNode Farm Intelligence: IoT Security and Row-Level Security (RLS)
-- Migration: 002_iot_security_and_rls.sql
-- Description: Zero-trust device model, explicit farm-based access control,
--              and RLS policies enforcing tenant isolation.
-- =============================================================================

--------------------------------------------------------------------------------
-- Access Control Helper Functions
--------------------------------------------------------------------------------

-- Checks whether user can view a specific device based on active plot/farm installation
create or replace function public.can_view_device(p_device_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.device_installations i
    join public.farms f on f.id = i.farm_id
    where i.device_id = p_device_id
      and i.is_active = true
      and (
        f.owner_id = auth.uid()
        or (f.organization_id is not null and public.org_role(f.organization_id) is not null)
        or (f.onboarded_by = auth.uid() and public.has_role('field_agent'))
        or i.installed_by = auth.uid()
        or public.is_admin()
      )
  ) or exists (
    -- Devices assigned directly to user or awaiting installation by installer
    select 1 from public.devices d
    where d.id = p_device_id
      and (d.assigned_owner_id = auth.uid() or public.is_admin())
  );
$$;

-- Checks whether user has permission to commission/manage IoT devices on a farm
create or replace function public.can_manage_farm_iot(p_farm_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.farms f
    where f.id = p_farm_id
      and (
        f.owner_id = auth.uid()
        or (f.organization_id is not null
            and public.org_role(f.organization_id) in ('owner', 'farm_manager'))
        or (f.onboarded_by = auth.uid() and public.has_role('field_agent'))
        or public.is_admin()
      )
  );
$$;

--------------------------------------------------------------------------------
-- Enable Row Level Security
--------------------------------------------------------------------------------
alter table public.device_models        enable row level security;
alter table public.sensor_channels      enable row level security;
alter table public.devices              enable row level security;
alter table public.device_installations enable row level security;
alter table public.telemetry_readings   enable row level security;
alter table public.telemetry_rollups    enable row level security;
alter table public.device_events        enable row level security;
alter table public.alert_rules          enable row level security;
alter table public.device_alerts        enable row level security;
alter table public.device_commands      enable row level security;

--------------------------------------------------------------------------------
-- Device Models & Channels: Publicly readable for authenticated users, admin only write
--------------------------------------------------------------------------------
create policy "device_models: read all authenticated" on public.device_models
  for select to authenticated using (true);

create policy "device_models: admin manage" on public.device_models
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "sensor_channels: read all authenticated" on public.sensor_channels
  for select to authenticated using (true);

create policy "sensor_channels: admin manage" on public.sensor_channels
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

--------------------------------------------------------------------------------
-- Devices: Authorized farmers, installers, and admins only
--------------------------------------------------------------------------------
create policy "devices: select if authorized" on public.devices
  for select to authenticated using (public.can_view_device(id));

create policy "devices: installers register or update assigned" on public.devices
  for update to authenticated
  using (
    public.is_admin() or
    (public.has_role('field_agent') and (assigned_owner_id = auth.uid() or assigned_owner_id is null))
  )
  with check (
    public.is_admin() or
    (public.has_role('field_agent') and (assigned_owner_id = auth.uid() or assigned_owner_id is null))
  );

--------------------------------------------------------------------------------
-- Device Installations: Scoped by farm permission
--------------------------------------------------------------------------------
create policy "installations: read with farm" on public.device_installations
  for select to authenticated using (public.can_view_farm(farm_id));

create policy "installations: manage with farm" on public.device_installations
  for insert to authenticated with check (public.can_manage_farm_iot(farm_id));

create policy "installations: update with farm" on public.device_installations
  for update to authenticated
  using (public.can_manage_farm_iot(farm_id))
  with check (public.can_manage_farm_iot(farm_id));

create policy "installations: delete with farm" on public.device_installations
  for delete to authenticated using (public.can_manage_farm_iot(farm_id));

--------------------------------------------------------------------------------
-- Telemetry Readings: Read-only for authorized farm viewers
-- Devices NEVER insert directly using web/mobile keys.
-- Telemetry ingestion runs through the dedicated secure ingestion service.
--------------------------------------------------------------------------------
create policy "telemetry: read only if can view farm" on public.telemetry_readings
  for select to authenticated
  using (
    plot_id is not null and public.can_view_farm(public.plot_farm_id(plot_id))
  );

-- No public insert policy: only the service_role or ingestion service can insert raw readings.

--------------------------------------------------------------------------------
-- Telemetry Rollups: Read-only for authorized farm viewers
--------------------------------------------------------------------------------
create policy "rollups: read only if can view farm" on public.telemetry_rollups
  for select to authenticated
  using (
    plot_id is not null and public.can_view_farm(public.plot_farm_id(plot_id))
  );

--------------------------------------------------------------------------------
-- Device Events
--------------------------------------------------------------------------------
create policy "events: read if authorized" on public.device_events
  for select to authenticated using (public.can_view_device(device_id));

--------------------------------------------------------------------------------
-- Alert Rules: Published rules readable by all, managed by agronomists/admin
--------------------------------------------------------------------------------
create policy "alert_rules: read published" on public.alert_rules
  for select to authenticated using (is_active = true);

create policy "alert_rules: admin manage" on public.alert_rules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

--------------------------------------------------------------------------------
-- Device Alerts: Viewable by farm viewers, acknowledgeable by farm managers
--------------------------------------------------------------------------------
create policy "device_alerts: read with farm" on public.device_alerts
  for select to authenticated using (public.can_view_farm(farm_id));

create policy "device_alerts: acknowledge or resolve" on public.device_alerts
  for update to authenticated
  using (public.can_manage_farm_iot(farm_id))
  with check (public.can_manage_farm_iot(farm_id));

--------------------------------------------------------------------------------
-- Revoke excessive grants to ensure zero-trust security
--------------------------------------------------------------------------------
revoke all on public.device_models, public.sensor_channels, public.devices,
               public.device_installations, public.telemetry_readings,
               public.telemetry_rollups, public.device_events,
               public.alert_rules, public.device_alerts, public.device_commands
  from anon;

revoke insert, update, delete on public.telemetry_readings, public.telemetry_rollups
  from authenticated;

grant select on public.device_models, public.sensor_channels, public.devices,
              public.device_installations, public.telemetry_readings,
              public.telemetry_rollups, public.device_events,
              public.alert_rules, public.device_alerts to authenticated;

grant insert, update, delete on public.device_installations, public.device_alerts
  to authenticated;

grant execute on function
  public.can_view_device(uuid),
  public.can_manage_farm_iot(uuid)
  to authenticated;
-- =============================================================================
-- CultivaNode Farm Intelligence: Agronomy Rules & Device Hardware Seed
-- Migration: 003_iot_agronomy_rules_seed.sql
-- Description: Seed initial hardware models, sensor channels, and
--              agronomist-approved conservative alert rules.
-- =============================================================================

--------------------------------------------------------------------------------
-- 1. Hardware Models Seed
--------------------------------------------------------------------------------

-- Model 1: CultivaNode Soil Pro (LoRaWAN)
insert into public.device_models (id, model_code, name, vendor, connectivity, supported_power, hardware_revision, default_firmware, description)
values (
  '11111111-1111-1111-1111-111111111101',
  'CN-SOIL-PRO-V1',
  'CultivaNode Soil & Root Station',
  'CultivaNode Hardware Labs',
  'lorawan',
  '{solar_lifepo4}',
  'v1.2',
  '1.2.0',
  'Precision soil moisture at root depth (FDR probe), air temperature, humidity, and solar battery monitor.'
) on conflict (model_code) do nothing;

-- Model 2: CultivaNode Micro-Weather (Cellular)
insert into public.device_models (id, model_code, name, vendor, connectivity, supported_power, hardware_revision, default_firmware, description)
values (
  '11111111-1111-1111-1111-111111111102',
  'CN-WEATHER-CELL-V1',
  'CultivaNode Plot Micro-Weather Station',
  'CultivaNode Hardware Labs',
  'cellular_2g_4g',
  '{solar_lifepo4}',
  'v2.0',
  '2.0.1',
  'Cellular weather node: Tipping bucket rainfall, canopy temperature, relative humidity, solar irradiance.'
) on conflict (model_code) do nothing;

-- Model 3: CultivaNode Water Intel (Tank & Flow Meter)
insert into public.device_models (id, model_code, name, vendor, connectivity, supported_power, hardware_revision, default_firmware, description)
values (
  '11111111-1111-1111-1111-111111111103',
  'CN-TANK-FLOW-V1',
  'CultivaNode Water Infrastructure Node',
  'CultivaNode Hardware Labs',
  'cellular_2g_4g',
  '{solar_lifepo4, mains_grid}',
  'v1.1',
  '1.1.4',
  'Irrigation readiness monitor: Ultrasonic tank water level % and digital pulse flow meter for delivery detection.'
) on conflict (model_code) do nothing;

--------------------------------------------------------------------------------
-- 2. Sensor Channels Seed
--------------------------------------------------------------------------------

-- Channels for CN-SOIL-PRO-V1
insert into public.sensor_channels (device_model_id, channel_code, display_name, unit, min_valid_value, max_valid_value, precision_decimals, measurement_priority)
values
  ('11111111-1111-1111-1111-111111111101', 'soil_moisture_pct', 'Soil Moisture (Root Depth)', '%', 0.0, 100.0, 1, 1),
  ('11111111-1111-1111-1111-111111111101', 'soil_temp_c', 'Soil Temperature', '°C', -5.0, 65.0, 1, 1),
  ('11111111-1111-1111-1111-111111111101', 'air_temperature_c', 'Air Temperature', '°C', -10.0, 60.0, 1, 1),
  ('11111111-1111-1111-1111-111111111101', 'air_humidity_pct', 'Relative Humidity', '%', 0.0, 100.0, 1, 1),
  ('11111111-1111-1111-1111-111111111101', 'battery_pct', 'Node Battery Level', '%', 0.0, 100.0, 1, 1),
  ('11111111-1111-1111-1111-111111111101', 'signal_rssi', 'LoRa Signal Strength', 'dBm', -140.0, -20.0, 0, 1)
on conflict (device_model_id, channel_code) do nothing;

-- Channels for CN-WEATHER-CELL-V1
insert into public.sensor_channels (device_model_id, channel_code, display_name, unit, min_valid_value, max_valid_value, precision_decimals, measurement_priority)
values
  ('11111111-1111-1111-1111-111111111102', 'rainfall_mm', 'Rainfall', 'mm', 0.0, 500.0, 1, 2),
  ('11111111-1111-1111-1111-111111111102', 'air_temperature_c', 'Air Temperature', '°C', -10.0, 60.0, 1, 1),
  ('11111111-1111-1111-1111-111111111102', 'air_humidity_pct', 'Relative Humidity', '%', 0.0, 100.0, 1, 1),
  ('11111111-1111-1111-1111-111111111102', 'battery_pct', 'Node Battery Level', '%', 0.0, 100.0, 1, 1),
  ('11111111-1111-1111-1111-111111111102', 'signal_rssi', 'Cellular Signal Strength', 'dBm', -130.0, -40.0, 0, 1)
on conflict (device_model_id, channel_code) do nothing;

-- Channels for CN-TANK-FLOW-V1
insert into public.sensor_channels (device_model_id, channel_code, display_name, unit, min_valid_value, max_valid_value, precision_decimals, measurement_priority)
values
  ('11111111-1111-1111-1111-111111111103', 'water_level_pct', 'Water Tank Level', '%', 0.0, 100.0, 1, 2),
  ('11111111-1111-1111-1111-111111111103', 'water_flow_lpm', 'Irrigation Flow Rate', 'L/min', 0.0, 1000.0, 1, 2),
  ('11111111-1111-1111-1111-111111111103', 'battery_pct', 'Node Battery Level', '%', 0.0, 100.0, 1, 1)
on conflict (device_model_id, channel_code) do nothing;

--------------------------------------------------------------------------------
-- 3. Agronomist-Approved Alert Rules Seed
--------------------------------------------------------------------------------

-- Rule 1: Tomato Flowering/Fruiting Moisture Stress
insert into public.alert_rules (
  id, rule_code, crop_type, crop_stage, soil_type, channel_code,
  operator, threshold_value, hysteresis_delta, sustained_duration_minutes, cooldown_minutes,
  title, observation_template, suggested_action, severity, approved_by, version
) values (
  '22222222-2222-2222-2222-222222222201',
  'RULE_TOMATO_MOISTURE_DEFICIT',
  'tomato',
  'flowering',
  null,
  'soil_moisture_pct',
  'sustained_below',
  22.0,
  2.5,
  360, -- 6 hours sustained
  720, -- 12 hours cooldown
  'Tomato Moisture Deficit (Plot Root Zone)',
  'Moisture has stayed below the crop-stage threshold (22%) for six hours.',
  'Inspect irrigation on this plot today. Tomato flowering is sensitive to moisture stress which causes blossom drop.',
  'warning',
  'Dr. A. Adebayo (South-West Horticulture Agronomist)',
  '1.0'
) on conflict (rule_code) do nothing;

-- Rule 2: Maize Tasseling/Silking Moisture Stress
insert into public.alert_rules (
  id, rule_code, crop_type, crop_stage, soil_type, channel_code,
  operator, threshold_value, hysteresis_delta, sustained_duration_minutes, cooldown_minutes,
  title, observation_template, suggested_action, severity, approved_by, version
) values (
  '22222222-2222-2222-2222-222222222202',
  'RULE_MAIZE_MOISTURE_DEFICIT',
  'maize',
  'tasseling',
  null,
  'soil_moisture_pct',
  'sustained_below',
  20.0,
  2.0,
  360, -- 6 hours sustained
  720, -- 12 hours cooldown
  'Maize Tasseling Water Deficit',
  'Soil moisture has remained below 20% for six consecutive hours during critical tasseling stage.',
  'Check irrigation or furrow delivery on this plot. Water stress during pollination sharply reduces ear fill.',
  'warning',
  'Dr. F. Oladipo (IAR&T Maize Agronomist)',
  '1.0'
) on conflict (rule_code) do nothing;

-- Rule 3: Water Tank Low Level Alert
insert into public.alert_rules (
  id, rule_code, crop_type, crop_stage, soil_type, channel_code,
  operator, threshold_value, hysteresis_delta, sustained_duration_minutes, cooldown_minutes,
  title, observation_template, suggested_action, severity, approved_by, version
) values (
  '22222222-2222-2222-2222-222222222203',
  'RULE_TANK_WATER_LOW',
  null,
  null,
  null,
  'water_level_pct',
  'sustained_below',
  25.0,
  5.0,
  30,  -- 30 minutes sustained
  360, -- 6 hours cooldown
  'Low Irrigation Reservoir Level',
  'Tank level is low ({value}%); planned irrigation may not complete.',
  'Verify borehole pump operation and refill the main reservoir before starting drip cycles.',
  'warning',
  'CultivaNode Irrigation Systems Team',
  '1.0'
) on conflict (rule_code) do nothing;

-- Rule 4: Tomato Fungal / Blight Disease Risk (High Humidity + High Temp)
insert into public.alert_rules (
  id, rule_code, crop_type, crop_stage, soil_type, channel_code,
  operator, threshold_value, hysteresis_delta, sustained_duration_minutes, cooldown_minutes,
  title, observation_template, suggested_action, severity, approved_by, version
) values (
  '22222222-2222-2222-2222-222222222204',
  'RULE_TOMATO_FUNGAL_RISK',
  'tomato',
  null,
  null,
  'air_humidity_pct',
  'sustained_above',
  85.0,
  5.0,
  480, -- 8 hours sustained
  1440, -- 24 hours cooldown
  'Elevated Fungal & Blight Risk Condition',
  'High humidity (>85%) and warm temperature increase fungal-risk conditions.',
  'Inspect tomato leaves for early blight spots before scheduled spraying. Delay foliar spray if rain is forecast.',
  'warning',
  'Dr. A. Adebayo (Crop Protection)',
  '1.0'
) on conflict (rule_code) do nothing;

-- Rule 5: Node Battery Depleted
insert into public.alert_rules (
  id, rule_code, crop_type, crop_stage, soil_type, channel_code,
  operator, threshold_value, hysteresis_delta, sustained_duration_minutes, cooldown_minutes,
  title, observation_template, suggested_action, severity, approved_by, version
) values (
  '22222222-2222-2222-2222-222222222205',
  'RULE_DEVICE_BATTERY_CRITICAL',
  null,
  null,
  null,
  'battery_pct',
  '<',
  15.0,
  5.0,
  0,
  720,
  'Sensor Node Battery Low',
  'Sensor battery is below 15% ({value}%). Node may enter low-power sleep mode.',
  'Check solar panel orientation, clean surface dust or foliage shade, and inspect charging cable.',
  'critical',
  'Hardware Operations Lead',
  '1.0'
) on conflict (rule_code) do nothing;
-- =============================================================================
-- CultivaNode Farm Intelligence: Crop Bridge, Rollups & Watchdog Functions
-- Migration: 004_crop_bridge_and_rollups.sql
-- Description: Rollup aggregations, watchdog for silent/stale nodes,
--              and clean bridging of approved observations into crop_measurements.
-- =============================================================================

--------------------------------------------------------------------------------
-- 1. Rollup Generation Procedure
-- Aggregates raw valid telemetry into 15m, 1h, and 1d rollups
--------------------------------------------------------------------------------
create or replace function public.process_telemetry_rollups(p_lookback_interval interval default interval '2 hours')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r_period text;
  r_trunc text;
begin
  -- 1. 15-minute rollups
  insert into public.telemetry_rollups (
    device_id, plot_id, channel_code, period, bucket_timestamp,
    avg_value, min_value, max_value, last_value, sample_count, valid_count
  )
  select
    device_id,
    plot_id,
    channel_code,
    '15m'::public.rollup_period,
    date_trunc('hour', source_timestamp) +
      floor(extract(minute from source_timestamp) / 15.0) * interval '15 minutes' as bucket_ts,
    round(avg(calibrated_value), 3),
    min(calibrated_value),
    max(calibrated_value),
    (array_agg(calibrated_value order by source_timestamp desc))[1],
    count(*),
    count(*) filter (where quality_flag = 'valid')
  from public.telemetry_readings
  where source_timestamp >= now() - p_lookback_interval
    and quality_flag in ('valid', 'suspicious')
  group by 1, 2, 3, 5
  on conflict (device_id, channel_code, period, bucket_timestamp)
  do update set
    avg_value = excluded.avg_value,
    min_value = excluded.min_value,
    max_value = excluded.max_value,
    last_value = excluded.last_value,
    sample_count = excluded.sample_count,
    valid_count = excluded.valid_count;

  -- 2. Hourly rollups
  insert into public.telemetry_rollups (
    device_id, plot_id, channel_code, period, bucket_timestamp,
    avg_value, min_value, max_value, last_value, sample_count, valid_count
  )
  select
    device_id,
    plot_id,
    channel_code,
    '1h'::public.rollup_period,
    date_trunc('hour', source_timestamp) as bucket_ts,
    round(avg(calibrated_value), 3),
    min(calibrated_value),
    max(calibrated_value),
    (array_agg(calibrated_value order by source_timestamp desc))[1],
    count(*),
    count(*) filter (where quality_flag = 'valid')
  from public.telemetry_readings
  where source_timestamp >= now() - p_lookback_interval
    and quality_flag in ('valid', 'suspicious')
  group by 1, 2, 3, 5
  on conflict (device_id, channel_code, period, bucket_timestamp)
  do update set
    avg_value = excluded.avg_value,
    min_value = excluded.min_value,
    max_value = excluded.max_value,
    last_value = excluded.last_value,
    sample_count = excluded.sample_count,
    valid_count = excluded.valid_count;

  -- 3. Daily rollups
  insert into public.telemetry_rollups (
    device_id, plot_id, channel_code, period, bucket_timestamp,
    avg_value, min_value, max_value, last_value, sample_count, valid_count
  )
  select
    device_id,
    plot_id,
    channel_code,
    '1d'::public.rollup_period,
    date_trunc('day', source_timestamp) as bucket_ts,
    round(avg(calibrated_value), 3),
    min(calibrated_value),
    max(calibrated_value),
    (array_agg(calibrated_value order by source_timestamp desc))[1],
    count(*),
    count(*) filter (where quality_flag = 'valid')
  from public.telemetry_readings
  where source_timestamp >= now() - p_lookback_interval
    and quality_flag in ('valid', 'suspicious')
  group by 1, 2, 3, 5
  on conflict (device_id, channel_code, period, bucket_timestamp)
  do update set
    avg_value = excluded.avg_value,
    min_value = excluded.min_value,
    max_value = excluded.max_value,
    last_value = excluded.last_value,
    sample_count = excluded.sample_count,
    valid_count = excluded.valid_count;
end;
$$;

--------------------------------------------------------------------------------
-- 2. Crop Measurements Bridge
-- Links approved daily/hourly aggregate observations into crop_measurements
-- without bloating it with millions of raw sensor pulses.
--------------------------------------------------------------------------------
create or replace function public.sync_approved_iot_to_crop_measurements(p_target_date date default current_date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- crop_measurements was retired by the farm-management reconcile; telemetry rollups are read directly.
  return 0;
end;
$$;

--------------------------------------------------------------------------------
-- 3. Device Watchdog & Health Monitor
-- Detects silent/stale nodes (> 12 hours), updates status, and issues alerts
--------------------------------------------------------------------------------
create or replace function public.run_device_watchdog(p_stale_threshold_hours integer default 12)
returns table(device_serial text, previous_status text, new_status text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with stale_candidates as (
    select
      d.id as target_device_id,
      d.serial_number,
      d.status as prev_stat,
      inst.farm_id,
      inst.plot_id,
      d.last_seen_at
    from public.devices d
    join public.device_installations inst on inst.device_id = d.id and inst.is_active = true
    where d.status in ('active', 'degraded')
      and (d.last_seen_at is null or d.last_seen_at < now() - (p_stale_threshold_hours || ' hours')::interval)
  ),
  updated_devices as (
    update public.devices dev
    set status = 'offline',
        updated_at = now()
    from stale_candidates sc
    where dev.id = sc.target_device_id
    returning dev.serial_number, dev.id, dev.status
  ),
  inserted_events as (
    insert into public.device_events (
      device_id, event_type, severity, details, payload
    )
    select
      sc.target_device_id,
      'offline'::public.device_event_type,
      'warning'::public.device_alert_severity,
      'Node missed telemetry transmissions for over ' || p_stale_threshold_hours || ' hours.',
      jsonb_build_object(
        'last_seen_at', sc.last_seen_at,
        'threshold_hours', p_stale_threshold_hours
      )
    from stale_candidates sc
  ),
  inserted_alerts as (
    insert into public.device_alerts (
      farm_id, plot_id, device_id, channel_code,
      observation, confidence, suggested_action, source,
      severity, status, triggered_at
    )
    select
      sc.farm_id,
      sc.plot_id,
      sc.target_device_id,
      'device_health',
      'This soil sensor has not reported for ' || p_stale_threshold_hours || ' hours; crop advice from it is paused.',
      1.00,
      'Inspect physical node, antenna connection, and solar panel clean state in the field.',
      'device watchdog',
      'warning'::public.device_alert_severity,
      'open'::public.device_alert_status,
      now()
    from stale_candidates sc
    where not exists (
      select 1 from public.device_alerts a
      where a.device_id = sc.target_device_id
        and a.channel_code = 'device_health'
        and a.status = 'open'
    )
  )
  select
    sc.serial_number::text,
    sc.prev_stat::text,
    'offline'::text
  from stale_candidates sc;
end;
$$;

--------------------------------------------------------------------------------
-- Scheduled jobs run as the service role only (pg_cron / Edge Functions).
--------------------------------------------------------------------------------
revoke all on function public.process_telemetry_rollups(interval) from public, anon, authenticated;
revoke all on function public.sync_approved_iot_to_crop_measurements(date) from public, anon, authenticated;
revoke all on function public.run_device_watchdog(integer) from public, anon, authenticated;
grant execute on function public.process_telemetry_rollups(interval) to service_role;
grant execute on function public.sync_approved_iot_to_crop_measurements(date) to service_role;
grant execute on function public.run_device_watchdog(integer) to service_role;
revoke all on function public.can_view_device(uuid) from public, anon;
revoke all on function public.can_manage_farm_iot(uuid) from public, anon;
