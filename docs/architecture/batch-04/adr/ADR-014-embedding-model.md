# ADR-014: Embedding and Reranking Model Selection

**Status:** Proposed — revised for review correction 7; owner decision after benchmark (Batch 04.0) | **Date:** 2026-11-22

## Context
`agronomic_standard_chunks.embedding` and `farm_memory_items.embedding` are `vector(1536)` with HNSW indexes;
`formatPgVector` enforces 1,536 (`embedding-provider.ts`); Production uses `UnconfiguredEmbeddingProvider`.

## Decision
- Select models only through the benchmark in `10_EMBEDDING_AND_RERANKING_EVALUATION.md`: strata for Nigerian
  English, local crop names and Yoruba/Hausa/Igbo/Pidgin; Recall@k, nDCG@10, MRR, latency split, cost, storage.
- Store document embeddings in a per-model `passage_embeddings` table keyed by (passage, model, version), each with
  its own HNSW index. Model change = new rows, evaluation gate, switch, retire old rows.
- Query-embedding failure degrades to full-text + taxonomy, never to an empty answer.
- Farm memory embeddings keep `vector(1536)` until a separate decision (D-T5), because re-embedding sends farmer
  content to a provider again (D-L3).

## Alternatives
- In-place column change: possible (dual column, re-embed, switch) but blocks side-by-side evaluation.
- Self-hosted model: no GPU in the current stack (rejected for now).
