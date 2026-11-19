# ADR-001: Farm Context Retrieval Architecture

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
Existing AI endpoints (`/api/ai/assistant`, `actions/ai-assistant.ts`) are stateless and inject only static `draft` crop snippets (`packages/shared/src/engines/ai-assistant/grounding.ts`), ignoring all 35 farm, soil, crop, livestock, telemetry, and financial tables.

## Decision
Implement a server-side `LiveFarmContextService` that executes parallel, RLS-scoped queries using the **caller's authenticated Supabase JWT** for a target `farm_id` (fetching `memory_scope = 'farm'` for `farm_id` plus `memory_scope = 'profile'` for `auth.uid()`), applies **8-domain provenance and conflict-resolution rules** (`ADR-007`), classifies every field into one of **7 context states** (`verified_current`, `unverified_provisional`, `stale`, `missing`, `conflicting`, `awaiting_sync`, `invalid_rejected`), never treats missing values as zero, and surfaces credible conflicts for human clarification.

## Alternatives & Trade-offs
- **Single global source ranking:** Simpler, but fails domain realities (e.g., allowing a soil moisture sensor to override lab NPK/pH) (rejected).
- **Materialized farm summary table:** Faster single-row read, but risks stale sync bugs and RLS drift across 35 tables.
- **Unrestricted `service_role` aggregator:** Violates tenant isolation (rejected).

## Security & Cost Implications
- Zero RLS bypass risk because queries run under `auth.uid()` + `private.can_view_farm(farm_id)` (and `profile_id = auth.uid()` for profile preferences).
- Bounded parallel queries with explicit `LIMIT`s keep Postgres CPU and LLM token costs predictable.
