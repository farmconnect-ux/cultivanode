# ADR-009: Retention, Correction and Deletion

**Status:** Proposed — Independent Review Remediation (Batch 03.0) | **Date:** 2026-11-19

## Context
Batch 02.5 established 3-phase account deletion (`execute_account_deletion` + `lease_token`-fenced Storage cleanup) preserving financial/device audit trails. Deleting a user must not erase legitimate shared farm knowledge or mutate append-only `ai_audit_events`.

## Decision
1. **Correction & Deletion of Memory:** Authorised users edit/dispute/delete `scope = 'farm'` memory via the server Memory Write Service (`can_edit_farm`); users manage their own `scope = 'profile'` preferences (`profile_id = auth.uid()`).
2. **Account Deletion & Memory (Ownership vs. Attribution):**
   - `memory_scope = 'profile'` (`profile_id = deleted_user_id`): hard-deleted / anonymised.
   - `memory_scope = 'farm'` on surviving org farms: **farm-owned knowledge is preserved** (`farm_id` intact); attribution fields (`created_by`, `confirmed_by`, `updated_by`) referencing the deleted user are set to `NULL` (`ON DELETE SET NULL`), retaining `source_kind` and `verification_status` without PII.
3. **Account Deletion & Immutable Audit (`private.ai_actor_directory`):** `public.ai_audit_events` is **never updated or deleted**. Instead, `public.execute_account_deletion(uuid, text)` (`OWNER TO postgres`, `SECURITY DEFINER`) invokes `private.anonymise_ai_actor(p_profile_id)` internally (`REVOKE ALL FROM PUBLIC, anon, authenticated, service_role` on `anonymise_ai_actor` itself so no unrelated `service_role` caller can invoke it directly). `anonymise_ai_actor` idempotently sets `profile_id = NULL, deleted_at = COALESCE(deleted_at, now())` in `private.ai_actor_directory` (cannot create or reactivate mappings), and `execute_account_deletion` records the anonymisation once in `public.audit_log`. Compliance lookups via `public.compliance_lookup_ai_actor` (`audit.read`, principal-keyed + system-wide atomic DB rate-limited, audited in `public.audit_log` per `ADR-005`) return `profile_id = NULL` and `deleted_at` for deleted users without exposing PII.
4. **Consent:** FIE memory/proactive monitoring requires `'ai_intelligence'` consent in `public.consents`.

## Alternatives & Trade-offs
- **Granting `EXECUTE` on `private.anonymise_ai_actor` or `private.lookup_ai_actor_subject` to `service_role`:** Allows unrelated server code to anonymise or bulk-enumerate mappings (rejected).
- **Mutating `ai_audit_events` directly:** Violates append-only audit integrity (rejected).
