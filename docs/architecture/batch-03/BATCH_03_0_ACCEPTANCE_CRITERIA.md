# Batch 03.0 — Acceptance Criteria

**Date:** 2026-11-19  
**Status:** Revised for Final Security Boundary Clarifications (`BATCH-03.0-FINAL-SECURITY-BOUNDARY-CLARIFICATIONS`)

---

## 1. Batch 03.0 Documentation Validation *(Completed in Batch 03.0)*

| Criterion | Status | Evidence Location |
|---|---|---|
| Existing AI implementation mapped accurately | **Met** | `BATCH_03_0_EXISTING_AI_CAPABILITIES.md` |
| Existing 35+ table farm database assessed (incl. `public.machinery_telemetry`) | **Met** | `BATCH_03_0_FARM_DATA_INVENTORY.md` |
| Existing functionality distinguished from proposed functionality | **Met** | `BATCH_03_0_BASELINE_DISCOVERY.md` vs `BATCH_03_0_TARGET_ARCHITECTURE.md` |
| Farm context architecture defines 8-domain conflict rules, `soil_test_age_days`, and `machinery_telemetry` | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §2 & `ADR-001`, `ADR-007` |
| Persistent memory defines `NOT NULL memory_scope`, ownership/attribution separation & lifecycle | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §3 & `ADR-002` |
| Two-pathway AI audit contract & `private.write_ai_audit_event` vs. `record_ai_feedback` defined | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §4, `SECURITY_AND_GOVERNANCE.md` §1, `ADR-005` |
| Enforceable `private.ai_actor_directory` grants (`service_role` revoked on table & internal fns) defined | **Met** | `SECURITY_AND_GOVERNANCE.md` §1 & `ADR-005`, `ADR-009` |
| Verifiable `pg_cron` identity (`service_role` revoked on cron wrapper, `private.ai_scheduled_jobs`) defined | **Met** | `SECURITY_AND_GOVERNANCE.md` §1 & `ADR-005` |
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

### B. Trusted AI Audit-Writer & Feedback Boundary (`[Batch 03.1]`)
6. **Authenticated RPC fabrication blocked:** `PUBLIC`, `anon`, and `authenticated` have zero `EXECUTE` privileges on `private.write_ai_audit_event`, preventing clients from fabricating AI model executions, provider/model/prompt metadata, or guardrail passes.
7. **Human feedback strictly scoped:** `public.record_ai_feedback` allows only `accepted | rejected | modified` for an existing `trace_id` under `can_view_farm(farm_id)` and `auth.uid()`, and cannot alter provider, model, prompt version, guardrail result, system actor, or original execution outcome.
8. **Payload allowlist, trusted server boundary & fail-loud:** Invalid event types/payloads are rejected; unrelated `service_role` routes do not call `private.write_ai_audit_event`; audit-write failures fail closed rather than silently succeeding; `public.ai_audit_events` rejects `UPDATE`/`DELETE` via `private.forbid_change()`.

### C. `private.ai_actor_directory` Privilege Enforcement (`[Batch 03.1/03.2]`)
9. **Direct table access revoked for all non-owner roles:** `PUBLIC`, `anon`, `authenticated`, and `service_role` have zero direct table privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on `private.ai_actor_directory` (verified via pgTAP `has_table_privilege`).
10. **Restricted 3-function interface & deletion isolation:** `private.resolve_or_create_ai_actor` and `private.anonymise_ai_actor` revoke `EXECUTE` from `PUBLIC`, `anon`, `authenticated`, and `service_role` (callable only internally via `postgres`-owned `write_ai_audit_event` and `execute_account_deletion`), preventing unrelated `service_role` code from anonymising or creating identities directly.
11. **Single-row lookup, idempotency & non-reactivation:** `private.lookup_ai_actor_subject` returns at most one authorised subject (no bulk enumeration); `execute_account_deletion` anonymises idempotently (`profile_id = NULL, deleted_at`); deleted mappings cannot be reactivated; `public.ai_audit_events` remains untouched.

### D. Verifiable PostgreSQL Scheduled-Job Identity (`[Batch 03.3]`)
12. **Empty JWT alone rejected & HTTP/service-role blocked:** Scheduled-job `private.*` wrappers revoke `EXECUTE` from `PUBLIC`, `anon`, `authenticated`, AND `service_role`, proving an empty JWT claim is never relied upon alone and HTTP `service_role` callers cannot invoke system-event wrappers.
13. **Registered job allowlist, non-spoofing & idempotency:** Unregistered or disabled jobs in `cron.job` / `private.ai_scheduled_jobs` fail closed; clients cannot spoof `system_job_name`; registered jobs create only their `allowed_event_kinds`; retries are idempotent on `(job_name, run_window)` without duplicate audit rows; system jobs cannot impersonate humans or read `private.ai_actor_directory` generally.

### E. Provenance, Soil Staleness, Machinery Telemetry, Prompt Rollback & `pgvector` (`[Batch 03.1/03.2/03.5]`)
14. **Soil-test staleness (`[Batch 03.1]`):** `soil_test_age_days = current_date - tested_on > approved_validity_days` (`365` provisional, `[Requires Agronomy Validation]`) marks tests `stale`; `tested_on > current_date` is `invalid_rejected`; `tested_on IS NULL` is `missing` (never `0` or current).
15. **Machinery telemetry provenance (`[Batch 03.1/03.3]`):** Uses verified `public.machinery_telemetry` (`machinery_id` linked to `farm_machinery_assets`, cross-farm telemetry blocked); invalid/non-monotonic sensor readings cannot silently override `farm_machinery_usage_logs`; conflicts are exposed as `conflicting`; historical readings remain traceable.
16. **Prompt-version rollback (`[Batch 03.1]`):** Immutable prompt artefacts + controlled active-version pointer pass pre-activation validation, switch back to a previously approved version on rollback, and record activation/rollback in `admin_actions`/`audit_log`.
17. **Provisional `pgvector` benchmark gate (`[Batch 03.1/03.2]`):** Measure retrieval latency separately from embedding generation and LLM inference under realistic Staging volumes, dimensions, HNSW config, RLS filtering, and concurrency to validate or revise the provisional `< 50 ms` p95 target.
