# CultivaNode 3.0 — Batch 03.2 Implementation Report
## Persistent Farm Memory, Memory Governance and Published Agronomic Standards RAG

**Date:** 2026-11-21  
**Repository:** `farmconnect-ux/cultivanode`  
**Branch:** `feat/batch-03-2-persistent-farm-memory-rag`  
**Base (`main`):** `7504a7384ea9f39ca678f19c7787704375d3f43b`  
**Hosted Environments:** **CultivaNode-Staging and CultivaNode-Production were NOT modified. No hosted migrations were applied.**

---

## 1. Architecture & ADR Compliance Summary

| ADR | Requirement | Batch 03.2 Implementation |
|---|---|---|
| **ADR-001** | Farm Intelligence Engine evidence layering | `assembleGroundedEvidencePackage()` integrates Live Farm Context, persistent memories, and published agronomic standards into `/api/engines/ai/ground` and `/api/ai/assistant` without creating a parallel AI orchestration layer. |
| **ADR-002** | `NOT NULL` `memory_scope` + ownership/attribution separation | `public.farm_memory_items` enforces `memory_scope IN ('farm','profile')`, strict scope/category `CHECK` constraints, and separate nullable attribution FKs (`created_by`, `confirmed_by`, `updated_by` -> `ON DELETE SET NULL`). |
| **ADR-003** | PostgreSQL 17 + `pgvector` hybrid retrieval + model metadata | Uses `extensions.vector(1536)` with HNSW cosine indexes (`vector_cosine_ops`) and mandatory `embedding_model` + `embedding_version` metadata on every vector row. Latency/storage measurement gate remains required on Staging prior to Production rollout. |
| **ADR-004** | Tenant isolation & server-mediated memory writes | `FORCE ROW LEVEL SECURITY` on `farm_memory_items`, `agronomic_standard_documents`, and `agronomic_standard_chunks`; direct DML revoked from `authenticated` and `anon`; all writes & vector searches enforce `account_active`, `ai_intelligence` consent, and `can_view_farm`/`can_edit_farm` inside PostgreSQL. |
| **ADR-005** | Reuse central trusted AI audit writer | Memory writes/transitions and grounded AI executions emit structured metadata via `recordAiAuditEvent()` (`apps/web/src/lib/ai-audit.ts`) -> narrow `service_role`-only `public.write_ai_audit_event(...)`. No parallel audit writer introduced. |
| **ADR-007** | Provenance & confidence preservation | Confirmed memories never override newer `verified_current` Live Farm Context facts; AI-inferred memories are never auto-confirmed; published standards are tagged `evidenceKind: 'published_agronomic_standard'` and never represented as farm measurements. |
| **ADR-008** | Offline sync compatibility | `sync_state ('synced' | 'awaiting_sync')` and `idempotency_key` supported; offline `awaiting_sync` memories cannot be auto-confirmed or confirmed before server synchronisation. |
| **ADR-009** | Account deletion & retention | `public.execute_account_deletion(uuid, text)` hard-deletes `memory_scope = 'profile'` rows of the deleted user while preserving `memory_scope = 'farm'` rows with `created_by`/`confirmed_by`/`updated_by` nulled, idempotently inside the existing advisory lock. |

---

## 2. Database Migrations Prepared (Repository Only — NOT Applied to Hosted Environments)

1. `supabase/migrations/20261122000000_batch_03_2_persistent_farm_memory.sql`
   - `public.farm_memory_items` (table, 6 `CHECK` constraints, 5 indexes including HNSW cosine index, forced RLS, `SELECT`-only grant for `authenticated`).
   - `private.has_ai_intelligence_consent(uuid)` (internal helper, revoked from all non-owner roles).
   - `public.create_farm_memory_item(...)`, `public.transition_farm_memory_item(...)`, `public.search_farm_memory_items(...)`.
2. `supabase/migrations/20261122010000_batch_03_2_memory_account_deletion_integration.sql`
   - Extends `public.execute_account_deletion(uuid, text)` to hard-delete `profile` memories and strip personal attribution from surviving `farm` memories per ADR-009.
3. `supabase/migrations/20261122020000_batch_03_2_agronomic_standards_rag.sql`
   - `public.agronomic_standard_documents` and `public.agronomic_standard_chunks` (linked to `public.farm_agronomic_standards`, forced RLS, HNSW cosine index, immutability trigger on published/superseded/retired standards).
   - `public.ingest_agronomic_standard_document(...)` (staff-only, draft-only, never auto-publishes) and `public.search_published_agronomic_standards(...)` (enforces `status = 'published'`, `is_active = true`, and effective dates inside PostgreSQL).
   - Extends `private.write_ai_audit_event(...)` `c_allowed_sources` to whitelist `farm_memory_items`, `agronomic_standard_documents`, `agronomic_standard_chunks`, `irrigation_zones`, and `irrigation_events`.

---

## 3. Embedding Provider Abstraction & Operational Notes

- No commercial embedding provider is hardcoded or added as an undocumented dependency.
- `packages/shared/src/engines/memory-rag/embedding-provider.ts` defines the provider-neutral `EmbeddingProvider` interface (`1536` dimensions), `UnconfiguredEmbeddingProvider` (default in production until an embedding provider is explicitly approved and configured — degrades cleanly to structured/keyword retrieval), and `DeterministicTestEmbeddingProvider` (offline/CI testing only).
- **Operational cost note (ADR-003):** Before enabling a commercial embedding provider in Staging/Production, measure embedding API call volume, HNSW RAM/storage growth, and p95 vector query latency under realistic tenant-filtered workloads.

---

## 4. Known Limitations & Deferred Capabilities

1. **Staging migration prerequisites:** Batch 03.1B (`M1`–`M5`), Batch 03.1C (`20261121020000`), and Batch 03.2 (`20261122000000`–`20261122020000`) exist in the repository but have **not** been applied to `CultivaNode-Staging` or `CultivaNode-Production`.
2. **Profile-scoped memory audit persistence:** `public.ai_audit_events.farm_id` is `NOT NULL` (`20261120020000`); farm-scoped memory writes/transitions are audited in `ai_audit_events`, while profile-only preference writes await a future approved profile-scoped audit schema if required.
3. **Live embedding provider adapter:** Intentionally deferred until a specific embedding vendor/model and cost budget are approved.
4. **Proactive FIE triggers, mobile offline outbox unification (ADR-008), and CI golden evaluation suite (ADR-010):** Intentionally deferred to Batches 03.3–03.5.
