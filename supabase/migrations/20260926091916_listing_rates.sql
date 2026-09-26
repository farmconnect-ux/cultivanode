-- Tillmate: listings follow the Phase 1 specification.
--
--   * Equipment listings name an equipment_type from a fixed list; service listings name the
--     provider_type (service type). The free-text `category` column is removed.
--   * A listing can carry several prices (per hour, per day, per hectare, per job) in listing_rates,
--     instead of exactly one pricing unit.
--   * nearby_listings() filters by equipment type or service type and returns every price.
-- No production listings exist yet (listing UI arrives in M4), so the columns are replaced directly.

create type public.equipment_type as enum (
  'tractor', 'plough', 'harrow', 'planter', 'harvester', 'sprayer', 'ridger', 'tiller',
  'irrigation_equipment', 'transport_equipment', 'other'
);

drop function public.nearby_listings(double precision, double precision, numeric, public.listing_kind, text, integer);

drop index if exists public.listings_active_idx;
alter table public.listings
  drop column category,
  drop column pricing_unit,
  drop column rate_kobo,
  add column equipment_type public.equipment_type,
  add constraint listings_equipment_has_type check ((kind = 'equipment') = (equipment_type is not null));

create index listings_active_equipment_idx on public.listings (equipment_type) where status = 'active' and kind = 'equipment';
create index listings_active_service_idx on public.listings (provider_type) where status = 'active' and kind = 'service';

create table public.listing_rates (
  listing_id  uuid not null references public.listings (id) on delete cascade,
  unit        public.pricing_unit not null,
  rate_kobo   bigint not null check (rate_kobo > 0 and rate_kobo <= 100000000000), -- up to N1bn
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  primary key (listing_id, unit)
);
create index listing_rates_created_by_idx on public.listing_rates (created_by);
create trigger listing_rates_updated_at before update on public.listing_rates
  for each row execute function public.set_updated_at();
comment on table public.listing_rates is 'Prices for a listing, one per unit (hour, day, hectare, job). Money in kobo.';

alter table public.listing_rates enable row level security;

-- Visible whenever the listing itself is visible (the subquery runs under listings' own RLS).
create policy "listing_rates: visible with the listing" on public.listing_rates
  for select to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));
create policy "listing_rates: owner adds" on public.listing_rates
  for insert to authenticated
  with check (exists (select 1 from public.listings l
                       where l.id = listing_id and l.owner_id = (select auth.uid()) and l.status <> 'suspended'));
create policy "listing_rates: owner changes" on public.listing_rates
  for update to authenticated
  using (exists (select 1 from public.listings l
                  where l.id = listing_id and l.owner_id = (select auth.uid()) and l.status <> 'suspended'))
  with check (exists (select 1 from public.listings l
                       where l.id = listing_id and l.owner_id = (select auth.uid()) and l.status <> 'suspended'));
create policy "listing_rates: owner removes" on public.listing_rates
  for delete to authenticated
  using (exists (select 1 from public.listings l
                  where l.id = listing_id and l.owner_id = (select auth.uid()) and l.status <> 'suspended'));

revoke all on public.listing_rates from anon, authenticated;
grant select, insert (listing_id, unit, rate_kobo), update (rate_kobo), delete on public.listing_rates to authenticated;

-- Column grants on listings: category/pricing columns are gone; equipment_type is new.
revoke insert, update on public.listings from authenticated;
grant insert (kind, equipment_type, provider_type, title, description, operator_included,
              location, service_radius_km, status)
  on public.listings to authenticated;
grant update (equipment_type, title, description, operator_included, location, service_radius_km, status)
  on public.listings to authenticated;

create function public.nearby_listings(
  p_lat             double precision,
  p_lng             double precision,
  p_radius_km       numeric default 30,
  p_kind            public.listing_kind default null,
  p_equipment_type  public.equipment_type default null,
  p_provider_type   public.provider_type default null,
  p_limit           integer default 50
)
returns table (
  listing_id         uuid,
  owner_id           uuid,
  kind               public.listing_kind,
  equipment_type     public.equipment_type,
  provider_type      public.provider_type,
  title              text,
  rates              jsonb,
  operator_included  boolean,
  service_radius_km  numeric,
  distance_km        numeric
)
language plpgsql stable security invoker
set search_path = ''
as $$
declare
  v_radius_m double precision;
  v_limit    integer;
  v_origin   extensions.geography;
begin
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Invalid coordinates: latitude must be -90..90 and longitude -180..180.'
      using errcode = '22023';
  end if;

  v_radius_m := greatest(1, least(coalesce(p_radius_km, 30), 100)) * 1000;
  v_limit    := greatest(1, least(coalesce(p_limit, 50), 100));
  v_origin   := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;

  return query
  select l.id,
         l.owner_id,
         l.kind,
         l.equipment_type,
         l.provider_type,
         l.title,
         r.rates,
         l.operator_included,
         l.service_radius_km,
         round((extensions.st_distance(l.location, v_origin) / 1000.0)::numeric, 2) as distance_km
    from public.listings l
    -- A listing without any price is not bookable, so it is not returned.
    join lateral (
      select jsonb_object_agg(lr.unit, lr.rate_kobo) as rates
        from public.listing_rates lr
       where lr.listing_id = l.id
    ) r on r.rates is not null
   where l.status = 'active'
     and (p_kind is null or l.kind = p_kind)
     and (p_equipment_type is null or l.equipment_type = p_equipment_type)
     and (p_provider_type is null or l.provider_type = p_provider_type)
     and extensions.st_dwithin(l.location, v_origin, v_radius_m)
     and extensions.st_dwithin(l.location, v_origin, (l.service_radius_km * 1000)::double precision)
   order by distance_km asc, l.id
   limit v_limit;
end;
$$;

comment on function public.nearby_listings is
  'Active, priced listings within p_radius_km (capped at 100) whose own service radius also reaches the caller. Nearest first. rates = {unit: kobo}.';

revoke execute on function public.nearby_listings(double precision, double precision, numeric, public.listing_kind,
  public.equipment_type, public.provider_type, integer) from public, anon;
grant execute on function public.nearby_listings(double precision, double precision, numeric, public.listing_kind,
  public.equipment_type, public.provider_type, integer) to authenticated;
