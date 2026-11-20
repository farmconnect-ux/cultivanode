-- Batch 03.1B M3: append-only AI audit register and constrained human feedback.
-- The trusted server client must authenticate the caller and verify farm visibility
-- under the caller's JWT before invoking the service_role-only writer. PostgreSQL
-- cannot distinguish apps/web modules sharing the same service_role credential.

create table public.ai_audit_events (
  id uuid primary key default gen_random_uuid(),
  trace_id uuid not null unique,
  farm_id uuid not null references public.farms (id) on delete restrict,
  actor_subject_id uuid not null references private.ai_actor_directory (actor_subject_id) on delete restrict,
  actor_kind text not null check (actor_kind in ('user', 'system')),
  event_kind text not null default 'ai_execution' check (event_kind = 'ai_execution'),
  provider text not null check (provider in ('claude', 'gemini', 'openai', 'rule-engine')),
  model_id text not null check (char_length(model_id) between 1 and 128),
  prompt_version text not null check (char_length(prompt_version) between 1 and 128),
  execution_outcome text not null check (execution_outcome in ('completed', 'blocked', 'failed', 'fallback')),
  guardrail_result jsonb not null default '{}'::jsonb,
  context_refs jsonb not null default '[]'::jsonb,
  memory_item_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default clock_timestamp(),
  constraint ai_audit_events_guardrail_shape_check check (
    jsonb_typeof(guardrail_result) = 'object'
    and pg_column_size(guardrail_result) <= 8192
    and guardrail_result - array['status', 'rule_ids', 'reason_codes', 'blocked']::text[] = '{}'::jsonb
    and (not (guardrail_result ? 'status') or jsonb_typeof(guardrail_result -> 'status') = 'string')
    and (not (guardrail_result ? 'rule_ids') or jsonb_typeof(guardrail_result -> 'rule_ids') = 'array')
    and (not (guardrail_result ? 'reason_codes') or jsonb_typeof(guardrail_result -> 'reason_codes') = 'array')
    and (not (guardrail_result ? 'blocked') or jsonb_typeof(guardrail_result -> 'blocked') = 'boolean')
  ),
  constraint ai_audit_events_context_refs_shape_check check (
    jsonb_typeof(context_refs) = 'array'
    and jsonb_array_length(context_refs) <= 100
    and pg_column_size(context_refs) <= 16384
  ),
  constraint ai_audit_events_memory_count_check check (
    cardinality(memory_item_ids) <= 100
  )
);

create index ai_audit_events_farm_created_idx
  on public.ai_audit_events (farm_id, created_at desc);

create index ai_audit_events_actor_created_idx
  on public.ai_audit_events (actor_subject_id, created_at desc);

alter table public.ai_audit_events enable row level security;
alter table public.ai_audit_events owner to postgres;
revoke all on table public.ai_audit_events from public, anon, authenticated, service_role;
grant select on table public.ai_audit_events to authenticated;

create policy ai_audit_events_select_visible_farm
  on public.ai_audit_events
  for select
  to authenticated
  using (
    (select private.account_active((select auth.uid())))
    and (select private.can_view_farm(farm_id))
  );

create trigger ai_audit_events_forbid_update
  before update on public.ai_audit_events
  for each row execute function private.forbid_change();

create trigger ai_audit_events_forbid_delete
  before delete on public.ai_audit_events
  for each row execute function private.forbid_change();

create table public.ai_audit_feedback (
  id uuid primary key default gen_random_uuid(),
  trace_id uuid not null references public.ai_audit_events (trace_id) on delete restrict,
  actor_subject_id uuid not null references private.ai_actor_directory (actor_subject_id) on delete restrict,
  outcome text not null check (outcome in ('accepted', 'rejected', 'modified')),
  note text,
  created_at timestamptz not null default clock_timestamp(),
  constraint ai_audit_feedback_note_length_check check (
    note is null or char_length(note) <= 1000
  ),
  constraint ai_audit_feedback_one_per_actor_trace unique (trace_id, actor_subject_id)
);

alter table public.ai_audit_feedback enable row level security;
alter table public.ai_audit_feedback owner to postgres;
revoke all on table public.ai_audit_feedback from public, anon, authenticated, service_role;

