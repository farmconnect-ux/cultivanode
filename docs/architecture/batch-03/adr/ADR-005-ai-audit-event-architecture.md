# ADR-005: AI Audit Event Architecture

**Status:** Proposed — Revised (Batch 03.0 Final Review) | **Date:** 2026-11-19

## Context
1. Granting `EXECUTE` on a general AI audit writer to `authenticated` allows clients to fabricate arbitrary AI model executions or guardrail results via PostgREST RPC even if `actor_id` is JWT-bound.
2. In Supabase, `service_role` bypasses RLS (`BYPASSRLS`), so `private.ai_actor_directory` requires a restricted schema + dedicated database-function interface rather than relying solely on "narrow `service_role` intent".
3. Internal `pg_cron` scheduled jobs do not execute with a normal HTTP JWT (`auth.role()`/`auth.uid()` may be NULL), and `current_user` inside `SECURITY DEFINER` is the function owner (`postgres`), not proof of the caller.

## Decision

### 1. Two-Pathway AI Audit Ingestion Boundary
- **General AI Audit Writer (`private` / `service_role`-only):** `REVOKE ALL FROM PUBLIC, anon, authenticated`. Invoked **only** by:
  - **Pathway A (Trusted Server-Side AI Orchestration):** Server routes/actions authenticate the caller via `supabase.auth.getUser()`, validate `account_active` and `can_view_farm`/`can_edit_farm`, validate payload against an allowlist/Zod schema, and record verified actor identity, actual provider, resolved `model_id`, `prompt_version`, `trace_id`, execution result, and guardrail outcome.
  - **Pathway B (Human Feedback):** Routed through the trusted server API (or, if an RPC is needed, a separate feedback-only function accepting **only** `human_outcome in ('accepted','rejected','modified')` for an existing `trace_id` under `can_view_farm`, never `provider`/`model_id`/`guardrail_result`/`actor_kind='system'`).
- **System-Event Pathway (`pg_cron` Scheduled Jobs):** Registered in `cron.job` and `private.ai_scheduled_jobs(job_name, system_principal, allowed_event_kinds, is_enabled)`. Executed by `pg_cron` calling a dedicated non-API `private.*` wrapper that verifies `current_setting('request.jwt.claim.role', true)` is NULL/empty (proving it is NOT a PostgREST HTTP call), verifies the job against `cron.job` + `private.ai_scheduled_jobs` allowlist, enforces idempotency `(job_name, run_window)` against duplicate retries, and writes `actor_kind = 'system'` without trusting client-supplied `system_job_name`.

### 2. Enforceable `private.ai_actor_directory` Privilege Boundaries
- **Schema & Ownership:** Table `private.ai_actor_directory` is owned by `postgres`, resides in the `private` schema (not exposed by PostgREST), has RLS enabled, and revokes all table grants from `PUBLIC`, `anon`, and `authenticated`.
- **Supabase `service_role` Limitation & Mitigation:** Because `service_role` has `BYPASSRLS` in Supabase, general application code must never query `private.ai_actor_directory` directly. Instead, all operations go through **3 separated `SECURITY DEFINER` interface functions** (`owner: postgres`, `SET search_path = ''`, fully qualified refs, `REVOKE ALL FROM PUBLIC, anon, authenticated`, `GRANT EXECUTE TO service_role` only):
  1. `private.resolve_or_create_ai_actor(p_profile_id uuid)`: creates/resolves active mapping (`deleted_at IS NULL`); rejects deleted mappings.
  2. `private.anonymise_ai_actor(p_profile_id uuid)`: callable only by `execute_account_deletion`; idempotently sets `profile_id = NULL, deleted_at = COALESCE(deleted_at, now())`; cannot create or reactivate mappings.
  3. `private.lookup_ai_actor_subject(p_actor_subject_id uuid)`: single-row lookup for authorised internal compliance workflows; no bulk enumeration.
- **`public.ai_audit_events`:** Remains strictly append-only (`private.forbid_change()`), storing `actor_subject_id` (opaque non-PII) and never mutated during account deletion.
