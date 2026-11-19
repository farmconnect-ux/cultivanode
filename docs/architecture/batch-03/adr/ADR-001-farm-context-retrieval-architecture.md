# ADR-001: Farm Context Retrieval Architecture

**Status:** Proposed (Batch 03.0) | **Date:** 2026-11-19

## Context
Existing AI endpoints (`/api/ai/assistant`, `actions/ai-assistant.ts`) are stateless and inject only static `draft` crop snippets (`packages/shared/src/engines/ai-assistant/grounding.ts`), ignoring all 35 farm, soil, crop, livestock, telemetry, and financial tables.

## Decision
Implement a server-side `LiveFarmContextService` that executes parallel, RLS-scoped queries using the **caller's authenticated Supabase JWT** for a target `farm_id`, reconciles conflicting tables deterministically (`soil_records` > `plots.soil_*`; valid `<6h` `telemetry_rollups` > `irrigation_zones.current_moisture_pct`; active `crop_cycles` > `plots.current_crop`), tags every field with `asOf` freshness, and outputs a token-budgeted `LiveFarmContextSnapshot` split into `current_observations`, `historical_records`, `external_sources`, and `ai_derived`.

## Alternatives & Trade-offs
- **Materialized farm summary table:** Faster single-row read, but risks stale sync bugs and RLS drift across 35 tables.
- **Unrestricted `service_role` aggregator:** Simpler SQL, but violates tenant isolation (rejected).

## Security & Cost Implications
- Zero RLS bypass risk because queries run under `auth.uid()` + `private.can_view_farm(farm_id)`.
- Bounded parallel queries with explicit `LIMIT`s (e.g., last 30d observations, top-10 alerts) keep Postgres CPU and LLM token costs predictable.
