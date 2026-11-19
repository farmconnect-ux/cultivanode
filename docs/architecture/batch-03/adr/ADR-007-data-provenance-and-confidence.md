# ADR-007: Data Provenance and Confidence

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
A single global source-ranking rule cannot handle domain differences (e.g., a fresh soil-moisture sensor is fresher than a manual irrigation setting, but a sensor must never override verified lab soil NPK/pH).

## Decision
Adopt an **8-domain provenance and conflict-resolution matrix** (`BATCH_03_0_TARGET_ARCHITECTURE.md` §2) paired with **7 explicit context states** (`verified_current`, `unverified_provisional`, `stale`, `missing`, `conflicting`, `awaiting_sync`, `invalid_rejected`):
- Missing data is NEVER treated as zero.
- AI inferences (`source_kind = 'ai_inferred'`) NEVER overwrite verified records.
- When two credible sources disagree, FIE marks the field `conflicting`, explains both sources, and requests farmer/agronomist clarification.
- Tropical soil-test staleness thresholds (`365d`) are marked `[Requires Agronomy Validation]`.

## Alternatives & Trade-offs
- **Universal precedence hierarchy:** Causes unsafe overrides across soil chemistry vs. telemetry domains (rejected).

## Security & Cost Implications
- Prevents sensor-poisoning and hallucination feedback loops while keeping conflict explanation transparent to farmers.
