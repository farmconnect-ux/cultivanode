-- CultivaNode 3.0, Batch 03.3 (Workstream B): Machinery Telemetry Provenance & Device Trust Boundary
--
-- Extends `public.machinery_telemetry` (`20261011100000`) without creating a duplicate telemetry table:
-- 1. Creates `public.machinery_device_links` binding registered IoT devices (`public.devices`)
--    to specific `farm_machinery_assets` and `farms` (with FORCE RLS and unique active device link).
-- 2. Adds database-enforced provenance, integrity, deduplication, and trust columns to
--    `public.machinery_telemetry`, enables FORCE ROW LEVEL SECURITY, and revokes direct
--    UPDATE and DELETE from authenticated/anon/service_role (append-only provenance ledger).
-- 3. Adds `private.guard_machinery_telemetry_provenance()` trigger enforcing:
--    - Cross-farm machinery binding (`farm_machinery_assets.farm_id = new.farm_id`).
--    - Anti-spoofing: ordinary authenticated users can NEVER self-assert `device_authenticated`,
--      `trusted_provider_integration`, `verified`, or `verified_current`.
--    - Timestamp plausibility (`recorded_at <= clock_timestamp() + interval '5 minutes'` and >= 2015-01-01).
--    - Physical sensor range validation (speed, heading, fuel, RPM, engine temp, engine hours).
--    - Strict immutability of all provenance and sensor reading fields after insert.
--    - Trust-state transitions permitted ONLY through the audited transition RPC.
-- 4. Adds narrowly scoped RPCs:
--    - `public.ingest_authenticated_device_telemetry(...)` (`service_role`-only): authenticates
--      device token SHA-256 against `public.devices.auth_token_hash` inside PostgreSQL and verifies
--      active `public.machinery_device_links` binding before recording `device_authenticated` / `verified_current`.
--    - `public.ingest_provider_machinery_telemetry(...)` (`service_role`-only): records verified
--      OEM/telematics provider telemetry (`trusted_provider_integration` / `verified_current`).
--    - `public.record_machinery_observation(...)` (`authenticated`): records `farmer_observation`
--      or `staff_observation` (always `provisional` / `unverified_provisional`).
--    - `public.transition_machinery_telemetry_trust(...)` (`authenticated` staff with `crops.manage`
--      or `standards.publish`): audited quarantine/rejection of faulty telemetry.
--
-- Rollback notes: Drop new RPCs, trigger, and `public.machinery_device_links`; retain added
-- provenance columns on `public.machinery_telemetry` for audit history.

------------------------------------------------------------------------------------------------
-- 1. Machinery-to-Device Hardware Binding Table
------------------------------------------------------------------------------------------------
create table if not exists public.machinery_device_links (
  id             uuid primary key default gen_random_uuid(),
  farm_id        uuid not null references public.farms (id) on delete cascade,
  machinery_id   uuid not null references public.farm_machinery_assets (id) on delete cascade,
  device_id      uuid not null references public.devices (id) on delete cascade,
  is_active      boolean not null default true,
  linked_by      uuid references public.profiles (id) on delete set null,
  installed_at   timestamptz not null default clock_timestamp(),
  uninstalled_at timestamptz,
  created_at     timestamptz not null default clock_timestamp(),
  updated_at     timestamptz not null default clock_timestamp()
);

create unique index if not exists machinery_device_links_active_device_uidx
  on public.machinery_device_links (device_id)
  where is_active = true;

create index if not exists machinery_device_links_farm_machinery_idx
  on public.machinery_device_links (farm_id, machinery_id)
  where is_active = true;

create or replace function private.guard_machinery_device_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_asset_farm_id uuid;
begin
  select farm_id into v_asset_farm_id
    from public.farm_machinery_assets
   where id = new.machinery_id;

  if v_asset_farm_id is null or v_asset_farm_id <> new.farm_id then
    raise exception 'Machinery asset does not belong to the specified farm.'
      using errcode = '23514';
  end if;

  new.updated_at := clock_timestamp();
  return new;
end;
$$;

alter function private.guard_machinery_device_link() owner to postgres;
revoke all on function private.guard_machinery_device_link()
  from public, anon, authenticated, service_role;

