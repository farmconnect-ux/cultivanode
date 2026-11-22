# ADR-016: Evidence-Grounded Answer Contract

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22 | **Extends:** ADR-007

## Context
The evidence package separates tiers and discloses degraded grounding, but answers are free text. The only output
check is banned pesticide names (`chemical-guardrail.ts`). An LLM may state any rate (path P6 in
`02_FERTILISER_SAFETY_FINDING.md`).

## Decision
Structured claims (`kind`, `citations`, `applicability`, `confidence`, `conflicts`, `missing`) validated server-side:
citation ids must exist in the package; every rate, dose or quantity must trace to an engine result or cited
passage; limits and constraints are enforced; crops without an approved standard get no numeric rate.
Detail: `09_RETRIEVAL_AND_EVIDENCE_PACKAGE.md`.

## Alternatives
- Prompt-only citation instructions: not checkable (rejected).
