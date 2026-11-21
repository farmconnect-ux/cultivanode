-- CultivaNode 3.0, Batch 03.2I: memory consent withdrawal and source provenance (PR #23 review findings 1 and 2)
--
-- Forward-only. Migrations 20261122000000 to 20261122040000 are untouched.
--
-- Finding 1 (consent withdrawal): `transition_farm_memory_item` required current `ai_intelligence` consent for
--   every action, so a farmer who withdrew consent could no longer delete, withdraw or reject what was stored
--   about them. Consent is now required only for `confirm` and `supersede`; `reject`, `withdraw`, `expire` and
--   `delete` need an active account plus the existing scope/farm edit checks.
--
-- Finding 2 (client-asserted provenance): any farm editor could call `create_farm_memory_item` directly with
--   `source_kind = 'farm_record'` or `'deterministic_derived'`, confirm it immediately, and attach source_refs
--   pointing at records of other farms (or at nothing). A BEFORE INSERT/UPDATE trigger on farm_memory_items now
--   applies to every end-user request (auth.uid() is set), whichever RPC performs the write:
--   - only `farmer_explicit` or `ai_inferred` may be written; the two derived kinds are reserved for a future
--     trusted server-side derivation path (no end-user JWT) and are rejected with 42501;
--   - every source reference (create and supersede) must have the shape {source, record_id, observed_at?},
--     must exist, and must belong to the memory's farm (farm scope) or to a farm the caller can view (profile
--     scope). Published agronomic standards and the caller's own marketplace orders are accepted as references.
--     Weather cache, journal entries and raw telemetry are not accepted as memory anchors.