drop trigger if exists machinery_device_links_farm_guard on public.machinery_device_links;
create trigger machinery_device_links_farm_guard
  before insert or update on public.machinery_device_links
  for each row execute function private.guard_machinery_device_link();

alter table public.machinery_device_links owner to postgres;
alter table public.machinery_device_links enable row level security;
alter table public.machinery_device_links force row level security;
revoke all on table public.machinery_device_links from public, anon, authenticated, service_role;
grant select, insert, update on table public.machinery_device_links to authenticated;

drop policy if exists machinery_device_links_select on public.machinery_device_links;
create policy machinery_device_links_select
  on public.machinery_device_links
  for select
  to authenticated
  using (
    (select private.account_active((select auth.uid())))
    and (
      (select public.can_view_farm(farm_id))
      or (select public.has_permission('crops.manage'))
      or (select public.has_permission('standards.publish'))
    )
  );

drop policy if exists machinery_device_links_manage on public.machinery_device_links;
create policy machinery_device_links_manage
  on public.machinery_device_links
  for insert
  to authenticated
  with check (
    (select private.account_active((select auth.uid())))
    and (
      (select public.can_edit_farm(farm_id))
      or (select public.has_permission('crops.manage'))
    )
  );

drop policy if exists machinery_device_links_update on public.machinery_device_links;
create policy machinery_device_links_update
  on public.machinery_device_links
  for update
  to authenticated
  using (
    (select private.account_active((select auth.uid())))
    and (
      (select public.can_edit_farm(farm_id))
      or (select public.has_permission('crops.manage'))
    )
  )
  with check (
    (select private.account_active((select auth.uid())))
    and (
      (select public.can_edit_farm(farm_id))
      or (select public.has_permission('crops.manage'))
    )
  );

------------------------------------------------------------------------------------------------
-- 2. Provenance, Integrity, Deduplication & Trust Columns on public.machinery_telemetry
------------------------------------------------------------------------------------------------
alter table public.machinery_telemetry
  add column if not exists source_category text not null default 'unverified_provisional' check (
    source_category in (
      'device_authenticated',
      'trusted_provider_integration',
      'farmer_observation',
      'staff_observation',
      'unverified_provisional'
    )
  ),
  add column if not exists source_device_id uuid references public.devices (id) on delete set null,
  add column if not exists source_provider text check (
    source_provider is null or source_provider ~ '^[a-z][a-z0-9_-]{2,63}$'
  ),
  add column if not exists actor_id uuid references public.profiles (id) on delete set null,
  add column if not exists ingested_at timestamptz not null default clock_timestamp(),
  add column if not exists validation_status text not null default 'provisional' check (
    validation_status in ('verified', 'provisional', 'rejected')
  ),
  add column if not exists trust_classification text not null default 'unverified_provisional' check (
    trust_classification in ('verified_current', 'unverified_provisional', 'invalid_rejected')
  ),
  add column if not exists device_event_id text check (
    device_event_id is null or char_length(trim(device_event_id)) between 1 and 128
  ),
  add column if not exists trace_id uuid not null default gen_random_uuid(),
  add column if not exists payload_sha256 text check (
    payload_sha256 is null or payload_sha256 ~ '^[a-f0-9]{64}$'
  );

alter table public.machinery_telemetry
  drop constraint if exists machinery_telemetry_provenance_consistency_check;

alter table public.machinery_telemetry
  add constraint machinery_telemetry_provenance_consistency_check check (
    (source_category <> 'device_authenticated' or source_device_id is not null)
    and (source_category <> 'trusted_provider_integration' or source_provider is not null)
    and (
      trust_classification <> 'verified_current'
      or (
        validation_status = 'verified'
        and source_category in ('device_authenticated', 'trusted_provider_integration')
      )
    )
    and (
      validation_status <> 'rejected'
      or trust_classification = 'invalid_rejected'
    )
  );

-- Replay & duplicate detection indexes for device and provider telemetry events.
create unique index if not exists machinery_telemetry_device_event_uidx
  on public.machinery_telemetry (source_device_id, device_event_id)
  where source_device_id is not null and device_event_id is not null;

