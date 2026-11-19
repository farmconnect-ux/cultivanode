# CultivaNode 3.0 — Batch 03.1 Final Implementation Handover

**Date:** 2026-11-19  
**Repository:** `farmconnect-ux/cultivanode`  
**Programme:** CultivaNode 3.0 — Batch 03.1 (Schema Hygiene, Context Service & Audit Register)  
**Architecture Baseline:** PR #12 merged on `main` @ `0f3ee8d49f5ce774ce52a79052be6bdc740e7534` (`docs/architecture/batch-03/` + `ADR-001` through `ADR-010`)  
**Preflight Source of Truth:** `BATCH_03_1_IMPLEMENTATION_READINESS.md`, `BATCH_03_1_DEPENDENCY_REGISTER.md`, `BATCH_03_1_MIGRATION_REGISTER.md`, `BATCH_03_1_TESTING_BASELINE.md`, `BATCH_03_1_IMPLEMENTATION_SEQUENCE.md`  
**Execution Status:** **HANDOVER ONLY — BATCH 03.1 IMPLEMENTATION HAS NOT STARTED.**

---

## 1. Batch 03.1 Objectives

Establish the non-breaking security, governance, application-remediation, and PostgreSQL database foundations required for CultivaNode's **Live Farm Context**, **Persistent Farm Memory (Batch 03.2)**, and **AI Audit Register**:

1. **Remediate verified application defects** in existing AI vision guardrails, shared chemical safety rules, AI grounding identity/authorisation boundaries, fertiliser API/engine contracts, and weather fallback attribution.
2. **Establish database foundations (`M1`–`M5`):** `pgvector` enablement, `'ai_intelligence'` consent integration, `private.ai_actor_directory` (with `service_role` table/function revocation and `execute_account_deletion` anonymisation), append-only `public.ai_audit_events` + trusted server writer + scoped human feedback RPC, atomically rate-limited `public.compliance_lookup_ai_actor`, and immutable `ai_prompt_versions` + audited active-pointer rollback.
3. **Implement the trusted server-side AI audit client** (`apps/web/src/lib/ai-audit.ts`) and **RLS-scoped `LiveFarmContextService`** across all 8 canonical farm data domains and 7 explicit context states.

---

## 2. Existing Dependencies & Confirmed Application Defects

### 2.1 Prerequisite Blocker: PR #13 (Batch 01 Marketplace Reconciliation)
- **Current status:** PR #13 (`chore/reconcile-batch-01-marketplace-commits` -> `main`) is **OPEN and unmerged** with full green CI (Run `44587234505`: `22` pgTAP files / `812` assertions including `44/44` in `19_marketplace_order_security.test.sql`, `12/12` concurrency, `5/5` Storage, `6/6` API/DB, `4/4` typecheck, lint, unit tests, and build).
- **Why PR #13 completion is a prerequisite:**
  1. PR #13 reconciles the 12 post-merge marketplace commits (`8ee4f43`..`a8e47dc`) and 5 SQL migrations (`20261117130000`–`20261117190000`) into `main`, resolving chronological replay inversion (`170000` -> `190000`) and the `ready_for_pickup -> dispatched` inventory double-settlement bug.
  2. Following PR #13 merge, a separate explicitly authorised Staging reconciliation operation must align `CultivaNode-Staging` (`xdbqndgwisshhjqqksbe`) `supabase_migrations.schema_migrations` (`migration repair` for `130000`/`150000`/`160000`/`180000` + selective apply of updated `190000` `seller_update_fulfilment`). **Batch 03.1 DB migrations (`M1`–`M5`) must not be applied to Staging until PR #13 is merged and Staging history is aligned.**

### 2.2 Confirmed Source Defects vs. Architectural Risks

