# ADR-011: Knowledge Source Register and Licence Gate

**Status:** Proposed — revised for review correction 5 (Batch 04.0) | **Date:** 2026-11-22

## Context
`agronomic_standard_documents` (`20261122020000`) records `source_authority` as free text and has no licence
fields. The most relevant Nigerian sources are all rights reserved, and CultivaNode is a commercial service.

## Decision
- `public.knowledge_sources`: publisher, legal status and evidence attributes (ADR-019), `ingestion_mode`
  (`metadata_only` | `full_text`), review-due date, status. New documents require `source_id`.
- `public.knowledge_licence_grants`: one boolean per activity A2–A13 (store, OCR, extract, chunk, embed, staff
  retrieval, farmer display, commercial AI use, quotation with length limit, translation, retention after expiry,
  training), attribution text, territory, validity, grant document in private Storage.
- Enforcement in PostgreSQL: ingestion checks A2–A6; retrieval checks A7 or A8/A9 and returns `may_quote` and
  `may_translate`; a scheduled job retires and purges at expiry (A12); no training export (A13).
- Without a grant a source can only be `metadata_only`: link-out, never answered from.

Full matrix: `05_LICENSING_CONTROLS.md`. Counsel review required (D-L1).

## Alternatives
- Licence notes as free text per document: not enforceable (rejected).
