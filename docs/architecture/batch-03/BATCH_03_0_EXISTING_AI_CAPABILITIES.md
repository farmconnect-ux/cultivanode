# Batch 03.0 — Existing AI, Agronomy & Weather Capabilities

**Date:** 2026-11-19  
**Scope:** Complete discovery of implemented AI, agronomy, inputs, and weather components across `apps/web`, `packages/shared`, and `supabase/functions`.

---

## 1. AI Capabilities Inventory

| Capability | Location | Data Sources | Auth / Boundary | Failure Behaviour | Current Limitations | Test Coverage |
|---|---|---|---|---|---|---|
| **AI Config Loader** | `apps/web/src/lib/ai-config.ts:1-21` | Env vars (`ANTHROPIC_API_KEY`/`CLAUDE_API_KEY`, `CLAUDE_MODEL`, `CLAUDE_FALLBACK_MODEL`, `GEMINI_API_KEY`/`AI_API_KEY`, `OPENAI_API_KEY`, `AI_PRIMARY_MODEL`, `AI_FALLBACK_MODEL`, `AI_TIMEOUT_MS`) | `import "server-only"` | `AI_TIMEOUT_MS` falls back to `30000` if `0`/`NaN` | Default Claude IDs (`claude-sonnet-5-5`, `claude-haiku-5-5`) require env overrides if deprecated | Covered indirectly |
| **Grounding Engine** | `packages/shared/src/engines/ai-assistant/grounding.ts:10-57` | Static in-memory `catalogue.ts`, `templates.ts`, `standards.ts` | Pure function | Returns available snippets; omits missing standards | **Static `draft` snippets only**; no DB/RAG/vector retrieval; only `maize` & `tomato` have GAP standards | `ai-assistant.test.ts` |
| **Prompt Builder** | `packages/shared/src/engines/ai-assistant/prompt-builder.ts:8-48` | `retrieveGroundedContext()` + `FarmerContext` | Pure function | N/A | Single-turn only; no conversation/farm memory injection | `ai-assistant.test.ts` |
| **Chemical Safety Guardrail** | `packages/shared/src/engines/ai-assistant/chemical-guardrail.ts:14-72` | `BANNED_CHEMICAL_NAMES` (6 chemicals) + `APPROVED_CHEMICALS_REGISTRY` | Pure function | Replaces unsafe output with fixed NAFDAC ban warning | `aldrin` (mentioned in `ai-vision.ts:41`) is missing from `BANNED_CHEMICAL_NAMES`; brand matching uses first-word `.includes()` | `ai-assistant.test.ts`, `claude-adapter.test.ts` |
| **LLM Adapter** | `packages/shared/src/engines/ai-assistant/llm-adapter.ts:46-423` | `buildGroundedPrompt()` -> Claude -> Gemini -> OpenAI -> `generateAgronomicAdvisorAnswer()` | Pure server orchestration | Catch + record `providerErrors`, fall back to next model or deterministic `rule-engine` (never throws) | Stateless single-turn; `callClaude` omits `temperature`; no structured citations/trace IDs | `claude-adapter.test.ts` (Claude + rule-engine only; **Gemini/OpenAI fetch paths untested**) |
| **AI Assistant HTTP API** | `apps/web/src/app/api/ai/assistant/route.ts:1-109` | `askGroundedAiAssistant()` + Zod `AssistantBodySchema` | Dual auth: `Bearer` JWT or cookie session (`401`); forces `farmerId = authenticatedUserId` | `400` bad JSON/Zod, `401` unauth, `500` unexpected | `context.cropId` & `context.zone` optional in Zod but cast `as FarmerContext` | `batch-02-2.test.ts:79-98` (`401`, `400` only) |
| **AI Assistant Server Action** | `apps/web/src/actions/ai-assistant.ts:1-51` | `askGroundedAiAssistant()` | `requireAccount()` (`farmerId = account.userId`) | Throws `Error` if empty query & image | `imageBase64`/`imageMimeType` lack MIME allowlist & size validation | **None** |
| **AI Health Probe** | `apps/web/src/app/api/ai/health/route.ts:1-67` | `aiConfig()`, live provider HTTP probes (20s timeout) | Cookie session (`401`) + non-empty `my_permissions()` (`403`) | Returns per-model status, latency, masked key hint, 300-char error | Any staff permission grants access (not scoped to `ai.read`/`analytics.read`) | `batch-02-2.test.ts:67-77` (`401`, `403` only) |
| **Engine AI Ground / Guardrail APIs** | `apps/web/src/app/api/engines/ai/{ground,guardrail}/route.ts` | `buildGroundedPrompt()`, `checkChemicalSafetyGuardrails()` | `authorizeRequest(req)` (`ENGINE_JWT_SECRET` HMAC JWT; `503` if unset, `401` if invalid) | `400` on invalid JSON/Zod | `ground/route.ts` accepts client-supplied `context.farmerId` without matching `auth.user.sub` | `batch-02-2.test.ts:148-181` (`401`, `400`) |
| **Scouting Photo Vision** | `apps/web/src/lib/ai-vision.ts:1-196`, `scouting-photos.ts:1-121`, `api/scouting/analyse/route.ts:1-35` | `crop_observations` + private `scouting-photos` bucket + `isOn("ai_photo_diagnosis")` + `aiConfig()` | `Bearer` token (`401`), user-scoped Supabase client (RLS enforced) | `off`/`not_configured`/`no_photos` (`200`), `not_found` (`404`), `failed` (`502`); no rule-engine fallback | `en`/`yo` only (no `pcm`); `clean()` only replaces `d.actions` on guardrail failure, leaving `d.summary`/`d.likely` untouched; `aldrin` missing from guardrail list | **None** |

