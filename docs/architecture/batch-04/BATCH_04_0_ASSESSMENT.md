# CultivaNode Batch 04.0 — Agricultural Knowledge Infrastructure & RAG Assessment

**Status:** Proposed | **Date:** 2026-11-22 | **Base (`main`):** `ddad3b0` (after Batch 03.3)
**Scope:** Assessment and architecture decisions only. No code, migrations or hosted changes.
**Shared review copy:** Claude Doc "CultivaNode Batch 04.0 — Knowledge Infrastructure & RAG Assessment".

## 1. Summary

Batch 03.2 built a secure knowledge container that is still empty. Batch 04 should fill it and make it
searchable, not rebuild it.

- Production (checked 2026-11-22): `agronomic_standard_documents` = 0 rows, `agronomic_standard_chunks` = 0 rows,
  `farm_agronomic_standards` = 5 published (cassava, maize, soybean, poultry layer, broiler feed) + 14 draft.
- The reference question ("15,000 lettuce plants in Oyo State: what fertiliser programme at this growth stage?")
  fails at step 1: lettuce is not in `packages/shared/src/engines/agronomy/catalogue.ts` (18 crops), has no
  standard and no licensed Nigerian source.
- The biggest risk is content licensing, not code: NIHORT, NAERLS and the national fertiliser guide are
  "all rights reserved" or carry no licence.
- Sequence change: run the core taxonomy (04.3) alongside ingestion (04.1).

## 2. What Batch 03.2 already delivers (reuse, do not rebuild)

| Capability | Where | Batch 04 use |
|---|---|---|
| Standards register with lifecycle (draft → in_review → approved → published → superseded/retired), effective dates, `parameters`, `max_nitrogen_kg_ha`, `restricted_chemicals` | `20261008130000`, `20261103120000` | Keep as the approved-recommendation layer |
| Source documents with SHA-256, private Storage archive, ingestion status, provenance tier (`staff_asserted` → `file_hash_verified` → `authority_verified`) | `20261122020000`–`040000` | Extend under a source register (ADR-011) |
| Passages with section/page/paragraph, content hash, `vector(1536)` + HNSW | `20261122020000` | Keep; add `tsvector` and taxonomy tags |
| Trusted ingestion boundary (`service_role`-only hash verification; immutable published content) | `20261122040000`, `apps/web/src/lib/rag/trusted-document-verifier.ts` | Keep unchanged |
| `search_published_agronomic_standards` (published, active, indexed, in-date; crop/zone/authority/code filters) | `20261122030000` | Keep the filters; replace ranking (ADR-013) |
| Provider-neutral `EmbeddingProvider`; production default `UnconfiguredEmbeddingProvider` | `packages/shared/src/engines/memory-rag/embedding-provider.ts` | Approve a model (ADR-014) |
| Grounded evidence package with model-safe serialisation and degraded-grounding disclosure | `evidence-assembler.ts`, `prompt-builder.ts` | Base for the answer contract (ADR-016) |
| AI audit, `ai_intelligence` consent, account-deletion rules | Batch 03.1B/C, 03.2 | Reuse unchanged |

Limits found:
- File ingestion returns `422` for PDF until a verified extractor is configured.
- Without embeddings, retrieval is `content ILIKE '%' || <whole question> || '%'` — a natural question almost never
  matches verbatim. `%` and `_` in the question are not escaped.
- The 5 published standards are seeded parameter sets; their `source_authority` codes are labels, not verified
  citations (e.g. `IITA_NIHORT_GAP` on the poultry feed standards).

## 3. Gap analysis — the Oyo lettuce question

| Step | Needs | Today | Gap | Batch |
|---|---|---|---|---|
| Crop and stage | Lettuce, variety, stage today | Not in catalogue; stages only for catalogue crops | No extension path for new crops | 04.3 |
| Place the farm | Agro-ecological zone, season, soil | `farm_zone` = rainforest, derived_savanna, other | Zones too coarse; Oyo spans several | 04.3 |
| Farm facts | Soil test, past inputs, plants → area | Live Farm Context (03.1C) | Works; spacing missing for lettuce | 04.4 |
| Evidence | Nigerian/West African lettuce guidance | 0 documents; PDF 422 | No sources, no PDF pipeline | 04.1, 04.2 |
| Retrieve | Passages on rates, splits, local soils | Whole-question `ILIKE` | No keyword search, embeddings or reranking | 04.2 |
| Applicability | Same crop, zone, soil, season, recent | Exact crop/zone filters only | No applicability scoring or conflict detection | 04.4 |
| Rates | kg/ha N-P-K by stage | `calculateFertiliserRecommendation` falls back to a generic 15/6/15 kg/t for unknown crops; Batch 03.1A says the API rejects unvalidated crops — confirm which path the assistant uses | Coefficients not linked to cited evidence | 04.4 |
| Answer | Evidence vs assumption, conflicts, citations | Evidence tiers + degraded-grounding flag | No claim-level citation contract | 04.5 |