| Category | Item | Exact Location | Classification | Required Batch 03.1 Remediation |
|---|---|---|---|---|
| **Confirmed Defect** | AI vision incomplete sanitisation & guardrail fail-open fallthrough | `apps/web/src/lib/ai-vision.ts:158-165, 183-193` | **Confirmed source defect** | Validate every user-visible field (`summary`, `likely`, `checks`, `actions`, `see_expert_if`, `safety`); return complete safe response on failure; fail closed if guardrail execution throws rather than falling through to another provider. |
| **Confirmed Defect** | Missing `aldrin` in shared banned chemical list | `packages/shared/src/engines/ai-assistant/chemical-guardrail.ts:4` | **Confirmed source defect** | Add `'aldrin'` to `BANNED_CHEMICAL_NAMES`; maintain sentence-level warning vs. recommendation separation; preserve safe cultural/mechanical advice where safely separable; fail safely on error/malformed input. |
| **Confirmed Defect** | AI grounding accepts untrusted client `context.farmerId` | `apps/web/src/app/api/engines/ai/ground/route.ts:8-30` | **Confirmed identity/authorisation boundary defect** *(not a demonstrated DB disclosure)* | Bind actor identity strictly from verified server auth context; reject mismatched identifiers (`403`); validate farm membership (`can_view_farm`) for every requested farm. |
| **Confirmed Defect** | Fertiliser API / shared engine schema mismatch (`NaN` & ignored `ph`) | `apps/web/src/app/api/engines/agronomy/fertiliser/route.ts:10-16,31` vs `packages/shared/src/engines/inputs/fertiliser.ts:31-60` | **Confirmed source defect** | Unify `pH` / `organicMatterPercent` contract; ensure omitted nutrients (`phosphorusPpm`, `potassiumPpm`, `pH`) produce explicit missing-data signalling — **never `NaN` and never silently `0`**. |
| **Confirmed Defect** | Open-Meteo fallback hardcodes `provider: "nimet"` | `apps/web/src/lib/weather.ts:202` | **Confirmed source defect** | Attribute Open-Meteo fallback accurately once canonical provider string is approved (see §6). |
| **Architectural Risk** | Shared `SUPABASE_SECRET_KEY` (`service_role`) across `apps/web` | `apps/web/src/lib/ai-audit.ts` (planned) | **Documented architectural limitation (`ADR-005`)** | Isolate `private.write_ai_audit_event` strictly in `apps/web/src/lib/ai-audit.ts` via ESLint + review; revoke `service_role` from `private.ai_actor_directory` and its 3 internal functions in PostgreSQL. |
| **Architectural Risk** | `pgvector` resource footprint vs. Supabase Free `500 MB` ceiling | Staging (`xdbqndgwisshhjqqksbe`), `ADR-003` | **Operational capacity risk** | Enable `vector` (`0.8.2`) in `M1` and execute Staging capacity + provisional `< 50 ms` p95 latency benchmark before Batch 03.2 production rollout. |

---

## 3. Database Implementation Sequence (`M1`–`M5`)

All Batch 03.1 migrations use timestamps strictly greater than `20261119005153` (highest Staging `schema_migrations` version), never duplicate marketplace or Batch 02 migrations, and must never be deployed via indiscriminate `supabase db push`.

| Seq | Filename | Core Objects & Security Contract | Dependencies | pgTAP / Concurrency Tests |
|---|---|---|---|---|
| **M1** | `20261120000000_batch_03_1_pgvector_and_ai_consent.sql` | `CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;` + `ALTER TYPE public.consent_type ADD VALUE IF NOT EXISTS 'ai_intelligence';` (isolated from DML referencing the new enum value). | `extensions` schema; `public.consent_type`; `public.consents` | `23_batch_03_1_foundations.test.sql` |
| **M2** | `20261120010000_batch_03_1_ai_actor_directory.sql` | `private.ai_actor_directory` (owned by `postgres`, RLS enabled, `REVOKE ALL` from `PUBLIC, anon, authenticated, service_role`); internal `private.resolve_or_create_ai_actor(uuid)`, `private.anonymise_ai_actor(uuid)`, `private.lookup_ai_actor_subject(uuid)` (`service_role` revoked, `SECURITY DEFINER SET search_path = ''`); idempotent `PERFORM private.anonymise_ai_actor(v_user_id)` integrated into `execute_account_deletion` preserving `20261118050000` lease-fencing. | `M1`, `public.profiles`, `execute_account_deletion` (`20261118050000`) | `24_batch_03_1_ai_actor_security.test.sql` + existing `22_batch_02_5_account_deletion.test.sql` |
| **M3** | `20261120020000_batch_03_1_ai_audit_events.sql` | Append-only `public.ai_audit_events` (`BEFORE UPDATE OR DELETE` trigger `private.forbid_change()`, RLS `SELECT` via `can_view_farm`); `private.write_ai_audit_event(...)` (`PUBLIC, anon, authenticated` revoked; `service_role` granted); `public.record_ai_feedback(...)` (`authenticated` only, enforces `account_active`, `can_view_farm`, existing `trace_id`, `outcome IN ('accepted','rejected','modified')`). | `M2`, `private.forbid_change()`, `private.account_active()`, `private.can_view_farm()` | `25_batch_03_1_ai_audit_register.test.sql` |
| **M4** | `20261120030000_batch_03_1_compliance_lookup_rpc.sql` | `private.ai_compliance_lookup_limits` (`REVOKE ALL` from `PUBLIC, anon, authenticated, service_role`); `public.compliance_lookup_ai_actor(p_actor_subject_id uuid, p_purpose text)` (`authenticated` only, enforces `has_permission('audit.read')`, `account_active`, non-empty `p_purpose`, atomic PostgreSQL `FOR UPDATE`/`pg_advisory_xact_lock` principal-keyed + system-wide rate limits, non-recursive `public.audit_log` write for every outcome without rollback loss on denied/throttled). | `M2`, `public.has_permission('audit.read')`, `public.audit_log` | `26_batch_03_1_compliance_lookup.test.sql` + DB concurrency test |
| **M5** | `20261120040000_batch_03_1_prompt_versioning.sql` | Immutable `public.ai_prompt_versions` (`private.forbid_change()`); `public.ai_prompt_active_pointers`; audited admin RPC `public.set_active_ai_prompt_version(p_prompt_key, p_version_id, p_reason)` supporting pre-activation validation and controlled rollback logged to `public.audit_log`. | `private.forbid_change()`, `public.has_permission(...)`, `public.audit_log` | `27_batch_03_1_prompt_versioning.test.sql` |

