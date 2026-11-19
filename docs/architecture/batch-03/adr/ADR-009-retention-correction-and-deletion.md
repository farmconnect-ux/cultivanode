# ADR-009: Retention, Correction and Deletion

**Status:** Proposed (Batch 03.0) | **Date:** 2026-11-19

## Context
Batch 02.5 established 3-phase account deletion (`execute_account_deletion` + `lease_token`-fenced Storage cleanup) that anonymises `profiles`, drops `profiles_id_fkey`, and nulls `device_commands.created_by` while preserving operational/financial audit trails.

## Decision
Align FIE memory and audit retention with Batch 02.5:
1. Farmers with `can_edit_farm` can correct, dispute, or soft-delete `farm_memory_items` at any time.
2. On account deletion, personal `preference` memories for the deleted user are deleted/anonymised, while shared farm memories (`farm_id` owned by surviving org) retain `farm_id` with `confirmed_by`/`profile_id` anonymised.
3. `ai_audit_events` remains append-only with `actor_id` anonymised (`NULL`) upon user deletion, preserving safety/agronomic traceability without retaining PII.
4. FIE memory/proactive monitoring requires explicit `'ai_intelligence'` consent in `public.consents`.

## Alternatives & Trade-offs
- **Hard-deleting all AI audit rows on user deletion:** Destroys NAFDAC safety and agronomic liability trails (rejected).

## Security & Cost Implications
- Complies with GDPR/NDPR data-minimisation and erasure rights while preserving non-repudiable safety logs.
