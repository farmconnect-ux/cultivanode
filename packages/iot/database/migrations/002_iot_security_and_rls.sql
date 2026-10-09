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