---

## 4. Application Workstreams & Inter-Dependencies

Application remediations are intentionally separated from database foundations so Workstream A can proceed cleanly without blocking on DB migrations:

1. **Workstream A (Application Remediation — Zero DB Migrations):** Fixes `chemical-guardrail.ts`, `ai-vision.ts`, `/api/engines/ai/ground`, `/api/engines/agronomy/fertiliser` + `fertiliser.ts`, and `weather.ts` with full unit/route test suites.
2. **Workstream D + C-DB (Database Foundations & Audit Schema):** Lands `M1`–`M5` and pgTAP `23`–`27` + compliance lookup concurrency tests. Requires PR #13 merged and Staging aligned.
3. **Workstream C-App (Trusted AI Audit Client):** Implements `apps/web/src/lib/ai-audit.ts` (centralised caller for `private.write_ai_audit_event`, Zod allowlist, secret/raw-image stripping, fail-closed error handling) + ESLint boundary rule + feedback/compliance wiring. Depends on **M2–M5**.
4. **Workstream B (Live Farm Context Service):** Implements `packages/shared/src/engines/farm-context/` (canonical types, 7 context states, 8-domain precedence) and `apps/web/src/lib/farm-context/live-farm-context.service.ts` (user-JWT RLS retrieval via `createClient()`, `can_view_farm`, `soil_test_age_days`, `machinery_telemetry`, conflict/missing surfacing, zero `service_role` reads). Depends on **Workstream A** (`missing != 0`, weather attribution) and **M1–M3**; provides the verified context contract consumed by **Batch 03.2 Persistent Farm Memory** (`farm_memory_items` dual-scope `memory_scope IN ('farm','profile')`, `ADR-002`).

---

## 5. Security & Governance Carry-Forward (Batch 03.0 & ADR-001..ADR-010)

All Batch 03.1 workstreams must preserve the Batch 03.0 13-threat model (`BATCH_03_0_SECURITY_AND_GOVERNANCE.md`) and ADRs:
- **Tenant Isolation & RLS (`ADR-004`):** Interactive farm context reads run strictly under the caller's verified Supabase JWT (`auth.uid()`, `private.can_view_farm(farm_id)`). Never trust client-supplied `farmerId` or expose `service_role` credentials to clients.
- **Consent (`M1`, `ADR-009`):** Require active `'ai_intelligence'` consent in `public.consents` before AI intelligence processing; fail closed on missing/withdrawn consent.
- **Actor Identity & Directory Protection (`ADR-005`, `ADR-009`):** `private.ai_actor_directory` and its 3 internal functions revoke all privileges from `PUBLIC, anon, authenticated, service_role`. Compliance lookups occur solely through audited, atomically DB-rate-limited `public.compliance_lookup_ai_actor`.
- **Audit Integrity (`ADR-005`):** `public.ai_audit_events` is strictly append-only (`private.forbid_change()`); clients cannot call `private.write_ai_audit_event`; human feedback (`public.record_ai_feedback`) cannot alter provider, model, prompt version, guardrail result, or system actor.
- **Account Deletion (`ADR-009`):** `execute_account_deletion` anonymises `private.ai_actor_directory` idempotently (`profile_id = NULL, deleted_at`) while leaving `public.ai_audit_events` immutable and intact.
- **Data Provenance & Prompt Injection (`ADR-001`, `ADR-006`, `ADR-007`):** Delimit untrusted user/document text; validate structured model outputs with Zod; never treat missing data as `0`; never promote AI inferences to `verified_current`; use immutable validated prompt versions; keep autonomous farm actions disabled in Batch 03.1.

