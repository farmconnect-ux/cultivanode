# ADR-017: Retrieval and Citation Evaluation Gate

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22 | **Extends:** ADR-010

## Context
Production has no farms or crop cycles yet, so quality cannot be learned from usage.

## Decision
A versioned set of Nigerian farmer questions (English plus Yoruba, Hausa, Igbo, Pidgin phrasings) with the farm
context, the passages each should retrieve, and the facts the answer must not invent. CI replays it against
fixture documents; Staging replays it against licensed documents. Tracked: correct source in top results,
citation validity, unsupported-claim rate, refusal when no evidence exists, latency and cost. A release is blocked
when a score drops below the last accepted baseline. Thresholds are set from the first Staging run, not guessed.

## Alternatives
- Manual spot checks: not repeatable (rejected).
