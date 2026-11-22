# ADR-012: Document Extraction (PDF)

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22

## Context
File ingestion returns `422` for PDF (Batch 03.2G). Nigerian institute and extension material is mainly PDF, some
of it scanned.

## Decision
Extract server-side, only from the archived and hash-verified file, inside the existing trusted verification
boundary. Use the text layer first; OCR only when a page has no text layer, and mark those passages
`extraction_method = 'pdf_ocr'` with a confidence score. Every passage keeps page number and section heading.
Extraction is versioned (`extraction_version`); re-extraction creates new passages, never edits published ones.
A staff reviewer compares sampled passages with the original pages before approval.

## Consequences
- Adds a server dependency for PDF parsing; it must run without network access to third parties.
- Ingested text is untrusted input: it keeps passing through the model-safe serialisation boundary (03.2G).

## Alternatives
- Hosted document-AI service: sends source files to a third party and complicates licence terms (rejected for now).
