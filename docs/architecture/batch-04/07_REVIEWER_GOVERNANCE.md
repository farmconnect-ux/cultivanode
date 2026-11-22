# Batch 04.0 — Reviewer Governance (Correction 6)

**Status:** Proposed | **Date:** 2026-11-22 | **ADR:** ADR-021

## Current state (verified)

- `farm_agronomic_standards` has `author_id`, `reviewer_id`, `approved_by_id`, `approved_by_name`, `approved_at`
  (`supabase/migrations/20261103120000_agronomy_standards_governance.sql:30-32`).
- `public.agronomy_publish_standard` (line 204) enforces author ≠ approver **unless the caller is super admin**
  (lines 237-240). The override is silent: no second reviewer or recorded justification is required.
- Permissions used: `standards.publish`, `crops.manage` (`20261122030000`, lines 39-51).
- No record of reviewer qualifications, competence scope or conflicts of interest exists.
- pgTAP coverage: `supabase/tests/database/17_agronomy_governance.test.sql`.

## Roles

| Role | Does | Qualification |
|---|---|---|
| Uploader | Registers source, uploads file, starts extraction | Trained staff |
| Extraction reviewer | Checks text and tables against page images (`06_…OCR_GOVERNANCE.md`) | Trained staff; need not be an agronomist |
| Agronomic approver | Approves content for publication within their competence scope | Qualified reviewer (below) |
| High-risk second reviewer | Independent second approval for high-risk content | Qualified reviewer, different person and organisation where possible |
| Licence approver | Confirms the licence grant record | Owner or delegate; counsel for non-standard licences |

## Separation rules (enforced in PostgreSQL)

- Agronomic approver ≠ uploader for the same document or standard.
- High-risk second reviewer ≠ first approver and ≠ uploader.
- No super-admin bypass. An emergency publication requires a recorded justification, is time-limited, and must be
  ratified by a second reviewer within a set period, or it is retired automatically.
- One person may hold different roles on different documents.

**Minimum staffing is not two full-time employees.** One internal staff member (uploader and extraction reviewer)
plus one contracted external qualified reviewer (approver) satisfies separation. High-risk content needs a second
qualified reviewer, who can also be external or part-time.

## Qualified reviewer (proposal; owner and agronomy lead to confirm, D-P4)

- Degree in agronomy, crop science, soil science, crop protection, horticulture or animal science (livestock);
  veterinary qualification for veterinary medicines.
- Documented experience with Nigerian or West African farming systems in the domain reviewed.
- Competence scope recorded per reviewer (domains and crop groups); approval outside scope is refused.
- Qualification evidence stored privately; annual conflict-of-interest declaration (e.g. links to input sellers).

## External review arrangements

Written agreement covering scope, confidentiality, conflict of interest, turnaround, liability and fees. Options: a
research institute partner (e.g. under an MoU with NIHORT), a university faculty, or individual consultants.
External reviewers receive reviewer-only accounts with no farmer data access.

## High-risk content (requires second review)

- Any fertiliser, pesticide, veterinary or feed-additive rate or dose.
- Food-safety intervals and limits (pre-harvest interval, withdrawal period, mycotoxins).
- Content that conflicts with a regulation or with an existing published standard.
- The first published standard for a crop (e.g. lettuce).
- Numeric-critical pages produced by OCR.

## Publication audit record

Written to the existing audit log on publish, immutable: source and document ids, version and file hashes, every
reviewer with role and competence reference, review checklist results, page exclusions, conflicts found and how
resolved, licence grant id, decision and timestamps. Its id is added to AI audit `context_refs` when the content is
later cited.
