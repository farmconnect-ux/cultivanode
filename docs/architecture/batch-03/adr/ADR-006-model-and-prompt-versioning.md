# ADR-006: Model and Prompt Versioning

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
`ai-config.ts` selects models via env vars (`claude-sonnet-5-5`, `gemini-flash-latest`, `gpt-4o-mini`) with automatic fallback to `rule-engine`, while `prompt-builder.ts` and `ai-vision.ts` embed unversioned prompt strings. Version identifiers alone do not provide rollback without immutable prompt artefacts and a controlled version-selection mechanism.

## Decision
Implement a controlled prompt-version lifecycle:
1. **Immutable Prompt Artefacts:** Store each prompt version (`prompt_version`, e.g. `fie-chat-v1.0.0`, `fie-vision-v1.0.0`) as an immutable artefact (versioned content + SHA-256 content hash, protected against mutation once approved).
2. **Controlled Active-Version Selection:** Maintain an explicit active-version pointer (`active_prompt_version` per `interaction_kind`) that can only point to a validated, approved immutable prompt version.
3. **Pre-Activation Validation & Rollback:** New prompt versions must pass automated safety/guardrail validation before activation. Rollback switches the active pointer back to a previously approved immutable version without altering historical versions.
4. **Audit & Reproducibility:** Record every prompt-version activation and rollback in `public.admin_actions` / `audit_log`, and preserve the exact `provider`, resolved `model_id`, and `prompt_version` on every `public.ai_audit_events` row (`crop_observations.ai_model` tagged `<provider>:<model_id>@<prompt_version>`).

## Alternatives & Trade-offs
- **Unversioned env-only strings or raw git-commit tags without an active pointer:** Cannot switch or audit active prompt versions independently of full app redeploys (rejected).

## Security & Cost Implications
- Eliminates silent prompt drift when upstream model aliases rotate and provides an auditable, tested rollback path.