---

## 6. Outstanding Architecture Decisions Requiring Approval Before Implementation

The following provisional items **must not** be silently treated as approved decisions:

1. **Grounding route authentication model (`/api/engines/ai/ground`):** Decide whether to retain `ENGINE_JWT_SECRET` (binding `farmerId = auth.user.sub` + farm-membership check) or migrate directly to Supabase user JWT (`createClient().auth.getUser()`) so the route can invoke `LiveFarmContextService` under RLS.
2. **Prompt activation/rollback permission key (`M5`):** Decide whether `public.set_active_ai_prompt_version` should require an existing admin permission (`super_admin` / `system.settings`) or introduce a dedicated `ai.manage` permission.
3. **Soil-test validity period (`ADR-007`):** `365` days remains **provisional (`[Requires Agronomy Validation]`)** pending qualified agronomist/soil-scientist sign-off.
4. **Compliance lookup rate-limit thresholds (`M4`, `ADR-005`):** `10`/15m per principal, `5`/15m denied per principal, and `30`/15m system-wide remain **provisional engineering defaults** pending security/operational sign-off prior to production enforcement.
5. **Canonical weather fallback provider name (`A5`):** Confirm `"open-meteo"` as the canonical `WeatherResponse.provider` string for Open-Meteo fallback responses (and confirm any UI label adjustments).

---

## 7. Measurable Workstream Acceptance Criteria

| Workstream | Acceptance Criteria |
|---|---|
| **Workstream A (App Remediation)** | Vitest suites prove: `aldrin` + 6 existing banned chemicals blocked; warnings vs. recommendations tested separately; safe advice preserved where separable; guardrail throws fail closed; `ai-vision.ts` sanitises all user-visible fields; `/api/engines/ai/ground` rejects spoofed `farmerId` / unauthorised `farmId` (`403`); `/api/engines/agronomy/fertiliser` handles complete, incomplete, and invalid soil profiles with zero `NaN` and missing != `0`; `weather.ts` returns accurate fallback provider. |
| **Workstream B (Live Farm Context)** | Unit & integration tests prove: user-JWT RLS execution (zero `service_role` reads); cross-farm/cross-org denial (`can_view_farm = false`); all 8 domains and 7 context states; `soil_test_age_days` (`tested_on > current_date` -> `invalid_rejected`; `NULL` -> `missing`); IoT never overrides verified lab soil chemistry; non-monotonic `machinery_telemetry.engine_hours` flagged `conflicting`; AI inference never marked `verified_current`. |
| **Workstream C (AI Audit & Compliance)** | pgTAP `24`–`26` + concurrency test prove: `PUBLIC, anon, authenticated, service_role` denied on `private.ai_actor_directory` and its 3 internal functions; `PUBLIC, anon, authenticated` denied on `private.write_ai_audit_event`; `ai_audit_events` blocks `UPDATE`/`DELETE`; `record_ai_feedback` enforces `can_view_farm`, `account_active`, valid `trace_id`, allowed outcomes; `compliance_lookup_ai_actor` enforces atomic principal-keyed + system-wide limits under concurrency, resists subject-ID rotation, logs every outcome to `public.audit_log` without rollback loss, and fails closed on audit error; `execute_account_deletion` anonymises idempotently (`22` + `24`); ESLint restricts `write_ai_audit_event` to `apps/web/src/lib/ai-audit.ts`. |
| **Workstream D (DB Foundations)** | Clean-DB chronological migration replay (`supabase start`) succeeds; pgTAP `23`, `27`, and `04_function_grants.test.sql` pass with zero `SECURITY DEFINER` regressions; `vector` installed in `extensions`; `'ai_intelligence'` in `public.consent_type`; `ai_prompt_versions` immutable with audited rollback; Staging validation complete without duplicate migrations. |

---

## 8. Execution Boundary Statement

**Batch 03.1 implementation has NOT started.** This handover is a documentation-only preparation artefact and does **not** authorise:
- Merging PR #13,
- Modifying `CultivaNode-Staging` or `CultivaNode-Production` schemas, data, or migration history,
- Creating or applying SQL migrations,
- Modifying application source code, feature flags, environment variables, or secrets, or
- Deploying to Production.

Implementation may proceed only after explicit human review and authorisation of PR #13, the separate post-merge Staging reconciliation operation, and the outstanding decisions in §6.
