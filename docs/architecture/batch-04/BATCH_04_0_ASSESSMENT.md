# CultivaNode Batch 04.0 — Agricultural Knowledge Infrastructure & RAG Assessment

**Status:** Proposed — revision 4 (ready for independent final review) | **Date:** 2026-11-22
**Base:** `main` @ `ddad3b0` (after Batch 03.3) | **Scope:** architecture and documentation only. No code,
migrations, Supabase, provider, secret or deployment changes. Batch 04.0-H and Batch 04.1 have not started.

## 1. Summary

- Batch 03.2 built a secure knowledge container that is still empty: in Production (checked 2026-11-22)
  `agronomic_standard_documents` and `agronomic_standard_chunks` have 0 rows; `farm_agronomic_standards` has 5
  published (cassava, maize, soybean, poultry layer, broiler feed; all with `max_nitrogen_kg_ha` NULL) and 14 draft.
- **Safety finding:** an unsupported crop (e.g. lettuce) can receive numeric NPK and urea rates through the AI
  assistant's rule-engine fallback, and the fertiliser engine applies default coefficients to unknown crops. The
  HTTP fertiliser API is closed by a 5-crop allow-list. See `02_FERTILISER_SAFETY_FINDING.md`. **The fail-closed
  correction (04.0-H, ADR-020) is a mandatory prerequisite before Batch 04.1** (D-P6, confirmed).
- CultivaNode operates under Excel Palace Global Concept (D-P3, confirmed). BN 7455859 is recorded; CAC verification
  is required before formal correspondence or contracts.
- Lettuce is not in `packages/shared/src/engines/agronomy/catalogue.ts`, has no standard and no licensed Nigerian
  source. The most relevant Nigerian sources are all rights reserved and stay metadata-only until permission.

## 2. Revision 4 changes (final pre-sign-off corrections)

| # | Requirement | Where addressed |
|---|---|---|
| 1 | Numerical agricultural recommendation authority: a cited passage cannot independently authorise a farm-specific numerical fertiliser prescription; all nine ADR-020 conditions are mandatory; licensed source quotes must be explicitly contextualised as general source information only | `ADR-016`, `ADR-020`, `02_FERTILISER_SAFETY_FINDING.md`, `09_RETRIEVAL_AND_EVIDENCE_PACKAGE.md`, `01_CURRENT_AND_TARGET_ARCHITECTURE.md`, `11_SECURITY_THREAT_ASSESSMENT.md` |
| 2 | Two-level retrieval & evaluation acceptance framework: initial Staging run never auto-sets baseline; provisional Level A absolute thresholds (including zero unsupported numerical fertiliser prescriptions) + Level B regression gates + formal sign-off requirements (D-P9, D-A8) | `ADR-017`, `10_EMBEDDING_AND_RERANKING_EVALUATION.md`, `13_DECISION_REGISTER.md` |
| 3 | Explicit phased roadmap & execution gates (`04.0` → `04.0-H` → `04.1` → `04.2` → `04.3` → `04.4` → `04.5`) with full ADR mapping and explicit separation of architecture approval, implementation, Staging verification, and Production promotion | `14_IMPLEMENTATION_ROADMAP.md`, `09_RETRIEVAL_AND_EVIDENCE_PACKAGE.md`, `13_DECISION_REGISTER.md` |

## 3. Revision 3 changes (retained)

| # | Requirement | Where addressed |
|---|---|---|
| 2 | Legal entity decision | `13_DECISION_REGISTER.md` (D-P3 confirmed, CAC prerequisite), ADR-011 |
| 3 | Fertiliser safety as mandatory prerequisite | `14_IMPLEMENTATION_ROADMAP.md` (04.0-H), ADR-020, `02_FERTILISER_SAFETY_FINDING.md` |
| 4 | Embedding storage for different dimensions | ADR-014 (options A/B/C, lifecycle, rollback), `10_EMBEDDING_AND_RERANKING_EVALUATION.md` |
| 5 | Retrieval RPC security | ADR-013 (controls C1–C15), `11_SECURITY_THREAT_ASSESSMENT.md` (S15–S19) |
| 6 | Licensing as proposed policy; all-rights-reserved metadata-only | `05_LICENSING_CONTROLS.md`, ADR-011 |
| 7 | Lab soil necessary but not sufficient | ADR-018, ADR-020, `03_GEOGRAPHIC_APPLICABILITY_AND_SOIL_PROVENANCE.md` |
| 8 | Explicit dependencies; crops awaiting validation; confirmed vs outstanding decisions | `14_IMPLEMENTATION_ROADMAP.md`, `12_PRIORITY_CROPS.md`, `13_DECISION_REGISTER.md` |

## 4. Revision 2 corrections (retained)

