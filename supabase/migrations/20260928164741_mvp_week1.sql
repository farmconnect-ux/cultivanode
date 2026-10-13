-- CultivaNode MVP week 1: safe foundation and supply online.
--
--   1. One verified claimant per NIN, BVN and bank account (id_claims), closing the check-then-insert race.
--   2. Account suspension and flagging, with an auth ban and forced sign-out, all audited.
--   3. feature_flags with the marketplace kill switch (marketplace_live, optionally limited to pilot states).
--   4. Listings: publishing needs an active account, the right role and tier, and the marketplace switched on.
--      Staff suspend and restore listings through an audited function.
--   5. nearby_listings() hides suspended owners, respects the kill switch and returns a public provider card.
--   6. Admin: users search, queue counts with median approval time, agent codes and business staff views.

------------------------------------------------------------------------------------------------
-- 0. New permission
------------------------------------------------------------------------------------------------

insert into public.permissions (permission, description) values
  ('users.suspend', 'Suspend, flag or sign out accounts; revoke field-agent codes and business staff access')
on conflict do nothing;
insert into public.admin_role_permissions (admin_role, permission) values
  ('support_disputes', 'users.suspend')
on conflict do nothing;

------------------------------------------------------------------------------------------------
-- 1. One verified claimant per ID
------------------------------------------------------------------------------------------------

create table public.id_claims (
  kind        text not null check (kind in ('nin', 'bvn', 'bank')),
  id_hash     text not null check (id_hash ~ '^[0-9a-f]{64}$'),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  claimed_at  timestamptz not null default now(),
  primary key (kind, id_hash)
);
create index id_claims_profile_idx on public.id_claims (profile_id);
comment on table public.id_claims is
  'Which account owns a verified NIN, BVN or bank account (by keyed hash). The primary key makes a second account''s claim fail atomically.';

alter table public.id_claims enable row level security;
revoke all on public.id_claims from anon, authenticated;

-- Backfill from existing verified checks; the earliest verification keeps the claim.
insert into public.id_claims (kind, id_hash, profile_id, claimed_at)
select distinct on (v.kind, v.id_hash) v.kind::text, v.id_hash, v.profile_id, coalesce(v.verified_at, v.created_at)
  from public.verifications v
 where v.status = 'verified' and v.id_hash is not null and v.kind in ('nin', 'bvn')
 order by v.kind, v.id_hash, coalesce(v.verified_at, v.created_at)
on conflict do nothing;
insert into public.id_claims (kind, id_hash, profile_id, claimed_at)
select distinct on (b.id_hash) 'bank', b.id_hash, b.profile_id, coalesce(b.verified_at, b.created_at)
  from public.bank_accounts b
 where b.status = 'verified' and b.id_hash is not null
 order by b.id_hash, coalesce(b.verified_at, b.created_at)
on conflict do nothing;

-- Claims the ID for p_profile, or reports that another account holds it. Race-safe (primary key).
create or replace function private.claim_id(p_kind text, p_hash text, p_profile uuid)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  insert into public.id_claims (kind, id_hash, profile_id) values (p_kind, p_hash, p_profile)
  on conflict (kind, id_hash) do nothing;
  select profile_id into v_owner from public.id_claims where kind = p_kind and id_hash = p_hash;
  return v_owner = p_profile;
end;
$$;

