-- CultivaNode 3.0, Batch 03.3 (Workstream B): device credential and device-link hardening
-- PR #24 review, High 2.
--
-- Problem: `authenticated` held table-level UPDATE on public.devices, including `auth_token_hash`
-- and `secret_key_hash`, and the existing devices UPDATE policy lets admins and field agents
-- (unassigned devices or devices assigned to themselves) change rows. Any farm editor could also
-- link ANY device to their own machinery. Together that let an app user set a token they know on a
-- device, link it, and submit `device_authenticated` / `verified_current` telemetry.
--
-- This migration:
-- 1. Removes UPDATE/INSERT of `auth_token_hash` and `secret_key_hash` (and TRUNCATE, REFERENCES,
--    TRIGGER) from `anon` and `authenticated` on public.devices. All other columns keep their
--    previous column-level UPDATE/INSERT grant, so existing installer flows are unchanged.
-- 2. Adds `public.issue_device_auth_token(uuid)`: the only app-reachable way to set a device
--    credential. Staff (public.is_admin()) only, or service_role. Generates a 256-bit random token,
--    stores only its SHA-256, returns the raw token once, and writes a platform audit entry
--    (never the token or its hash).
-- 3. Replaces `private.guard_machinery_device_link()` so an end user can only link a device that
--    is assigned to the farm's owner or the farm's organisation (staff excepted), cannot link a
--    revoked device, and cannot forge `linked_by`.

------------------------------------------------------------------------------------------------
-- 1. Column-level privileges on public.devices
------------------------------------------------------------------------------------------------
do $$
declare
  v_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into v_cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'devices'
     and column_name not in ('auth_token_hash', 'secret_key_hash');

  revoke insert, update, truncate, references, trigger on table public.devices from anon, authenticated;

  -- Re-grant everything except the credential columns. RLS policies still decide which rows.
  execute format('grant insert (%s) on table public.devices to authenticated', v_cols);
  execute format('grant update (%s) on table public.devices to authenticated', v_cols);
end $$;

------------------------------------------------------------------------------------------------
-- 2. Staff-only device credential issuance
------------------------------------------------------------------------------------------------
create or replace function public.issue_device_auth_token(p_device_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text := coalesce(auth.role(), '');
  v_device public.devices%rowtype;
  v_token text;
begin
  -- Staff in the app, or the trusted server (service_role, no end-user JWT).
  if v_uid is not null then
    if not private.account_active(v_uid) or not public.is_admin() then
      raise exception 'Only staff can issue device credentials.' using errcode = '42501';
    end if;
  elsif v_role <> 'service_role' and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'Only staff or the trusted server can issue device credentials.' using errcode = '42501';
  end if;

  select * into v_device
    from public.devices
   where id = p_device_id
     for update;

  if not found then
    raise exception 'Device not found.' using errcode = 'P0002';
  end if;

  if v_device.revoked_at is not null then
    raise exception 'Cannot issue a credential for a revoked device.' using errcode = '22023';
  end if;

  -- 256-bit random token, hex encoded (64 chars). Only its SHA-256 is stored.
  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  update public.devices
     set auth_token_hash = encode(extensions.digest(v_token, 'sha256'), 'hex'),
         updated_at = clock_timestamp()
   where id = p_device_id;

  insert into public.audit_log (actor_id, action, entity, entity_id, new_values)
  values (
    v_uid,
    case when v_device.auth_token_hash is null then 'device_credential_issued' else 'device_credential_rotated' end,
    'device',
    p_device_id,
    jsonb_build_object('serial_number', v_device.serial_number, 'issued_via', case when v_uid is null then 'server' else 'staff' end)
  );

  return v_token;
end;
$$;

alter function public.issue_device_auth_token(uuid) owner to postgres;
revoke all on function public.issue_device_auth_token(uuid) from public, anon, authenticated, service_role;
grant execute on function public.issue_device_auth_token(uuid) to authenticated, service_role;

------------------------------------------------------------------------------------------------
-- 3. Device link guard: device must belong to the farm's owner or organisation
------------------------------------------------------------------------------------------------
create or replace function private.guard_machinery_device_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_asset_farm_id uuid;
  v_farm public.farms%rowtype;
  v_device public.devices%rowtype;
begin
  select farm_id into v_asset_farm_id
    from public.farm_machinery_assets
   where id = new.machinery_id;

  if v_asset_farm_id is null or v_asset_farm_id <> new.farm_id then
    raise exception 'Machinery asset does not belong to the specified farm.'
      using errcode = '23514';
  end if;

  -- Trusted server paths (service_role, migrations, tests seeding as owner) have no end-user JWT.
  if v_uid is not null then
    if tg_op = 'INSERT' then
      new.linked_by := v_uid;
    elsif new.linked_by is distinct from old.linked_by then
      raise exception 'linked_by cannot be changed.' using errcode = '42501';
    end if;

    if tg_op = 'INSERT'
       or new.device_id is distinct from old.device_id
       or new.farm_id is distinct from old.farm_id
       or (new.is_active and not old.is_active)
    then
      select * into v_device from public.devices where id = new.device_id;
      if not found then
        raise exception 'Device not found.' using errcode = 'P0002';
      end if;
      if v_device.revoked_at is not null then
        raise exception 'A revoked device cannot be linked.' using errcode = '22023';
      end if;

      if not public.is_admin() then
        select * into v_farm from public.farms where id = new.farm_id;
        if not (
          (v_device.assigned_owner_id is not null and v_device.assigned_owner_id = v_farm.owner_id)
          or (
            v_device.assigned_org_id is not null
            and v_farm.organization_id is not null
            and v_device.assigned_org_id = v_farm.organization_id
          )
        ) then
          raise exception 'Device is not assigned to this farm''s owner or organisation.'
            using errcode = '42501';
        end if;
      end if;
    end if;
  end if;

  new.updated_at := clock_timestamp();
  return new;
end;
$$;

alter function private.guard_machinery_device_link() owner to postgres;
revoke all on function private.guard_machinery_device_link()
  from public, anon, authenticated, service_role;
