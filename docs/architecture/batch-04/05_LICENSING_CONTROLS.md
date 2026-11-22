# Batch 04.0 — Licensing Controls (Correction 5)

**Status:** Proposed; requires legal counsel review before use | **Date:** 2026-11-22 | **ADR:** ADR-011 (revised)

Nothing here is legal advice. Every "counsel" cell is an open question for a lawyer (decision register, Legal).

## Two ingestion modes

| Mode | What is stored | What the AI may do |
|---|---|---|
| **Metadata / link-out** | Title, publisher, year, edition, URL, licence statement, topic and crop tags written by staff. No file, no text, no abstract unless the licence allows it | Say a source exists and link to it. Never answer from its content |
| **Licensed full-text** | Original file, derivatives, passages, embeddings | Answer from passages within the activities the licence grants |

A source without a recorded licence grant can only be registered in metadata mode.

## Permission matrix

Activities are checked separately because licences and permissions grant them separately.

| # | Activity | CC BY 4.0 | CC BY-SA | CC BY-NC / NC-SA | CC BY-NC-ND | All rights reserved, no permission | Written permission |
|---|---|---|---|---|---|---|---|
| A1 | Store metadata and link | Yes | Yes | Yes | Yes | Yes (facts and link) | Yes |
| A2 | Store the original file | Yes | Yes | Counsel (commercial service) | Counsel | No | As granted |
| A3 | Create OCR derivative | Yes | Yes (SA applies) | Counsel | Counsel (derivative) | No | As granted |
| A4 | Extract text | Yes | Yes | Counsel | Counsel | No | As granted |
| A5 | Chunk into passages | Yes | Yes | Counsel | Counsel | No | As granted |
| A6 | Create embeddings | Yes | Yes | Counsel | Counsel | No | As granted, named explicitly |
| A7 | Retrieve for staff review | Yes | Yes | Counsel | Counsel | No | As granted |
| A8 | Show passages to farmers | Yes, with attribution | Yes, with attribution | No (commercial) unless counsel confirms | No | No | As granted |
| A9 | Use in commercial AI answers (text sent to an LLM provider) | Yes, with attribution | Counsel (share-alike on outputs) | No | No | No | As granted, naming third-party processing |
| A10 | Quote verbatim | Yes, attributed | Yes, attributed | Counsel | Counsel | Short quotation only if counsel confirms fair dealing | Length limit as granted |
| A11 | Translate (yo, ha, ig, pcm) | Yes, marked as modified | Yes, under same licence | Counsel | **No** (no derivatives) | No | As granted |
| A12 | Retain after licence ends | n/a (perpetual) | n/a | n/a | n/a | n/a | Purge passages, derivatives and embeddings within the grant's period; keep metadata and hashes for audit |
| A13 | Use to train or fine-tune models | Counsel | Counsel | No | No | No | Only if explicitly granted |

## Data model and enforcement (for Batch 04.1)

- `knowledge_sources` (ADR-011) gains `ingestion_mode` (`metadata_only` | `full_text`).
- `knowledge_licence_grants`: source, licence type, grant document (private Storage), granted-by, one boolean per
  activity A2–A13, quotation limit, attribution text, territory, valid-from/to, retention period after expiry.
- Enforcement points, all in PostgreSQL:
  - ingestion RPCs check A2–A6 before archiving, extracting or embedding;
  - the retrieval RPC returns passages only where A7 (staff) or A8/A9 (farmer answers) are granted, and marks each
    passage `may_quote` (A10) and `may_translate` (A11);
  - a scheduled job retires sources at grant expiry and purges derivatives after the retention period (A12);
  - training export is not built (A13).
- Every answer's evidence package includes the attribution text of each cited source.
