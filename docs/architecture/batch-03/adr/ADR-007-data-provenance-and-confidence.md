# ADR-007: Data Provenance and Confidence

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
A single global source-ranking rule cannot handle domain differences (e.g., a fresh soil-moisture sensor is fresher than a manual irrigation setting, but a sensor must never override verified lab soil NPK/pH). Additionally, soil-test staleness and machinery telemetry sources require exact, unambiguous definitions.

## Decision
Adopt an **8-domain provenance and conflict-resolution matrix** (`BATCH_03_0_TARGET_ARCHITECTURE.md` §2) paired with **7 explicit context states** (`verified_current`, `unverified_provisional`, `stale`, `missing`, `conflicting`, `awaiting_sync`, `invalid_rejected`):
- Missing data is NEVER treated as zero.
- AI inferences (`source_kind = 'ai_inferred'`) NEVER overwrite verified records.
- When two credible sources disagree, FIE marks the field `conflicting`, explains both sources, and requests farmer/agronomist clarification.
- **Soil-Test Staleness Calculation:** Compute `soil_test_age_days = current_date - tested_on` and classify as `stale` when `soil_test_age_days > approved_validity_days` (`365` provisional, `[Requires Agronomy Validation]`, configurable per domain/crop). Future-dated tests (`tested_on > current_date`) are `invalid_rejected`; missing `tested_on` (`NULL`) is `missing`. Stale tests remain historically useful but are never represented as `verified_current`.
- **Machinery Telemetry Source:** Uses existing `public.machinery_telemetry` (`20261011100000:62-77`, linked via `machinery_id` and `farm_id`) for machinery assets, distinct from `public.telemetry_readings` (`quality_flag = 'valid'`, for plot IoT devices). Because `machinery_telemetry` currently lacks a `quality_flag` and same-farm `machinery_id` trigger, non-monotonic/implausible `engine_hours` or disagreements with `farm_machinery_usage_logs` are surfaced as `conflicting` or `unverified_provisional`.

## Alternatives & Trade-offs
- **Universal precedence hierarchy:** Causes unsafe overrides across soil chemistry vs. telemetry domains (rejected).
