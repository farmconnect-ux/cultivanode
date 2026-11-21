-- CultivaNode 3.0, Batch 03.3: constant-time device token check (PR #24 review, Low)
-- Forward-only; earlier Batch 03.3 migrations untouched.
--
-- private.ingest_authenticated_device_telemetry compared the stored SHA-256 of the device token with
-- the presented one using `<>`, which can stop at the first differing byte. The comparison now uses
-- private.constant_time_text_equals, which always inspects every byte. The obsolete
-- set_config('app.telemetry_trusted_writer', ...) calls are dropped: since 20261123030000 trust is
-- decided by the executing role, not by that setting. Signature, owner and grants are unchanged.
--
-- The other two Low findings are handled elsewhere: linked_by is forced to the caller by
-- private.guard_machinery_device_link (20261123020000), and the recency rule for verified telemetry
-- lives in packages/shared/src/engines/farm-context/provenance.ts.

create or replace function private.constant_time_text_equals(p_a text, p_b text)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  v_a bytea := convert_to(p_a, 'UTF8');
  v_b bytea := convert_to(p_b, 'UTF8');
  v_len integer := least(length(v_a), length(v_b));
  v_diff integer := length(v_a) # length(v_b);
  i integer;
begin
  for i in 0 .. v_len - 1 loop
    v_diff := v_diff | (get_byte(v_a, i) # get_byte(v_b, i));
  end loop;
  return v_diff = 0;
end;
$$;

alter function private.constant_time_text_equals(text, text) owner to postgres;
revoke all on function private.constant_time_text_equals(text, text) from public, anon, authenticated, service_role;

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
  -- Batch 03.3 (PR #24 review, Low): constant-time comparison of the stored and presented hashes.
  if not coalesce(private.constant_time_text_equals(lower(trim(v_device.auth_token_hash)), v_token_sha256), false) then
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

  -- 3. Insert verified device telemetry (trusted: this function runs as its owner).
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
