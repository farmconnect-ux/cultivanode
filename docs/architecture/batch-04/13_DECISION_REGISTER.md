# Batch 04.0 — Unresolved Decision Register (Correction 10)

**Status:** Open | **Date:** 2026-11-22

## Product owner

| ID | Decision | Needed before | Note |
|---|---|---|---|
| D-P1 | Embedding and reranking vendors and monthly budget | 04.2 | After benchmark D-T1 |
| D-P2 | First ten crops (proposal in `12_PRIORITY_CROPS.md`) | 04.3 | Lettuce included |
| D-P3 | Legal entity that requests content permissions (Excel Palace Global Concept, BN 7455859, or an incorporated company) | 04.1 | Affects agreements |
| D-P4 | Reviewer qualification standard and budget for external reviewers | 04.1 | `07_REVIEWER_GOVERNANCE.md` |
| D-P5 | Launch with metadata-only sources where permission is pending | 04.1 | |
| D-P6 | Whether to fix the fertiliser fallback (finding 02) before 04.1 as a separate safety patch | Now | Recommended |
| D-P7 | Emergency publication policy (who, how long, ratification) | 04.1 | |

## Legal counsel

| ID | Decision |
|---|---|
| D-L1 | Every "counsel" cell in the permission matrix (`05_LICENSING_CONTROLS.md`) |
| D-L2 | Whether short verbatim quotations of all-rights-reserved works are permitted for a commercial service |
| D-L3 | Sending farm facts and passages to LLM and embedding providers outside Nigeria (NDPA), and provider terms |
| D-L4 | Template agreements for content permissions and external reviewers; liability wording on recommendations |
| D-L5 | Translation rights and attribution for translated passages |
| D-L6 | Licences of admin-boundary, AEZ and climate datasets |

## Agronomists

| ID | Decision |
|---|---|
| D-A1 | AEZ map to adopt and farm-to-zone method (ADR-018) |
| D-A2 | Accepted soil test methods, units and validity periods |
| D-A3 | Conflict tolerances per quantity type (ADR-019) |
| D-A4 | Confirm the high-risk content list (ADR-021) |
| D-A5 | Coefficient sources per crop; review of uncited factors in `fertiliser.ts` (`× 0.6`, `× 0.48`, `OM × 15`) and oxide/elemental basis |
| D-A6 | Interim answer policy for crops without standards (e.g. lettuce) |

## External source providers

| ID | Request |
|---|---|
| D-E1 | NIHORT: permission or MoU for production guides (horticulture, Ibadan) |
| D-E2 | Federal Ministry of Agriculture and Food Security: national fertiliser guide |
| D-E3 | NAERLS: extension bulletins |
| D-E4 | NiMet: reuse of seasonal predictions |
| D-E5 | CABI: commercial licence for PlantwisePlus content |
| D-E6 | NAFDAC: machine-readable pesticide registration and ban list |

## Technical benchmarking

| ID | Decision |
|---|---|
| D-T1 | Embedding model shortlist and results (`10_…EVALUATION.md`) |
| D-T2 | OCR page-quality thresholds and review sampling rates (`06_…OCR_GOVERNANCE.md`) |
| D-T3 | Reranker choice |
| D-T4 | HNSW parameters, storage and p95 latency on Staging (ADR-003 gate) |
| D-T5 | Keep 1,536 dimensions or move to a per-model embedding table |
