-- CultivaNode 3.0, Batch 03.3: telemetry trust boundary and scheduler failure visibility
-- PR #24 review, Medium 3 and Medium 4. Forward-only; earlier Batch 03.3 migrations untouched.
--
-- Medium 3 (settable trust flag): private.guard_machinery_telemetry_provenance() decided whether a
--   write was "trusted" from the session settings app.telemetry_trusted_writer /
--   app.telemetry_trust_transition. Any session able to run SQL can set those. The trigger was also
--   SECURITY DEFINER, so its current_user was always postgres and its DELETE check never fired.
--   Now the trigger runs as the CALLER (SECURITY INVOKER) and trusts an insert or trust change only
--   when it executes as the owner of the reviewed SECURITY DEFINER writers (postgres / supabase_admin)
--   AND the session's role is an app role (authenticated / service_role / anon), i.e. inside a
--   postgres-owned definer RPC called through the API. App roles cannot become postgres, so direct
--   writes from them are always constrained whatever settings they set; plain owner sessions (SQL
--   editor, migrations) are not treated as trusted writers either. The old set_config(...) calls in
--   the ingest RPCs become harmless no-ops.
--   The trigger only uses objects app roles may already use (farm_machinery_assets under RLS,
--   public.has_permission, extensions.digest).
--
-- Medium 4 (failures looked successful): run_scheduled_task records a failure and returns
--   ok:false, so cron.job_run_details said "succeeded". Each cron job now runs
--     select private.run_scheduled_task('<task>'); commit; select private.assert_scheduled_task_succeeded('<task>');
--   pg_cron (libpq, cron.use_background_workers = off on Hosted) sends this as one simple query; the
--   COMMIT makes the failure row durable, then the assertion raises, so the job run is marked failed
--   with the trace id while the ledger keeps the details. Note: if pg_cron is ever switched to
--   background-worker mode this multi-statement form must be re-verified on Staging.

------------------------------------------------------------------------------------------------
-- 1. Telemetry provenance trigger: caller-privilege trust boundary
------------------------------------------------------------------------------------------------
create or replace function private.guard_machinery_telemetry_provenance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_asset_farm_id    uuid;
  -- Running as the table/RPC owner (only possible for app roles via a postgres-owned definer RPC).
  v_owner_context    boolean := current_user in ('postgres', 'supabase_admin');
  -- Trusted writer: owner privileges reached from an API session role, i.e. inside a reviewed
  -- SECURITY DEFINER RPC. SECURITY DEFINER changes current_user but not the session 'role' setting.
  v_trusted_context  boolean := current_user in ('postgres', 'supabase_admin')
                                and coalesce(current_setting('role', true), 'none')
                                    in ('authenticated', 'service_role', 'anon');
  v_jwt_sub          text := nullif(current_setting('request.jwt.claim.sub', true), '');
begin
  if tg_op = 'DELETE' then
    -- App roles hold no DELETE grant; owner-level maintenance (and FK cascades) may still delete.
    if not v_owner_context then
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

    -- Trust/validation changes only inside the audited transition RPC (a postgres-owned definer).
    if (new.validation_status is distinct from old.validation_status
        or new.trust_classification is distinct from old.trust_classification)
       and not v_trusted_context
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

  -- 4. Anti-spoofing boundary: writes outside the reviewed definer RPCs can NEVER claim
  --    device_authenticated, trusted_provider_integration, verified, or verified_current.
  if not v_trusted_context then
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
-- Trigger functions are invoked by the trigger mechanism, not by EXECUTE grants; keep them closed.
revoke all on function private.guard_machinery_telemetry_provenance()
  from public, anon, authenticated, service_role;

------------------------------------------------------------------------------------------------
-- 2. Scheduler: make task failures visible to pg_cron
------------------------------------------------------------------------------------------------
create or replace function private.assert_scheduled_task_succeeded(p_task_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run private.scheduled_task_runs%rowtype;
begin
  if nullif(current_setting('request.jwt.claim.sub', true), '') is not null
     or session_user not in ('cultivanode_scheduler', 'postgres', 'supabase_admin') then
    raise exception 'Unauthorized scheduler execution identity.' using errcode = '42501';
  end if;

  if p_task_name is null
     or not exists (select 1 from private.scheduled_task_registry r where r.task_name = p_task_name) then
    raise exception 'Unknown scheduled task.' using errcode = '22023';
  end if;

  -- The run this cron session just committed (runs of one task cannot overlap: advisory lock).
  select * into v_run
    from private.scheduled_task_runs
   where task_name = p_task_name
     and started_at > clock_timestamp() - interval '30 minutes'
   order by started_at desc
   limit 1;

  if found and v_run.status = 'failed' then
    raise exception 'Scheduled task % failed (trace %, %): %',
      p_task_name, v_run.trace_id, coalesce(v_run.error_code, 'unknown'), coalesce(v_run.error_message, '')
      using errcode = 'P0001';
  end if;
end;
$$;

alter function private.assert_scheduled_task_succeeded(text) owner to postgres;
revoke all on function private.assert_scheduled_task_succeeded(text) from public, anon, authenticated, service_role;
grant execute on function private.assert_scheduled_task_succeeded(text) to cultivanode_scheduler;

-- Re-point the three registered jobs (same names, schedules and username) to run, commit, assert.
do $$
declare
  v_task record;
  v_job_id bigint;
begin
  if not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    return;
  end if;

  for v_task in
    select task_name, cron_job_name
      from private.scheduled_task_registry
     where is_enabled = true
     order by task_name
  loop
    execute format('select jobid from cron.job where jobname = %L order by jobid desc limit 1', v_task.cron_job_name)
      into v_job_id;

    if v_job_id is not null then
      execute format(
        'select cron.alter_job(job_id := %s, command := %L)',
        v_job_id,
        format(
          'select private.run_scheduled_task(%L); commit; select private.assert_scheduled_task_succeeded(%L);',
          v_task.task_name,
          v_task.task_name
        )
      );
    end if;
  end loop;
end $$;
