# ADR-012: Document Extraction and OCR Quality Governance

**Status:** Proposed — revised for review correction 4 (Batch 04.0) | **Date:** 2026-11-22

## Context
File ingestion returns `422` for PDF (Batch 03.2G). Nigerian institute and extension material is mainly PDF, some
scanned. Rates and doses in tables are the highest-risk content.

## Decision
- Originals archived once and immutable by SHA-256 (existing `agronomic-standard-sources` bucket); page images
  stored with their own hashes.
- `document_page_extractions` records per page and run: method (`text_layer` | `ocr`), engine and version,
  parameters, input and output hashes, quality metrics.
- Pages classed `pass` / `review` / `reject` with thresholds set by benchmark (D-T2), not guessed.
- Numeric-critical pages: 100% human verification, dual-extraction agreement on every number, structured table
  cells with units; unresolved disagreement blocks publication.
- Defined rejection criteria at page and document level; partial publication only without numeric-critical
  exclusions and with a recorded approval.
- Extraction runs in a sandbox without network access; ingested text stays untrusted input (03.2G boundary).

Detail: `06_DOCUMENT_EXTRACTION_AND_OCR_GOVERNANCE.md`.

## Alternatives
- Hosted document-AI service: sends source files to a third party and depends on licence A3 terms (rejected for now).
