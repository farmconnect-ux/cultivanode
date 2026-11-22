# ADR-021: Reviewer Governance

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22

## Context
`public.agronomy_publish_standard` (`20261103120000:204`) enforces author ≠ approver except for super admins
(lines 237-240). No qualification, competence scope or conflict-of-interest records exist.

## Decision
- Roles: uploader, extraction reviewer, agronomic approver, high-risk second reviewer, licence approver.
- Database-enforced separation (approver ≠ uploader; second reviewer ≠ both); no super-admin bypass; emergency
  publication only with recorded justification, time limit and ratification.
- Reviewer qualification and competence scope recorded; approval outside scope refused; annual conflict-of-interest
  declaration.
- External and part-time reviewers allowed under written agreements; two full-time employees are not required.
- High-risk content (rates and doses, food-safety intervals, regulatory conflicts, first standard for a crop,
  OCR numeric-critical pages) needs a second independent review.
- An immutable publication audit record is written and referenced from AI audit events.

Detail: `07_REVIEWER_GOVERNANCE.md`. Qualification standard: D-P4.
