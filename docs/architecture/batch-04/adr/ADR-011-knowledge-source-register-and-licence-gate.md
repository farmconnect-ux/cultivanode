# ADR-011: Knowledge Source Register and Licence Gate

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22

## Context
`agronomic_standard_documents` records `source_authority` as free text and has no licence field. The Batch 04.0
source review found that the most relevant Nigerian sources (NIHORT, NAERLS, the national fertiliser guide) are
"all rights reserved" or unlicensed, while CultivaNode is a commercial service.

## Decision
Add `public.knowledge_sources` above documents: publisher, trust tier (T1–T5), licence identifier and text,
licence evidence URL, permission document (private Storage path), commercial-use allowed, derivative/quotation
limits, review-due date, status. `agronomic_standard_documents.source_id` becomes required for new rows.
The ingestion RPCs refuse documents whose source is not `cleared` (enforced in PostgreSQL, not the UI).

## Consequences
- Legal review becomes a recorded, auditable step.
- Sources whose licence forbids full-text storage can still be registered as citation-only (metadata + link),
  never as retrievable passages.

## Alternatives
- Licence notes in free text per document: not enforceable (rejected).
