# ADR-005: AI Audit Event Architecture

**Status:** Proposed (Batch 03.0) | **Date:** 2026-11-19

## Context
Currently `/api/ai/assistant` only emits ephemeral `console` JSON logs (`ai_assistant_ok`/`fallback`), and `audit_log` tracks general entity mutations rather than AI provenance, context refs, guardrail checks, or human acceptance.

## Decision
Introduce a dedicated append-only `public.ai_audit_events` table linked by `trace_id` (and `parent_event_id`), protected by `private.forbid_change()` (`BEFORE UPDATE OR DELETE`), written via a narrow `SECURITY DEFINER` writer (`SET search_path = ''`), and storing `actor_id`, `farm_id`, `provider`, `model_id`, `prompt_version`, `context_record_refs`, `memory_ids_used`, `guardrail_result`, `confidence`, and `human_outcome`.

## Alternatives & Trade-offs
- **Overloading `public.audit_log`:** Mixes high-volume AI trace telemetry with financial/admin compliance rows and lacks structured columns for `model_id`/`prompt_version`/`memory_ids_used`.

## Security & Cost Implications
- Never logs API keys, JWTs, raw `imageBase64`, or unredacted phone/bank PII.
- Append-only guarantees non-repudiation; 12–24 month partitioning/archival can manage Postgres storage growth.
