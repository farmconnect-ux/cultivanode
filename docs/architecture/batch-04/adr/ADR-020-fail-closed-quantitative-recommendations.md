# ADR-020: Fail-Closed Quantitative Recommendations

**Status:** Proposed (Batch 04.0) — recommended as a safety patch before 04.1 (D-P6) | **Date:** 2026-11-22

## Context
`calculateFertiliserRecommendation` uses default coefficients for unknown crops (`fertiliser.ts:22`); only the HTTP
schema restricts crops (`fertiliser-schema.ts:23`). The AI rule-engine fallback returns fixed NPK and urea rates for
any crop (`llm-adapter.ts:84,98-99,405-406`); the server action defaults `cropId` to maize
(`apps/web/src/actions/ai-assistant.ts:29`). Soil potassium is stored in cmol/kg but the engine takes ppm.

## Decision
- Engines return a result union and never default a coefficient: `crop_not_supported`, `coefficients_unapproved`,
  `soil_unit_unknown`, `soil_not_lab_confirmed`.
- Coefficients live in an approved, versioned store linked to a published standard and cited passages.
- `EngineClient` local mode and the HTTP route share one schema.
- The rule-engine fallback never emits numbers unless quoting an approved engine result with its citation.
- One audited AI entry point; no default crop.
- Typed units with a single conversion (K: 1 cmol(+)/kg = 391 mg/kg); oxide or elemental basis declared per
  coefficient.
- `forbid_published_standard_mutation` freezes every agronomic field after publication.

Detail and tests: `02_FERTILISER_SAFETY_FINDING.md`.
