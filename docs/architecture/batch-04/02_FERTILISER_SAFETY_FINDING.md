# Batch 04.0 — Fertiliser Safety Finding

**Status:** Verified finding; correction is a **mandatory prerequisite before Batch 04.1** (phase 04.0-H, D-P6) | **Date:** 2026-11-22 | **Branch base:** `main` @ `ddad3b0`

## Answer

**Yes. An unsupported crop such as lettuce can receive a numerical fertiliser recommendation today**, but not
through the fertiliser engine API. It comes from the AI assistant's rule-engine fallback, which returns fixed
NPK and urea rates for any crop. The fertiliser engine itself also fails open for unknown crops; only the HTTP
schema in front of it is closed.

## Execution paths traced

| # | Entry point | Path | Unknown crop (e.g. `lettuce`) | Evidence |
|---|---|---|---|---|
| P1 | `POST /api/engines/agronomy/fertiliser` | `apps/web/src/app/api/engines/agronomy/fertiliser/route.ts` → `FertiliserSchema` → `calculateFertiliserRecommendation` | **Rejected (400).** `cropId` is `z.enum(['maize','tomato','cassava','yam','rice'])` | `apps/web/src/lib/fertiliser-schema.ts:23`; `apps/web/src/__tests__/batch-02-2.test.ts:155,177` (only asserts 400 on an empty body, not on an unknown crop) |
| P2 | Shared engine called directly | `packages/shared/src/engines/inputs/fertiliser.ts:16` | **Numbers returned.** `CROP_NUTRIENT_UPTAKE[cropId] ?? { nPerTonne: 15, pPerTonne: 6, kPerTonne: 15 }` (line 22) | Exported to all consumers via `packages/shared/src/engines/index.ts:4` |
| P3 | `EngineClient.calculateFertiliserRecommendation` in local mode | `packages/shared/src/engines/api-gateway/client.ts:79-93` calls P2 with no schema | **Numbers returned.** No current caller in `apps/` (latent) | `packages/shared/src/engines/index.ts:7` exports it |
| P4 | `POST /api/ai/assistant` | `apps/web/src/app/api/ai/assistant/route.ts:57` (`cropId: z.string().max(80)`), `:157` (`resolvedCropId`), `:236` → `askGroundedAiAssistant` | **Numbers returned when all LLM providers are unavailable or fail:** `llm-adapter.ts:405-406` falls back to `generateAgronomicAdvisorAnswer`, whose fertiliser branch (`:84`) returns "NPK 15:15:15 at 200–300 kg/ha … Urea (46% N) at 100–150 kg/ha" (`:98-99`) labelled with `${context.cropId}` | `packages/shared/src/engines/ai-assistant/llm-adapter.ts` |
| P5 | Server action `askFarmAssistantAction` (web assistant UI) | `apps/web/src/components/account/ai-farm-assistant.tsx:176` → `apps/web/src/actions/ai-assistant.ts:24` → `askGroundedAiAssistant` | **Same as P4**, and `cropId` defaults to `"maize"` (`ai-assistant.ts:29`), so a lettuce farmer can get a maize-labelled rate. This path also skips the Live Farm Context evidence package and the AI audit write used by P4 | `apps/web/src/actions/ai-assistant.ts:10-45`; stage hard-coded `"Vegetative"` at `ai-farm-assistant.tsx:182` |
| P6 | LLM answer (Claude/Gemini/OpenAI) | `llm-adapter.ts:333+`; prompt rules in `prompt-builder.ts:154-156` | **Model may write any number.** No server-side numeric check exists; `checkChemicalSafetyGuardrails` only scans banned pesticide names (`chemical-guardrail.ts:4,10`) | `packages/shared/src/engines/ai-assistant/` |
| P7 | `POST /api/engines/ai/ground` | `apps/web/src/app/api/engines/ai/ground/route.ts` builds the grounded prompt only | No rate produced | — |

The fallback branch also matches any question containing `iye` (`llm-adapter.ts:84`), a common Yoruba word, so
non-fertiliser questions in Yoruba can receive the fertiliser template.

## Related governance gaps found while tracing

- The 5 published standards in Production have `max_nitrogen_kg_ha = NULL` (checked 2026-11-22), so no published
  nitrogen limit exists to check a rate against.
- `private.forbid_published_standard_mutation()` (`supabase/migrations/20261103120000_agronomy_standards_governance.sql:58`)
  does not freeze `max_nitrogen_kg_ha`, `agro_zone`, `variety_or_breed`, `source_authority`, `effective_from/to`
  or `is_active` after publication.
- `soybean` has a published standard (`GAP_SOYBEAN_V1`) but is not in `catalogue.ts`; `onion`, `millet`,
  `sorghum`, `groundnut` have draft standards and no catalogue entry.