create unique index if not exists machinery_telemetry_provider_event_uidx
  on public.machinery_telemetry (source_provider, machinery_id, device_event_id)
  where source_provider is not null and device_event_id is not null;

create index if not exists machinery_telemetry_trust_idx
  on public.machinery_telemetry (farm_id, machinery_id, trust_classification, recorded_at desc);

-- Harden RLS: FORCE ROW LEVEL SECURITY and revoke direct UPDATE/DELETE from authenticated.
alter table public.machinery_telemetry owner to postgres;
alter table public.machinery_telemetry enable row level security;
alter table public.machinery_telemetry force row level security;

drop policy if exists machinery_telemetry_update on public.machinery_telemetry;
drop policy if exists machinery_telemetry_delete on public.machinery_telemetry;
revoke all on table public.machinery_telemetry from public, anon, authenticated, service_role;
grant select, insert on table public.machinery_telemetry to authenticated;

------------------------------------------------------------------------------------------------
-- 3. Database-Enforced Provenance, Validation & Immutability Trigger
------------------------------------------------------------------------------------------------
create or replace function private.guard_machinery_telemetry_provenance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_asset_farm_id   uuid;
  v_trusted_writer  text := coalesce(current_setting('app.telemetry_trusted_writer', true), '');
  v_trust_trans     text := coalesce(current_setting('app.telemetry_trust_transition', true), '');
  v_jwt_sub         text := nullif(current_setting('request.jwt.claim.sub', true), '');