create or replace function public.record_identity_verification(
  p_profile      uuid,
  p_kind         public.verification_kind,
  p_verified     boolean,
  p_provider     text,
  p_reference    text,
  p_masked       text,
  p_id_hash      text,
  p_name_match   numeric,
  p_failure      text default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_status  public.verification_status := case when p_verified then 'verified' else 'failed' end;
  v_failure text := p_failure;
  v_id      uuid;
begin
  if p_kind not in ('nin', 'bvn') then
    raise exception 'only nin and bvn are recorded here' using errcode = '22023';
  end if;
  if p_verified and p_id_hash is not null and not private.claim_id(p_kind::text, p_id_hash, p_profile) then
    v_status := 'failed';
    v_failure := 'already_linked';
  end if;

  insert into public.verifications
    (profile_id, kind, status, provider, reference, masked_value, verified_at, id_hash, name_match, failure_reason)
  values (p_profile, p_kind, v_status, p_provider, left(p_reference, 120), p_masked,
          case when v_status = 'verified' then now() end, p_id_hash, p_name_match, v_failure)
  returning id into v_id;

  perform public.write_audit('identity_check_' || v_status, 'verification', v_id,
    jsonb_build_object('profile_id', p_profile, 'kind', p_kind, 'provider', p_provider, 'failure', v_failure));
  return jsonb_build_object('id', v_id, 'status', v_status, 'failure_reason', v_failure);
end;
$$;

create or replace function public.record_bank_account_verification(
  p_profile      uuid,
  p_bank_code    text,
  p_bank_name    text,
  p_account_name text,
  p_last4        text,
  p_provider     text,
  p_verified     boolean,
  p_id_hash      text,
  p_name_match   numeric,
  p_failure      text default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_status  public.verification_status := case when p_verified then 'verified' else 'failed' end;
  v_failure text := p_failure;
  v_id      uuid;
begin
  if p_verified and p_id_hash is not null and not private.claim_id('bank', p_id_hash, p_profile) then
    v_status := 'failed';
    v_failure := 'already_linked';
  end if;
  insert into public.bank_accounts
    (profile_id, bank_code, bank_name, account_name, account_number_last4, provider, status, verified_at,
     is_default, id_hash, name_match, failure_reason, created_by)
  values (p_profile, p_bank_code, p_bank_name, p_account_name, p_last4, p_provider, v_status,
          case when v_status = 'verified' then now() end,
          v_status = 'verified' and not exists (select 1 from public.bank_accounts b where b.profile_id = p_profile and b.is_default),
          p_id_hash, p_name_match, v_failure, p_profile)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'status', v_status, 'failure_reason', v_failure);
end;
$$;

------------------------------------------------------------------------------------------------
-- 2. Suspension and flags
------------------------------------------------------------------------------------------------

alter table public.profiles
  add column suspended_at     timestamptz,
  add column suspended_reason text check (suspended_reason is null or char_length(suspended_reason) <= 500),
  add column suspended_by     uuid references public.profiles (id) on delete set null,
  add column flagged_at       timestamptz,
  add column flag_reason      text check (flag_reason is null or char_length(flag_reason) <= 500),
  add column flagged_by       uuid references public.profiles (id) on delete set null;
create index profiles_suspended_idx on public.profiles (suspended_at) where suspended_at is not null;
create index profiles_flagged_idx on public.profiles (flagged_at) where flagged_at is not null;
create index profiles_suspended_by_idx on public.profiles (suspended_by);
create index profiles_flagged_by_idx on public.profiles (flagged_by);
comment on column public.profiles.suspended_at is
  'Set by staff (users.suspend). A suspended account cannot publish listings or book, is hidden from search, and is banned from signing in.';

-- True when the account exists and is not suspended. Used by RLS and the marketplace functions.
create or replace function private.account_active(p_profile uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = p_profile and p.suspended_at is null);
$$;

create or replace function private.require_reason(p_reason text)
returns text
language plpgsql immutable
set search_path = ''
as $$
begin
  if p_reason is null or char_length(trim(p_reason)) < 5 then
    raise exception 'Give a reason (at least 5 characters).' using errcode = '22023';
  end if;
  return left(trim(p_reason), 500);
end;
$$;

-- Ends every session of the person: refresh tokens stop working at once; an access token already issued
-- lasts until it expires (about an hour), which suspended_at checks cover in the meantime.
create or replace function private.end_sessions(p_profile uuid)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_n integer;
begin
  delete from auth.sessions where user_id = p_profile;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

create or replace function public.admin_set_account_suspension(p_profile uuid, p_suspend boolean, p_reason text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_reason   text := private.require_reason(p_reason);
  v_old      public.profiles;
  v_sessions integer := 0;
begin
  perform private.require_permission('users.suspend');
  if p_profile = auth.uid() then
    raise exception 'You cannot suspend your own account.' using errcode = '42501';
  end if;
  select * into v_old from public.profiles where id = p_profile for update;
  if not found then
    raise exception 'Account not found.' using errcode = 'P0002';
  end if;
  if p_suspend and exists (select 1 from public.admin_roles where profile_id = p_profile)
     and not public.has_permission('admin.manage') then
    raise exception 'Only an admin manager can suspend a staff account.' using errcode = '42501';
  end if;

  if p_suspend then
    update public.profiles
       set suspended_at = coalesce(suspended_at, now()), suspended_reason = v_reason, suspended_by = auth.uid()
     where id = p_profile;
    update auth.users set banned_until = 'infinity'::timestamptz where id = p_profile;
    v_sessions := private.end_sessions(p_profile);
  else
    update public.profiles set suspended_at = null, suspended_reason = null, suspended_by = null where id = p_profile;
    update auth.users set banned_until = null where id = p_profile;
  end if;

  perform private.record_admin_action('users.suspend', case when p_suspend then 'account_suspended' else 'account_restored' end,
    'profile', p_profile, v_reason);
  perform public.write_audit(case when p_suspend then 'account_suspended' else 'account_restored' end, 'profile', p_profile,
    jsonb_build_object('sessions_ended', v_sessions),
    jsonb_build_object('suspended_at', v_old.suspended_at, 'suspended_reason', v_old.suspended_reason),
    jsonb_build_object('suspended', p_suspend, 'reason', v_reason));
  return jsonb_build_object('suspended', p_suspend, 'sessions_ended', v_sessions);
end;
$$;

create or replace function public.admin_set_account_flag(p_profile uuid, p_flag boolean, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_reason text := private.require_reason(p_reason);
begin
  perform private.require_permission('users.suspend');
  update public.profiles
     set flagged_at = case when p_flag then coalesce(flagged_at, now()) end,
         flag_reason = case when p_flag then v_reason end,
         flagged_by = case when p_flag then auth.uid() end
   where id = p_profile;
  if not found then
    raise exception 'Account not found.' using errcode = 'P0002';
  end if;
  perform private.record_admin_action('users.suspend', case when p_flag then 'account_flagged' else 'account_unflagged' end,
    'profile', p_profile, v_reason);
end;
$$;

create or replace function public.admin_force_sign_out(p_profile uuid, p_reason text)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_reason text := private.require_reason(p_reason);
  v_n      integer;
begin
  perform private.require_permission('users.suspend');
  if not exists (select 1 from public.profiles where id = p_profile) then
    raise exception 'Account not found.' using errcode = 'P0002';
  end if;
  v_n := private.end_sessions(p_profile);
  perform private.record_admin_action('users.suspend', 'sessions_revoked', 'profile', p_profile, v_reason);
  return v_n;
end;
$$;

------------------------------------------------------------------------------------------------
-- 3. Feature flags (kill switches)
------------------------------------------------------------------------------------------------

create table public.feature_flags (
  key          text primary key check (key ~ '^[a-z][a-z0-9_]{2,40}$'),
  description  text not null,
  enabled      boolean not null default false,
  -- Pilot states the flag is on for; null means everywhere.
  states       text[] check (states is null or cardinality(states) between 1 and 37),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles (id) on delete set null
);
create index feature_flags_updated_by_idx on public.feature_flags (updated_by);
comment on table public.feature_flags is 'Staff-controlled switches. Read by the database functions; changed only through admin_set_feature_flag().';

insert into public.feature_flags (key, description, enabled) values
  ('marketplace_live', 'Farmers can search listings and providers can publish them. Off stops both at once.', false);

alter table public.feature_flags enable row level security;
create policy "feature_flags: everyone signed in reads" on public.feature_flags
  for select to authenticated using (true);
revoke all on public.feature_flags from anon, authenticated;
grant select on public.feature_flags to authenticated;

-- Is the flag on for this person (by the state on their profile)?
create or replace function private.flag_on_for(p_key text, p_profile uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((
    select f.enabled and (f.states is null or exists (
             select 1 from public.profiles p where p.id = p_profile and p.state = any (f.states)))
      from public.feature_flags f where f.key = p_key), false);
$$;

-- For the apps: is the marketplace open to me?
create or replace function public.marketplace_open()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.flag_on_for('marketplace_live', auth.uid()) and private.account_active(auth.uid());
$$;

create or replace function public.admin_set_feature_flag(p_key text, p_enabled boolean, p_states text[], p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_reason text := private.require_reason(p_reason);
  v_old    public.feature_flags;
  v_states text[] := case when p_states is null or cardinality(p_states) = 0 then null else p_states end;
begin
  perform private.require_permission('settings.manage');
  select * into v_old from public.feature_flags where key = p_key for update;
  if not found then
    raise exception 'Unknown switch.' using errcode = 'P0002';
  end if;
  update public.feature_flags
     set enabled = p_enabled, states = v_states, updated_at = now(), updated_by = auth.uid()
   where key = p_key;
  perform private.record_admin_action('settings.manage', 'feature_flag:' || p_key, 'feature_flag', null, v_reason);
  perform public.write_audit('feature_flag_changed', 'feature_flag', null, jsonb_build_object('key', p_key),
    jsonb_build_object('enabled', v_old.enabled, 'states', v_old.states),
    jsonb_build_object('enabled', p_enabled, 'states', v_states));
end;
$$;

------------------------------------------------------------------------------------------------
-- 4. Listings: publishing rules and moderation
------------------------------------------------------------------------------------------------

alter table public.listings
  add column suspended_at     timestamptz,
  add column suspended_reason text check (suspended_reason is null or char_length(suspended_reason) <= 500);

-- Publishing (status active) needs: my own active account, the role and tier (can_create_listing), and the
-- marketplace switched on for me. Drafts and paused listings can be kept while the marketplace is off.
create or replace function private.can_publish_listing(p_kind public.listing_kind, p_provider_type public.provider_type)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.account_active(auth.uid())
     and private.can_create_listing(p_kind, p_provider_type)
     and private.flag_on_for('marketplace_live', auth.uid());
$$;

drop policy "listings: approved providers create their own" on public.listings;
create policy "listings: approved providers create their own" on public.listings
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (select private.account_active((select auth.uid())))
    and private.can_create_listing(kind, provider_type)
    and (status = 'draft' or (status = 'active' and private.can_publish_listing(kind, provider_type)))
  );

drop policy "listings: owners update" on public.listings;
create policy "listings: owners update" on public.listings
  for update to authenticated
  using (owner_id = (select auth.uid()) and status <> 'suspended')
  with check (
    owner_id = (select auth.uid())
    and (select private.account_active((select auth.uid())))
    and status in ('draft', 'paused', 'active')
    and (status <> 'active' or private.can_publish_listing(kind, provider_type))
  );

-- Staff change listing status only through admin_set_listing_status() (audited).
drop policy if exists "listings: listings.moderate" on public.listings;

create or replace function public.admin_set_listing_status(p_listing uuid, p_suspend boolean, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_reason text := private.require_reason(p_reason);
  v_old    public.listings;
begin
  perform private.require_permission('listings.moderate');
  select * into v_old from public.listings where id = p_listing for update;
  if not found then
    raise exception 'Listing not found.' using errcode = 'P0002';
  end if;
  if p_suspend then
    update public.listings set status = 'suspended', suspended_at = now(), suspended_reason = v_reason where id = p_listing;
  else
    if v_old.status <> 'suspended' then
      raise exception 'This listing is not suspended.' using errcode = '22023';
    end if;
    -- Restored listings come back paused; the owner publishes them again.
    update public.listings set status = 'paused', suspended_at = null, suspended_reason = null where id = p_listing;
  end if;
  perform private.record_admin_action('listings.moderate', case when p_suspend then 'listing_suspended' else 'listing_restored' end,
    'listing', p_listing, v_reason);
  perform public.write_audit(case when p_suspend then 'listing_suspended' else 'listing_restored' end, 'listing', p_listing,
    jsonb_build_object('owner_id', v_old.owner_id),
    jsonb_build_object('status', v_old.status), jsonb_build_object('status', case when p_suspend then 'suspended' else 'paused' end));
end;
$$;

create or replace function public.admin_listings(p_status public.listing_status default null, p_query text default null, p_limit integer default 100)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_q text := nullif(trim(coalesce(p_query, '')), '');
begin
  perform private.require_permission('listings.moderate');
  return coalesce((
    select jsonb_agg(row_to_json(x) order by x.created_at desc)
      from (
        select l.id, l.kind, l.equipment_type, l.provider_type, l.title, l.status, l.service_radius_km,
               l.suspended_reason, l.created_at, l.updated_at,
               p.id as owner_id, p.full_name as owner_name, p.phone as owner_phone, p.state as owner_state,
               p.verification_tier as owner_tier, p.suspended_at is not null as owner_suspended,
               extensions.st_y(l.location::extensions.geometry) as lat, extensions.st_x(l.location::extensions.geometry) as lng,
               (select jsonb_object_agg(r.unit, r.rate_kobo) from public.listing_rates r where r.listing_id = l.id) as rates
          from public.listings l
          join public.profiles p on p.id = l.owner_id
         where (p_status is null or l.status = p_status)
           and (v_q is null or l.title ilike '%' || v_q || '%' or p.full_name ilike '%' || v_q || '%'
                or p.phone like '%' || regexp_replace(v_q, '\D', '', 'g') || '%' and regexp_replace(v_q, '\D', '', 'g') <> '')
         order by l.created_at desc
         limit greatest(1, least(coalesce(p_limit, 100), 500))
      ) x), '[]'::jsonb);
end;
$$;

------------------------------------------------------------------------------------------------
-- 5. Nearby search: kill switch, suspended owners hidden, public provider card
------------------------------------------------------------------------------------------------

-- What a farmer may see about a provider before any booking: first name, state, tier. No phone.
create or replace function private.provider_card(p_profile uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
           'name', coalesce(split_part(trim(p.full_name), ' ', 1), ''),
           'state', p.state,
           'tier', p.verification_tier)
    from public.profiles p
   where p.id = p_profile and p.suspended_at is null;
$$;

drop function public.nearby_listings(double precision, double precision, numeric, public.listing_kind,
  public.equipment_type, public.provider_type, integer);

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
  description        text,
  rates              jsonb,
  operator_included  boolean,
  service_radius_km  numeric,
  distance_km        numeric,
  provider           jsonb
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

  -- Kill switch and suspended searchers: no results, no error (the app shows "not open yet").
  if not public.marketplace_open() then
    return;
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
         l.description,
         r.rates,
         l.operator_included,
         l.service_radius_km,
         round((extensions.st_distance(l.location, v_origin) / 1000.0)::numeric, 2) as distance_km,
         c.card
    from public.listings l
    join lateral (
      select jsonb_object_agg(lr.unit, lr.rate_kobo) as rates
        from public.listing_rates lr
       where lr.listing_id = l.id
    ) r on r.rates is not null
    -- The card is null for a suspended owner, which drops the listing.
    join lateral (select private.provider_card(l.owner_id) as card) c on c.card is not null
   where l.status = 'active'
     and l.owner_id <> (select auth.uid())
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
  'Active, priced listings of active accounts within p_radius_km (capped at 100) whose own service radius reaches the point. Empty while marketplace_live is off for the caller. Nearest first. rates = {unit: kobo}; provider = {name, state, tier}.';

-- Search from one of my farms (or a business farm I belong to). Runs as the caller: farms RLS decides
-- which farms can be searched from, so a farmer cannot probe from someone else's farm.
create or replace function public.nearby_listings_for_farm(
  p_farm            uuid,
  p_radius_km       numeric default 30,
  p_kind            public.listing_kind default null,
  p_equipment_type  public.equipment_type default null,
  p_provider_type   public.provider_type default null,
  p_limit           integer default 50
)
returns setof jsonb
language plpgsql stable security invoker
set search_path = ''
as $$
declare
  v_lat double precision;
  v_lng double precision;
begin
  select extensions.st_y(f.location::extensions.geometry), extensions.st_x(f.location::extensions.geometry)
    into v_lat, v_lng
    from public.farms f
   where f.id = p_farm
     and (f.owner_id = (select auth.uid())
          or (f.organization_id is not null and public.org_role(f.organization_id) is not null));
  if v_lat is null then
    raise exception 'Farm not found.' using errcode = 'P0002';
  end if;
  return query
  select to_jsonb(n) from public.nearby_listings(v_lat, v_lng, p_radius_km, p_kind, p_equipment_type, p_provider_type, p_limit) n;
end;
$$;

-- My listings with their pin and prices, for the listings page.
create or replace function public.my_listings()
returns jsonb
language sql stable security invoker
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', l.id, 'kind', l.kind, 'equipment_type', l.equipment_type, 'provider_type', l.provider_type,
           'title', l.title, 'description', l.description, 'operator_included', l.operator_included,
           'service_radius_km', l.service_radius_km, 'status', l.status, 'suspended_reason', l.suspended_reason,
           'lat', extensions.st_y(l.location::extensions.geometry), 'lng', extensions.st_x(l.location::extensions.geometry),
           'rates', coalesce((select jsonb_object_agg(r.unit, r.rate_kobo) from public.listing_rates r where r.listing_id = l.id), '{}'::jsonb),
           'updated_at', l.updated_at)
         order by l.created_at desc), '[]'::jsonb)
    from public.listings l
   where l.owner_id = (select auth.uid());
$$;

------------------------------------------------------------------------------------------------
-- 6. Admin: users search, queue counts, agent codes, business staff
------------------------------------------------------------------------------------------------

create or replace function public.admin_search_users(
  p_query text default null, p_filter text default null, p_limit integer default 50
)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_q      text := nullif(trim(coalesce(p_query, '')), '');
  v_digits text;
begin
  perform private.require_permission('users.read');
  v_digits := nullif(regexp_replace(coalesce(v_q, ''), '\D', '', 'g'), '');
  -- 0803... and 234803... find the same number.
  if v_digits like '0%' then v_digits := '234' || substr(v_digits, 2); end if;
  if p_filter is not null and p_filter not in ('suspended', 'flagged', 'staff', 'tier2') then
    raise exception 'Unknown filter.' using errcode = '22023';
  end if;
  return coalesce((
    select jsonb_agg(row_to_json(x) order by x.created_at desc)
      from (
        select p.id, p.full_name, p.phone, p.state, p.account_type, p.verification_tier, p.created_at, p.onboarded_at,
               p.suspended_at, p.suspended_reason, p.flagged_at, p.flag_reason,
               coalesce((select jsonb_agg(jsonb_build_object('role', ur.role, 'provider_type', ur.provider_type))
                           from public.user_roles ur where ur.profile_id = p.id), '[]'::jsonb) as roles,
               coalesce((select jsonb_agg(o.name) from public.org_members m join public.organizations o on o.id = m.organization_id
                          where m.profile_id = p.id), '[]'::jsonb) as organizations,
               exists (select 1 from public.admin_roles a where a.profile_id = p.id) as is_staff
          from public.profiles p
         where (v_q is null
                or p.full_name ilike '%' || v_q || '%'
                or (v_digits is not null and char_length(v_digits) >= 4 and p.phone like '%' || v_digits || '%')
                or exists (select 1 from public.org_members m join public.organizations o on o.id = m.organization_id
                            where m.profile_id = p.id and o.name ilike '%' || v_q || '%'))
           and (p_filter is null
                or (p_filter = 'suspended' and p.suspended_at is not null)
                or (p_filter = 'flagged' and p.flagged_at is not null)
                or (p_filter = 'staff' and exists (select 1 from public.admin_roles a where a.profile_id = p.id))
                or (p_filter = 'tier2' and p.verification_tier >= 2))
         order by p.created_at desc
         limit greatest(1, least(coalesce(p_limit, 50), 200))
      ) x), '[]'::jsonb);
end;
$$;

create or replace function public.admin_dashboard()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admin_roles where profile_id = auth.uid()) then
    raise exception 'Staff only.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'pending_role_requests', case when public.has_permission('roles.review')
      then (select count(*) from public.role_requests where status = 'pending') end,
    'oldest_pending_role_request_hours', case when public.has_permission('roles.review')
      then (select round((extract(epoch from now() - min(created_at)) / 3600.0)::numeric, 1)
              from public.role_requests where status = 'pending') end,
    'median_approval_hours_30d', case when public.has_permission('roles.review')
      then (select round((percentile_cont(0.5) within group (order by extract(epoch from reviewed_at - created_at)) / 3600.0)::numeric, 1)
              from public.role_requests
             where status in ('approved', 'rejected') and reviewed_at > now() - interval '30 days') end,
    'pending_documents', case when public.has_permission('verification.review')
      then (select count(*) from public.verification_documents where status = 'pending') end,
    'open_contact_messages', case when public.has_permission('website_inbox.manage')
      then (select count(*) from public.contact_messages where handled_at is null) end,
    'waitlist_signups', case when public.has_permission('website_inbox.manage')
      then (select count(*) from public.waitlist_signups) end,
    'open_data_requests', case when public.has_permission('privacy.manage')
      then (select count(*) from public.data_requests where status = 'open') end,
    'users', case when public.has_permission('users.read')
      then (select count(*) from public.profiles) end,
    'users_last_7_days', case when public.has_permission('users.read')
      then (select count(*) from public.profiles where created_at > now() - interval '7 days') end,
    'suspended_accounts', case when public.has_permission('users.read')
      then (select count(*) from public.profiles where suspended_at is not null) end,
    'flagged_accounts', case when public.has_permission('users.read')
      then (select count(*) from public.profiles where flagged_at is not null) end,
    'active_listings', case when public.has_permission('listings.moderate')
      then (select count(*) from public.listings where status = 'active') end,
    'suspended_listings', case when public.has_permission('listings.moderate')
      then (select count(*) from public.listings where status = 'suspended') end,
    'marketplace_live', (select jsonb_build_object('enabled', f.enabled, 'states', f.states)
                           from public.feature_flags f where f.key = 'marketplace_live')
  );
