# ADR-020: Fail-Closed Quantitative Recommendations

**Status:** Proposed — revision 3; **mandatory prerequisite before Batch 04.1 (phase 04.0-H, D-P6 confirmed)** | **Date:** 2026-11-22

## Context

`calculateFertiliserRecommendation` uses default coefficients for unknown crops (`fertiliser.ts:22`); only the HTTP
schema restricts crops (`fertiliser-schema.ts:23`). The AI rule-engine fallback returns fixed NPK and urea rates for
any crop (`llm-adapter.ts:84,98-99,405-406`); the server action defaults `cropId` to maize
(`apps/web/src/actions/ai-assistant.ts:29`). Soil potassium is stored in cmol/kg but the engine takes ppm. The full
seven-path trace is in `02_FERTILISER_SAFETY_FINDING.md`.

## Decision

Phase 04.0-H must block:

1. rates for unsupported crops (`crop_not_supported`);
2. unapproved or default coefficients (`coefficients_unapproved`);
3. requests with no resolved crop (`crop_not_identified`);
4. unverified soil inputs (`soil_not_lab_confirmed`, `soil_method_missing`, `soil_depth_missing`, `soil_test_expired`,
   `soil_unit_unknown`, `soil_basis_unknown`);
5. any numerical recommendation not traceable to an approved engine result or a cited passage.

Implementation rules:

- Engines return a result union and never default a coefficient.
- Coefficients live in an approved, versioned store linked to a published standard, cited passages and the soil-test
  calibration they assume.
- `EngineClient` local mode and the HTTP route share one schema.
- The rule-engine fallback never emits numbers unless quoting an approved engine result with its citation.
- One audited AI entry point; no default crop.
- Typed units with one conversion (K: 1 cmol(+)/kg = 391 mg/kg); oxide or elemental basis declared per coefficient.
- `forbid_published_standard_mutation` freezes every agronomic field after publication.

### Soil inputs: necessary versus sufficient

A lab-confirmed soil test is necessary for a single numeric rate but not sufficient. The engine also requires the
extraction method, sampling depth, test date, units, nutrient basis, approved crop-specific coefficients, agronomic
calibration and applicable cited evidence (ADR-018). Modelled soil values stay distinct and never produce a single
number.

Detail and tests: `02_FERTILISER_SAFETY_FINDING.md`. Not implemented in PR #25.
