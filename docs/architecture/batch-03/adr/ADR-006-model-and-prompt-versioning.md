# ADR-006: Model and Prompt Versioning

**Status:** Proposed (Batch 03.0) | **Date:** 2026-11-19

## Context
`ai-config.ts` selects models via env vars (`claude-sonnet-5-5`, `gemini-flash-latest`, `gpt-4o-mini`) with automatic fallback to `rule-engine`, while `prompt-builder.ts` and `ai-vision.ts` embed unversioned prompt strings.

## Decision
Assign explicit semantic `prompt_version` identifiers (e.g. `fie-chat-v1.0.0`, `fie-vision-v1.0.0`) to every system prompt template, log the exact `provider`, resolved `model_id`, and `prompt_version` on every `ai_audit_events` row, and tag `crop_observations.ai_model` with `<provider>:<model_id>@<prompt_version>`.

## Alternatives & Trade-offs
- **Unversioned env-only strings:** Impossible to attribute regressions or reproduce historical recommendations after a model alias (`gemini-flash-latest`) rotates.

## Security & Cost Implications
- Zero extra infra cost; enables instant rollback of prompt regressions and reproducible safety audits.