end;
$$;

-- Field-agent codes: who sent a code to which farmer phone, and its state. Codes themselves are never stored.
alter table public.agent_onboarding_codes
  add column revoked_at timestamptz,
  add column revoked_by uuid references public.profiles (id) on delete set null;
create index agent_onboarding_codes_revoked_by_idx on public.agent_onboarding_codes (revoked_by);

create or replace function public.admin_agent_codes(p_limit integer default 100)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform private.require_permission('users.read');
  return coalesce((
    select jsonb_agg(row_to_json(x) order by x.created_at desc)
      from (
        select c.id, c.agent_id, a.full_name as agent_name,
               '234******' || right(c.phone, 4) as farmer_phone,
               c.attempts, c.created_at, c.expires_at, c.used_at, c.revoked_at,
               case when c.revoked_at is not null then 'revoked'
                    when c.used_at is not null then 'used'
                    when c.expires_at <= now() then 'expired'
                    else 'open' end as state
          from public.agent_onboarding_codes c
          join public.profiles a on a.id = c.agent_id
         order by c.created_at desc
         limit greatest(1, least(coalesce(p_limit, 100), 500))
      ) x), '[]'::jsonb);
end;
$$;

create or replace function public.admin_revoke_agent_code(p_code uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_reason text := private.require_reason(p_reason);
begin
  perform private.require_permission('users.suspend');
  update public.agent_onboarding_codes
     set revoked_at = now(), revoked_by = auth.uid(), expires_at = least(expires_at, now())
   where id = p_code and used_at is null and revoked_at is null;
  if not found then
    raise exception 'That code is already used, revoked or does not exist.' using errcode = 'P0002';
  end if;
  perform private.record_admin_action('users.suspend', 'agent_code_revoked', 'agent_onboarding_code', p_code, v_reason);
end;
$$;

-- Business staff memberships (not owners' own row counts as a membership too, shown for context).
create or replace function public.admin_org_memberships(p_query text default null, p_limit integer default 200)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_q text := nullif(trim(coalesce(p_query, '')), '');
begin
  perform private.require_permission('users.read');
  return coalesce((
    select jsonb_agg(row_to_json(x) order by x.organization, x.member_role, x.created_at)
      from (
        select m.organization_id, o.name as organization, o.cac_number, m.profile_id, p.full_name, p.phone,
               m.member_role, m.created_at, ab.full_name as added_by_name, p.suspended_at is not null as suspended
          from public.org_members m
          join public.organizations o on o.id = m.organization_id
          join public.profiles p on p.id = m.profile_id
          left join public.profiles ab on ab.id = m.added_by
         where v_q is null or o.name ilike '%' || v_q || '%' or p.full_name ilike '%' || v_q || '%'
         limit greatest(1, least(coalesce(p_limit, 200), 1000))
      ) x), '[]'::jsonb);
end;
$$;

create or replace function public.admin_remove_org_member(p_org uuid, p_profile uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_reason text := private.require_reason(p_reason);
  v_role   public.org_member_role;
begin
  perform private.require_permission('users.suspend');
  select member_role into v_role from public.org_members where organization_id = p_org and profile_id = p_profile for update;
  if not found then
    raise exception 'Membership not found.' using errcode = 'P0002';
  end if;
  if v_role = 'owner' then
    raise exception 'The business owner cannot be removed here. Suspend the account instead.' using errcode = '22023';
  end if;
  delete from public.org_members where organization_id = p_org and profile_id = p_profile;
  perform private.record_admin_action('users.suspend', 'org_member_removed:' || v_role::text, 'organization', p_org, v_reason);
  perform public.write_audit('org_member_removed', 'organization', p_org,
    jsonb_build_object('profile_id', p_profile, 'member_role', v_role));
end;
$$;

------------------------------------------------------------------------------------------------
-- 7. Grants
------------------------------------------------------------------------------------------------

revoke execute on function
  private.claim_id(text, text, uuid),
  private.end_sessions(uuid),
  private.require_reason(text)
  from public, anon, authenticated;

-- RLS helpers: callable by signed-in users (the private schema is not exposed through the API).
revoke execute on function
  private.account_active(uuid),
  private.flag_on_for(text, uuid),
  private.can_publish_listing(public.listing_kind, public.provider_type),
  private.provider_card(uuid)
  from public, anon;
grant execute on function
  private.account_active(uuid),
  private.flag_on_for(text, uuid),
  private.can_publish_listing(public.listing_kind, public.provider_type),
  private.provider_card(uuid)
  to authenticated;

revoke execute on function
  public.admin_set_account_suspension(uuid, boolean, text),
  public.admin_set_account_flag(uuid, boolean, text),
  public.admin_force_sign_out(uuid, text),
  public.admin_set_feature_flag(text, boolean, text[], text),
  public.admin_set_listing_status(uuid, boolean, text),
  public.admin_listings(public.listing_status, text, integer),
  public.admin_search_users(text, text, integer),
  public.admin_agent_codes(integer),
  public.admin_revoke_agent_code(uuid, text),
  public.admin_org_memberships(text, integer),
  public.admin_remove_org_member(uuid, uuid, text),
  public.marketplace_open(),
  public.my_listings(),
  public.nearby_listings_for_farm(uuid, numeric, public.listing_kind, public.equipment_type, public.provider_type, integer),
  public.nearby_listings(double precision, double precision, numeric, public.listing_kind,
    public.equipment_type, public.provider_type, integer)
  from public, anon;
grant execute on function
  public.admin_set_account_suspension(uuid, boolean, text),
  public.admin_set_account_flag(uuid, boolean, text),
  public.admin_force_sign_out(uuid, text),
  public.admin_set_feature_flag(text, boolean, text[], text),
  public.admin_set_listing_status(uuid, boolean, text),
  public.admin_listings(public.listing_status, text, integer),
  public.admin_search_users(text, text, integer),
  public.admin_agent_codes(integer),
  public.admin_revoke_agent_code(uuid, text),
  public.admin_org_memberships(text, integer),
  public.admin_remove_org_member(uuid, uuid, text),
  public.marketplace_open(),
  public.my_listings(),
  public.nearby_listings_for_farm(uuid, numeric, public.listing_kind, public.equipment_type, public.provider_type, integer),
  public.nearby_listings(double precision, double precision, numeric, public.listing_kind,
    public.equipment_type, public.provider_type, integer)
  to authenticated;
