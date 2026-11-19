# Batch 03.0 — Acceptance Criteria

**Date:** 2026-11-19  
**Status:** Revised for Batch 03.0 Identity & Memory Controls

---

## 1. Batch 03.0 Architecture & Discovery Acceptance Checklist

| Criterion | Status | Evidence Location |
|---|---|---|
| Existing AI implementation mapped accurately | **Met** | `BATCH_03_0_EXISTING_AI_CAPABILITIES.md` |
| Existing 35-table farm database assessed | **Met** | `BATCH_03_0_FARM_DATA_INVENTORY.md` |
| Existing functionality distinguished from proposed functionality | **Met** | `BATCH_03_0_BASELINE_DISCOVERY.md` vs `BATCH_03_0_TARGET_ARCHITECTURE.md` |
| Farm context architecture has defined data contract & 8-domain conflict rules | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §2 & `ADR-001`, `ADR-007` |
| Persistent memory has `NOT NULL memory_scope`, ownership/attribution separation & lifecycle | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §3 & `ADR-002` |
| AI audit register has immutable event model + `private.ai_actor_directory` protection | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §4 & `ADR-005`, `ADR-009` |
| Server-mediated memory writes & JWT-derived `SECURITY DEFINER` audit writer specified | **Met** | `BATCH_03_0_SECURITY_AND_GOVERNANCE.md` §1 & `ADR-004`, `ADR-005` |
| `pgvector` cost, capacity & provisional p95 measurement gate specified | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §3 & `ADR-003` |
| Security & governance risks (13 threats) assessed | **Met** | `BATCH_03_0_SECURITY_AND_GOVERNANCE.md` §2 |
| Implementation dependencies & sequencing documented | **Met** | `BATCH_03_0_IMPLEMENTATION_ROADMAP.md` |
| Measurable acceptance tests specified for Batch 03.1+ | **Met** | §2 below |

---

## 2. Batch 03.1+ Implementation Acceptance Tests *(Future Implementation Gates — Not Yet Executed)*

### A. Memory Scope, Ownership, Attribution & Isolation (`[Batch 03.2]`)
1. **Profile-scoped preference isolation:** `memory_scope = 'profile'` preferences (`farm_id IS NULL`) are retrieved by their owning `profile_id` across multiple farms without exposing one farm's private data to another farm or allowing other farm/org members to read them.
2. **Farm-scoped memory isolation:** `memory_scope = 'farm'` memories cannot be retrieved by unauthorised users or removed org members (`can_view_farm(farm_id) = false`).
3. **Non-null scope & invalid combination rejection:** Database `CHECK` and `NOT NULL` constraints reject:
   - `NULL` `memory_scope`.
   - `memory_scope = 'farm'` with `farm_id IS NULL` or non-null `profile_id`.
   - `memory_scope = 'profile'` with non-null `farm_id`, `profile_id IS NULL`, or `category <> 'preference'`.
   - Invalid farm/profile ownership combinations.
4. **Ownership vs. attribution & farm knowledge continuity on deletion:** Deleting a creator/confirmer's account deletes/anonymises their `scope = 'profile'` preferences, sets `created_by`/`confirmed_by`/`updated_by` to `NULL` on surviving org `scope = 'farm'` memories, and **preserves** the farm-owned knowledge (`farm_id` intact).
5. **AI memory remains proposed:** AI-inferred memories are inserted strictly with `source_kind = 'ai_inferred'` and `verification_status = 'proposed'`, and cannot self-promote to `'confirmed'` without an authorised human confirmation event (`can_edit_farm`).
6. **No client bypass of Memory Write Service:** Direct PostgREST `INSERT`/`UPDATE` from `anon` or unauthorised `authenticated` clients against `farm_memory_items` is rejected by RLS/grants.
7. **Consent enforcement:** Memory writes and proactive FIE processing fail closed when `'ai_intelligence'` consent in `public.consents` is absent or withdrawn.

### B. `SECURITY DEFINER` Audit Writer & Immutability (`[Batch 03.1]`)
8. **Unauthenticated & `PUBLIC`/`anon` rejection:** `PUBLIC` and `anon` have zero `EXECUTE` privileges on the audit writer, and calls without valid authenticated JWT claims (`auth.uid() IS NULL`) are rejected (`42501`).
9. **Actor impersonation prevention:** An `authenticated` user cannot supply another user's `actor_id`/`profile_id` or claim `actor_kind = 'system'`.
10. **Cross-farm & view-only rejection:** An `authenticated` user cannot insert an audit event for a `farm_id` they cannot access (`can_view_farm = false`), nor perform edit/confirmation traces with view-only access (`can_edit_farm = false`).
11. **Service-role system pathway:** `actor_kind = 'system'` events succeed **only** via `service_role` / trusted internal pathway with allowlisted `system_job_name`.
12. **No privileged data access & fail-loud errors:** The audit writer cannot be used to read or modify unrelated farm data, and security-critical audit write failures surface errors rather than being silently discarded.
13. **Audit immutability:** pgTAP `throws_ok` confirms `UPDATE` and `DELETE` on `public.ai_audit_events` fail for `authenticated` and `service_role` via `private.forbid_change()`.

### C. `private.ai_actor_directory` Protection & Deletion (`[Batch 03.1/03.2]`)
14. **Directory enumeration & modification blocked:** Ordinary clients (`anon`, `authenticated`) cannot enumerate, read, or modify `private.ai_actor_directory` directly.
15. **Trusted mapping creation/resolution & cross-tenant safety:** Only authorised trusted processes can create or resolve mappings, and identity resolution cannot expose another farm's or user's private information.
16. **Idempotent anonymisation & non-reactivation:** Account deletion anonymises `private.ai_actor_directory` (`profile_id = NULL, deleted_at = now()`) without mutating `public.ai_audit_events`; repeated anonymisation is idempotent; a deleted mapping (`deleted_at IS NOT NULL`) cannot be silently reactivated.

### D. Context Provenance & `pgvector` Measurement Gate (`[Batch 03.1/03.2]`)
17. **Domain-specific provenance & 7 context states:** `LiveFarmContextService` tests verify `verified_current`, `unverified_provisional`, `stale`, `missing`, `conflicting`, `awaiting_sync`, and `invalid_rejected` across all 8 domains, and missing measurements are never treated as `0`.
18. **Provisional `pgvector` benchmark gate:** Before production-scale rollout, measure vector retrieval latency separately from embedding generation and LLM inference under representative Staging volumes, dimensions, HNSW config, RLS filtering, and concurrency, validating or revising the provisional `< 50 ms` p95 target.
