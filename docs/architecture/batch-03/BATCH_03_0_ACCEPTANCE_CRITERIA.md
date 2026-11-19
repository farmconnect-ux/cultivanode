# Batch 03.0 — Acceptance Criteria

**Date:** 2026-11-19  
**Status:** Revised for Batch 03.0 Review Findings 1–6

---

## 1. Batch 03.0 Architecture & Discovery Acceptance Checklist

| Criterion | Status | Evidence Location |
|---|---|---|
| Existing AI implementation mapped accurately | **Met** | `BATCH_03_0_EXISTING_AI_CAPABILITIES.md` |
| Existing 35-table farm database assessed | **Met** | `BATCH_03_0_FARM_DATA_INVENTORY.md` |
| Existing functionality distinguished from proposed functionality | **Met** | `BATCH_03_0_BASELINE_DISCOVERY.md` vs `BATCH_03_0_TARGET_ARCHITECTURE.md` |
| Farm context architecture has defined data contract & 8-domain conflict rules | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §2 & `ADR-001`, `ADR-007` |
| Persistent memory has defined `farm`/`profile` scope, lifecycle & provenance | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §3 & `ADR-002` |
| AI audit register has immutable event model + `ai_actor_directory` separation | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §4 & `ADR-005`, `ADR-009` |
| Server-mediated memory writes & caller-bound audit writer specified | **Met** | `BATCH_03_0_SECURITY_AND_GOVERNANCE.md` §1 & `ADR-004`, `ADR-005` |
| `pgvector` cost, capacity & measurement gate specified | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §3 & `ADR-003` |
| Security & governance risks (13 threats) assessed | **Met** | `BATCH_03_0_SECURITY_AND_GOVERNANCE.md` §2 |
| Implementation dependencies & sequencing documented | **Met** | `BATCH_03_0_IMPLEMENTATION_ROADMAP.md` |
| Measurable acceptance tests specified for Batch 03.1+ | **Met** | §2 below |

---

## 2. Batch 03.1+ Implementation Acceptance Tests *(Future Implementation Gates — Not Yet Executed)*

1. **Profile-scoped preference isolation (`[Batch 03.2]`):** Profile-scoped preferences (`memory_scope = 'profile'`, `farm_id IS NULL`) can be retrieved by their owner across multiple farms without exposing one farm's private information to another farm or allowing other farm/org members to read them.
2. **Farm-scoped memory isolation (`[Batch 03.2]`):** Farm-scoped memories (`memory_scope = 'farm'`) cannot be retrieved by unauthorised users or removed org members (`can_view_farm(farm_id) = false`).
3. **Invalid memory scope rejection (`[Batch 03.2]`):** Database `CHECK` constraints reject `memory_scope = 'farm'` with `farm_id IS NULL` and reject `memory_scope = 'profile'` with non-null `farm_id`, null `profile_id`, or `category <> 'preference'`.
4. **Audit immutability (`[Batch 03.1]`):** pgTAP `throws_ok` confirms `UPDATE` and `DELETE` on `ai_audit_events` fail for `authenticated` and `service_role` via `private.forbid_change()`.
5. **Account deletion without audit mutation (`[Batch 03.1/03.2]`):** `execute_account_deletion` deletes `scope='profile'` memory, nulls `created_by`/`confirmed_by` on surviving org `scope='farm'` memory, and unlinks `ai_actor_directory.profile_id = NULL` without updating or deleting any row in `ai_audit_events`.
6. **Actor impersonation prevention (`[Batch 03.1]`):** An authenticated user cannot write an `ai_audit_events` row as another `actor_id` or with `actor_kind = 'system'`.
7. **Cross-farm audit insertion rejection (`[Batch 03.1]`):** An authenticated user cannot insert an `ai_audit_events` row for a `farm_id` where `can_view_farm(farm_id)` is `false`, or with forged `context_record_refs` from another farm.
8. **Unauthenticated audit rejection (`[Batch 03.1]`):** `anon` and `PUBLIC` have zero `EXECUTE` privileges on the audit writer, and calls with `auth.uid() IS NULL` under `authenticated` fail with `42501`.
9. **Domain-specific provenance & 7 context states (`[Batch 03.1]`):** `LiveFarmContextService` tests verify `verified_current`, `unverified_provisional`, `stale`, `missing`, `conflicting`, `awaiting_sync`, and `invalid_rejected` across all 8 domains (e.g., IoT moisture never overrides lab soil NPK/pH; conflicting sources surface uncertainty).
10. **Missing data never treated as zero (`[Batch 03.1]`):** Omitted soil P/K, rain, or telemetry returns `missing` (`null`) rather than `0` (including `/api/engines/agronomy/fertiliser`).
11. **AI memory remains proposed (`[Batch 03.2]`):** AI-inferred memories are inserted strictly as `source_kind = 'ai_inferred'` and `verification_status = 'proposed'`, and cannot self-promote to `'confirmed'` without an authorised human confirmation event (`can_edit_farm`).
12. **No client bypass of Memory Write Service (`[Batch 03.2]`):** Direct PostgREST `INSERT`/`UPDATE` from `anon` or unauthorised `authenticated` clients against `farm_memory_items` is rejected by RLS/grants.
13. **Consent enforcement (`[Batch 03.1/03.2]`):** Memory writes and proactive FIE processing fail closed when `'ai_intelligence'` consent in `public.consents` is absent or withdrawn.
14. **Cross-farm & cross-profile memory denial (`[Batch 03.2]`):** pgTAP + API tests confirm cross-farm and cross-profile `SELECT`/`INSERT`/`UPDATE`/`DELETE` attempts return `0` rows or `403`/`42501`.
15. **Vector capacity, latency & cost gate (`[Batch 03.1/03.2]`):** Benchmark exercise measures expected memory-item volume, embedding dimensions, generation cost, HNSW index size, and p95 query latency (`< 50 ms` target) against Supabase plan limits before production-scale rollout.
