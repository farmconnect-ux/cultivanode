-- CultivaNode: marketplace listings (first slice) and nearby search
--
-- Ported from the prototype's /equipment/nearby query (ST_DWithin + ST_Distance), with fixes:
--   * radius and result count are capped; coordinates are validated
--   * a listing only appears if the farmer is inside the provider's own service radius
--   * money is stored in kobo as whole numbers (no floating point)
--   * it runs as the caller (SECURITY INVOKER), so Row Level Security still applies
-- Bookings, availability and payments arrive in milestones M4-M5.

create type public.listing_kind as enum ('equipment', 'service');
create type public.pricing_unit as enum ('hour', 'hectare', 'day', 'job');
create type public.listing_status as enum ('draft', 'active', 'paused', 'suspended');

create table public.listings (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind               public.listing_kind not null,
  -- Equipment: tractor, planter, boom_sprayer, harvester, ... ; Service: mirrors provider_type.
  category           text not null check (category ~ '^[a-z][a-z0-9_]{1,40}$'),
  provider_type      public.provider_type,
  title              text not null check (char_length(title) between 3 and 120),
  description        text check (description is null or char_length(description) <= 2000),
  pricing_unit       public.pricing_unit not null,
  rate_kobo          bigint not null check (rate_kobo > 0 and rate_kobo <= 100000000000), -- up to N1bn
  operator_included  boolean not null default true,
  location           extensions.geography(Point, 4326) not null,
  service_radius_km  numeric(6, 1) not null default 30 check (service_radius_km between 1 and 200),
  status             public.listing_status not null default 'draft',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint listings_service_has_provider_type check (
    (kind = 'service') = (provider_type is not null)
  )
);
create index listings_location_gix on public.listings using gist (location);
create index listings_active_idx on public.listings (kind, category) where status = 'active';
create index listings_owner_idx on public.listings (owner_id);

create trigger listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

------------------------------------------------------------------------------------------------
-- Who may list: approved role + payout-ready verification (tier 2+)
------------------------------------------------------------------------------------------------

create or replace function public.can_create_listing(p_kind public.listing_kind, p_provider_type public.provider_type)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.my_verification_tier() >= 2
     and case p_kind
           when 'equipment' then public.has_role('machinery_owner')
           when 'service'   then p_provider_type is not null
                                 and public.has_role('service_provider', p_provider_type)
         end;
$$;

alter table public.listings enable row level security;

create policy "listings: active for all, rest for owner and staff" on public.listings
  for select to authenticated
  using (status = 'active' or owner_id = auth.uid() or public.is_admin());

create policy "listings: approved providers create their own" on public.listings
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and status in ('draft', 'active')
    and public.can_create_listing(kind, provider_type)
  );

-- Owners edit their listings but can neither un-suspend nor suspend (staff only).
create policy "listings: owners update" on public.listings
  for update to authenticated
  using (owner_id = auth.uid() and status <> 'suspended')
  with check (owner_id = auth.uid() and status <> 'suspended');

create policy "listings: owners delete" on public.listings
  for delete to authenticated
  using (owner_id = auth.uid());

create policy "listings: staff moderate" on public.listings
  for update to authenticated
  using (public.is_admin('support_officer'))
  with check (public.is_admin('support_officer'));

revoke all on public.listings from anon, authenticated;
grant select, delete on public.listings to authenticated;
grant insert (kind, category, provider_type, title, description, pricing_unit, rate_kobo,
              operator_included, location, service_radius_km, status)
  on public.listings to authenticated;
grant update (category, title, description, pricing_unit, rate_kobo, operator_included,
              location, service_radius_km, status)
  on public.listings to authenticated;

------------------------------------------------------------------------------------------------
-- nearby_listings(): the ported search
------------------------------------------------------------------------------------------------

create or replace function public.nearby_listings(
  p_lat        double precision,
  p_lng        double precision,
  p_radius_km  numeric default 30,
  p_kind       public.listing_kind default null,
  p_category   text default null,
  p_limit      integer default 50
)
returns table (
  listing_id         uuid,
  owner_id           uuid,
  kind               public.listing_kind,
  category           text,
  provider_type      public.provider_type,
  title              text,
  pricing_unit       public.pricing_unit,
  rate_kobo          bigint,
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

  -- Caps: 1-100 km search radius, 1-100 results.
  v_radius_m := greatest(1, least(coalesce(p_radius_km, 30), 100)) * 1000;
  v_limit    := greatest(1, least(coalesce(p_limit, 50), 100));
  v_origin   := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;

  return query
  select l.id,
         l.owner_id,
         l.kind,
         l.category,
         l.provider_type,
         l.title,
         l.pricing_unit,
         l.rate_kobo,
         l.operator_included,
         l.service_radius_km,
         round((extensions.st_distance(l.location, v_origin) / 1000.0)::numeric, 2) as distance_km
    from public.listings l
   where l.status = 'active'
     and (p_kind is null or l.kind = p_kind)
     and (p_category is null or l.category = p_category)
     and extensions.st_dwithin(l.location, v_origin, v_radius_m)
     and extensions.st_dwithin(l.location, v_origin, (l.service_radius_km * 1000)::double precision)
   order by distance_km asc, l.rate_kobo asc, l.id
   limit v_limit;
end;
$$;

comment on function public.nearby_listings is
  'Active listings within p_radius_km (capped at 100) whose own service radius also reaches the caller. Nearest first.';

revoke execute on function public.can_create_listing(public.listing_kind, public.provider_type) from public, anon;
grant execute on function public.can_create_listing(public.listing_kind, public.provider_type) to authenticated;

revoke execute on function public.nearby_listings(double precision, double precision, numeric, public.listing_kind, text, integer)
  from public, anon;
grant execute on function public.nearby_listings(double precision, double precision, numeric, public.listing_kind, text, integer)
  to authenticated;
