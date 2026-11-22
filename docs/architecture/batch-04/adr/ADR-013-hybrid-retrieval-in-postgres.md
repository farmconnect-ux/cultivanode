# ADR-013: Hybrid Retrieval in PostgreSQL

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22 | **Extends:** ADR-003

## Context
`search_published_agronomic_standards` ranks by vector distance only when an embedding is supplied; otherwise it
filters with `ILIKE '%<whole question>%'` (unescaped). The production embedding provider is unconfigured.

## Decision
One security-definer RPC (same checks as today) combining three ranked lists:
1. Full-text: a generated `tsvector` per passage, queried with crop and local-name synonyms from the taxonomy.
2. Vector: pgvector cosine similarity when the passage and query have embeddings of the same model/version.
3. Taxonomy match: overlap between the farm's tags and the passage's tags.
Lists are merged by reciprocal rank fusion, then the top candidates are reranked. Evidence selection then scores
applicability per dimension (crop, stage, zone, soil, season), applies tier precedence, flags conflicts and caps
passages per document. Retrieval logs keep tags, candidate IDs and scores, not farmer text.

## Consequences
- Retrieval works on day one without embeddings.
- One data copy and one RLS model.

## Alternatives
- External search engine: second copy of the data and a second access model (rejected).
