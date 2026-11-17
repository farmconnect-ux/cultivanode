# AI Capability Audit — CultivaNode

**Audit Date:** 2026-11-17  
**Scope:** `packages/shared/src/engines/ai-assistant/`, `packages/shared/src/engines/agronomy/`, `apps/web/src/actions/ai-assistant.ts`, `apps/web/src/app/api/ai/*`, `apps/web/src/app/api/scouting/analyse/route.ts`, `apps/web/src/lib/ai-vision.ts`, `apps/web/src/lib/scouting-photos.ts`, `apps/mobile/src/lib/scout.ts`, `supabase/functions/`, `supabase/migrations/`.

---

## 1. Existing AI Architecture Summary

CultivaNode has **two live AI paths** and **zero AI Edge Functions**:
1. **Grounded Farm Assistant Chat** (`apps/web/src/components/account/ai-farm-assistant.tsx` -> `actions/ai-assistant.ts` & `POST /api/ai/assistant` -> `packages/shared/src/engines/ai-assistant/llm-adapter.ts`):
   - Supports text + single base64 image upload.
   - Provider chain (`apps/web/src/lib/ai-config.ts`): **Anthropic Claude** (`DEFAULT_CLAUDE_MODELS`: Sonnet 5.5, then Haiku 5.5; `ANTHROPIC_API_KEY || CLAUDE_API_KEY`) -> **Google Gemini** (`gemini-flash-latest` default; `GEMINI_API_KEY || AI_API_KEY`) -> **OpenAI** (`gpt-4o-mini` default; `OPENAI_API_KEY`) -> deterministic rule-engine fallback (`generateAgronomicAdvisorAnswer` in `en`/`yo`/`pcm`).
   - Staff-only AI health check endpoint: `GET /api/ai/health` (`apps/web/src/app/api/ai/health/route.ts`) checks configured keys and runs a live test call per provider.
   - Post-processes all outputs through `checkChemicalSafetyGuardrails` (`chemical-guardrail.ts`, updated in `d2191fd` to block only sentences recommending a banned product, not warnings against it).
2. **Multimodal Crop Scouting Photo Diagnosis** (`apps/web/src/lib/ai-vision.ts` + `scouting-photos.ts` -> `POST /api/scouting/analyse` + `analyseObservationPhotos` action):
   - Gated by `feature_flags.ai_photo_diagnosis`.
   - Reads private photos from `scouting-photos` bucket, calls Gemini/OpenAI vision, runs `checkChemicalSafetyGuardrails`, and persists `ai_diagnosis`, `ai_model`, `ai_analysed_at` on `public.crop_observations`.
   - **Mobile integration:** `apps/mobile/src/screens/ScoutScreen.tsx` -> `src/lib/scout.ts` uploads photos and calls `${SITE_URL}/api/scouting/analyse`.

---

## 2. Capability-by-Capability Audit

| Capability | Status | Actual Implementation Location | Remaining Work / Gaps |
|---|---|---|---|
| **Provider adapters & API integrations** | **Implemented (non-streaming)** | `packages/shared/src/engines/ai-assistant/llm-adapter.ts`, `apps/web/src/lib/ai-config.ts`, `apps/web/src/lib/ai-vision.ts`, `apps/web/src/app/api/ai/health/route.ts` | Direct REST `fetch` with 30s timeout (Claude primary -> Gemini -> OpenAI). No streaming, no token/cost metering. |
| **Prompts & context builders** | **Partially wired** | `prompt-builder.ts` (`buildGroundedPrompt`), `grounding.ts` (`retrieveGroundedContext`), `ai-farm-assistant.tsx` | `AiFarmAssistant` queries user `farms` and `plots`, **but hardcodes `stageName: "Vegetative"`**, ignores `plots`, `varietyId`, `season`, and `daysAfterPlanting`. |
| **Agronomy standards & chemical guardrails** | **Guardrail wired; Standards disconnected** | `chemical-guardrail.ts` (`BANNED_CHEMICALS_REGISTRY`, `APPROVED_CHEMICALS_REGISTRY`); `standards.ts` | Guardrail blocks banned chemicals (`paraquat`, `carbofuran`, `ddt`, etc.) and appends PHI/REI. However, `retrieveGroundedContext` reads hardcoded in-memory `PUBLISHED_STANDARDS` (marked `draft`), **not** DB `farm_agronomic_standards`. |
| **Image diagnosis (crop / livestock)** | **Crop wired; Livestock missing** | `apps/web/src/lib/ai-vision.ts`, `scouting-photos.ts`, `apps/mobile/src/lib/scout.ts` | Crop scouting photo diagnosis is wired end-to-end. Livestock/veterinary image diagnosis is **not implemented**. |
| **Persistent farm-specific memory** | **Not implemented** | `ai-farm-assistant.tsx` (React `useState` only) | No chat/session persistence table, no farm memory store, no summarization across sessions. |
| **Persistent user preferences** | **Not implemented** | `ai-farm-assistant.tsx` (`assistantLang` client state) | Preferences are ephemeral in client state (aside from `profiles.preferred_language`). |
| **Retrieval of historical farm activities** | **Not implemented** | — | AI does not query `crop_cycle_operations`, `crop_observations`, `farm_operational_tasks`, or `farm_general_records`. |
| **Retrieval of soil and crop info** | **Not implemented** | — | `soil_records`, `crop_cycles`, and `plots` are not queried by `askFarmAssistantAction` or `/api/ai/assistant`. |
| **Retrieval of previous fertiliser applications** | **Not implemented** | `packages/shared/src/engines/inputs/fertiliser.ts` (standalone deterministic calc) | AI does not retrieve past fertiliser `crop_cycle_operations` or `farm_inventory_transactions`. |
| **Livestock nutrition calculations** | **Not implemented** | `packages/shared/src/engines/farm-management/livestock-engine.ts` | `FarmLivestockEngine` only computes FCR, ADG, and withdrawal periods—and is **unused in `apps/`**. No ration formulation or AI nutrition exists. |
| **Agricultural document retrieval, PDF ingestion, vector search** | **Not implemented** | `apps/web/src/components/screens/agronomy-library.tsx` (static `GUIDES`) | Zero `pgvector` extension, zero embedding columns/indexes, zero PDF ingestion/chunking pipeline. |
| **Proactive farm monitoring & event-triggered recommendations** | **Not implemented** | `inputs/weather-alerts.ts`, `packages/iot/src/engine/alert-rules-engine.ts` | Only pull-based API `/api/engines/agronomy/weather-alerts` and standalone IoT simulator exist; no `pg_cron` or event-driven AI recommendation engine. |
| **Automated inventory analysis** | **Not implemented** | `farm-management/inventory-engine.ts` (unused in apps) | No AI reorder forecasting or stock-to-crop-plan gap analysis. |
| **Supplier price comparison** | **Not implemented** | `marketplace/buy-what-i-need.ts` (unused; `priceScore = 20` hardcoded) | Not wired to apps or AI; no live supplier price comparison. |
| **Service provider matching** | **Not implemented** | `nearby_listings_for_farm` RPC (geo distance only) | No AI-driven matching by equipment capacity, schedule, or reliability. |
| **Permission-based autonomous actions** | **Not implemented** | `marketplace/ai-service.ts` (`proposeDraftListing`, unused) | AI is strictly read-only advisory. No tool-calling, approval queue, or permissioned execution framework exists. |
| **Feedback and continuous learning** | **Not implemented** | — | No thumbs-up/down, outcome tracking, or agronomist correction loop on AI responses or `crop_observations.ai_diagnosis`. |
