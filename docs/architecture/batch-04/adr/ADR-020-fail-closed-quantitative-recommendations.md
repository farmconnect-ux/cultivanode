# ADR-020: Fail-Closed Quantitative Recommendations

**Status:** Proposed — revision 4; **mandatory prerequisite before Batch 04.1 (phase 04.0-H, D-P6 confirmed)** | **Date:** 2026-11-22 | **See also:** ADR-016, ADR-018

## Context

`calculateFertiliserRecommendation` uses default coefficients for unknown crops (`fertiliser.ts:22`); only the HTTP
schema restricts crops (`fertiliser-schema.ts:23`). The AI rule-engine fallback returns fixed NPK and urea rates for
any crop (`llm-adapter.ts:84,98-99,405-406`); the server action defaults `cropId` to maize
(`apps/web/src/actions/ai-assistant.ts:29`). Soil potassium is stored in cmol/kg but the engine takes ppm. The full
seven-path trace is in `02_FERTILISER_SAFETY_FINDING.md`.

## Decision

### Numerical fertiliser prescription authority

A cited passage **cannot** independently authorise a farm-specific numerical fertiliser prescription. A numerical
fertiliser prescription requires **all nine** applicable conditions to pass:

1. The crop and production context are identified and supported.
2. An approved, versioned crop-specific agronomic protocol or coefficient set exists.
3. The coefficient or protocol has a documented source, approval record, applicability scope, and version.
4. Soil inputs have suitable provenance, units, sampling depth, extraction method, and date where required by the
   recommendation.
5. The soil-test method is calibrated to the relevant nutrient interpretation and crop protocol.
6. Geographic, climatic, crop-stage, and production-system applicability have been assessed.
7. Relevant legal and safety constraints have been applied.
8. The deterministic calculation engine validates its inputs, units, outputs, and applicable limits.
9. The answer cites the supporting evidence and identifies important assumptions and missing information.

A cited passage may support a calculation or provide general agricultural information, but it cannot bypass approval,
calibration, provenance, or applicability requirements. A numerical value quoted from a source may be displayed as
general published source information only where its licence permits, its context is disclosed, and it cannot be
mistaken for a recommendation for the user's farm (ADR-016).

### Required fail-closed behaviour (Phase 04.0-H)

When any mandatory condition is absent, inconsistent, expired, or unverified, Phase 04.0-H must fail closed:

1. Block rates for unsupported crops (`crop_not_supported`); never substitute maize or another crop's coefficients.
2. Block unapproved or default coefficients (`coefficients_unapproved`).
3. Block requests with no resolved crop (`crop_not_identified`).
4. Block unverified or incomplete soil inputs (`soil_not_lab_confirmed`, `soil_method_missing`, `soil_depth_missing`,
   `soil_test_expired`, `soil_unit_unknown`, `soil_basis_unknown`); never convert an uncertain or incompatible unit
   silently.
5. Block any farm-specific numerical prescription not produced by the validated deterministic engine under an approved
   crop protocol — never infer a rate from a loosely related document or let a cited passage bypass engine/approval
   gates.
6. Explain clearly which information or approval is missing, and offer appropriate non-numerical guidance (e.g.
   recommending a laboratory soil test or qualified agronomic assessment).

### Implementation rules

- Engines return a result union and never default a coefficient.
- Coefficients live in an approved, versioned store linked to a published standard, cited passages, and the soil-test
  calibration they assume.
- `EngineClient` local mode and the HTTP route share one schema.
- The rule-engine fallback never emits numbers unless quoting an approved deterministic engine result with its citation.
- One audited AI entry point; no default crop.
- Typed units with one conversion (K: 1 cmol(+)/kg = 391 mg/kg); oxide or elemental basis declared per coefficient.
- `forbid_published_standard_mutation` freezes every agronomic field after publication.

### Soil inputs: necessary versus sufficient

A lab-confirmed soil test is necessary for a farm-specific numeric rate but not sufficient. The engine also requires
the extraction method, sampling depth, test date, units, nutrient basis, approved crop-specific coefficients, agronomic
calibration, and applicable cited evidence (ADR-018). Modelled soil values stay distinct and never produce a
farm-specific numeric prescription.

Detail and tests: `02_FERTILISER_SAFETY_FINDING.md`. **Not implemented in PR #25.**
