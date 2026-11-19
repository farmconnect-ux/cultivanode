# Batch 03.0 — Acceptance Criteria

**Date:** 2026-11-19  
**Status:** Revised for PR #12 Independent Review Remediation

---

## 1. Batch 03.0 Documentation Validation *(Completed in Batch 03.0)*

| Criterion | Status | Evidence Location |
|---|---|---|
| Existing AI implementation mapped accurately | **Met** | `BATCH_03_0_EXISTING_AI_CAPABILITIES.md` |
| Existing 35+ table farm database assessed (incl. `public.machinery_telemetry`) | **Met** | `BATCH_03_0_FARM_DATA_INVENTORY.md` |
| Existing functionality distinguished from proposed functionality | **Met** | `BATCH_03_0_BASELINE_DISCOVERY.md` vs `BATCH_03_0_TARGET_ARCHITECTURE.md` |
| Farm context architecture defines 8-domain rules, `soil_test_age_days`, agronomist factors & `machinery_telemetry` | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §2 & `ADR-001`, `ADR-007` |
| Persistent memory defines `NOT NULL memory_scope`, ownership/attribution separation & lifecycle | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §3 & `ADR-002` |
| Two-pathway AI audit contract & `ai-audit.ts` application boundary limitation documented | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §4, `SECURITY_AND_GOVERNANCE.md` §1, `ADR-005` |
| `private.ai_actor_directory` `service_role` table/function revokes + audited `compliance_lookup_ai_actor` defined | **Met** | `SECURITY_AND_GOVERNANCE.md` §1 & `ADR-005`, `ADR-009` |
| Restricted scheduler boundary & Batch 03.3 `cultivanode_scheduler` verification criteria defined | **Met** | `SECURITY_AND_GOVERNANCE.md` §1 & `ADR-005` |
| Batch 03.1 remediation register (`ai-vision.ts`, `aldrin`, `ground/route.ts`, `fertiliser/route.ts`) preserved | **Met** | `BATCH_03_0_IMPLEMENTATION_ROADMAP.md` §1 |
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
8. **Payload allowlist, trusted server boundary & fail-loud:** Invalid event types/payloads are rejected; unrelated server routes are blocked by lint/review from calling `private.write_ai_audit_event`; audit-write failures fail closed rather than silently succeeding; `public.ai_audit_events` rejects `UPDATE`/`DELETE` via `private.forbid_change()`.

### C. `private.ai_actor_directory` Privilege Enforcement & Compliance Lookup (`[Batch 03.1/03.2]`)
9. **Direct table & internal function access revoked:** `PUBLIC`, `anon`, `authenticated`, and `service_role` have zero direct table privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on `private.ai_actor_directory`, and zero `EXECUTE` on `private.resolve_or_create_ai_actor`, `private.anonymise_ai_actor`, and `private.lookup_ai_actor_subject` (preventing `service_role` bulk enumeration).
10. **Narrowly scoped, concurrency-safe, audited compliance lookup (`[Batch 03.1/03.2]` — planned, not yet executed):**
    - `public.compliance_lookup_ai_actor` requires `public.has_permission('audit.read')`, `account_active`, and validated non-empty `p_purpose`, and returns only the minimum authorised compliance fields (`actor_subject_id`, `actor_kind`, `profile_id`, `deleted_at`).
    - Rate limiting is keyed to the **requesting compliance principal (`auth.uid()`)** so rotating `p_actor_subject_id` across calls cannot bypass the principal's limit, paired with a secondary **system-wide compliance ceiling** across principals.
    - Concurrent requests are serialised atomically inside PostgreSQL (`private.ai_compliance_lookup_limits` with `FOR UPDATE` / `pg_advisory_xact_lock`) and cannot exceed configured thresholds through race conditions (verified via concurrency test).
    - Every attempt (`permitted`, `denied`, `throttled`, `failed`) is recorded in `public.audit_log` without rollback loss on denied/throttled outcomes, and any audit-insert failure fails closed without returning actor data.
    - Numerical thresholds (`10`/15m per principal, `5`/15m denied, `30`/15m system-wide) remain configurable engineering defaults subject to security/operational review prior to production enforcement.
11. **Idempotent deletion & non-reactivation:** `execute_account_deletion` anonymises idempotently via internal `private.anonymise_ai_actor()` (`profile_id = NULL, deleted_at`); deleted mappings cannot be restored; `public.ai_audit_events` remains untouched.

### D. Scheduled-Job Identity & Staging Verification (`[Batch 03.3]`)
12. **Empty JWT alone rejected & HTTP/service-role blocked:** Scheduled-job `private.*` wrappers revoke `EXECUTE` from `PUBLIC`, `anon`, `authenticated`, AND `service_role`; unregistered/disabled jobs fail closed; retries are idempotent on `(job_name, run_window)`; system jobs cannot impersonate humans or access `private.ai_actor_directory`.
13. **Staging dedicated-role verification (`cultivanode_scheduler`):** Test on `CultivaNode-Staging` whether a dedicated non-`BYPASSRLS` role `cultivanode_scheduler` can be created and assigned via `cron.alter_job`, executes `pg_cron` jobs with minimal permissions (no `BYPASSRLS`), blocks `service_role`, handles failures/retries safely, and distinguishes scheduled execution from manual `postgres` sessions (or documents the fallback limitation if Supabase Hosted disallows custom `pg_cron` roles).

### E. Batch 03.1 Application Remediations, Provenance, Rollback & `pgvector` (`[Batch 03.1/03.2/03.5]`)
14. **AI Vision Guardrail & `aldrin` (`[Batch 03.1]`):** `ai-vision.ts` validates every user-visible field (`summary`, `likely`, `actions`, checks, safety notices), returns a complete safe response on failure, covers `aldrin` and banned substances in `chemical-guardrail.ts`, tests warnings vs. recommendations separately, and fails safely if guardrail execution fails.
15. **AI Grounding Identity Binding (`[Batch 03.1]`):** `/api/engines/ai/ground` and `LiveFarmContextService` derive actor identity strictly from verified server auth context (never trusting client `farmerId`), validate farm membership/permissions per farm, and reject mismatched/cross-tenant identifiers.
16. **Fertiliser Schema Contract (`[Batch 03.1]`):** `/api/engines/agronomy/fertiliser` aligns with `SoilNutrientProfile` (`pH`, `organicMatterPercent`, optional nutrient handling without `NaN`, missing != zero) with unit tests for incomplete, invalid, and complete profiles.
17. **Soil-test staleness (`[Batch 03.1]`):** `soil_test_age_days = current_date - tested_on > approved_validity_days` (`365` provisional, awaiting qualified agronomist/soil-scientist approval) marks tests `stale`; `tested_on > current_date` is `invalid_rejected`; `tested_on IS NULL` is `missing`.
18. **Machinery telemetry provenance (`[Batch 03.1/03.3]`):** Uses verified `public.machinery_telemetry` (`machinery_id` linked to `farm_machinery_assets`, cross-farm telemetry blocked); invalid/non-monotonic readings cannot silently override `farm_machinery_usage_logs`; conflicts are exposed as `conflicting`.
19. **Prompt-version rollback (`[Batch 03.1]`):** Immutable prompt artefacts + controlled active-version pointer pass pre-activation validation, switch back to a previously approved version on rollback, and record activation/rollback in `admin_actions`/`audit_log`.
20. **Provisional `pgvector` benchmark gate (`[Batch 03.1/03.2]`):** Measure retrieval latency separately from embedding generation and LLM inference under realistic Staging volumes, dimensions, HNSW config, RLS filtering, and concurrency to validate or revise the provisional `< 50 ms` p95 target.
