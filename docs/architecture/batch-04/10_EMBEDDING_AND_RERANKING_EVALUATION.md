# Batch 04.0 — Embedding, Reranking and Retrieval Evaluation Methodology

**Status:** Proposed — revision 3 | **Date:** 2026-11-22 | **ADRs:** ADR-014, ADR-017

## Current vector architecture (verified)

- `public.agronomic_standard_chunks.embedding vector(1536)` + HNSW `agronomic_std_chunks_embedding_hnsw_idx`
  (`20261122020000`).
- `public.farm_memory_items.embedding vector(1536)` + HNSW `farm_memory_items_embedding_hnsw_idx` (`20261122000000`);
  used by `public.search_farm_memory_items(…, extensions.vector, integer)` (line 812).
- `EMBEDDING_DIMENSIONS = 1536` and `formatPgVector` rejects any other length
  (`packages/shared/src/engines/memory-rag/embedding-provider.ts`).
- pgvector 0.8.2 in Production. Production default provider: `UnconfiguredEmbeddingProvider` (no vectors).

## Comparison methodology

### Configurations compared

1. Baseline: current 03.2 behaviour (whole-question `ILIKE`).
2. Full-text only (`tsvector` + taxonomy synonyms).
3. Each shortlisted hosted embedding model (2–4, at least one multilingual), alone and fused with full-text. Models
   are compared at their native output size, and at reduced sizes where the model supports it; no model is assumed
   to produce 1,536 dimensions.
4. Best fused configuration with each reranking option: none, a hosted cross-encoder reranker, an LLM reranker.

The shortlist is fixed at the start of the benchmark and recorded with exact model versions (D-T1). Each model is
loaded into its own partition of the proposed store (ADR-014), so comparisons run side by side.

### Corpus

A frozen snapshot of licensed documents with the production chunking settings.

### Question set (ADR-017)

Labelled by agronomists with graded relevance (0, 1, 2) per passage. Strata:

| Stratum | Examples of what it tests |
|---|---|
| Standard English agronomy | "basal application", "top-dressing", "pre-harvest interval" |
| Nigerian English farm usage | ridges, heaps, stands, "bags per plot", product trade names |
| Local crop names | ewedu, ugu, tete, ata rodo, egusi |
| Yoruba, Hausa, Igbo, Pidgin and code-mixed questions | Same intents as the English set |
| Units and numbers | kg/ha vs bags/acre, ml per 16 L knapsack |
| Noisy input | Typos, voice transcription errors |
| No-answer questions | Topics absent from the corpus (must return nothing relevant) |

### Metrics

Reported per stratum, not only overall: Recall@5, Recall@20, nDCG@10, MRR; no-answer precision; citation validity and
unsupported-claim rate after generation; latency p50/p95 split into query embedding, database search and rerank; cost
per 1,000 questions and per full corpus embedding; storage per 10,000 passages per dimension size; HNSW build time.
Confidence intervals by bootstrap over questions.

### Decision rule

A configuration is acceptable only if it beats full-text-only on the local-name and non-English strata (not only
English), stays within the latency and monthly cost budgets set by the owner (D-P1), and does not reduce no-answer
precision.

## Storage for different dimensions

See ADR-014 for the full comparison. In summary:

- A typed `vector(n)` column holds one size; vectors from different models are not comparable even at equal size.
- pgvector HNSW indexes support up to 2,000 dimensions for `vector` and 4,000 for `halfvec`; larger models use
  `halfvec` or a supported reduced size.
- Recommended: a `passage_embeddings` table list-partitioned by model, one partition per model with a dimension check
  and its own HNSW index, driven by an `embedding_models` registry (candidate → shadow → active → standby → retired).
  Alternatives compared: dimension-specific tables, and one table with an untyped column and per-model expression
  indexes.
- Switching models is a registry update in one transaction; rollback flips back to the standby model; retirement
  drops its partition.
- Farm memory (`farm_memory_items`, `search_farm_memory_items`) stays on its own `vector(1536)` column and is not
  moved, unless a separate ADR approves it (D-L3).
