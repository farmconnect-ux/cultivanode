# ADR-014: Embedding Storage, Model Selection and Lifecycle

**Status:** Proposed — revision 3 (Batch 04.0); model choice after benchmark D-T1 | **Date:** 2026-11-22

## Context

- `public.agronomic_standard_chunks.embedding` and `public.farm_memory_items.embedding` are `vector(1536)` with HNSW
  indexes (`20261122020000`, `20261122000000`); `formatPgVector` enforces 1,536
  (`packages/shared/src/engines/memory-rag/embedding-provider.ts`). Production uses `UnconfiguredEmbeddingProvider`.
- Candidate models output different sizes; some allow a reduced output size. Vectors from different models are not
  comparable even at the same size. pgvector 0.8.2 (Production) builds HNSW indexes on `vector` up to 2,000
  dimensions and on `halfvec` up to 4,000.

## Decision

### Model registry

`public.embedding_models`: id, provider, model name, model version, dimensions, storage type (`vector` or `halfvec`),
distance (`cosine`), corpus (`agronomic_passages`), status (`candidate`, `shadow`, `active`, `standby`, `retired`),
activated and retired timestamps. A partial unique index allows one `active` model per corpus.

### Storage options compared

| Option | Design | Different dimensions | Index management | Retirement and rollback | Main drawback |
|---|---|---|---|---|---|
| A. Dimension-specific tables | `passage_embeddings_d1024`, `_d1536`, … each with a typed `vector(n)`; rows keyed by (passage, model) | Native typing per table | One partial HNSW index per model (`WHERE model_id = …`) | Delete rows and drop the partial index | A new table per new size; deletes are slow on large tables |
| B. One table, untyped `vector` | Single table with `embedding vector` (no size) and a `CHECK (vector_dims(embedding) = dims)` per model via the registry | Any size in one column | Expression + partial index per model: `((embedding::vector(1024))) WHERE model_id = …` | Delete rows, drop index | Queries must repeat the exact cast expression to use the index; one large table |
| **C. List-partitioned by model (recommended)** | Parent `passage_embeddings` partitioned by `model_id`; one partition per model with untyped `vector`/`halfvec`, a dimension `CHECK`, and its own HNSW index on the cast expression | Any size, isolated per partition | Index built per partition, independently and concurrently with serving | `DETACH` / `DROP` the partition: constant time, no bulk delete | Retrieval SQL is generated from the registry (allow-listed values only, never caller text) |

Option C is recommended because each model is isolated, retirement is cheap, and an index build cannot affect the
active model. D-T5 confirms it on Staging against A and B.

Rows hold passage id, model id, embedding, the passage `content_sha256` it was computed from, and created at.
Uniqueness on (passage id, model id) makes re-embedding idempotent.

### Lifecycle, migration and rollback

1. **Candidate:** register the model; create its partition and index.
2. **Shadow:** a background job embeds all approved passages; new passages are embedded for active and shadow models.
   Coverage is tracked; the evaluation gate (ADR-017) runs on full coverage.
3. **Switch:** one transaction marks the shadow model `active` and the previous one `standby`. The query-embedding
   model always comes from the registry, never from the caller. The model id is recorded in retrieval logs and AI
   audit events.
4. **Rollback:** mark `standby` back to `active` in one transaction; no re-embedding needed while it is kept.
5. **Retire:** after the standby window (D-P8), drop the partition.

If the query embedding fails or the active model is unavailable, retrieval degrades to full-text and taxonomy
(ADR-013), never to an empty answer.

### Farm memory stays separate

`farm_memory_items.embedding vector(1536)` and `public.search_farm_memory_items` are not moved into this store.
Farm memories are farm-scoped personal data under RLS and consent; passages are shared published knowledge. Any
change to farm-memory embeddings needs its own ADR, because re-embedding sends farmer content to a provider again
(D-L3).

## Alternatives

- Keep `vector(1536)` on `agronomic_standard_chunks`: forces 1,536-dimension models only and blocks side-by-side
  evaluation.
- Self-hosted model: no GPU in the current stack (rejected for now).
