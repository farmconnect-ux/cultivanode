# ADR-003: Memory Storage and Retrieval Technology

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
FIE requires both exact structured lookups (open `unresolved` alerts, `profile` preferences) and semantic cross-season recall plus RAG over published `farm_agronomic_standards` (`20261103120000`).

## Decision
Use **PostgreSQL 17 + `pgvector`** inside the existing Supabase database (hybrid relational + HNSW vector retrieval). **Extension availability does not mean zero total cost:** embeddings, HNSW index storage/RAM, query compute, WAL/backup growth, embedding-provider API calls, and separate LLM inference all carry real costs and must pass a **Batch 03.1 measurement gate** before production rollout.

## Measurement & Capacity Gate (Required Before Production Rollout)
- Measure expected memory-item volume per farm, embedding dimensions (e.g. `512` vs `1536`), embedding cadence, p95 query latency (`< 50 ms` target), and DB growth against Supabase Free (`500 MB` DB) → Pro thresholds.
- Store `embedding_model` and `embedding_version` on every vector row to support zero-downtime re-embedding migrations.
- Define archival/pruning triggers (e.g., expired `proposed` items) and criteria for upgrading to Supabase Pro or partitioning.

## Alternatives & Trade-offs
- **External vector DB (Pinecone / Qdrant):** Adds vendor cost, network hops, and ACL desynchronisation risk with Supabase RLS (rejected for Phase 1).
- **Postgres FTS only:** Lower storage/embedding cost, but weaker on multilingual (`en`/`yo`/`pcm`) symptom similarity.
