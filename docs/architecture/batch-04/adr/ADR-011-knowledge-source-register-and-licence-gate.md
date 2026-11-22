# ADR-011: Knowledge Source Register and Licence Gate

**Status:** Proposed — revision 3 (Batch 04.0) | **Date:** 2026-11-22

## Context

`agronomic_standard_documents` (`20261122020000`) records `source_authority` as free text and has no licence
fields. The most relevant Nigerian sources are all rights reserved, and CultivaNode is a commercial service.

## Decision

- `public.knowledge_sources`: publisher, legal status and evidence attributes (ADR-019), `ingestion_mode`
  (`metadata_only` | `full_text`), review-due date, status. New documents require `source_id`.
- `public.knowledge_licence_grants`: one boolean per activity A2–A13, attribution, territory, validity, retention,
  grant document in private Storage, and the counsel review reference.
- Enforcement in PostgreSQL at ingestion (A2–A6), retrieval (A7, A8/A9; ADR-013 C7) and expiry (A12).
- All-rights-reserved sources stay `metadata_only` until written permission or a counsel-documented legal basis exists
  for the intended use.

The A1–A13 matrix in `05_LICENSING_CONTROLS.md` is a **proposed compliance policy subject to qualified legal review**
(D-L1, D-L2). It is not a legal interpretation of Creative Commons licences or Nigerian copyright law.

Correspondence and agreements with providers are made by Excel Palace Global Concept after the CAC verification
prerequisite in D-P3.

## Alternatives

- Licence notes as free text per document: not enforceable (rejected).