create trigger ai_audit_feedback_forbid_update
  before update on public.ai_audit_feedback
  for each row execute function private.forbid_change();

create trigger ai_audit_feedback_forbid_delete
  before delete on public.ai_audit_feedback
  for each row execute function private.forbid_change();

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
  p_memory_item_ids uuid[]
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

  if p_provider not in ('claude', 'gemini', 'openai', 'rule-engine')
     or p_model_id is null or char_length(p_model_id) not between 1 and 128
     or p_prompt_version is null or char_length(p_prompt_version) not between 1 and 128
     or p_execution_outcome not in ('completed', 'blocked', 'failed', 'fallback') then
    raise exception 'Invalid AI audit event attributes.' using errcode = '22023';
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
       or jsonb_typeof(v_ref -> 'source') <> 'string'
       or char_length(v_ref ->> 'source') not between 1 and 64
       or jsonb_typeof(v_ref -> 'record_id') <> 'string'
       or char_length(v_ref ->> 'record_id') not between 1 and 128
       or (v_ref ? 'observed_at' and jsonb_typeof(v_ref -> 'observed_at') <> 'string') then
      raise exception 'Context references must contain only source, record_id and optional observed_at.' using errcode = '22023';
    end if;
  end loop;

  if coalesce(cardinality(p_memory_item_ids), 0) > 100 then
    raise exception 'Too many memory references.' using errcode = '22023';
  end if;

  -- Identity and farm membership are verified by the central server audit client
  -- under the caller's JWT before this service_role-only RPC is invoked.
  v_actor_subject_id := private.resolve_or_create_ai_actor(p_profile_id);

  insert into public.ai_audit_events (
    trace_id, farm_id, actor_subject_id, actor_kind, event_kind,
    provider, model_id, prompt_version, execution_outcome,
    guardrail_result, context_refs, memory_item_ids
  )
  select
    p_trace_id, p_farm_id, v_actor_subject_id, d.actor_kind, 'ai_execution',
    p_provider, p_model_id, p_prompt_version, p_execution_outcome,
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
     or v_existing.execution_outcome is distinct from p_execution_outcome
     or v_existing.guardrail_result is distinct from p_guardrail_result
     or v_existing.context_refs is distinct from p_context_refs
     or v_existing.memory_item_ids is distinct from coalesce(p_memory_item_ids, '{}'::uuid[]) then
    raise exception 'Trace ID is already associated with a different AI audit event.' using errcode = '23505';
  end if;

  return v_existing.id;
end;
$$;

alter function private.write_ai_audit_event(uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[]) owner to postgres;
revoke all on function private.write_ai_audit_event(uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[])
  from public, anon, authenticated, service_role;
grant execute on function private.write_ai_audit_event(uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[])
  to service_role;

create or replace function public.record_ai_feedback(
  p_trace_id uuid,
  p_outcome text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_farm_id uuid;
  v_actor_subject_id uuid;
  v_feedback_id uuid;
  v_note text := nullif(trim(p_note), '');
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  if not private.account_active(auth.uid()) then
    raise exception 'Active account required.' using errcode = '42501';
  end if;

  if p_trace_id is null or p_outcome not in ('accepted', 'rejected', 'modified')
     or (v_note is not null and char_length(v_note) > 1000) then
    raise exception 'Invalid AI feedback.' using errcode = '22023';
  end if;

  select e.farm_id
    into v_farm_id
  from public.ai_audit_events e
  where e.trace_id = p_trace_id
    and e.actor_kind = 'user';

  if not found then
    raise exception 'AI audit event not found.' using errcode = 'P0002';
  end if;

  if not private.can_view_farm(v_farm_id) then
    raise exception 'Farm access denied.' using errcode = '42501';
  end if;

  v_actor_subject_id := private.resolve_or_create_ai_actor(auth.uid());

  insert into public.ai_audit_feedback (trace_id, actor_subject_id, outcome, note)
  values (p_trace_id, v_actor_subject_id, p_outcome, v_note)
  returning id into v_feedback_id;

  return v_feedback_id;
end;
$$;

alter function public.record_ai_feedback(uuid, text, text) owner to postgres;
revoke all on function public.record_ai_feedback(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.record_ai_feedback(uuid, text, text)
  to authenticated;