## Potassium unit mismatch

| Layer | Unit | Evidence |
|---|---|---|
| Database | `soil_records.potassium_cmol_kg` — cmol(+)/kg (exchangeable K) | Production column; check constraint `potassium_cmol_kg >= 0` |
| Live Farm Context | `potassiumCmolKg` | `apps/web/src/lib/farm-context/live-farm-context.service.ts:330,370` |
| Fertiliser engine input | `potassiumPpm` ("Exchangeable K, e.g. 120 ppm") | `packages/shared/src/engines/inputs/types.ts`; `fertiliser.ts:35` |
| Engine crop demand | Comment says "kg N, P2O5, K2O" per tonne | `fertiliser.ts:3` |

- No code converts cmol/kg to ppm today, because no path feeds Live Farm Context soil into the engine. The risk
  appears the moment Batch 04.4 wires them together.
- Conversion for potassium (K⁺, 39.10 g/mol, charge 1): **1 cmol(+)/kg = 391 mg/kg (ppm)**.
- Impact if wired without conversion: a soil at 0.25 cmol/kg (≈ 98 ppm) would be read as 0.25 ppm. The engine's
  K credit (`ppm × 0.48`, `fertiliser.ts:35`) would drop from about 47 kg/ha to 0.12 kg/ha, overstating the
  K deficit.
- A second mismatch: demand coefficients are labelled as oxides (P2O5, K2O) while soil credits are derived from
  elemental ppm. P2O5 = P × 2.291 and K2O = K × 1.205. The credit factors (`× 0.6`, `× 0.48`, `OM × 15`) carry
  no citation.

## Required correction: phase 04.0-H (mandatory before 04.1; not implemented in PR #25)

See ADR-020 and ADR-016. A cited passage **must not** independently authorise a numerical fertiliser prescription.
A farm-specific numerical fertiliser prescription requires all nine conditions in ADR-020 (identified supported crop,
approved versioned crop-specific protocol/coefficients, documented source/approval/scope/version, suitable soil
provenance/units/depth/method/date, calibrated soil-test method, assessed geographic/climatic/crop-stage/production
applicability, applied legal and safety constraints, deterministic engine validation, and disclosed citations,
assumptions, and missing facts). When any mandatory condition is absent, inconsistent, expired, or unverified, the
system must fail closed without substituting another crop's coefficients, inferring from a loosely related document,
or silently converting uncertain units, and must explain what is missing while offering non-numerical guidance.

04.0-H must enforce:

1. `calculateFertiliserRecommendation` returns a result union (`crop_not_supported`, `coefficients_unapproved`,
   `crop_not_identified`, soil-input codes) and never applies a default coefficient. Coefficients move to an approved,
   versioned store linked to a published standard, cited passages, and the assumed soil-test calibration.
2. `EngineClient` local mode applies the same validation as the HTTP route; both import one shared schema.
3. `generateAgronomicAdvisorAnswer` never returns numeric rates. Its fertiliser branch returns non-numerical guidance
   ("no approved rate is available for this crop; contact an extension agent or obtain a soil test"), unless the
   deterministic engine returned an approved result for that crop, in which case it quotes the engine output with its
   citation.
4. All AI entry points (P4, P5) go through one audited path; P5's `cropId || "maize"` default is removed. With no
   resolved crop, numbers are refused.
5. A server-side numeric validator blocks any farm-specific numerical fertiliser prescription in an LLM answer that does
   not trace to an approved deterministic engine result satisfying ADR-020, and blocks any rate above the published
   `max_nitrogen_kg_ha`. A numerical value quoted from a licensed source passage may appear only as explicitly labelled
   general published source information with full context disclosed — never as a farm-specific prescription (ADR-016).
6. Soil inputs must be lab-confirmed **and** carry extraction method, sampling depth, test date, units, and nutrient
   basis (ADR-018). Units become explicit types: `SoilPotassium = { value, unit: 'cmol_kg' | 'mg_kg' }`, with one
   conversion (× 391). Oxide/elemental basis is declared per coefficient; uncertain units fail closed.
7. `forbid_published_standard_mutation` is extended to every agronomic field.

**Tests required in 04.0-H:** unknown crop → `crop_not_supported` (engine, client, route); rule-engine fertiliser
query for `lettuce` contains no digits followed by `kg`; `cropId` absent → `crop_not_identified`; farmer-reported or
modelled soil → refused; lab soil without method or depth → refused; LLM output attempting a farm-specific rate from a
cited passage without an approved engine result → blocked; `0.25 cmol/kg` → `97.75 mg/kg`; published standard
`max_nitrogen_kg_ha` update → `42501`.
