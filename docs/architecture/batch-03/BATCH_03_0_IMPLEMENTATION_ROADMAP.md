# Batch 03.0 — Implementation Roadmap & Operational Considerations

**Date:** 2026-11-19  
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
| **Batch 03.1: Schema Hygiene, Context Service & Audit Register** | Non-breaking DB foundations + server-side Context Retriever | Enable `pgvector`; add `ai_audit_events` (append-only); add `consents` `'ai_intelligence'` enum value; build `LiveFarmContextService` (RLS-scoped); fix `/api/engines/agronomy/fertiliser` & `ai-vision.ts` guardrail; add unit + pgTAP tests. |
| **Batch 03.2: Persistent Farm Memory & Published Standards RAG** | 5-category `farm_memory_items` + `pgvector` retrieval | Create `farm_memory_items` table + RLS (`can_view_farm`/`can_edit_farm`); replace static `draft` `grounding.ts` with DB `farm_agronomic_standards` (`status = 'published'`) + `pgvector` recall; wire farmer confirmation/correction/deletion UI; align `account-deletion` to clean up personal preference memory & anonymise `ai_audit_events`. |
| **Batch 03.3: Proactive Monitoring & IoT/Offline Bridge** | Event-driven & scheduled farm intelligence | Unify `apps/mobile/src/lib/outbox.ts` with `packages/shared/src/engines/offline-sync/`; wire `packages/iot` persistence to Supabase `telemetry_readings`; fix `sync_approved_iot_to_crop_measurements`; add scheduled weather/telemetry/crop-cycle anomaly evaluator emitting `crop_alerts` with `trace_id`. |
| **Batch 03.4: Human-Approved Action Proposals (HITL)** | Permissioned action queue (no unsupervised autonomy) | Add `ai_action_proposals` table + RLS policies on `device_commands`; require explicit `can_edit_farm` approval, rate/budget caps, and compensating rollback hooks before executing any irrigation/task/command action. |
| **Batch 03.5: Evaluation Harness & Agronomy Sign-Off** | Quality, hallucination, latency & cost gates | Expand `ai-assistant.test.ts` into a full Nigerian crop/soil/pest golden-dataset eval harness (en/yo/pcm) + vision benchmark before enabling `ai_photo_diagnosis` or proactive FIE in Production. |

---

## 3. Cost & Operational Considerations
- **Supabase Free → Pro boundary:** `pgvector` runs inside existing Supabase Postgres with zero extra vendor cost; however, sustained `telemetry_readings`, `farm_memory_items` embeddings, and `ai_audit_events` growth will require retention/archival policies (e.g., 90-day raw telemetry rollup pruning) and eventually Supabase Pro for PITR and higher connection/storage quotas.
- **LLM Cost Control:** Keep deterministic `packages/shared/src/engines/{agronomy,inputs}` calculators for numeric NPK/spray/schedule math (zero token cost) and invoke LLMs only for synthesis, multimodal scouting diagnosis, and natural-language explanation (`en`/`yo`/`pcm`).
- **Vercel Cron:** Hobby plan allows 1 daily cron; proactive sub-daily farm monitoring in Batch 03.3 should use Supabase `pg_cron` / Edge Functions or a dedicated worker queue rather than Vercel Hobby cron.
