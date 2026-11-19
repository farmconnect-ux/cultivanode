# ADR-005: AI Audit Event Architecture

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
Mutating `ai_audit_events.actor_id = NULL` on account deletion conflicts with strict append-only immutability (`private.forbid_change()`). Additionally, inside a `SECURITY DEFINER` audit writer, `current_user` is the function owner (`postgres`), not the original requester, and an unprotected identity directory could become an enumeration pathway.

## Decision
1. **Separate Protected Identity Resolution from Immutable Audit Evidence:**
   - **`private.ai_actor_directory`** (resides in restricted `private` schema, excluded from PostgREST; RLS enabled; `REVOKE ALL FROM PUBLIC, anon, authenticated`; narrow `service_role` scope): stores `actor_subject_id uuid PK`, `actor_kind` (`'human' | 'system'`), `profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL`, `system_principal text UNIQUE`, `created_at`, `deleted_at`. Deleted mappings (`deleted_at IS NOT NULL`) cannot be reactivated.
   - **`public.ai_audit_events`** (strictly append-only via `private.forbid_change()`): stores `actor_subject_id` (opaque non-PII), `actor_kind`, `trace_id`, `parent_event_id`, `farm_id`, `provider`, `model_id`, `prompt_version`, `context_record_refs`, `memory_ids_used`, `guardrail_result`, `human_outcome`, `execution_status`, `error_code`, `created_at`.
2. **Trusted Caller Validation Inside `SECURITY DEFINER` Audit Writer:**
   - Never relies on `current_user`.
   - **Human events (`actor_kind = 'human'`):** Validates `auth.role() = 'authenticated'` and non-null `auth.uid()` from verified JWT claims; verifies `private.account_active(auth.uid())`; validates `private.can_view_farm(farm_id)` (and `can_edit_farm` for edit/confirmation events). Rejects client-supplied `actor_id`/`profile_id` and rejects `actor_kind = 'system'`.
   - **System events (`actor_kind = 'system'`):** Permitted **only** when `auth.role() = 'service_role'` (or internal `postgres` job) with an allowlisted `system_job_name` / `system_principal`.
   - **Boundaries:** `SET search_path = ''`, explicit schema qualification, `REVOKE ALL FROM PUBLIC, anon`, `GRANT EXECUTE TO authenticated, service_role`, `INSERT`-only, and fail-loud error handling for security-critical writes.

## Alternatives & Trade-offs
- **Storing `ai_actor_directory` in `public` or trusting `current_user`:** Exposes enumeration risk or breaks caller attribution under `SECURITY DEFINER` (rejected).
