# ADR-003: Memory Storage and Retrieval Technology

**Status:** Proposed (Batch 03.0) | **Date:** 2026-11-19

## Context
FIE requires both exact structured lookups (e.g., open `unresolved` alerts, `preference` language/units) and semantic cross-season recall (e.g., recurring pest/soil issues) plus RAG over published `farm_agronomic_standards` (`20261103120000`).

## Decision
Use **PostgreSQL 17 + `pgvector`** inside the existing Supabase database (hybrid relational + HNSW vector retrieval) with Reciprocal Rank Fusion / deterministic priority weighting.

## Alternatives & Trade-offs
- **External vector DB (Pinecone / Qdrant / Weaviate):** Adds vendor cost, network hops, and risk of cross-tenant ACL desynchronisation between Supabase RLS and external metadata filters (rejected).
- **Postgres full-text search only:** Zero embedding cost, but weaker on multilingual (`en`/`yo`/`pcm`) and symptom-similarity queries.

## Security & Cost Implications
- Native RLS (`private.can_view_farm(farm_id)`) protects vector queries directly in Postgres without duplicating ACLs.
- Zero additional infrastructure cost on Supabase Free/Pro; embeddings generated only for confirmed/published/long-lived memory items.
