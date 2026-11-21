-- Batch 03.1C: narrow service_role-only public RPC wrapper for private.write_ai_audit_event.
-- PostgREST exposes only ["public", "graphql_public"] (private schema remains unexposed).
-- This wrapper follows the exact pattern of public.get_active_ai_prompt(text) (M5) and
-- public.execute_account_deletion(uuid, text) (Batch 02.5): postgres-owned SECURITY DEFINER,
-- empty search_path, strict delegation to private.write_ai_audit_event(...), and EXECUTE
-- granted exclusively to service_role (PUBLIC, anon, and authenticated explicitly revoked).

create or replace function public.write_ai_audit_event(
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
begin
  return private.write_ai_audit_event(
    p_profile_id,
    p_farm_id,
    p_trace_id,
    p_provider,
    p_model_id,
    p_prompt_version,
    p_execution_outcome,
    p_guardrail_result,
    p_context_refs,
    p_memory_item_ids,
    p_prompt_version_id
  );
end;
$$;

alter function public.write_ai_audit_event(
  uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[], uuid
) owner to postgres;

revoke all on function public.write_ai_audit_event(
  uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[], uuid
) from public, anon, authenticated, service_role;

grant execute on function public.write_ai_audit_event(
  uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[], uuid
) to service_role;
