# Batch 04.0 — Document Extraction and OCR Quality Governance (Correction 4)

**Status:** Proposed | **Date:** 2026-11-22 | **ADR:** ADR-012 (revised)

Builds on the 03.2G/H chain: private bucket `agronomic-standard-sources`, `original_file_sha256`,
`storage_object_path`, `extraction_method`, `extraction_version`, `ingestion_status`, and `service_role`-only
verification (`supabase/migrations/20261122030000_batch_03_2g_document_provenance_chain.sql`,
`20261122040000_batch_03_2h_document_provenance_trust_boundary.sql`, `apps/web/src/lib/rag/trusted-document-verifier.ts`).

## 1. Original preservation

- The original file is archived once, immutable, addressed by its SHA-256 (existing canonical path
  `<standard_id>/<original_file_sha256>.<ext>`). It is never modified, re-saved or overwritten.
- Each page is rendered to an image at a fixed resolution; the page image is stored with its own SHA-256.
- Licence permitting (A2/A3, `05_LICENSING_CONTROLS.md`); otherwise the source stays metadata-only.

## 2. Derivative provenance (one record per page per extraction run)

`document_page_extractions`: document id, page number, page image SHA-256, method (`text_layer` | `ocr`), engine name
and version, language packs, parameters, output text SHA-256, quality metrics (below), extraction run id, created at.
Passages reference the page extraction records they came from. A re-extraction creates a new run and new passages;
published passages are never edited (existing immutability trigger `private.guard_agronomic_rag_integrity()`).

## 3. Page-level quality classification

Each page is classed `pass`, `review` or `reject` from:

| Metric | Text layer | OCR |
|---|---|---|
| Mean and minimum word confidence | n/a | recorded |
| Share of low-confidence words | n/a | recorded |
| Lexicon hit rate (English + agricultural lexicon incl. local crop names) | recorded | recorded |
| Numeric tokens and units found (kg/ha, g/L, ml, %, ppm, bags) | recorded | recorded |
| Table detected | recorded | recorded |
| Rotation, skew, handwriting detected | n/a | recorded |

Thresholds are not guessed here. They are set from a labelled benchmark of real Nigerian source pages in 04.1
(decision register D-T2) and stored as versioned configuration.

## 4. Numbers and tables

- A page with any rate, dose, unit or quantity token is **numeric-critical**.
- Every numeric-critical page needs 100% human verification against the page image.
- Two independent extractions (text layer vs OCR, or two OCR configurations) must agree on every numeric token;
  any disagreement blocks the page until a reviewer resolves it.
- Tables are extracted to structured cells (row header, column header, value, unit, footnote) and stored alongside
  the text passage. The reviewer confirms each table cell-by-cell for numeric-critical tables.
- Units are normalised for calculation, but the original string is kept.

## 5. Human review

- The reviewer sees the page image beside the extracted text and table, with differences highlighted.
- Non-critical pages are sampled; the sampling rate is set with the thresholds (D-T2).
- Review results (page, decision, corrections, reviewer, time) are stored and included in the publication audit
  record (`07_REVIEWER_GOVERNANCE.md`).
- Corrections create a corrected derivative with its own hash; the OCR output is kept for comparison.

## 6. Rejection criteria

A page is rejected, and excluded from retrieval, when any of these holds:
- unreadable, missing, cut off or out of order versus the table of contents;
- an unresolved numeric disagreement;
- handwriting or annotations that change meaning;
- a table whose structure cannot be reconstructed;
- a language without a supported OCR pack;
- page classed `reject` by the benchmark thresholds.

A whole document is rejected when the original hash does not verify, the licence does not permit A3/A4, or a
numeric-critical page is rejected. A document may be published with some pages excluded only if none of them is
numeric-critical and the approver records the exclusion.
