-- Lat/lng views over geography columns so the web app can plot farms and machine tracks
-- without parsing WKB. security_invoker keeps the base tables' row level security in force.
create or replace view public.machinery_telemetry_points with (security_invoker = true) as
select t.id, t.farm_id, t.machinery_id, t.recorded_at, t.speed_kmh, t.heading_deg, t.fuel_pct, t.engine_rpm, t.engine_temp_c, t.engine_hours, t.status,
       extensions.st_y(t.location::extensions.geometry) as lat, extensions.st_x(t.location::extensions.geometry) as lng
from public.machinery_telemetry t;

create or replace view public.farm_points with (security_invoker = true) as
select f.id, f.name, f.owner_id, f.organization_id, f.state, f.lga, f.area_ha, f.zone, f.status, f.farm_code,
       extensions.st_y(f.location::extensions.geometry) as lat, extensions.st_x(f.location::extensions.geometry) as lng,
       f.boundary is not null as has_boundary
from public.farms f;

grant select on public.machinery_telemetry_points, public.farm_points to authenticated;
