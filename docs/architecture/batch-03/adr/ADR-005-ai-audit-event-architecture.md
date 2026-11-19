# ADR-005: AI Audit Event Architecture

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
Mutating `ai_audit_events.actor_id = NULL` on account deletion conflicts with strict append-only immutability (`private.forbid_change()`), and accepting an application-supplied `actor_id` creates an impersonation risk.

## Decision
1. **Separate Identity Resolution from Immutable Audit Evidence:**
   - `public.ai_actor_directory` (mutable): maps `actor_subject_id uuid PK` ↔ `profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL`, `deleted_at timestamptz`.
   - `public.ai_audit_events` (strictly append-only via `private.forbid_change()`): stores `actor_subject_id` (opaque non-PII), `actor_kind` (`'human' | 'system'`), `trace_id`, `parent_event_id`, `farm_id`, `provider`, `model_id`, `prompt_version`, `context_record_refs`, `memory_ids_used`, `guardrail_result`, `human_outcome`, `execution_status`, `error_code`, `created_at`.
2. **Caller-Bound Audit Writer Contract:**
   - `REVOKE ALL FROM PUBLIC, anon`; `GRANT EXECUTE TO authenticated, service_role`.
   - For `authenticated`: derives identity strictly from `auth.uid()`, verifies `private.account_active(auth.uid())` and `private.can_view_farm(farm_id)`, rejects `actor_kind = 'system'`, and rejects client-supplied actor overrides.
   - For `service_role`: permitted only for `actor_kind = 'system'` scheduled/background jobs with `system_job_name`.
   - Audit write failures are critically logged and fail closed for actionable/state-changing flows.

## Alternatives & Trade-offs
- **Updating `ai_audit_events` during deletion:** Breaks append-only tamper resistance (rejected).
