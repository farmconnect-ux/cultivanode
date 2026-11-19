# Batch 03.0 — Acceptance Criteria

**Date:** 2026-11-19  
**Status:** Revised for Final Batch 03.0 Security Review

---

## 1. Batch 03.0 Documentation Validation *(Completed in Batch 03.0)*

| Criterion | Status | Evidence Location |
|---|---|---|
| Existing AI implementation mapped accurately | **Met** | `BATCH_03_0_EXISTING_AI_CAPABILITIES.md` |
| Existing 35+ table farm database assessed (incl. `machinery_telemetry`) | **Met** | `BATCH_03_0_FARM_DATA_INVENTORY.md` |
| Existing functionality distinguished from proposed functionality | **Met** | `BATCH_03_0_BASELINE_DISCOVERY.md` vs `BATCH_03_0_TARGET_ARCHITECTURE.md` |
| Farm context architecture defines 8-domain conflict rules, `soil_test_age_days`, and `machinery_telemetry` | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §2 & `ADR-001`, `ADR-007` |
| Persistent memory defines `NOT NULL memory_scope`, ownership/attribution separation & lifecycle | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §3 & `ADR-002` |
| Two-pathway AI audit trust boundary & `private.ai_actor_directory` 3-function interface defined | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §4, `SECURITY_AND_GOVERNANCE.md` §1, `ADR-005` |
| Verifiable `pg_cron` non-HTTP system-job identity defined | **Met** | `BATCH_03_0_SECURITY_AND_GOVERNANCE.md` §1 & `ADR-005` |
| Immutable prompt-version artefacts & controlled rollback defined | **Met** | `ADR-006` |
| `pgvector` cost, capacity & provisional `< 50 ms` p95 measurement gate defined | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §3 & `ADR-003` |

---

## 2. Batch 03.1+ Implementation Validation *(Future Gates — Not Yet Executed)*

### A. Memory Scope, Ownership, Attribution & Isolation (`[Batch 03.2]`)
1. **Profile-scoped preference isolation:** `memory_scope = 'profile'` preferences (`farm_id IS NULL`) are retrieved by their owning `profile_id` across multiple farms without exposing one farm's private data to another farm or allowing other farm/org members to read them.
2. **Farm-scoped memory isolation:** `memory_scope = 'farm'` memories cannot be retrieved by unauthorised users or removed org members (`can_view_farm(farm_id) = false`).
3. **Non-null scope & invalid combination rejection:** Database `NOT NULL` and `CHECK` constraints reject `NULL` `memory_scope`, `'farm'` with `farm_id IS NULL` or non-null `profile_id`, `'profile'` with non-null `farm_id`, `profile_id IS NULL`, or `category <> 'preference'`, and invalid ownership combinations.
4. **Ownership vs. attribution & farm continuity on deletion:** Deleting a user's account deletes/anonymises `scope = 'profile'` preferences, sets `created_by`/`confirmed_by`/`updated_by` to `NULL` on surviving org `scope = 'farm'` memories, and preserves farm-owned knowledge (`farm_id` intact).
5. **AI memory remains proposed & server-mediated:** AI-inferred memories stay `source_kind = 'ai_inferred'` / `verification_status = 'proposed'` until authorised human confirmation (`can_edit_farm`); direct client PostgREST writes fail; missing/withdrawn `'ai_intelligence'` consent fails closed.

### B. AI Audit-Writer Trust Boundary (`[Batch 03.1]`)
6. **No AI execution fabrication:** An `authenticated` user cannot call the general audit writer via RPC to fabricate a successful AI model execution, provider, model ID, prompt version, or guardrail pass.
7. **Actor & system-role impersonation blocked:** A user cannot submit another user's actor identity or create arbitrary system events.
8. **Payload allowlist & fail-loud:** Invalid event payloads are rejected; failed audit writes do not silently produce an apparent successful outcome; event volume/types are rate- and allowlist-controlled.
9. **Trusted server events & immutability:** Valid server-generated events preserve verified human actor identity (`actor_subject_id`), and `public.ai_audit_events` rejects `UPDATE`/`DELETE` via `private.forbid_change()`.

### C. `private.ai_actor_directory` Privilege Boundaries (`[Batch 03.1/03.2]`)
10. **Client & general enumeration blocked:** `anon`, `authenticated`, and ordinary application operations cannot access or enumerate `private.ai_actor_directory`.
11. **Single-purpose interface functions:** `private.resolve_or_create_ai_actor` performs only create/resolve; `private.anonymise_ai_actor` cannot create or reactivate identities; unauthorised execution is rejected.
12. **Idempotent deletion & non-reactivation:** Account-deletion anonymisation is idempotent, deleted mappings (`deleted_at IS NOT NULL`) cannot be restored via ordinary operations, and directory operations never mutate `public.ai_audit_events`.

### D. Verifiable PostgreSQL Scheduled-Job Identity (`[Batch 03.3]`)
13. **Job spoofing & unregistered jobs blocked:** Ordinary `authenticated` users cannot create system events; a client cannot impersonate a scheduled job by supplying `system_job_name`; unregistered jobs are rejected.
14. **Trusted non-HTTP execution & idempotent retries:** Registered `pg_cron` jobs create only their `private.ai_scheduled_jobs`-allowlisted event categories, derive system identity from trusted non-HTTP context, handle retries idempotently without duplicate audit rows, cannot impersonate human actors, and gain no general access to `private.ai_actor_directory`.

### E. Provenance, Soil Staleness, Machinery Telemetry, Prompt Rollback & `pgvector` (`[Batch 03.1/03.2/03.5]`)
15. **Soil-test staleness (`[Batch 03.1]`):** `soil_test_age_days = current_date - tested_on > approved_validity_days` (`365` provisional, `[Requires Agronomy Validation]`) marks tests `stale`; `tested_on > current_date` is `invalid_rejected`; `tested_on IS NULL` is `missing` (never `0` or current).
16. **Machinery telemetry provenance (`[Batch 03.1/03.3]`):** Uses verified `public.machinery_telemetry` (`machinery_id` linked to `farm_machinery_assets`, cross-farm telemetry blocked); invalid/non-monotonic sensor readings cannot silently override `farm_machinery_usage_logs`; conflicts are exposed as `conflicting`; historical readings remain traceable.
17. **Prompt-version rollback (`[Batch 03.1]`):** Immutable prompt artefacts + controlled active-version pointer pass pre-activation validation, switch back to a previously approved version on rollback, and record activation/rollback in `admin_actions`/`audit_log`.
18. **Provisional `pgvector` benchmark gate (`[Batch 03.1/03.2]`):** Measure retrieval latency separately from embedding generation and LLM inference under realistic Staging volumes, dimensions, HNSW config, RLS filtering, and concurrency to validate or revise the provisional `< 50 ms` p95 target.
