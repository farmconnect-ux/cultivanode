# ADR-003: Memory Storage and Retrieval Technology

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
FIE requires both exact structured lookups (open `unresolved` alerts, `profile` preferences) and semantic cross-season recall plus RAG over published `farm_agronomic_standards` (`20261103120000`).

## Decision
Use **PostgreSQL 17 + `pgvector`** inside the existing Supabase database (hybrid relational + HNSW vector retrieval). **Extension availability does not mean zero total cost:** embeddings, HNSW index storage/RAM, query compute, WAL/backup growth, embedding-provider API calls, and separate LLM inference all carry real costs and must pass a **Batch 03.1/03.2 measurement gate** before production rollout.

## Provisional Target & Measurement Gate
- A `< 50 ms` p95 vector retrieval latency is a **provisional engineering target**, not a proven performance characteristic.
- Before production acceptance, vector retrieval latency must be measured **separately from embedding generation and LLM inference** under realistic Staging workloads (representative memory volumes, embedding dimensions, HNSW index parameters, tenant-isolation RLS filters, and query concurrency) and revised based on measured results.
- Measure DB storage growth against Supabase Free (`500 MB` DB) → Pro thresholds, and store `embedding_model` + `embedding_version` on every vector row for safe re-embedding migrations.

## Alternatives & Trade-offs
- **External vector DB (Pinecone / Qdrant):** Adds vendor cost, network hops, and ACL desynchronisation risk with Supabase RLS (rejected for Phase 1).
- **Postgres FTS only:** Lower storage/embedding cost, but weaker on multilingual (`en`/`yo`/`pcm`) symptom similarity.
