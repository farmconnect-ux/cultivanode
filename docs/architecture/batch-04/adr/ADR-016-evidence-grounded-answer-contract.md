# ADR-016: Evidence-Grounded Answer Contract

**Status:** Proposed — revision 4 (Batch 04.0) | **Date:** 2026-11-22 | **Extends:** ADR-007 | **See also:** ADR-020

## Context
The evidence package separates tiers and discloses degraded grounding, but answers are free text. The only output
check is banned pesticide names (`chemical-guardrail.ts`). An LLM may state any rate (path P6 in
`02_FERTILISER_SAFETY_FINDING.md`).

## Decision
Structured claims (`kind`, `citations`, `applicability`, `confidence`, `conflicts`, `missing`) are validated
server-side before display:

1. **Citation validity:** every citation ID must exist in the evidence package; otherwise the claim is dropped and the
   answer is marked degraded.
2. **Numerical fertiliser prescription authority (aligned with ADR-020):** a cited passage **must not** independently
   authorise a farm-specific numerical fertiliser prescription. A numerical fertiliser prescription may be emitted
   **only** when it comes from the deterministic calculation engine AND all nine mandatory conditions in ADR-020
   pass (identified supported crop, approved versioned crop-specific protocol/coefficients, documented
   source/approval/scope/version, suitable soil provenance/units/depth/method/date, calibrated soil-test method,
   assessed geographic/climatic/crop-stage/production-system applicability, applied legal and safety constraints,
   validated deterministic engine inputs/units/outputs/limits, and disclosed citations/assumptions/missing facts).
3. **General published source information vs. farm-specific prescription:** a cited passage may support a calculation
   or provide general agricultural information. A numerical value quoted from a published source may be displayed as
   general source information **only** when:
   - the source's licence explicitly permits quotation/display (`may_quote = true`, ADR-011),
   - its original context (crop, region, source, date, applicability) is disclosed alongside the quote, and
   - it is explicitly labelled as general published source information and cannot be mistaken for a farm-specific
     prescription for the user's farm.
4. **Fail-closed enforcement:** any numerical rate, dose, or quantity in an LLM answer that fails these rules or
   exceeds published limits (`max_nitrogen_kg_ha` or regulatory caps) is blocked server-side; crops without an
   approved standard receive no numerical fertiliser prescription and receive non-numerical guidance instead.

Detail: `09_RETRIEVAL_AND_EVIDENCE_PACKAGE.md`, `02_FERTILISER_SAFETY_FINDING.md`. Not implemented in PR #25.

## Alternatives
- Prompt-only citation instructions: not checkable (rejected).
- Allowing any cited passage to independently authorise a numerical fertiliser rate: bypasses approval, calibration,
  soil provenance, and geographic applicability gates (rejected in revision 4).
