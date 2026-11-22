# ADR-016: Evidence-Grounded Answer Contract

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22 | **Extends:** ADR-007

## Context
The grounded evidence package separates tiers and discloses degraded grounding, but the model answers in free
text; citations and the evidence/assumption split are prompt instructions only.

## Decision
The model returns structured claims. Each claim has `kind` (`cited_evidence`, `farm_fact`, `calculation`,
`assumption`, `general_guidance`), `citations` (passage ID, document version, page, section), `applicability`
(match/partial/mismatch/unknown per crop, stage, zone, soil, season), `confidence` with reason, `conflicts`, and
`missing` facts. The server then:
1. Drops claims citing IDs not in the request's evidence package and marks the answer degraded.
2. Blocks rates outside the published standard's limits (`max_nitrogen_kg_ha`, `restricted_chemicals`).
3. Scales rates to the farm with the deterministic engine, not the model.
4. Leads with "no approved standard" when no T1–T3 evidence matches crop and zone; regional references follow,
   labelled.

## Alternatives
- Prompt-only citation instructions: not checkable (rejected).
