-- CultivaNode 3.0, Batch 03.4: labour and livestock domains in the Live Farm Context (LFC-AC-06).
--
-- The Live Farm Context now cites farm_workers, farm_attendance_records and farm_livestock_groups
-- (the table the livestock screens actually write to) as evidence. `private.write_ai_audit_event`
-- rejects any context reference whose source is not on its allowlist, so this migration re-creates
-- the function from 20261122000000 with exactly those three sources added. Nothing else changes.
create or replace function private.write_ai_audit_event(
  p_profile_id uuid,
  p_farm_id uuid,
  p_trace_id uuid,
  p_provider text,
  p_model_id text,
  p_prompt_version text,
  p_execution_outcome text,
  p_guardrail_result jsonb,
  p_context_refs jsonb,
  p_memory_item_ids uuid[],
  p_prompt_version_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_subject_id uuid;
  v_event_id uuid;
  v_existing public.ai_audit_events%rowtype;
  v_ref jsonb;
  v_source text;
  v_record_id text;
  v_observed_at text;
  v_parsed_ts timestamptz;
  v_seen_refs text[] := '{}'::text[];
  c_allowed_sources constant text[] := array[
    'farms', 'plots', 'crop_cycles', 'crop_cycle_operations',
    'crop_observations', 'crop_alerts', 'crop_harvests', 'soil_records',
    'farm_agronomic_standards', 'agronomic_standard_documents', 'agronomic_standard_chunks',
    'farm_memory_items', 'irrigation_zones', 'irrigation_events',
    'farm_inventory', 'farm_inventory_transactions',
    'farm_financial_transactions', 'farm_machinery_assets',
    'farm_machinery_maintenance', 'farm_machinery_usage_logs',
    'machinery_telemetry', 'farm_operational_tasks', 'farm_livestock',
    'farm_livestock_health_events', 'farm_livestock_production_logs',
    'telemetry_readings', 'telemetry_rollups', 'weather_cache',
    'marketplace_orders', 'marketplace_journal_entries',
    'farm_workers', 'farm_attendance_records', 'farm_livestock_groups'
  ];
begin
  if p_profile_id is null or p_farm_id is null or p_trace_id is null then
    raise exception 'Profile, farm and trace identifiers are required.' using errcode = '22023';
  end if;

  if not private.account_active(p_profile_id) then
    raise exception 'Inactive profiles cannot create AI audit events.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.farms f where f.id = p_farm_id) then
    raise exception 'Farm not found.' using errcode = 'P0002';
  end if;

  if not private.profile_can_view_farm(p_profile_id, p_farm_id) then
    raise exception 'Profile cannot access this farm.' using errcode = '42501';
  end if;

  if p_provider is null or p_provider not in ('claude', 'gemini', 'openai', 'rule-engine')
     or p_model_id is null or char_length(p_model_id) not between 1 and 128
     or p_prompt_version is null or char_length(p_prompt_version) not between 1 and 128
     or p_execution_outcome is null
     or p_execution_outcome not in ('completed', 'blocked', 'failed', 'fallback') then
    raise exception 'Invalid AI audit event attributes.' using errcode = '22023';
  end if;

  if p_prompt_version_id is not null and not exists (
    select 1 from private.ai_prompt_versions v
     where v.id = p_prompt_version_id and v.version = p_prompt_version
  ) then
    raise exception 'Prompt version reference does not match a registered prompt version.' using errcode = '22023';
  end if;

  if p_guardrail_result is null
     or jsonb_typeof(p_guardrail_result) <> 'object'
     or pg_column_size(p_guardrail_result) > 8192
     or p_guardrail_result - array['status', 'rule_ids', 'reason_codes', 'blocked']::text[] <> '{}'::jsonb
     or (p_guardrail_result ? 'status' and jsonb_typeof(p_guardrail_result -> 'status') <> 'string')
     or (p_guardrail_result ? 'rule_ids' and jsonb_typeof(p_guardrail_result -> 'rule_ids') <> 'array')
     or (p_guardrail_result ? 'reason_codes' and jsonb_typeof(p_guardrail_result -> 'reason_codes') <> 'array')
     or (p_guardrail_result ? 'blocked' and jsonb_typeof(p_guardrail_result -> 'blocked') <> 'boolean') then
    raise exception 'Invalid or oversized guardrail result.' using errcode = '22023';
  end if;

  if p_context_refs is null
     or jsonb_typeof(p_context_refs) <> 'array'
     or jsonb_array_length(p_context_refs) > 100
     or pg_column_size(p_context_refs) > 16384 then
    raise exception 'Invalid or oversized context references.' using errcode = '22023';
  end if;

  for v_ref in select value from jsonb_array_elements(p_context_refs)
  loop
    if jsonb_typeof(v_ref) <> 'object'
       or v_ref - array['source', 'record_id', 'observed_at']::text[] <> '{}'::jsonb
       or not (v_ref ? 'source')
       or not (v_ref ? 'record_id')
       or jsonb_typeof(v_ref -> 'source') <> 'string'
       or jsonb_typeof(v_ref -> 'record_id') <> 'string'
       or (v_ref ? 'observed_at' and jsonb_typeof(v_ref -> 'observed_at') <> 'string') then
      raise exception 'Context references must contain only source, record_id and optional observed_at.' using errcode = '22023';
    end if;

    v_source := v_ref ->> 'source';
    v_record_id := v_ref ->> 'record_id';

    if not (v_source = any(c_allowed_sources)) then
      raise exception 'Unsupported context reference source.' using errcode = '22023';
    end if;

    if v_record_id !~ '^[A-Za-z0-9][A-Za-z0-9:_-]{0,63}$' then
      raise exception 'Invalid context reference record_id format.' using errcode = '22023';
    end if;

    if (v_source || '|' || v_record_id) = any(v_seen_refs) then
      raise exception 'Duplicate context references are not permitted.' using errcode = '22023';
    end if;
    v_seen_refs := array_append(v_seen_refs, v_source || '|' || v_record_id);

    if v_ref ? 'observed_at' then
      v_observed_at := v_ref ->> 'observed_at';
      if v_observed_at !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$' then
        raise exception 'Invalid context reference observed_at timestamp.' using errcode = '22023';
      end if;
      begin
        v_parsed_ts := v_observed_at::timestamptz;
      exception
        when invalid_datetime_format or datetime_field_overflow then
          raise exception 'Invalid context reference observed_at timestamp.' using errcode = '22023';
      end;
      if v_parsed_ts is null then
        raise exception 'Invalid context reference observed_at timestamp.' using errcode = '22023';
      end if;
    end if;
  end loop;

  if coalesce(cardinality(p_memory_item_ids), 0) > 100 then
    raise exception 'Too many memory references.' using errcode = '22023';
  end if;

  v_actor_subject_id := private.resolve_or_create_ai_actor(p_profile_id);

  insert into public.ai_audit_events (
    trace_id, farm_id, actor_subject_id, actor_kind, event_kind,
    provider, model_id, prompt_version, prompt_version_id, execution_outcome,
    guardrail_result, context_refs, memory_item_ids
  )
  select
    p_trace_id, p_farm_id, v_actor_subject_id, d.actor_kind, 'ai_execution',
    p_provider, p_model_id, p_prompt_version, p_prompt_version_id, p_execution_outcome,
    p_guardrail_result, p_context_refs, coalesce(p_memory_item_ids, '{}'::uuid[])
  from private.ai_actor_directory d
  where d.actor_subject_id = v_actor_subject_id
  on conflict (trace_id) do nothing
  returning id into v_event_id;

  if v_event_id is not null then
    return v_event_id;
  end if;

  select e.*
    into v_existing
  from public.ai_audit_events e
  where e.trace_id = p_trace_id;

  if not found
     or v_existing.farm_id is distinct from p_farm_id
     or v_existing.actor_subject_id is distinct from v_actor_subject_id
     or v_existing.provider is distinct from p_provider
     or v_existing.model_id is distinct from p_model_id
     or v_existing.prompt_version is distinct from p_prompt_version
     or v_existing.prompt_version_id is distinct from p_prompt_version_id
     or v_existing.execution_outcome is distinct from p_execution_outcome
     or v_existing.guardrail_result is distinct from p_guardrail_result
     or v_existing.context_refs is distinct from p_context_refs
     or v_existing.memory_item_ids is distinct from coalesce(p_memory_item_ids, '{}'::uuid[]) then
    raise exception 'Trace ID is already associated with a different AI audit event.' using errcode = '23505';
  end if;

  return v_existing.id;
end;
$$;

alter function private.write_ai_audit_event(uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[], uuid) owner to postgres;
revoke all on function private.write_ai_audit_event(uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[], uuid)
  from public, anon, authenticated, service_role;
grant execute on function private.write_ai_audit_event(uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[], uuid)
  to service_role;