begin
  if tg_op = 'DELETE' then
    if current_user not in ('postgres', 'supabase_admin') then
      raise exception 'Machinery telemetry records are immutable and cannot be deleted.'
        using errcode = '42501';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    -- All provenance and physical sensor reading columns are strictly immutable.
    if new.farm_id is distinct from old.farm_id
       or new.machinery_id is distinct from old.machinery_id
       or new.recorded_at is distinct from old.recorded_at
       or new.ingested_at is distinct from old.ingested_at
       or new.source_category is distinct from old.source_category
       or new.source_device_id is distinct from old.source_device_id
       or new.source_provider is distinct from old.source_provider
       or new.actor_id is distinct from old.actor_id
       or new.device_event_id is distinct from old.device_event_id
       or new.trace_id is distinct from old.trace_id
       or new.payload_sha256 is distinct from old.payload_sha256
       or new.speed_kmh is distinct from old.speed_kmh
       or new.heading_deg is distinct from old.heading_deg
       or new.fuel_pct is distinct from old.fuel_pct
       or new.engine_rpm is distinct from old.engine_rpm
       or new.engine_temp_c is distinct from old.engine_temp_c
       or new.engine_hours is distinct from old.engine_hours
       or new.status is distinct from old.status
    then
      raise exception 'Machinery telemetry provenance and reading fields are immutable.'
        using errcode = '42501';
    end if;

    -- Even trust/validation status transitions MUST go through the audited transition RPC.
    if (new.validation_status is distinct from old.validation_status
        or new.trust_classification is distinct from old.trust_classification)
       and v_trust_trans <> '1'
    then
      raise exception 'Telemetry trust state can only be updated via the audited transition RPC.'
        using errcode = '42501';
    end if;

    return new;
  end if;

  -- INSERT checks:
  -- 1. Bind machinery to its true farm (blocks cross-farm machinery references).
  select farm_id into v_asset_farm_id
    from public.farm_machinery_assets
   where id = new.machinery_id;

  if v_asset_farm_id is null or v_asset_farm_id <> new.farm_id then
    raise exception 'Machinery asset does not belong to the specified farm.'
      using errcode = '23514';
  end if;

  -- 2. Validate observation timestamp (reject impossible future or ancient timestamps).
  if new.recorded_at is null
     or new.recorded_at > clock_timestamp() + interval '5 minutes'
     or new.recorded_at < '2015-01-01T00:00:00Z'::timestamptz
  then
    raise exception 'Invalid telemetry recorded_at timestamp.'
      using errcode = '22023';
  end if;

  -- 3. Validate physical sensor value ranges.
  if (new.speed_kmh is not null and (new.speed_kmh < 0 or new.speed_kmh > 120))
     or (new.heading_deg is not null and (new.heading_deg < 0 or new.heading_deg > 360))
     or (new.fuel_pct is not null and (new.fuel_pct < 0 or new.fuel_pct > 100))
     or (new.engine_rpm is not null and (new.engine_rpm < 0 or new.engine_rpm > 6000))
     or (new.engine_temp_c is not null and (new.engine_temp_c < -40 or new.engine_temp_c > 200))
     or (new.engine_hours is not null and (new.engine_hours < 0 or new.engine_hours > 100000))
  then
    raise exception 'Physically implausible machinery telemetry sensor value.'
      using errcode = '22023';
  end if;

  -- 4. Anti-spoofing boundary: direct inserts outside the trusted ingestion RPCs can NEVER
  --    claim device_authenticated, trusted_provider_integration, verified, or verified_current.
  if v_trusted_writer <> '1' then
    if new.source_category in ('device_authenticated', 'trusted_provider_integration')
       or new.validation_status = 'verified'
       or new.trust_classification = 'verified_current'
       or new.source_device_id is not null
       or new.source_provider is not null
    then
      raise exception 'Direct inserts cannot self-assert trusted device/provider provenance or verified status.'
        using errcode = '42501';
    end if;

    if new.source_category = 'staff_observation'
       and not (public.has_permission('crops.manage') or public.has_permission('standards.publish'))
    then
      raise exception 'Only authorised staff may record staff_observation telemetry.'
        using errcode = '42501';
    end if;

    if v_jwt_sub is not null then
      new.actor_id := v_jwt_sub::uuid;
    end if;

    if new.source_category = 'unverified_provisional' and new.actor_id is not null then
      new.source_category := 'farmer_observation';
    end if;

    new.validation_status := case when new.validation_status = 'rejected' then 'rejected' else 'provisional' end;
    new.trust_classification := case when new.validation_status = 'rejected' then 'invalid_rejected' else 'unverified_provisional' end;
  end if;

  -- 5. Stamp server ingestion timestamp independently and compute canonical payload integrity hash.
  new.ingested_at := clock_timestamp();
  new.trace_id := coalesce(new.trace_id, gen_random_uuid());
  new.payload_sha256 := encode(
    extensions.digest(
      concat_ws(
        '|',
        new.farm_id::text,
        new.machinery_id::text,
        to_char(new.recorded_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        new.source_category,
        coalesce(new.source_device_id::text, ''),
        coalesce(new.source_provider, ''),
        coalesce(new.device_event_id, ''),
        coalesce(new.speed_kmh::text, ''),
        coalesce(new.heading_deg::text, ''),
        coalesce(new.fuel_pct::text, ''),
        coalesce(new.engine_rpm::text, ''),
        coalesce(new.engine_temp_c::text, ''),
        coalesce(new.engine_hours::text, ''),
        new.status
      ),
      'sha256'
    ),
    'hex'
  );

  return new;
end;
$$;

alter function private.guard_machinery_telemetry_provenance() owner to postgres;
revoke all on function private.guard_machinery_telemetry_provenance()
  from public, anon, authenticated, service_role;

drop trigger if exists machinery_telemetry_provenance_guard on public.machinery_telemetry;
create trigger machinery_telemetry_provenance_guard
  before insert or update or delete on public.machinery_telemetry
  for each row execute function private.guard_machinery_telemetry_provenance();

------------------------------------------------------------------------------------------------
-- 4. Narrow Trusted Device Telemetry Ingestion RPC (service_role ONLY)
------------------------------------------------------------------------------------------------
create or replace function private.ingest_authenticated_device_telemetry(
  p_device_id uuid,
  p_device_token text,
  p_farm_id uuid,
  p_machinery_id uuid,
  p_recorded_at timestamptz,
  p_device_event_id text,
  p_speed_kmh numeric default null,
  p_heading_deg numeric default null,
  p_fuel_pct numeric default null,
  p_engine_rpm integer default null,
  p_engine_temp_c numeric default null,
  p_engine_hours numeric default null,
  p_status text default 'working',
  p_trace_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_device        public.devices%rowtype;
  v_token_sha256  text;
  v_row           public.machinery_telemetry%rowtype;
  v_trace_id      uuid := coalesce(p_trace_id, gen_random_uuid());
begin
  if p_device_id is null or p_device_token is null or char_length(trim(p_device_token)) < 16 then
    raise exception 'Device authentication credentials required.' using errcode = '42501';
  end if;

  if p_device_event_id is null or char_length(trim(p_device_event_id)) < 1 then
    raise exception 'device_event_id is required for replay detection.' using errcode = '22023';
  end if;

  -- 1. Authenticate hardware device credentials INSIDE PostgreSQL (never trust bare device_id).
  select * into v_device
    from public.devices
   where id = p_device_id;

  if not found then
    raise exception 'Unknown telemetry device.' using errcode = '42501';
  end if;

  if v_device.revoked_at is not null or v_device.status not in ('active', 'installed') then
    raise exception 'Telemetry device is revoked or inactive.' using errcode = '42501';
  end if;

  if v_device.auth_token_hash is null then
    raise exception 'Telemetry device has no configured authentication credential.' using errcode = '42501';
  end if;

  v_token_sha256 := encode(extensions.digest(p_device_token, 'sha256'), 'hex');
  if lower(trim(v_device.auth_token_hash)) <> v_token_sha256 then
    raise exception 'Device authentication failed.' using errcode = '42501';
  end if;

  -- 2. Verify active hardware link binds this exact device to this exact farm & machinery.
  if not exists (
    select 1
      from public.machinery_device_links l
     where l.device_id = p_device_id
       and l.farm_id = p_farm_id
       and l.machinery_id = p_machinery_id
       and l.is_active = true
  ) then
    raise exception 'Authenticated device is not actively linked to this farm machinery asset.'
      using errcode = '42501';
  end if;

  -- 3. Insert verified device telemetry under trusted writer flag.
  perform set_config('app.telemetry_trusted_writer', '1', true);

  insert into public.machinery_telemetry (
    farm_id, machinery_id, recorded_at,
    speed_kmh, heading_deg, fuel_pct, engine_rpm, engine_temp_c, engine_hours, status,
    source_category, source_device_id, source_provider, actor_id,
    validation_status, trust_classification, device_event_id, trace_id
  )
  values (
    p_farm_id, p_machinery_id, p_recorded_at,
    p_speed_kmh, p_heading_deg, p_fuel_pct, p_engine_rpm, p_engine_temp_c, p_engine_hours, coalesce(p_status, 'working'),
    'device_authenticated', p_device_id, null, null,
    'verified', 'verified_current', trim(p_device_event_id), v_trace_id
  )
  returning * into v_row;

  perform set_config('app.telemetry_trusted_writer', '', true);

  update public.devices
     set last_seen_at = clock_timestamp(),
         updated_at = clock_timestamp()
   where id = p_device_id;

  insert into public.audit_log (actor_id, action, entity, entity_id, metadata)
  values (
    null,
    'machinery_telemetry_device_ingested',
    'machinery_telemetry',
    v_row.id,
    jsonb_build_object(
      'farm_id', v_row.farm_id,
      'machinery_id', v_row.machinery_id,
      'source_category', v_row.source_category,
      'source_device_id', v_row.source_device_id,
      'device_event_id', v_row.device_event_id,
      'validation_status', v_row.validation_status,
      'trust_classification', v_row.trust_classification,
      'trace_id', v_row.trace_id,
      'ingested_at', v_row.ingested_at
    )
  );

  return jsonb_build_object(
    'telemetry_id', v_row.id,
    'farm_id', v_row.farm_id,
    'machinery_id', v_row.machinery_id,
    'source_category', v_row.source_category,
    'validation_status', v_row.validation_status,
    'trust_classification', v_row.trust_classification,
    'trace_id', v_row.trace_id,
    'ingested_at', v_row.ingested_at,
    'payload_sha256', v_row.payload_sha256
  );
end;
$$;

alter function private.ingest_authenticated_device_telemetry(
  uuid, text, uuid, uuid, timestamptz, text, numeric, numeric, numeric, integer, numeric, numeric, text, uuid
) owner to postgres;
revoke all on function private.ingest_authenticated_device_telemetry(
  uuid, text, uuid, uuid, timestamptz, text, numeric, numeric, numeric, integer, numeric, numeric, text, uuid
) from public, anon, authenticated, service_role;

create or replace function public.ingest_authenticated_device_telemetry(
  p_device_id uuid,
  p_device_token text,
  p_farm_id uuid,
  p_machinery_id uuid,
  p_recorded_at timestamptz,
  p_device_event_id text,
  p_speed_kmh numeric default null,
  p_heading_deg numeric default null,
  p_fuel_pct numeric default null,
  p_engine_rpm integer default null,
  p_engine_temp_c numeric default null,
  p_engine_hours numeric default null,
  p_status text default 'working',
  p_trace_id uuid default null
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.ingest_authenticated_device_telemetry(
    p_device_id, p_device_token, p_farm_id, p_machinery_id, p_recorded_at, p_device_event_id,
    p_speed_kmh, p_heading_deg, p_fuel_pct, p_engine_rpm, p_engine_temp_c, p_engine_hours, p_status, p_trace_id
  );
$$;

alter function public.ingest_authenticated_device_telemetry(
  uuid, text, uuid, uuid, timestamptz, text, numeric, numeric, numeric, integer, numeric, numeric, text, uuid
) owner to postgres;
revoke all on function public.ingest_authenticated_device_telemetry(
  uuid, text, uuid, uuid, timestamptz, text, numeric, numeric, numeric, integer, numeric, numeric, text, uuid
) from public, anon, authenticated, service_role;
grant execute on function public.ingest_authenticated_device_telemetry(
  uuid, text, uuid, uuid, timestamptz, text, numeric, numeric, numeric, integer, numeric, numeric, text, uuid
) to service_role;

------------------------------------------------------------------------------------------------
-- 5. Narrow Trusted Provider Telemetry Ingestion RPC (service_role ONLY)
------------------------------------------------------------------------------------------------
create or replace function private.ingest_provider_machinery_telemetry(
  p_source_provider text,
  p_farm_id uuid,
  p_machinery_id uuid,
  p_recorded_at timestamptz,
  p_device_event_id text,
  p_speed_kmh numeric default null,
  p_heading_deg numeric default null,
  p_fuel_pct numeric default null,
  p_engine_rpm integer default null,
  p_engine_temp_c numeric default null,
  p_engine_hours numeric default null,
  p_status text default 'working',
  p_trace_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row      public.machinery_telemetry%rowtype;
  v_provider text := lower(trim(coalesce(p_source_provider, '')));
  v_trace_id uuid := coalesce(p_trace_id, gen_random_uuid());
begin
  if v_provider !~ '^[a-z][a-z0-9_-]{2,63}$' then
    raise exception 'Valid source_provider identifier required.' using errcode = '22023';
  end if;

  if p_device_event_id is null or char_length(trim(p_device_event_id)) < 1 then
    raise exception 'device_event_id is required for provider replay detection.' using errcode = '22023';
  end if;

  perform set_config('app.telemetry_trusted_writer', '1', true);

  insert into public.machinery_telemetry (
    farm_id, machinery_id, recorded_at,
    speed_kmh, heading_deg, fuel_pct, engine_rpm, engine_temp_c, engine_hours, status,
    source_category, source_device_id, source_provider, actor_id,
    validation_status, trust_classification, device_event_id, trace_id
  )
  values (
    p_farm_id, p_machinery_id, p_recorded_at,
    p_speed_kmh, p_heading_deg, p_fuel_pct, p_engine_rpm, p_engine_temp_c, p_engine_hours, coalesce(p_status, 'working'),
    'trusted_provider_integration', null, v_provider, null,
    'verified', 'verified_current', trim(p_device_event_id), v_trace_id
  )
  returning * into v_row;

  perform set_config('app.telemetry_trusted_writer', '', true);

  insert into public.audit_log (actor_id, action, entity, entity_id, metadata)
  values (
    null,
    'machinery_telemetry_provider_ingested',
    'machinery_telemetry',
    v_row.id,
    jsonb_build_object(
      'farm_id', v_row.farm_id,
      'machinery_id', v_row.machinery_id,
      'source_category', v_row.source_category,
      'source_provider', v_row.source_provider,
      'device_event_id', v_row.device_event_id,
      'validation_status', v_row.validation_status,
      'trust_classification', v_row.trust_classification,
      'trace_id', v_row.trace_id,
      'ingested_at', v_row.ingested_at
    )
  );

  return jsonb_build_object(
    'telemetry_id', v_row.id,
    'farm_id', v_row.farm_id,
    'machinery_id', v_row.machinery_id,
    'source_category', v_row.source_category,
    'source_provider', v_row.source_provider,
    'validation_status', v_row.validation_status,
    'trust_classification', v_row.trust_classification,
    'trace_id', v_row.trace_id,
    'ingested_at', v_row.ingested_at,
    'payload_sha256', v_row.payload_sha256
  );
end;
$$;

alter function private.ingest_provider_machinery_telemetry(
  text, uuid, uuid, timestamptz, text, numeric, numeric, numeric, integer, numeric, numeric, text, uuid
) owner to postgres;
revoke all on function private.ingest_provider_machinery_telemetry(
  text, uuid, uuid, timestamptz, text, numeric, numeric, numeric, integer, numeric, numeric, text, uuid
) from public, anon, authenticated, service_role;

create or replace function public.ingest_provider_machinery_telemetry(
  p_source_provider text,
  p_farm_id uuid,
  p_machinery_id uuid,
  p_recorded_at timestamptz,
  p_device_event_id text,
  p_speed_kmh numeric default null,
  p_heading_deg numeric default null,
  p_fuel_pct numeric default null,
  p_engine_rpm integer default null,
  p_engine_temp_c numeric default null,
  p_engine_hours numeric default null,
  p_status text default 'working',
  p_trace_id uuid default null
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.ingest_provider_machinery_telemetry(
    p_source_provider, p_farm_id, p_machinery_id, p_recorded_at, p_device_event_id,
    p_speed_kmh, p_heading_deg, p_fuel_pct, p_engine_rpm, p_engine_temp_c, p_engine_hours, p_status, p_trace_id
  );
$$;

alter function public.ingest_provider_machinery_telemetry(
  text, uuid, uuid, timestamptz, text, numeric, numeric, numeric, integer, numeric, numeric, text, uuid
) owner to postgres;
revoke all on function public.ingest_provider_machinery_telemetry(
  text, uuid, uuid, timestamptz, text, numeric, numeric, numeric, integer, numeric, numeric, text, uuid
) from public, anon, authenticated, service_role;
grant execute on function public.ingest_provider_machinery_telemetry(
  text, uuid, uuid, timestamptz, text, numeric, numeric, numeric, integer, numeric, numeric, text, uuid
) to service_role;

------------------------------------------------------------------------------------------------
-- 6. Authenticated Farmer / Staff Observation RPC (ALWAYS provisional / unverified_provisional)
------------------------------------------------------------------------------------------------
create or replace function public.record_machinery_observation(
  p_farm_id uuid,
  p_machinery_id uuid,
  p_recorded_at timestamptz,
  p_fuel_pct numeric default null,
  p_engine_hours numeric default null,
  p_engine_temp_c numeric default null,
  p_status text default 'idle',
  p_trace_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_is_staff boolean := false;
  v_source   text;
  v_row      public.machinery_telemetry%rowtype;
  v_trace_id uuid := coalesce(p_trace_id, gen_random_uuid());
begin
  if v_uid is null or not private.account_active(v_uid) then
    raise exception 'Active authenticated account required.' using errcode = '42501';
  end if;

  v_is_staff := public.has_permission('crops.manage') or public.has_permission('standards.publish');

  if not v_is_staff and not public.can_edit_farm(p_farm_id) then
    raise exception 'Permission denied for farm machinery observation.' using errcode = '42501';
  end if;

  v_source := case when v_is_staff then 'staff_observation' else 'farmer_observation' end;

  insert into public.machinery_telemetry (
    farm_id, machinery_id, recorded_at,
    fuel_pct, engine_hours, engine_temp_c, status,
    source_category, source_device_id, source_provider, actor_id,
    validation_status, trust_classification, trace_id
  )
  values (
    p_farm_id, p_machinery_id, p_recorded_at,
    p_fuel_pct, p_engine_hours, p_engine_temp_c, coalesce(p_status, 'idle'),
    v_source, null, null, v_uid,
    'provisional', 'unverified_provisional', v_trace_id
  )
  returning * into v_row;

  insert into public.audit_log (actor_id, action, entity, entity_id, metadata)
  values (
    v_uid,
    'machinery_telemetry_observation_recorded',
    'machinery_telemetry',
    v_row.id,
    jsonb_build_object(
      'farm_id', v_row.farm_id,
      'machinery_id', v_row.machinery_id,
      'source_category', v_row.source_category,
      'validation_status', v_row.validation_status,
      'trust_classification', v_row.trust_classification,
      'trace_id', v_row.trace_id
    )
  );

  return jsonb_build_object(
    'telemetry_id', v_row.id,
    'farm_id', v_row.farm_id,
    'machinery_id', v_row.machinery_id,
    'source_category', v_row.source_category,
    'validation_status', v_row.validation_status,
    'trust_classification', v_row.trust_classification,
    'trace_id', v_row.trace_id,
    'ingested_at', v_row.ingested_at
  );
end;
$$;

alter function public.record_machinery_observation(
  uuid, uuid, timestamptz, numeric, numeric, numeric, text, uuid
) owner to postgres;
revoke all on function public.record_machinery_observation(
  uuid, uuid, timestamptz, numeric, numeric, numeric, text, uuid
) from public, anon, authenticated, service_role;
grant execute on function public.record_machinery_observation(
  uuid, uuid, timestamptz, numeric, numeric, numeric, text, uuid
) to authenticated;

------------------------------------------------------------------------------------------------
-- 7. Audited Telemetry Trust-State Transition RPC (Staff-Only Quarantine / Rejection)
------------------------------------------------------------------------------------------------
create or replace function public.transition_machinery_telemetry_trust(
  p_telemetry_id uuid,
  p_new_validation_status text,
  p_new_trust_classification text,
  p_reason text,
  p_trace_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_row      public.machinery_telemetry%rowtype;
  v_trace_id uuid := coalesce(p_trace_id, gen_random_uuid());
begin
  if v_uid is null or not private.account_active(v_uid) then
    raise exception 'Active authenticated staff account required.' using errcode = '42501';
  end if;

  if not (public.has_permission('crops.manage') or public.has_permission('standards.publish')) then
    raise exception 'Permission denied: crops.manage or standards.publish required.' using errcode = '42501';
  end if;

  if p_reason is null or char_length(trim(p_reason)) < 3 then
    raise exception 'Audit reason is required for telemetry trust transition.' using errcode = '22023';
  end if;

  select * into v_row
    from public.machinery_telemetry
   where id = p_telemetry_id
     for update;

  if not found then
    raise exception 'Machinery telemetry record not found.' using errcode = 'P0002';
  end if;

  perform set_config('app.telemetry_trust_transition', '1', true);

  update public.machinery_telemetry
     set validation_status = p_new_validation_status,
         trust_classification = p_new_trust_classification
   where id = p_telemetry_id;

  perform set_config('app.telemetry_trust_transition', '', true);

  insert into public.audit_log (actor_id, action, entity, entity_id, metadata)
  values (
    v_uid,
    'machinery_telemetry_trust_transitioned',
    'machinery_telemetry',
    p_telemetry_id,
    jsonb_build_object(
      'farm_id', v_row.farm_id,
      'machinery_id', v_row.machinery_id,
      'source_category', v_row.source_category,
      'source_device_id', v_row.source_device_id,
      'previous_validation_status', v_row.validation_status,
      'new_validation_status', p_new_validation_status,
      'previous_trust_state', v_row.trust_classification,
      'new_trust_state', p_new_trust_classification,
      'reason', left(trim(p_reason), 240),
      'trace_id', v_trace_id,
      'transitioned_at', clock_timestamp()
    )
  );

  return jsonb_build_object(
    'telemetry_id', p_telemetry_id,
    'previous_trust_state', v_row.trust_classification,
    'new_trust_state', p_new_trust_classification,
    'trace_id', v_trace_id
  );
end;
$$;

alter function public.transition_machinery_telemetry_trust(uuid, text, text, text, uuid) owner to postgres;
revoke all on function public.transition_machinery_telemetry_trust(uuid, text, text, text, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.transition_machinery_telemetry_trust(uuid, text, text, text, uuid)
  to authenticated;
