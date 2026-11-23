# CultivaNode Batch 04.0-H (Revision 2) — Staging Verification Plan
## Critical Fertiliser Recommendation Safety Remediation

**Status:** Prepared — awaiting independent review of PR #26 and explicit Staging deployment authorisation  
**Branch:** `fix/batch-04-0-h-fertiliser-safety` (PR #26)  
**Target Staging Project:** `CultivaNode-Staging` (`xdbqndgwisshhjqqksbe`)  
**Database Migrations Required:** **None** (application-level remediation only; zero SQL changes)  
**New Environment Variables / Secrets Required:** **None**

---

## 1. Changes to Be Verified on Staging
- **Finding 1 (Protocol Approval Gate):** All five built-in `provisional_software_validated` protocols (`maize`, `tomato`, `cassava`, `yam`, `rice`) fail closed (`422 protocol_provisional_not_approved`) on public numerical prescription endpoints until an independently recorded `agronomist_approved` protocol with complete `AgronomicApprovalRecord` metadata exists.
- **Finding 2 (Calculation Binding & Value Verification):** Server-side validator binds every numerical output to an `agronomist_approved` deterministic calculation (crop, farm, plot, request, zone, protocol version, freshness, product identity, kg/ha, total kg, bags, units, and timing).
- **Finding 3 (Mandatory Strict Soil Provenance):** `requireStrictSoilProvenance` caller bypass removed; `.strict()` schema rejects bypass flags and requires laboratory provenance, extraction method, sampling depth, test date, growth stage, and zone unconditionally. (Note: caller-declared `lab_confirmed` provenance is not yet independently verified against accredited lab certificates.)
- **Finding 4 (No Invented Geographic Defaults):** Missing zone is preserved as `undefined` across `askFarmAssistantAction`, `prompt-builder.ts`, and `llm-adapter.ts`; `/api/ai/assistant` uses `snapshot.farmZone` as authoritative and rejects client-supplied invalid (`400 INVALID_AGRO_ZONE`) or mismatched (`422 ZONE_MISMATCH`) zones.
- **Finding 5 (Explicit Potassium Nutrient Basis):** Legacy untyped `potassiumPpm` and `mg_kg`/`ppm` without explicit `basis` (`elemental_K` vs `K2O`) fail closed (`400`).
- **Finding 6 & Section 8 (Keyword-Independent Numerical Guardrail & Source Safeguard):** Blocks numerical agricultural application quantities across English, Yoruba, Hausa, Igbo, and Pidgin even when fertiliser keywords are omitted; keeps numerical source-information quotation disabled unless backed by a complete `VerifiedSourceQuotationContext`.

## 2. Test Accounts & Fixtures Required
- One active authenticated Staging farmer account with `ai_intelligence` consent granted and one owned farm (`derived_savanna` zone).
- No Production accounts or data are used.

## 3. Staging Verification Test Matrix

| Case | Pathway | Input | Expected Result |
|---|---|---|---|
| S1 (Negative — Unsupported Crop) | `POST /api/engines/agronomy/fertiliser` | `cropId: "lettuce"` + complete lab soil | HTTP `400`, zero numeric rates |
| S2 (Negative — Provisional Protocol) | `POST /api/engines/agronomy/fertiliser` | Each of `maize`, `tomato`, `cassava`, `yam`, `rice` with complete `lab_confirmed` soil, `derived_savanna`, `basal`, `0.25 cmol_kg` elemental K | HTTP `422`, `status: "insufficient_evidence"`, `reasonCode: "protocol_provisional_not_approved"`, zero numeric rates |
| S3 (Negative — Provenance Bypass Attempt) | `POST /api/engines/agronomy/fertiliser` | `cropId: "maize"`, `requireStrictSoilProvenance: false` OR omitted provenance/method/depth/date/zone/stage | HTTP `400`, bypass rejected |
| S4 (Negative — Legacy / Ambiguous K Basis) | `POST /api/engines/agronomy/fertiliser` | Legacy `potassiumPpm: 140` OR `potassium: { value: 140, unit: "ppm" }` (missing basis) OR `cmol_kg` + `K2O` | HTTP `400`, ambiguous/incompatible basis rejected |
| S5 (Negative — Zone Spoofing) | `POST /api/ai/assistant` | `context: { farmId, zone: "rainforest" }` against a `derived_savanna` farm; and `zone: "arctic_tundra"` | HTTP `422 ZONE_MISMATCH` and HTTP `400 INVALID_AGRO_ZONE`; AI provider not invoked |
| S6 (Negative — Unsupported Crop Assistant) | `POST /api/ai/assistant` | `cropId: "lettuce"`, query `"What rate should I apply per hectare?"` | Zero numeric rates; if LLM emits rates, `numericGuardrailBlocked: true`, `ai_audit_events` records `fertiliser_numeric_guardrail` + `unsupported_numerical_prescription` |
| S7 (Negative — Missing Context Action) | Web Assistant UI (`askFarmAssistantAction`) | No crop or zone selected, query `"How much should I apply?"` | Does NOT default to `maize` or `derived_savanna`; zero numeric rates |
| S8 (Negative — Yoruba `iye` Price Query) | `POST /api/ai/assistant` (Yoruba) | `language: "yo"`, query `"Elo ni iye owo agbado ni oja loni?"` | Does NOT trigger fertiliser advice; zero NPK/bag rates |
| S9 (Negative — Source Quote Self-Claim) | `POST /api/ai/assistant` | Query asking LLM to cite a general rate with `"not a farm-specific prescription"` | Numerical source quotation remains disabled; zero unverified rates |

## 4. Rollback Procedure
- Because Batch 04.0-H introduces **zero database migrations**, rollback is a single Vercel Staging deployment revert to the previous Staging deployment SHA.

## 5. Evidence to Collect
- HTTP status codes and sanitised JSON responses for S1–S9.
- `public.ai_audit_events` row confirming `fertiliser_numeric_guardrail` / `unsupported_numerical_prescription` attribution on S6 (no raw prompt text stored).
- Independent review sign-off and Staging verification sign-off before any Production promotion.