---

## 2. Agronomy & Inputs Engines

- **Catalogue & Templates (`packages/shared/src/engines/agronomy/`):**
  - `catalogue.ts`: 18 crops (`8` field/staple, `7` vegetables, `3` tree crops) with local names (`en`/`yo`/`pcm`/`ha`/`ig`), spacing, seed rates, growth stages.
  - `templates.ts` & `schedule-generator.ts`: Deterministic UTC schedule generation stamped `DRAFT-GAP-TEMPLATE-V1` / `Pending Review`.
  - `standards.ts`: Only `maize_gap_v1` and `tomato_gap_v1` (`status: 'draft'`).
- **Inputs (`packages/shared/src/engines/inputs/`):**
  - `fertiliser.ts` (`calculateFertiliserRecommendation`), `spray-planner.ts` (`generateSprayPlan` with PHI & NAFDAC ban checks), `weather-alerts.ts` (`evaluateCropWeatherHazards`), `inventory.ts`, `farm-books.ts`.
- **Agronomy Engine HTTP Routes (`apps/web/src/app/api/engines/agronomy/`):**
  - `schedule/route.ts`: `POST` (`ENGINE_JWT_SECRET`), `GET` (unauthenticated public CSV of `CROP_CATALOGUE`).
  - `spray/route.ts` & `weather-alerts/route.ts`: `POST` (`ENGINE_JWT_SECRET`).
  - `fertiliser/route.ts:10-16`: **Confirmed bug** — `FertiliserSchema` uses `ph` and `organicMatterPct` (with optional P/K) and casts `as SoilNutrientProfile`, which expects `pH`, `organicMatterPercent`, and required P/K, yielding `NaN` deficits when P/K are omitted and always `0` lime.

---

## 3. Weather Capabilities

- **Edge Function (`supabase/functions/weather/` + `_shared/handlers/weather.ts` + `_shared/providers/weather.ts`):**
  - Staff-only (`currentUserId` + `has_permission('analytics.read')`).
  - 30-minute `weather_cache` across 6 `PILOT_PLACES` (Ibadan, Abeokuta, Osogbo, Akure, Ado-Ekiti, Ikeja); supports `nimet`, `weatherapi`, `open_meteo`; logs to `integration_events`; falls back to stale cache if all 6 fail.
- **Web Route (`apps/web/src/app/api/weather/route.ts` & `apps/web/src/lib/weather.ts`):**
  - Public `GET` (`revalidate = 900`, per-instance memory cache); calls NiMet if configured, else Open-Meteo.
  - **Bug:** `apps/web/src/lib/weather.ts:202` hardcodes `provider: "nimet"` in the Open-Meteo fallback response.
  - **Limitation:** Weather is regional (6 SW state capitals), not farm-coordinate-specific, and is not fed into `/api/ai/assistant` or `crop_alerts`.

---

## 4. Test Coverage Summary

- **Tested:** `ai-assistant.test.ts` (100-question guardrail/eval gate), `claude-adapter.test.ts` (Claude + rule-engine), `agronomy.test.ts`, `inputs.test.ts`, `shared/__tests__/weather.test.ts`, `functions/_shared/__tests__/weather.test.ts`, `batch-02-2.test.ts` (auth/400 checks).
- **Untested:** `ai-vision.ts`, `scouting-photos.ts`, `/api/scouting/analyse`, `actions/ai-assistant.ts`, `/api/weather`, `lib/weather.ts`, Gemini/OpenAI `fetch` paths, and `/api/engines/agronomy/fertiliser` happy-path.