------------------------------------------------------------------------------------------------
-- 1. Source reference resolver and validator
------------------------------------------------------------------------------------------------
create or replace function private.memory_source_ref_permitted(
  p_profile_id uuid,
  p_memory_scope text,
  p_farm_id uuid,
  p_source text,
  p_record_id text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ref_farm_id uuid := null;
begin
  if p_profile_id is null or p_source is null or p_record_id is null
     or p_record_id !~ '^[A-Za-z0-9][A-Za-z0-9:_-]{0,63}$' then
    return false;
  end if;

  -- Global references that are not owned by a farm.
  if p_source = 'farm_agronomic_standards' then
    return exists (
      select 1 from public.farm_agronomic_standards s
       where s.id::text = p_record_id and s.status = 'published' and s.is_active = true
    );
  elsif p_source = 'agronomic_standard_documents' then
    return exists (
      select 1
        from public.agronomic_standard_documents d
        join public.farm_agronomic_standards s on s.id = d.standard_id
       where d.id::text = p_record_id
         and d.ingestion_status = 'indexed'
         and s.status = 'published' and s.is_active = true
    );
  elsif p_source = 'agronomic_standard_chunks' then
    return exists (
      select 1
        from public.agronomic_standard_chunks c
        join public.agronomic_standard_documents d on d.id = c.document_id
        join public.farm_agronomic_standards s on s.id = c.standard_id
       where c.id::text = p_record_id
         and d.ingestion_status = 'indexed'
         and s.status = 'published' and s.is_active = true
    );
  elsif p_source = 'marketplace_orders' then
    return exists (
      select 1 from public.marketplace_orders o
       where o.id::text = p_record_id and o.buyer_id = p_profile_id
    );
  end if;

  -- Farm-owned references: resolve the owning farm.
  case p_source
    when 'farms' then
      select f.id into v_ref_farm_id from public.farms f where f.id::text = p_record_id;
    when 'plots' then
      select t.farm_id into v_ref_farm_id from public.plots t where t.id::text = p_record_id;
    when 'crop_cycles' then
      select t.farm_id into v_ref_farm_id from public.crop_cycles t where t.id::text = p_record_id;
    when 'crop_alerts' then
      select t.farm_id into v_ref_farm_id from public.crop_alerts t where t.id::text = p_record_id;
    when 'crop_cycle_operations' then
      select cc.farm_id into v_ref_farm_id
        from public.crop_cycle_operations t
        join public.crop_cycles cc on cc.id = t.crop_cycle_id
       where t.id::text = p_record_id;
    when 'crop_observations' then
      select cc.farm_id into v_ref_farm_id
        from public.crop_observations t
        join public.crop_cycles cc on cc.id = t.crop_cycle_id
       where t.id::text = p_record_id;
    when 'crop_harvests' then
      select cc.farm_id into v_ref_farm_id
        from public.crop_harvests t
        join public.crop_cycles cc on cc.id = t.crop_cycle_id
       where t.id::text = p_record_id;
    when 'soil_records' then
      select p.farm_id into v_ref_farm_id
        from public.soil_records t
        join public.plots p on p.id = t.plot_id
       where t.id::text = p_record_id;
    when 'farm_inventory' then
      select t.farm_id into v_ref_farm_id from public.farm_inventory t where t.id::text = p_record_id;
    when 'farm_inventory_transactions' then
      select t.farm_id into v_ref_farm_id from public.farm_inventory_transactions t where t.id::text = p_record_id;
    when 'farm_financial_transactions' then
      select t.farm_id into v_ref_farm_id from public.farm_financial_transactions t where t.id::text = p_record_id;
    when 'farm_machinery_assets' then
      select t.farm_id into v_ref_farm_id from public.farm_machinery_assets t where t.id::text = p_record_id;
    when 'farm_machinery_maintenance' then
      select t.farm_id into v_ref_farm_id from public.farm_machinery_maintenance t where t.id::text = p_record_id;
    when 'farm_machinery_usage_logs' then
      select t.farm_id into v_ref_farm_id from public.farm_machinery_usage_logs t where t.id::text = p_record_id;
    when 'machinery_telemetry' then
      select t.farm_id into v_ref_farm_id from public.machinery_telemetry t where t.id::text = p_record_id;
    when 'farm_operational_tasks' then
      select t.farm_id into v_ref_farm_id from public.farm_operational_tasks t where t.id::text = p_record_id;
    when 'farm_livestock' then
      select t.farm_id into v_ref_farm_id from public.farm_livestock t where t.id::text = p_record_id;
    when 'farm_livestock_health_events' then
      select t.farm_id into v_ref_farm_id from public.farm_livestock_health_events t where t.id::text = p_record_id;
    when 'farm_livestock_production_logs' then
      select t.farm_id into v_ref_farm_id from public.farm_livestock_production_logs t where t.id::text = p_record_id;
    when 'irrigation_zones' then
      select t.farm_id into v_ref_farm_id from public.irrigation_zones t where t.id::text = p_record_id;
    when 'irrigation_events' then
      select t.farm_id into v_ref_farm_id from public.irrigation_events t where t.id::text = p_record_id;
    when 'farm_memory_items' then
      select t.farm_id into v_ref_farm_id
        from public.farm_memory_items t
       where t.id::text = p_record_id
         and t.memory_scope = 'farm'
         and t.deleted_at is null
         and t.lifecycle_status <> 'deleted';
    else
      -- weather_cache, marketplace_journal_entries, telemetry_readings, telemetry_rollups and anything
      -- unknown cannot anchor a persistent memory.
      return false;
  end case;

  if v_ref_farm_id is null then
    return false;
  end if;

  if p_memory_scope = 'farm' then
    return p_farm_id is not null and v_ref_farm_id = p_farm_id;
  elsif p_memory_scope = 'profile' then
    return private.profile_can_view_farm(p_profile_id, v_ref_farm_id);
  end if;

  return false;
end;
$$;

alter function private.memory_source_ref_permitted(uuid, text, uuid, text, text) owner to postgres;
revoke all on function private.memory_source_ref_permitted(uuid, text, uuid, text, text)
  from public, anon, authenticated, service_role;

create or replace function private.assert_memory_source_refs_permitted(
  p_profile_id uuid,
  p_memory_scope text,
  p_farm_id uuid,
  p_source_refs jsonb
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ref jsonb;
  v_source text;
  v_record_id text;
  v_seen text[] := '{}'::text[];
begin
  if p_source_refs is null then
    return;
  end if;

  if jsonb_typeof(p_source_refs) <> 'array' or jsonb_array_length(p_source_refs) > 50 then
    raise exception 'source_refs must be an array of at most 50 references.' using errcode = '22023';
  end if;

  for v_ref in select value from jsonb_array_elements(p_source_refs)
  loop
    if jsonb_typeof(v_ref) <> 'object'
       or v_ref - array['source', 'record_id', 'observed_at']::text[] <> '{}'::jsonb
       or not (v_ref ? 'source')
       or not (v_ref ? 'record_id')
       or jsonb_typeof(v_ref -> 'source') <> 'string'
       or jsonb_typeof(v_ref -> 'record_id') <> 'string'
       or (v_ref ? 'observed_at' and jsonb_typeof(v_ref -> 'observed_at') <> 'string') then
      raise exception 'Each source reference must contain only source, record_id and optional observed_at.'
        using errcode = '22023';
    end if;

    v_source := v_ref ->> 'source';
    v_record_id := v_ref ->> 'record_id';

    if (v_source || '|' || v_record_id) = any(v_seen) then
      raise exception 'Duplicate source references are not permitted.' using errcode = '22023';
    end if;
    v_seen := array_append(v_seen, v_source || '|' || v_record_id);

    if not private.memory_source_ref_permitted(p_profile_id, p_memory_scope, p_farm_id, v_source, v_record_id) then
      raise exception 'Source reference % does not exist or does not belong to this memory''s scope.',
        v_source || ':' || v_record_id
        using errcode = '42501';
    end if;
  end loop;
end;
$$;

alter function private.assert_memory_source_refs_permitted(uuid, text, uuid, jsonb) owner to postgres;
revoke all on function private.assert_memory_source_refs_permitted(uuid, text, uuid, jsonb)
  from public, anon, authenticated, service_role;

------------------------------------------------------------------------------------------------
-- 2. Provenance guard trigger on farm_memory_items (covers create and supersede)
------------------------------------------------------------------------------------------------
create or replace function private.guard_farm_memory_client_provenance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  -- Only end-user requests are restricted. Requests without an end-user JWT (service_role, migrations,
  -- execute_account_deletion) are trusted server paths.
  if v_uid is null then
    return new;
  end if;

  if tg_op = 'INSERT' or new.source_kind is distinct from old.source_kind then
    if new.source_kind in ('farm_record', 'deterministic_derived') then
      raise exception 'source_kind % is reserved for trusted server-side derivation.', new.source_kind
        using errcode = '42501';
    end if;
  end if;

  if tg_op = 'INSERT' or new.source_refs is distinct from old.source_refs then
    perform private.assert_memory_source_refs_permitted(v_uid, new.memory_scope, new.farm_id, new.source_refs);
  end if;

  return new;
end;
$$;

alter function private.guard_farm_memory_client_provenance() owner to postgres;
revoke all on function private.guard_farm_memory_client_provenance()
  from public, anon, authenticated, service_role;

drop trigger if exists farm_memory_items_client_provenance_guard on public.farm_memory_items;
create trigger farm_memory_items_client_provenance_guard
  before insert or update of source_kind, source_refs on public.farm_memory_items
  for each row execute function private.guard_farm_memory_client_provenance();

------------------------------------------------------------------------------------------------
-- 3. transition_farm_memory_item: consent only for confirm / supersede
------------------------------------------------------------------------------------------------
create or replace function public.transition_farm_memory_item(
  p_memory_id uuid,
  p_action text,
  p_new_title text default null,
  p_new_structured_content jsonb default null,
  p_new_source_refs jsonb default null,
  p_new_embedding extensions.vector(1536) default null,
  p_new_embedding_model text default null,
  p_new_embedding_version text default null,
  p_trace_id uuid default null
)
returns public.farm_memory_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_current public.farm_memory_items%rowtype;
  v_result public.farm_memory_items%rowtype;
  v_trace_id uuid := coalesce(p_trace_id, gen_random_uuid());
  v_audit_refs jsonb;
begin
  if v_uid is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not private.account_active(v_uid) then
    raise exception 'Active account required.' using errcode = '42501';
  end if;

  -- Batch 03.2I (review finding 1): consent is required only to confirm or write memory content.
  -- reject / withdraw / expire / delete stay available after AI consent is withdrawn (NDPA 2023 right to
  -- withdraw consent and to erasure); they still require an active account and the scope/farm edit checks.
  if p_action in ('confirm', 'supersede') and not private.has_ai_intelligence_consent(v_uid) then
    raise exception 'AI intelligence consent is required.' using errcode = '42501';
  end if;

  select * into v_current
    from public.farm_memory_items
   where id = p_memory_id
     for update;

  if not found then
    raise exception 'Memory item not found.' using errcode = 'P0002';
  end if;

  if (v_current.memory_scope = 'farm' and not private.can_edit_farm(v_current.farm_id))
     or (v_current.memory_scope = 'profile' and v_current.profile_id <> v_uid) then
    raise exception 'Permission denied for this memory item.' using errcode = '42501';
  end if;

  if v_current.lifecycle_status in ('deleted', 'superseded') then
    raise exception 'Terminal memory items cannot be transitioned.' using errcode = '22023';
  end if;

  if p_action = 'confirm' then
    if v_current.sync_state = 'awaiting_sync' then
      raise exception 'Offline awaiting_sync memory cannot be confirmed before server synchronisation.' using errcode = '22023';
    end if;
    if v_current.lifecycle_status not in ('proposed', 'awaiting_confirmation') then
      raise exception 'Only proposed or awaiting_confirmation memories can be confirmed.' using errcode = '22023';
    end if;

    update public.farm_memory_items
       set lifecycle_status = 'confirmed',
           verification_status = 'confirmed',
           confirmed_by = v_uid,
           confirmed_at = clock_timestamp(),
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = p_memory_id
    returning * into v_result;

  elsif p_action = 'reject' then
    update public.farm_memory_items
       set lifecycle_status = 'rejected',
           verification_status = 'rejected',
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = p_memory_id
    returning * into v_result;

  elsif p_action = 'withdraw' then
    update public.farm_memory_items
       set lifecycle_status = 'withdrawn',
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = p_memory_id
    returning * into v_result;

  elsif p_action = 'expire' then
    update public.farm_memory_items
       set lifecycle_status = 'expired',
           expires_at = coalesce(expires_at, clock_timestamp()),
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = p_memory_id
    returning * into v_result;

  elsif p_action = 'delete' then
    update public.farm_memory_items
       set lifecycle_status = 'deleted',
           deleted_at = clock_timestamp(),
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = p_memory_id
    returning * into v_result;

  elsif p_action = 'supersede' then
    if p_new_structured_content is null then
      raise exception 'Replacement structured_content is required to supersede a memory.' using errcode = '22023';
    end if;

    insert into public.farm_memory_items (
      memory_scope, farm_id, profile_id, category, memory_type, title,
      structured_content, source_kind, source_refs, lifecycle_status,
      verification_status, confidence, sync_state, supersedes_id,
      consent_verified_at, created_by, confirmed_by, confirmed_at, updated_by,
      expires_at, embedding, embedding_model, embedding_version
    )
    values (
      v_current.memory_scope, v_current.farm_id, v_current.profile_id, v_current.category, v_current.memory_type,
      coalesce(nullif(trim(p_new_title), ''), v_current.title), p_new_structured_content, 'farmer_explicit',
      coalesce(p_new_source_refs, v_current.source_refs), 'confirmed', 'confirmed', 1.000, 'synced', v_current.id,
      clock_timestamp(), v_uid, v_uid, clock_timestamp(), v_uid,
      v_current.expires_at, p_new_embedding, p_new_embedding_model, p_new_embedding_version
    )
    returning * into v_result;

    update public.farm_memory_items
       set lifecycle_status = 'superseded',
           superseded_by_id = v_result.id,
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = v_current.id;
  else
    raise exception 'Unsupported memory transition action: %', p_action using errcode = '22023';
  end if;

  -- Atomic audit write in the SAME transaction: any audit error rolls back the memory transition.
  if v_result.memory_scope = 'farm' then
    v_audit_refs := jsonb_build_array(
      jsonb_build_object(
        'source', 'farm_memory_items',
        'record_id', v_result.id::text,
        'observed_at', to_char(v_result.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      )
    );
    perform private.write_ai_audit_event(
      v_uid,
      v_result.farm_id,
      v_trace_id,
      'rule-engine',
      'memory-transition-' || p_action,
      'memory-governance-v1',
      'completed',
      '{"status":"not_applicable","rule_ids":[],"reason_codes":[],"blocked":false}'::jsonb,
      v_audit_refs,
      array[v_result.id],
      null
    );
  else
    perform private.write_profile_memory_audit_event(
      v_uid,
      v_trace_id,
      v_result.id,
      p_action,
      v_result.lifecycle_status,
      jsonb_build_object('previous_memory_id', v_current.id)
    );
  end if;

  return v_result;
end;
$$;

alter function public.transition_farm_memory_item(
  uuid, text, text, jsonb, jsonb, extensions.vector, text, text, uuid
) owner to postgres;
revoke all on function public.transition_farm_memory_item(
  uuid, text, text, jsonb, jsonb, extensions.vector, text, text, uuid
) from public, anon, authenticated, service_role;
grant execute on function public.transition_farm_memory_item(
  uuid, text, text, jsonb, jsonb, extensions.vector, text, text, uuid
) to authenticated;
