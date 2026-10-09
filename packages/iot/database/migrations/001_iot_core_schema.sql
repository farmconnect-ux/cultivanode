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
