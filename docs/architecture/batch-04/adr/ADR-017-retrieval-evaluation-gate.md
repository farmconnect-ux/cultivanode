# ADR-017: Retrieval and Citation Evaluation Gate

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22 | **Extends:** ADR-010

## Context
Production has no farms or crop cycles yet, so quality cannot be learned from use.

## Decision
A versioned, agronomist-labelled question set stratified by language and terminology (see
`10_EMBEDDING_AND_RERANKING_EVALUATION.md`), replayed in CI against fixture documents and on Staging against
licensed documents. Tracked per stratum: Recall@k, nDCG@10, MRR, no-answer precision, citation validity,
unsupported-claim rate, latency and cost. A release is blocked when any stratum drops below the last accepted
baseline. Thresholds come from the first Staging run.

## Alternatives
- Manual spot checks: not repeatable (rejected).
