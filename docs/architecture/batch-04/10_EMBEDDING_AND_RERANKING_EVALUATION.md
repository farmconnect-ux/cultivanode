# Batch 04.0 — Embedding, Reranking and Retrieval Evaluation Methodology (Correction 7)

**Status:** Proposed | **Date:** 2026-11-22 | **ADRs:** ADR-014, ADR-017

## Current vector architecture (verified)

- `public.agronomic_standard_chunks.embedding vector(1536)` + HNSW `agronomic_std_chunks_embedding_hnsw_idx`
  (`20261122020000`).
- `public.farm_memory_items.embedding vector(1536)` + HNSW `farm_memory_items_embedding_hnsw_idx` (`20261122000000`);
  used by `public.search_farm_memory_items(…, extensions.vector, integer)` (line 812).
- `EMBEDDING_DIMENSIONS = 1536` and `formatPgVector` rejects any other length
  (`packages/shared/src/engines/memory-rag/embedding-provider.ts`).
- pgvector 0.8.2 in Production. Production default provider: `UnconfiguredEmbeddingProvider` (no vectors).

## Comparison methodology

**Configurations compared**

1. Baseline: current 03.2 behaviour (whole-question `ILIKE`).
2. Full-text only (`tsvector` + taxonomy synonyms).
3. Each shortlisted hosted embedding model (2–4, at least one multilingual), alone and fused with full-text.
4. Best fused configuration with each reranking option: none, a hosted cross-encoder reranker, an LLM reranker.

The shortlist is fixed at the start of the benchmark and recorded with exact model versions (D-T1).

**Corpus:** a frozen snapshot of licensed documents with the production chunking settings.

**Question set (ADR-017)**, labelled by agronomists with graded relevance (0, 1, 2) per passage. Strata:

| Stratum | Examples of what it tests |
|---|---|
| Standard English agronomy | "basal application", "top-dressing", "pre-harvest interval" |
| Nigerian English farm usage | ridges, heaps, stands, "bags per plot", product trade names |
| Local crop names | ewedu, ugu, tete, ata rodo, egusi |
| Yoruba, Hausa, Igbo, Pidgin and code-mixed questions | Same intents as the English set |
| Units and numbers | kg/ha vs bags/acre, ml per 16 L knapsack |
| Noisy input | Typos, voice transcription errors |
| No-answer questions | Topics absent from the corpus (must return nothing relevant) |

**Metrics**, reported per stratum, not only overall: Recall@5, Recall@20, nDCG@10, MRR; no-answer precision;
citation validity and unsupported-claim rate after generation; latency p50/p95 split into query embedding, database
search and rerank; cost per 1,000 questions and per full corpus embedding; storage per 10,000 passages; HNSW build
time. Confidence intervals by bootstrap over questions.

**Decision rule:** a configuration is acceptable only if it beats full-text-only on the local-name and non-English
strata (not only English), stays within the latency and monthly cost budgets set by the owner (D-P1), and does not
reduce no-answer precision.

## Changing the 1,536-dimension architecture

- A `vector(n)` column holds one dimension; vectors from different models are not comparable even at equal size.
- pgvector HNSW indexes support up to 2,000 dimensions for `vector` (4,000 for `halfvec`).
- Options:
  1. Choose a model with native 1,536 output, or one that supports reduced output dimensions, and keep the columns.
  2. **Recommended for 04.2:** a separate `passage_embeddings` table keyed by (passage id, model, version) with
     its own HNSW index per model. This allows side-by-side evaluation and model change without altering
     `agronomic_standard_chunks`.
  3. In-place change: add a new column and index, dual-write, re-embed in the background, switch the RPC, then drop
     the old column.
- Any change also affects farm memory (`farm_memory_items`, `search_farm_memory_items`) and `formatPgVector`.
  Re-embedding farm memories sends farmer content to the provider again, which needs the consent and data-processing
  review in the decision register (D-L3).
