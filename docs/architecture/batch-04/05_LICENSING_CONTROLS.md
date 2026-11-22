# Batch 04.0 — Licensing Controls

**Status:** **Proposed compliance policy, subject to qualified legal review (D-L1).** | **Date:** 2026-11-22 | **ADR:** ADR-011

This is CultivaNode's proposed internal policy for what it will and will not do with each kind of source. It is not
a legal interpretation of Creative Commons licences or of Nigerian copyright law, and it is not legal advice. Where a
cell says "Proposed: permitted", counsel must still confirm it before the activity starts.

## Two ingestion modes

| Mode | What is stored | What the AI may do |
|---|---|---|
| **Metadata / link-out** | Title, publisher, year, edition, URL, licence statement, topic and crop tags written by staff. No file, no text, no abstract unless the licence allows it | Say a source exists and link to it. Never answer from its content |
| **Licensed full-text** | Original file, derivatives, passages, embeddings | Answer from passages within the activities the licence or permission grants |

**All-rights-reserved material stays metadata-only** until CultivaNode holds written permission covering the
intended activities, or counsel has documented a legal basis for that specific use (D-L2). A source without a
recorded grant can only be registered in metadata mode.

## Proposed permission matrix

| # | Activity | CC BY 4.0 | CC BY-SA | CC BY-NC / NC-SA | CC BY-NC-ND | All rights reserved | Written permission |
|---|---|---|---|---|---|---|---|
| A1 | Store metadata and link | Proposed: permitted | Proposed: permitted | Proposed: permitted | Proposed: permitted | Proposed: permitted (facts and link only) | Permitted |
| A2 | Store the original file | Proposed: permitted | Proposed: permitted | Counsel | Counsel | Metadata-only | As granted |
| A3 | Create OCR derivative | Proposed: permitted | Proposed: permitted (share-alike) | Counsel | Counsel | Metadata-only | As granted |
| A4 | Extract text | Proposed: permitted | Proposed: permitted | Counsel | Counsel | Metadata-only | As granted |
| A5 | Chunk into passages | Proposed: permitted | Proposed: permitted | Counsel | Counsel | Metadata-only | As granted |
| A6 | Create embeddings | Proposed: permitted | Proposed: permitted | Counsel | Counsel | Metadata-only | As granted, named explicitly |
| A7 | Retrieve for staff review | Proposed: permitted | Proposed: permitted | Counsel | Counsel | Metadata-only | As granted |
| A8 | Show passages to farmers | Proposed: permitted, attributed | Proposed: permitted, attributed | Not without counsel approval (commercial service) | Not without counsel approval | Metadata-only | As granted |
| A9 | Use in commercial AI answers (text sent to an LLM provider) | Proposed: permitted, attributed | Counsel (share-alike on outputs) | Not without counsel approval | Not without counsel approval | Metadata-only | As granted, naming third-party processing |
| A10 | Quote verbatim | Proposed: permitted, attributed | Proposed: permitted, attributed | Counsel | Counsel | Metadata-only | Length limit as granted |
| A11 | Translate (yo, ha, ig, pcm) | Proposed: permitted, marked as modified | Proposed: permitted under same licence | Counsel | Proposed: not permitted (no derivatives) | Metadata-only | As granted |
| A12 | Retain after permission ends | n/a | n/a | n/a | n/a | n/a | Purge passages, derivatives and embeddings within the grant's period; keep metadata and hashes for audit |
| A13 | Train or fine-tune models | Counsel | Counsel | Proposed: not permitted | Proposed: not permitted | Not permitted | Only if explicitly granted |

## Data model and enforcement (for Batch 04.1)

- `knowledge_sources` (ADR-011) has `ingestion_mode` (`metadata_only` | `full_text`).
- `knowledge_licence_grants`: source, licence type, grant document (private Storage), granted-by, one boolean per
  activity A2–A13, quotation limit, attribution text, territory, valid-from/to, retention after expiry, and the
  counsel review reference that approved it.
- Enforcement points, all in PostgreSQL:
  - ingestion RPCs check A2–A6 before archiving, extracting or embedding;
  - the retrieval RPC (ADR-013 C7) returns passages only where A7 or A8/A9 are granted, and marks each passage
    `may_quote` (A10) and `may_translate` (A11);
  - a scheduled job retires sources at grant expiry and purges derivatives after the retention period (A12);
  - no training export is built (A13).
- Every answer's evidence package includes the attribution text of each cited source.