Data issues:
- `soil_records.potassium_cmol_kg` is cmol/kg; the fertiliser engine takes `potassiumPpm`. Conversion must be explicit.
- Production has 0 farms and 0 crop cycles, so evaluation needs a curated question set (ADR-017).

## 4. Knowledge source register (Nigeria-first, checked 2026-11-22)

Licence notes are read from each publisher's page. They are not legal advice.

| Source | Covers | Licence as published | Reuse risk | Role |
|---|---|---|---|---|
| [NIHORT production manuals](https://nihort.gov.ng/production-manuals/) | Tomato (2023), amaranth, corchorus, green peas, ugu, pineapple, citrus; no lettuce listed | "©2026 NIHORT. All Rights Reserved." | High | Request MoU (horticulture, Ibadan) |
| Federal Fertilizer Department, *Fertilizer Use and Management Practices for Crops in Nigeria* (4th ed., 2012) | National rates by crop/zone | No official online copy or licence found | High | Request ministry permission |
| [NAERLS bulletins](https://naerls.gov.ng/bulletins/) | 40 PDF bulletins (irrigated tomato, pepper, onion, garlic, cassava, rice, fish ponds) | "© 2026 All rights reserved" | High | Request permission |
| [IITA books on CGSpace](https://cgspace.cgiar.org/collections/1df39f25-a92a-4c1e-818b-ed997488cf36) | 583 open / 417 limited items | Per item: 99 CC BY 4.0, 110 all rights reserved, 12 other | Medium | Ingest CC BY items now |
| [FAO](https://openknowledge.fao.org/bitstreams/6e7af061-3928-4c55-99c5-6b5e4cb8e3f0/download) | Global/regional guidance | CC BY 4.0 default from 2024-07-01; Jun 2018–Dec 2024 items keep CC IGO 3.0 | Low | Ingest post-2024 items now |
| [iSDAsoil](https://www.isda-africa.com/isdasoil/open-soil-data/) | Africa soil analysis data | CC BY 4.0 | Low | Structured soil priors |
| [NiMet SCP](https://nimet.gov.ng/scp) | 2026 onset/cessation, advisories; 5 languages | No reuse statement | Medium | Cite and link; ingest with permission |
| [CABI PlantwisePlus](https://www.cabi.org/terms-and-conditions/) | Pest and disease factsheets | Technical factsheets CC BY-NC-ND 4.0; decision guides CC BY-NC-SA 4.0 | High | Commercial licence needed |
| [Ghana MoFA lettuce guide (2021)](https://mofa.gov.gh/site/images/pdf/production_guides/lettuce_Production_Guide.pdf) | Lettuce: compost 15–20 t/ha, NPK 15-15-15 250 kg/ha, urea 100 kg/ha after 2 weeks | Short extracts, non-profit only | High | Regional cross-check only |

## 5. Source governance

Trust tiers (precedence when sources disagree): **T1** Nigerian regulation/national guidance (binding limits) →
**T2** Nigerian research institutes and extension → **T3** international bodies (after applicability check) →
**T4** peer-reviewed studies (single study labelled) → **T5** other countries' extension (cross-check, labelled
"regional reference"). Excluded: marketing, blogs, social media, AI-generated text.

A passage reaches a farmer only if: licence cleared (ADR-011), file hash verified (03.2), agronomist approved
(approver ≠ uploader), in effective dates, taxonomy-tagged (ADR-015). New editions use `supersedes_id`;
withdrawal sets `retired` with a reason; audit events keep the exact version used.

## 6. Retrieval, taxonomy and answer contract

See ADR-012 to ADR-017.

## 7. Plan

1. 04.1 Ingestion and governance + 04.3 taxonomy core (parallel). Gate: first licensed documents published; every
   published passage tagged.
2. 04.2 Hybrid retrieval. Gate: beats the Batch 03.2 baseline on the evaluation set.
3. 04.4 Evidence-grounded recommendations. Gate: no uncited number reaches a farmer in the test set.
4. 04.5 Validation and release. Gate: Staging sign-off by the owner and a staff agronomist.

Owner decisions: embedding model and budget (ADR-014); who requests NIHORT/NAERLS/ministry permissions and under
which entity; named reviewing agronomist(s); first 10 priority crops; legal review of the licence approach.