| # | Review requirement | Where addressed | Key evidence |
|---|---|---|---|
| 1 | Fertiliser fallback, all paths, fail-closed fix, K units | `02_FERTILISER_SAFETY_FINDING.md`, ADR-020 | `packages/shared/src/engines/inputs/fertiliser.ts:22,35`; `apps/web/src/lib/fertiliser-schema.ts:23`; `packages/shared/src/engines/ai-assistant/llm-adapter.ts:84,98-99,405-406`; `apps/web/src/actions/ai-assistant.ts:29`; `packages/shared/src/engines/api-gateway/client.ts:79-93`; `soil_records.potassium_cmol_kg` |
| 2 | Geographic applicability; modelled vs lab soil | `03_GEOGRAPHIC_APPLICABILITY_AND_SOIL_PROVENANCE.md`, ADR-018 | `public.farm_zones` boundaries all NULL; `private.detect_farm_zone()` (`supabase/migrations/20260926091849_identity_alignment.sql:660`) |
| 3 | Authority separate from evidence quality, recency, geography | `04_SOURCE_AUTHORITY_AND_CONFLICT_RESOLUTION.md`, ADR-019 | Provenance tiers in `20261122020000`–`040000` |
| 4 | OCR quality governance | `06_DOCUMENT_EXTRACTION_AND_OCR_GOVERNANCE.md`, ADR-012 | `private.guard_agronomic_rag_integrity()` |
| 5 | Licensing controls per activity | `05_LICENSING_CONTROLS.md`, ADR-011 | No licence fields on `agronomic_standard_documents` |
| 6 | Reviewer governance | `07_REVIEWER_GOVERNANCE.md`, ADR-021 | `public.agronomy_publish_standard` override (`supabase/migrations/20261103120000_agronomy_standards_governance.sql:237-240`); `supabase/tests/database/17_agronomy_governance.test.sql` |
| 7 | Embedding and reranking evaluation | `10_EMBEDDING_AND_RERANKING_EVALUATION.md`, ADR-014, ADR-017 | `vector(1536)` on `agronomic_standard_chunks` and `farm_memory_items`; pgvector 0.8.2 |
| 8 | Complete architecture deliverables | Files 01, 08, 09, 11, 14 and ADRs | — |
| 9 | First ten crops incl. lettuce | `12_PRIORITY_CROPS.md` | `catalogue.ts`; Production standards |
| 10 | Decision register | `13_DECISION_REGISTER.md` | — |

## 5. Deliverables

| File | Content |
|---|---|
| `01_CURRENT_AND_TARGET_ARCHITECTURE.md` | Current- and target-state diagrams (Mermaid) |
| `02_FERTILISER_SAFETY_FINDING.md` | Seven-path trace, unit mismatch, mandatory 04.0-H correction |
| `03_GEOGRAPHIC_APPLICABILITY_AND_SOIL_PROVENANCE.md` | Location precision, layered AEZ profile, soil evidence classes |
| `04_SOURCE_AUTHORITY_AND_CONFLICT_RESOLUTION.md` | Five-attribute model, conflict procedure, source register |
| `05_LICENSING_CONTROLS.md` | Proposed compliance policy A1–A13 (subject to legal review) |
| `06_DOCUMENT_EXTRACTION_AND_OCR_GOVERNANCE.md` | Preservation, derivative provenance, page quality, numbers and tables, review, rejection |
| `07_REVIEWER_GOVERNANCE.md` | Roles, separation, qualifications, external review, high-risk, audit record |
| `08_TAXONOMY.md` | Term model, relations, synonyms, scope, lettuce example |
| `09_RETRIEVAL_AND_EVIDENCE_PACKAGE.md` | Retrieval steps, evidence package v2, answer contract |
| `10_EMBEDDING_AND_RERANKING_EVALUATION.md` | Benchmark design, strata, metrics, storage for different dimensions |
| `11_SECURITY_THREAT_ASSESSMENT.md` | Threats S1–S19 with existing controls and gaps |
| `12_PRIORITY_CROPS.md` | Ten proposed crops, awaiting agronomist validation |
| `13_DECISION_REGISTER.md` | Confirmed and outstanding decisions by group |
| `14_IMPLEMENTATION_ROADMAP.md` | 04.0-H prerequisite, dependency graph, gates |
| `adr/ADR-011` … `adr/ADR-021` | Architecture decisions |

## 6. What Batch 03.2 already delivers (reuse, do not rebuild)

| Capability | Where |
|---|---|
| Standards register and lifecycle; four-eyes publish RPC | `20261008130000`, `20261103120000` |
| Source documents with SHA-256, private archive, ingestion status, provenance tiers | `20261122020000`–`040000` |
| Passages with page/section, content hash, `vector(1536)` + HNSW | `20261122020000` |
| Trusted verification boundary (`service_role` only) | `20261122040000`, `apps/web/src/lib/rag/trusted-document-verifier.ts` |
| Published-only retrieval RPC | `public.search_published_agronomic_standards` (`20261122030000`) |
| Provider-neutral embeddings (unconfigured in production) | `packages/shared/src/engines/memory-rag/embedding-provider.ts` |
| Grounded evidence package with model-safe serialisation | `packages/shared/src/engines/memory-rag/types.ts:247`, `prompt-builder.ts` |
| AI audit, consent, account deletion | Batch 03.1B/C, 03.2 |

The shared review copy (Claude Doc) reflects revision 1; this file and its companions are authoritative.
