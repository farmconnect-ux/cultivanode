# ADR-013: Hybrid Retrieval in PostgreSQL

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22 | **Extends:** ADR-003

## Context
`public.search_published_agronomic_standards` (`20261122030000`) ranks by vector distance only when an embedding is
supplied; otherwise it filters with `ILIKE '%<whole question>%'` with unescaped wildcards. The production embedding
provider is unconfigured.

## Decision
One security-definer RPC with the existing checks, combining full-text (`tsvector` + taxonomy synonyms), vector
(per-model embedding table, ADR-014) and taxonomy-overlap lists through reciprocal rank fusion, then reranking and
evidence selection (ADR-019). Licence activity filters (ADR-011) apply before ranking. Retrieval logs store tags,
ids and scores, not farmer text. Detail: `09_RETRIEVAL_AND_EVIDENCE_PACKAGE.md`.

## Consequences
- Retrieval works without embeddings; one data copy and one RLS model.

## Alternatives
- External search engine: second copy of the data and access model (rejected).
