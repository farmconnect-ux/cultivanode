-- CultivaNode: farms, plots and soil records
--
-- Coordinates are stored as PostGIS geography (WGS84, SRID 4326), longitude first.
-- From the app, send WKT/EWKT text, e.g. location = 'SRID=4326;POINT(3.8967 7.3775)'
-- and boundary = 'SRID=4326;POLYGON((lng lat, lng lat, ..., first point again))'.

create table public.farms (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Set when the farm belongs to a business account.
  organization_id  uuid references public.organizations (id) on delete set null,
  name             text not null check (char_length(name) between 2 and 120),
  location         extensions.geography(Point, 4326) not null,
  boundary         extensions.geography(Polygon, 4326),
  -- Hectares. Calculated from the boundary when there is one; otherwise the farmer's estimate.
  area_ha          numeric(12, 4) check (area_ha is null or area_ha > 0),
  area_is_measured boolean not null default false,
  zone             public.farm_zone not null default 'other',
  state            text,
  lga              text,
  address_hint     text check (address_hint is null or char_length(address_hint) <= 300),
  onboarded_by     uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index farms_owner_idx on public.farms (owner_id);
create index farms_org_idx on public.farms (organization_id) where organization_id is not null;
create index farms_location_gix on public.farms using gist (location);

create table public.plots (
  id               uuid primary key default gen_random_uuid(),
  farm_id          uuid not null references public.farms (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 80),
  boundary         extensions.geography(Polygon, 4326),
  area_ha          numeric(12, 4) check (area_ha is null or area_ha > 0),
  area_is_measured boolean not null default false,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (farm_id, name)
);
create index plots_farm_idx on public.plots (farm_id);

create table public.soil_records (
  id                  uuid primary key default gen_random_uuid(),
  plot_id             uuid not null references public.plots (id) on delete cascade,
  tested_on           date,
  soil_type           text,       -- e.g. sandy loam, clay loam
  ph                  numeric(3, 1) check (ph is null or ph between 0 and 14),
  organic_matter_pct  numeric(5, 2) check (organic_matter_pct is null or organic_matter_pct between 0 and 100),
  nitrogen_pct        numeric(5, 3) check (nitrogen_pct is null or nitrogen_pct between 0 and 100),
  phosphorus_ppm      numeric(8, 2) check (phosphorus_ppm is null or phosphorus_ppm >= 0),
  potassium_cmol_kg   numeric(8, 3) check (potassium_cmol_kg is null or potassium_cmol_kg >= 0),
  lab_name            text,
  notes               text,
  created_by          uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now()
);
create index soil_records_plot_idx on public.soil_records (plot_id, tested_on desc);

create trigger farms_updated_at before update on public.farms
  for each row execute function public.set_updated_at();
create trigger plots_updated_at before update on public.plots
  for each row execute function public.set_updated_at();

------------------------------------------------------------------------------------------------
-- Area from boundary
------------------------------------------------------------------------------------------------

create or replace function public.compute_area_from_boundary()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.boundary is not null then
    if not extensions.st_isvalid(new.boundary::extensions.geometry) then
      raise exception 'The boundary crosses itself. Walk the edge in one direction and try again.'
        using errcode = '22023';
    end if;
    new.area_ha := round((extensions.st_area(new.boundary) / 10000.0)::numeric, 4);
    new.area_is_measured := true;
  elsif tg_op = 'UPDATE' and old.boundary is not null then
    -- Boundary removed: keep the last area but mark it as no longer measured.
    new.area_is_measured := false;
  else
    new.area_is_measured := false;
  end if;
  return new;
end;
$$;

create trigger farms_area before insert or update of boundary, area_ha on public.farms
  for each row execute function public.compute_area_from_boundary();
create trigger plots_area before insert or update of boundary, area_ha on public.plots
  for each row execute function public.compute_area_from_boundary();

------------------------------------------------------------------------------------------------
-- Access helpers
------------------------------------------------------------------------------------------------

create or replace function public.is_farmer_profile(p_profile uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.profile_id = p_profile and r.role in ('crop_farmer', 'animal_farmer')
  );
$$;

create or replace function public.can_view_farm(p_farm uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.farms f
    where f.id = p_farm
      and (
        f.owner_id = auth.uid()
        or (f.organization_id is not null and public.org_role(f.organization_id) is not null)
        or (f.onboarded_by = auth.uid() and public.has_role('field_agent'))
        or public.is_admin()
      )
  );
$$;

create or replace function public.can_edit_farm(p_farm uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.farms f
    where f.id = p_farm
      and (
        f.owner_id = auth.uid()
        or (f.organization_id is not null
            and public.org_role(f.organization_id) in ('owner', 'farm_manager'))
        or (f.onboarded_by = auth.uid() and public.has_role('field_agent'))
      )
  );
$$;

create or replace function public.plot_farm_id(p_plot uuid)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.farm_id from public.plots p where p.id = p_plot;
$$;

------------------------------------------------------------------------------------------------
-- Row Level Security
------------------------------------------------------------------------------------------------

alter table public.farms        enable row level security;
alter table public.plots        enable row level security;
alter table public.soil_records enable row level security;

-- farms
create policy "farms: read if you can view" on public.farms
  for select to authenticated
  using (public.can_view_farm(id));

create policy "farms: farmers or their field agents create" on public.farms
  for insert to authenticated
  with check (
    (
      owner_id = auth.uid()
      and onboarded_by is null
      and public.is_farmer_profile(auth.uid())
      and (organization_id is null or public.org_role(organization_id) in ('owner', 'farm_manager'))
    )
    or (
      onboarded_by = auth.uid()
      and public.is_my_onboarded_profile(owner_id)
      and public.is_farmer_profile(owner_id)
      and organization_id is null
    )
  );

create policy "farms: editors update" on public.farms
  for update to authenticated
  using (public.can_edit_farm(id))
  -- Moving a farm into a business account requires owner/manager rights in that business.
  with check (
    organization_id is null
    or public.org_role(organization_id) in ('owner', 'farm_manager')
  );

create policy "farms: owner deletes" on public.farms
  for delete to authenticated
  using (owner_id = auth.uid());

-- plots
create policy "plots: read with farm" on public.plots
  for select to authenticated using (public.can_view_farm(farm_id));
create policy "plots: edit with farm (insert)" on public.plots
  for insert to authenticated with check (public.can_edit_farm(farm_id));
create policy "plots: edit with farm (update)" on public.plots
  for update to authenticated using (public.can_edit_farm(farm_id)) with check (public.can_edit_farm(farm_id));
create policy "plots: edit with farm (delete)" on public.plots
  for delete to authenticated using (public.can_edit_farm(farm_id));

-- soil_records
create policy "soil: read with farm" on public.soil_records
  for select to authenticated using (public.can_view_farm(public.plot_farm_id(plot_id)));
create policy "soil: add with farm" on public.soil_records
  for insert to authenticated with check (public.can_edit_farm(public.plot_farm_id(plot_id)));
create policy "soil: change with farm" on public.soil_records
  for update to authenticated
  using (public.can_edit_farm(public.plot_farm_id(plot_id)))
  with check (public.can_edit_farm(public.plot_farm_id(plot_id)));
create policy "soil: delete with farm" on public.soil_records
  for delete to authenticated using (public.can_edit_farm(public.plot_farm_id(plot_id)));

------------------------------------------------------------------------------------------------
-- Grants
------------------------------------------------------------------------------------------------

revoke all on public.farms, public.plots, public.soil_records from anon, authenticated;

grant select, delete on public.farms to authenticated;
grant insert (owner_id, organization_id, name, location, boundary, area_ha, zone, state, lga, address_hint, onboarded_by)
  on public.farms to authenticated;
grant update (organization_id, name, location, boundary, area_ha, zone, state, lga, address_hint)
  on public.farms to authenticated;

grant select, delete on public.plots to authenticated;
grant insert (farm_id, name, boundary, area_ha, notes) on public.plots to authenticated;
grant update (name, boundary, area_ha, notes) on public.plots to authenticated;

grant select, delete on public.soil_records to authenticated;
grant insert (plot_id, tested_on, soil_type, ph, organic_matter_pct, nitrogen_pct, phosphorus_ppm,
              potassium_cmol_kg, lab_name, notes)
  on public.soil_records to authenticated;
grant update (tested_on, soil_type, ph, organic_matter_pct, nitrogen_pct, phosphorus_ppm,
              potassium_cmol_kg, lab_name, notes)
  on public.soil_records to authenticated;

revoke execute on function
  public.compute_area_from_boundary(),
  public.is_farmer_profile(uuid),
  public.can_view_farm(uuid),
  public.can_edit_farm(uuid),
  public.plot_farm_id(uuid)
  from public, anon;

grant execute on function
  public.is_farmer_profile(uuid),
  public.can_view_farm(uuid),
  public.can_edit_farm(uuid),
  public.plot_farm_id(uuid)
  to authenticated;
