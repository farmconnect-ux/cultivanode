# ADR-009: Retention, Correction and Deletion

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
Batch 02.5 established 3-phase account deletion (`execute_account_deletion` + `lease_token`-fenced Storage cleanup) preserving financial/device audit trails. Earlier ADR-009 text proposed nulling `ai_audit_events.actor_id`, conflicting with append-only `forbid_change()`.

## Decision
1. **Correction & Deletion of Memory:** Authorised users edit/dispute/delete `scope = 'farm'` memory via the server Memory Write Service (`can_edit_farm`); users manage their own `scope = 'profile'` preferences (`profile_id = auth.uid()`).
2. **Account Deletion & Memory:** `execute_account_deletion` hard-deletes/anonymises `scope = 'profile'` rows for the deleted user, and sets `created_by`/`confirmed_by = NULL` on surviving org `scope = 'farm'` rows.
3. **Account Deletion & Immutable Audit:** `ai_audit_events` is **never updated or deleted**. Instead, `execute_account_deletion` sets `ai_actor_directory.profile_id = NULL, deleted_at = now()`, severing PII attribution while preserving immutable safety/agronomic audit evidence, and logs the deletion in `public.audit_log`.
4. **Consent:** FIE memory/proactive monitoring requires `'ai_intelligence'` consent in `public.consents`.

## Alternatives & Trade-offs
- **Mutating `ai_audit_events` directly:** Violates append-only audit integrity (rejected).
