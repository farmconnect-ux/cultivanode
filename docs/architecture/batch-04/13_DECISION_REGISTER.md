# Batch 04.0 — Decision Register

**Status:** Revision 3 | **Date:** 2026-11-22

## Confirmed by the product owner

| ID | Decision | Confirmed | Conditions |
|---|---|---|---|
| D-P3 | CultivaNode operates under **Excel Palace Global Concept**. It is the proposed contracting and correspondence entity for NIHORT, NAERLS and the Federal Ministry of Agriculture and Food Security. | 2026-11-22 | Recorded registration reference: BN 7455859 (business name). **Administrative prerequisite:** verify the CAC business name and registration status (current extract) before any formal correspondence or contract execution. Do not describe the entity as incorporated or as a limited liability company unless registration evidence shows that status. |
| D-P6 | The fail-closed fertiliser safety correction (ADR-020) is a **mandatory prerequisite** before Batch 04.1 starts (phase 04.0-H). | 2026-11-22 | Not implemented in PR #25. |
| D-P2 (partial) | Keep the ten proposed crops, including lettuce, for planning (`12_PRIORITY_CROPS.md`). | 2026-11-22 | Final list awaits agronomist validation (D-A7). |

## Outstanding — product owner

| ID | Decision | Needed before |
|---|---|---|
| D-P1 | Embedding and reranking vendors and monthly budget, after benchmark D-T1 | 04.2 |
| D-P4 | Reviewer qualification standard and budget for external reviewers | 04.1 |
| D-P5 | Launch with metadata-only sources where permission is pending | 04.1 |
| D-P7 | Emergency publication policy (who, time limit, ratification) | 04.1 |
| D-P8 | Retention window for a retired embedding model kept for rollback (ADR-014) | 04.2 |

## Outstanding — legal counsel

| ID | Decision |
|---|---|
| D-L1 | Review of the proposed A1–A13 compliance policy (`05_LICENSING_CONTROLS.md`) under Nigerian copyright law and each licence's terms |
| D-L2 | Whether any documented legal basis permits specific uses of all-rights-reserved works (until then: metadata-only) |
| D-L3 | Sending farm facts and passages to LLM and embedding providers outside Nigeria (NDPA), and provider terms |
| D-L4 | Template agreements for content permissions and external reviewers; liability wording on recommendations |
| D-L5 | Translation rights and attribution for translated passages |
| D-L6 | Licences of admin-boundary, agro-ecological zone and climate datasets |
| D-L7 | Retention period and access rules for retrieval logs (ADR-013) |

## Outstanding — agronomists

| ID | Decision |
|---|---|
| D-A1 | Agro-ecological zone map and farm-to-zone method (ADR-018) |
| D-A2 | Accepted soil extraction methods, sampling depths, units, nutrient basis and validity periods |
| D-A3 | Conflict tolerances per quantity type (ADR-019) |
| D-A4 | Confirm the high-risk content list (ADR-021) |
| D-A5 | Coefficient sources and calibration per crop; review of uncited factors in `packages/shared/src/engines/inputs/fertiliser.ts` (`× 0.6`, `× 0.48`, `OM × 15`) |
| D-A6 | Interim answer wording for crops without standards (e.g. lettuce) |
| D-A7 | Final validation of the ten priority crops |

## Outstanding — institutional providers

| ID | Request (sent by Excel Palace Global Concept after the D-P3 prerequisite) |
|---|---|
| D-E1 | NIHORT: permission or MoU for production guides |
| D-E2 | Federal Ministry of Agriculture and Food Security: national fertiliser guide |
| D-E3 | NAERLS: extension bulletins |
| D-E4 | NiMet: reuse of seasonal predictions |
| D-E5 | CABI: commercial licence for PlantwisePlus content |
| D-E6 | NAFDAC: machine-readable pesticide registration and ban list |

## Outstanding — technical benchmarking

| ID | Decision |
|---|---|
| D-T1 | Embedding model shortlist and results (`10_EMBEDDING_AND_RERANKING_EVALUATION.md`) |
| D-T2 | OCR page-quality thresholds and review sampling rates (`06_DOCUMENT_EXTRACTION_AND_OCR_GOVERNANCE.md`) |
| D-T3 | Reranker choice |
| D-T4 | HNSW parameters, storage and p95 latency on Staging (ADR-003 gate) |
| D-T5 | Confirm the partitioned embedding store against the alternatives on Staging (ADR-014) |
