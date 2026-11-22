# ADR-017: Retrieval and Citation Evaluation Gate

**Status:** Proposed — revision 4 (Batch 04.0) | **Date:** 2026-11-22 | **Extends:** ADR-010 | **See also:** ADR-016, ADR-020

## Context
Production has no farms or crop cycles yet, so quality cannot be learned from use. Treating the initial Staging
benchmark automatically as an acceptable baseline would legitimise weak retrieval or unsafe generation if the first
run performs poorly.

## Decision
Adopt a **two-level evaluation framework** over a versioned, agronomist-labelled benchmark suite replayed in CI
(against fixture documents) and on Staging (against appropriately licensed documents), with separate reporting by
language (English, Nigerian English, Yoruba, Hausa, Igbo, Pidgin), crop, agricultural topic, query difficulty, and
no-answer category:

### Level A: Absolute release requirements (provisional pending sign-off)
A release cannot promote to Production unless it meets minimum absolute quality and safety criteria — **never**
derived automatically from the initial Staging run. Provisional thresholds are defined in
`10_EMBEDDING_AND_RERANKING_EVALUATION.md` for:

- **Critical safety:** `0` known unsupported numerical fertiliser prescriptions in the evaluation suite (zero tolerance).
- Citation validity, unsupported agricultural claim rate, and no-answer precision.
- Retrieval `Recall@5`, `Recall@20`, `nDCG@10`, and `MRR` (overall and per-language floor across English, Nigerian
  English, Yoruba, Hausa, Igbo, and Pidgin).
- Unit and numerical interpretation accuracy, and geographic/crop-stage applicability accuracy.
- Retrieval p95 latency and cost per 1,000 queries within approved budgets.

All Level A thresholds are explicitly **provisional** and must be formally approved by the **product owner**,
**lead agronomist**, and **engineering lead** before the first Production release (D-P9, D-A8).

### Level B: Regression requirements
Only **after** Level A thresholds are approved and achieved:

- Compare each subsequent release against the last accepted benchmark.
- Block promotion if any material metric regresses beyond its approved tolerance on any reporting slice.
- Preserve immutable benchmark versions, labelled questions, expected evidence, model/index versions, and results.
- Require independent agronomist review for material changes to agricultural answers.

Detail: `10_EMBEDDING_AND_RERANKING_EVALUATION.md`. Not implemented in PR #25.

## Alternatives
- Manual spot checks: not repeatable (rejected).
- Adopting the first Staging benchmark run automatically as the release baseline: legitimises weak initial quality
  (rejected in revision 4).
