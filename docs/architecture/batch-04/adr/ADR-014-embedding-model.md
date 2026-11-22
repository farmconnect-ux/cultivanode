# ADR-014: Embedding Model Selection

**Status:** Proposed — owner decision required (Batch 04.0) | **Date:** 2026-11-22

## Context
The `EmbeddingProvider` interface exists; production uses `UnconfiguredEmbeddingProvider`. Columns are
`vector(1536)` with `embedding_model` and `embedding_version` required on every vector row.

## Decision
Approve one hosted embedding model and a monthly budget. Prefer a model that outputs 1536 dimensions to avoid a
column migration. Embed passages in a background job; store model and version per row; a model change triggers a
full re-embed into new rows before the old ones are retired. Query embedding failure degrades to full-text +
taxonomy (ADR-013), never to an empty answer.

## Measurement gate (from ADR-003)
On Staging, measure embedding cost per document and per question, HNSW storage, and p95 retrieval latency
separately from model inference before enabling in Production.

## Alternatives
- Self-hosted model: no GPU in the current stack (rejected for now).
