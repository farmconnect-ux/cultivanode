# Batch 03.0 — Implementation Roadmap & Operational Considerations

**Date:** 2026-11-19  
**Status:** Revised for PR #12 Independent Review Remediation  
**Constraint:** No Batch 03.1+ code or migrations are implemented in Batch 03.0.

---

## 1. Prerequisites & Batch 03.1 Remediation Register
1. **Batch 01 Marketplace Reconciliation:** Cherry-pick the `12` post-merge commits (`8ee4f43`..`a8e47dc`) from `origin/security/batch-01-marketplace-hardening` into `main` so local `supabase/migrations/` and Staging match (`5` marketplace migrations).
2. **Scoped Batch 03.1 Application Remediation Items (Verified in Source):**
   - **AI Vision Chemical Guardrail (`apps/web/src/lib/ai-vision.ts:158` & `packages/shared/src/engines/ai-assistant/chemical-guardrail.ts:4`):** Currently replaces only `diagnosis.actions` on guardrail failure (leaving `summary`, `likely`, etc. exposed) and omits `aldrin` from `BANNED_CHEMICALS_NAMES`. Batch 03.1 must validate every user-visible field, return a complete safe response on failure, add `aldrin` regression coverage, test warnings vs. recommendations separately, preserve safe advice where separable, and fail safely if the guardrail cannot execute.
   - **AI Grounding Identity Boundary (`apps/web/src/app/api/engines/ai/ground/route.ts`):** Currently serves static agronomic grounding and accepts client-supplied `context.farmerId` without binding to the authenticated user (an identity/authorisation boundary defect, not a demonstrated DB disclosure). Batch 03.1 must bind identity from verified server auth context, validate farm membership/permissions for every requested farm, and apply the same boundary to live context, memory, and audit.
   - **Fertiliser Schema Mismatch (`apps/web/src/app/api/engines/agronomy/fertiliser/route.ts:10-16,31` vs `packages/shared/src/engines/inputs/fertiliser.ts:31-40`):** Confirmed in source — API uses `ph`, `organicMatterPct`, and optional `phosphorusPpm`/`potassiumPpm` while `SoilNutrientProfile` expects `pH`, `organicMatterPercent`, and required `phosphorusPpm`/`potassiumPpm` (yielding `NaN` deficits when omitted). Batch 03.1 must unify the contract, distinguish missing from zero, and test incomplete/invalid/complete profiles.
   - **Weather Fallback Provider Label (`apps/web/src/lib/weather.ts:202`):** Fix hardcoded `provider: "nimet"` in Open-Meteo fallback.

---

## 2. Phased Implementation Roadmap

| Phase | Scope | Key Deliverables |
|---|---|---|
| **Batch 03.1: Schema Hygiene, Context Service & Audit Register** | Non-breaking DB foundations + server-side Context Retriever + §1 remediations | Enable `pgvector` (run Staging capacity & provisional `< 50 ms` latency measurement gate per `ADR-003`); add `private.ai_actor_directory` (`service_role` revoked on table & `resolve_or_create`/`anonymise`/`lookup_ai_actor_subject`) + `private.ai_compliance_lookup_limits` + `public.compliance_lookup_ai_actor` (`audit.read`, atomic principal-keyed & system-wide DB rate limits, non-recursive `audit_log` recording); add append-only `public.ai_audit_events` + `private.write_ai_audit_event` (isolated in `apps/web/src/lib/ai-audit.ts`) + `public.record_ai_feedback`; add immutable prompt artefacts + active pointer (`ADR-006`); add `consents` `'ai_intelligence'`; build `LiveFarmContextService` (RLS-scoped, 8-domain precedence, agronomist-validated `soil_test_age_days`, `machinery_telemetry`, 7 context states); complete §1 remediations + unit/pgTAP tests. |
| **Batch 03.2: Persistent Farm Memory & Published Standards RAG** | Dual-scope `farm_memory_items` + server-mediated Memory Write Service | Create `farm_memory_items` (`memory_scope` `NOT NULL`: `'farm'`/`'profile'`, ownership vs. `created_by`/`confirmed_by`/`updated_by` attribution, `CHECK` constraints, RLS, `embedding_model`/`embedding_version`); implement server-side Memory Write Service (consent + scope + `can_edit_farm` validation); replace static `draft` `grounding.ts` with DB `farm_agronomic_standards` (`status = 'published'`) + `pgvector` recall; align `account-deletion` to delete `scope='profile'` memory, null deleted user attribution on surviving `'farm'` memory, and invoke `private.anonymise_ai_actor()`. |
| **Batch 03.3: Proactive Monitoring & IoT/Offline Bridge** | Event-driven & scheduled farm intelligence | Unify `apps/mobile/src/lib/outbox.ts` with `packages/shared/src/engines/offline-sync/`; wire `packages/iot` persistence to Supabase `telemetry_readings`; fix `sync_approved_iot_to_crop_measurements`; add `pg_cron` jobs + `private.ai_scheduled_jobs` allowlist + `service_role`-revoked `private.*` wrapper (including Staging verification of dedicated `cultivanode_scheduler` role via `cron.alter_job`) emitting idempotent `actor_kind = 'system'` audit traces. |
| **Batch 03.4: Human-Approved Action Proposals (HITL)** | Permissioned action queue (no unsupervised autonomy) | Add `ai_action_proposals` table + RLS policies on `device_commands`; require explicit `can_edit_farm` approval, rate/budget caps, and compensating rollback hooks before executing any irrigation/task/command action. |
| **Batch 03.5: Evaluation Harness & Agronomy Sign-Off** | Quality, hallucination, latency & cost gates | Expand `ai-assistant.test.ts` into a full Nigerian crop/soil/pest golden-dataset eval harness (`en`/`yo`/`pcm`) + vision benchmark + measured `pgvector` latency/cost validation before enabling `ai_photo_diagnosis` or proactive FIE in Production. |

---

## 3. Cost & Operational Considerations
- **Supabase Free → Pro boundary:** `pgvector` extension availability in Postgres does **not** mean zero total cost. Embeddings, HNSW index RAM/disk, query compute, WAL/backup growth, and embedding-provider API calls must be measured against the `500 MB` Supabase Free DB limit before Batch 03.2 production rollout (see `ADR-003`).
- **LLM Cost Control:** Keep deterministic `packages/shared/src/engines/{agronomy,inputs}` calculators for numeric NPK/spray/schedule math and invoke LLMs only for synthesis, multimodal scouting diagnosis, and natural-language explanation (`en`/`yo`/`pcm`).
- **Vercel Cron:** Hobby plan allows 1 daily cron; proactive sub-daily farm monitoring in Batch 03.3 should use Supabase `pg_cron` (`private.ai_scheduled_jobs`) rather than Vercel Hobby cron.
