# CultivaNode Batch 04.0-H — Staging Verification Plan
## Critical Fertiliser Recommendation Safety Remediation

**Status:** Prepared — awaiting explicit Staging deployment authorisation  
**Branch:** `fix/batch-04-0-h-fertiliser-safety`  
**Target Staging Project:** `CultivaNode-Staging` (`xdbqndgwisshhjqqksbe`)  
**Database Migrations Required:** **None** (application-level remediation only; zero SQL changes)  
**New Environment Variables / Secrets Required:** **None**

---

## 1. Changes to Be Verified on Staging
- Fail-closed deterministic fertiliser engine (`packages/shared/src/engines/inputs/fertiliser.ts` & `nutrient-units.ts`) and shared 7-state recommendation contract (`approved_calculation`, `source_information`, `general_guidance`, `insufficient_evidence`, `unsupported_crop`, `invalid_input`, `calculation_failure`).
- Unified fertiliser API schema & route (`apps/web/src/lib/fertiliser-schema.ts`, `/api/engines/agronomy/fertiliser`).
- Hardened rule-engine fallback, Yoruba `iye` false-trigger fix, ambiguous multilingual clarification, and server-side LLM numerical prescription validator (`packages/shared/src/engines/ai-assistant/fertiliser-safety.ts`, `llm-adapter.ts`).
- Hardened web server action (`apps/web/src/actions/ai-assistant.ts` — removed silent `cropId || "maize"` default) and AI audit guardrail reason code recording (`apps/web/src/lib/ai-audit.ts`, `/api/ai/assistant`).

## 2. Test Accounts & Fixtures Required
- One active authenticated Staging farmer account with `ai_intelligence` consent granted and one owned farm (`derived_savanna` zone).
- No Production accounts or data are used.

## 3. Staging Verification Test Matrix

| Case | Pathway | Input | Expected Result |
|---|---|---|---|
| S1 (Negative) | `POST /api/engines/agronomy/fertiliser` | `cropId: "lettuce"` + valid soil | HTTP `400`, zero numeric rates |
| S2 (Negative) | `POST /api/engines/agronomy/fertiliser` | `cropId: "maize"`, `soil.provenance: "modelled_estimate"` | HTTP `422`, `reasonCode: "soil_modelled_not_allowed"` |
| S3 (Negative) | `POST /api/engines/agronomy/fertiliser` | `cropId: "maize"`, `soil.provenance: "farmer_reported"` | HTTP `422`, `reasonCode: "soil_not_lab_confirmed"` |
| S4 (Negative) | `POST /api/engines/agronomy/fertiliser` | `cropId: "maize"`, `potassium: { value: 0.25, unit: "cmol_kg", basis: "K2O" }` | HTTP `400`, `reasonCode: "soil_basis_unknown"` |
| S5 (Positive) | `POST /api/engines/agronomy/fertiliser` | `cropId: "maize"`, `lab_confirmed`, `bray_1`, `depth: 15`, `0.25 cmol_kg` elemental K, fresh `testDate` | HTTP `200`, `recommendationStatus: "approved_calculation"`, `derivedElementalMgKg: 97.75` |
| S6 (Negative) | `POST /api/ai/assistant` | `cropId: "lettuce"`, query `"What NPK rate should I apply per hectare?"` | Zero numeric rates; if LLM emits rates, `numericGuardrailBlocked: true`, `ai_audit_events` records `fertiliser_numeric_guardrail` + `unsupported_numerical_prescription` |
| S7 (Negative) | Web Assistant UI (`askFarmAssistantAction`) | No crop selected, query `"How much NPK should I apply?"` | Does NOT default to maize; zero numeric rates |
| S8 (Negative) | `POST /api/ai/assistant` (Yoruba) | `language: "yo"`, query `"Elo ni iye owo agbado ni oja loni?"` | Does NOT trigger fertiliser advice; zero NPK/bag rates |
| S9 (Negative) | `POST /api/ai/assistant` (Ambiguous) | `language: "yo"`, query `"Iye melo ni mo le lo?"` | Asks for clarification; zero numeric rates |

## 4. Rollback Procedure
- Because Batch 04.0-H introduces **zero database migrations**, rollback is a single Vercel Staging deployment revert to the previous Staging deployment SHA.

## 5. Evidence to Collect
- HTTP status codes and sanitised JSON responses for S1–S9.
- `public.ai_audit_events` row confirming `fertiliser_numeric_guardrail` / `unsupported_numerical_prescription` attribution on S6 (no raw prompt text stored).
- Signed sign-off by product owner and engineering lead prior to Production promotion.
