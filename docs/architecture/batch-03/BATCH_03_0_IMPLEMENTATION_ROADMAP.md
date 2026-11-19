# Batch 03.0 — Implementation Roadmap & Operational Considerations

**Date:** 2026-11-19  
**Status:** Revised for Batch 03.0 Identity & Memory Controls  
**Constraint:** No Batch 03.1+ code or migrations are implemented in Batch 03.0.

---

## 1. Prerequisites Before Starting Batch 03.1
1. **Batch 01 Marketplace Reconciliation:** Cherry-pick the `12` post-merge commits (`8ee4f43`..`a8e47dc`) from `origin/security/batch-01-marketplace-hardening` into `main` so local `supabase/migrations/` and Staging match (`5` marketplace migrations).
2. **Existing Code Hygiene Fixes (Scoped):**
   - Fix `FertiliserSchema` field mismatch (`ph`/`pH`, `organicMatterPct`/`organicMatterPercent`) in `apps/web/src/app/api/engines/agronomy/fertiliser/route.ts`.
   - Fix `ai-vision.ts:158` so guardrail failure sanitises `summary`/`likely` as well as `actions`, and add `aldrin` to `BANNED_CHEMICALS_REGISTRY`.
   - Bind `farmerId` to `auth.user.sub` in `/api/engines/ai/ground/route.ts`.
   - Fix hardcoded `provider: "nimet"` in `apps/web/src/lib/weather.ts:202`.

---

## 2. Phased Implementation Roadmap

| Phase | Scope | Key Deliverables |
|---|---|---|
| **Batch 03.1: Schema Hygiene, Context Service & Audit Register** | Non-breaking DB foundations + server-side Context Retriever | Enable `pgvector` (run Staging capacity & provisional `< 50 ms` latency measurement gate per `ADR-003`); add `private.ai_actor_directory` + append-only `public.ai_audit_events` + JWT-validated `SECURITY DEFINER` audit writer; add `consents` `'ai_intelligence'` enum value; build `LiveFarmContextService` (RLS-scoped, 8-domain precedence, 7 context states); fix `/api/engines/agronomy/fertiliser` & `ai-vision.ts` guardrail; add unit + pgTAP tests. |
| **Batch 03.2: Persistent Farm Memory & Published Standards RAG** | Dual-scope `farm_memory_items` + server-mediated Memory Write Service | Create `farm_memory_items` (`memory_scope` `NOT NULL`: `'farm'`/`'profile'`, ownership vs. `created_by`/`confirmed_by`/`updated_by` attribution, `CHECK` constraints, RLS, `embedding_model`/`embedding_version`); implement server-side Memory Write Service (consent + scope + `can_edit_farm` validation); replace static `draft` `grounding.ts` with DB `farm_agronomic_standards` (`status = 'published'`) + `pgvector` recall; align `account-deletion` to delete `scope='profile'` memory, null deleted user attribution on surviving `'farm'` memory, and idempotently anonymise `private.ai_actor_directory.profile_id`. |
| **Batch 03.3: Proactive Monitoring & IoT/Offline Bridge** | Event-driven & scheduled farm intelligence | Unify `apps/mobile/src/lib/outbox.ts` with `packages/shared/src/engines/offline-sync/`; wire `packages/iot` persistence to Supabase `telemetry_readings`; fix `sync_approved_iot_to_crop_measurements`; add scheduled weather/telemetry/crop-cycle anomaly evaluator emitting `crop_alerts` with `actor_kind = 'system'` audit traces. |
| **Batch 03.4: Human-Approved Action Proposals (HITL)** | Permissioned action queue (no unsupervised autonomy) | Add `ai_action_proposals` table + RLS policies on `device_commands`; require explicit `can_edit_farm` approval, rate/budget caps, and compensating rollback hooks before executing any irrigation/task/command action. |
| **Batch 03.5: Evaluation Harness & Agronomy Sign-Off** | Quality, hallucination, latency & cost gates | Expand `ai-assistant.test.ts` into a full Nigerian crop/soil/pest golden-dataset eval harness (`en`/`yo`/`pcm`) + vision benchmark + measured `pgvector` latency/cost validation before enabling `ai_photo_diagnosis` or proactive FIE in Production. |

---

## 3. Cost & Operational Considerations
- **Supabase Free → Pro boundary:** `pgvector` extension availability in Postgres does **not** mean zero total cost. Embeddings, HNSW index RAM/disk, query compute, WAL/backup growth, and embedding-provider API calls must be measured against the `500 MB` Supabase Free DB limit before Batch 03.2 production rollout (see `ADR-003`).
- **LLM Cost Control:** Keep deterministic `packages/shared/src/engines/{agronomy,inputs}` calculators for numeric NPK/spray/schedule math and invoke LLMs only for synthesis, multimodal scouting diagnosis, and natural-language explanation (`en`/`yo`/`pcm`).
- **Vercel Cron:** Hobby plan allows 1 daily cron; proactive sub-daily farm monitoring in Batch 03.3 should use Supabase `pg_cron` / Edge Functions or a dedicated worker queue rather than Vercel Hobby cron.
