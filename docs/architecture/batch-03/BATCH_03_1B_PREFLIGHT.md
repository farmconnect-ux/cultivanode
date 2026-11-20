# Batch 03.1B — Database Foundations Preflight

**Date:** 2026-11-20  
**Branch:** `feat/batch-03-1b-database-foundations`  
**Base:** `main` at `2de2223f891e772457e47958a61513f7f0e9afa6` (PR #14 merge)  
**Scope:** M1–M5 database foundation design and implementation readiness  
**Execution boundary:** Read-only Staging inspection only. No migration has been applied to Staging or Production.

## 1. Start state

A dedicated Batch 03.1B branch has been created from the current `main` commit. PR #14 is merged. Its pre-merge CI passed. Post-merge CI and Android build workflows were queued at the time of this preflight and must be checked before any merge of subsequent work.

The Staging project inspected was `CultivaNode-Staging` (`xdbqndgwisshhjqqksbe`). Production was not queried or modified.

## 2. Staging migration baseline

A read-only query of `supabase_migrations.schema_migrations` returned **74 rows**, with maximum version `20261119005153`. The five Batch 03.1B migration versions in the approved register (`20261120000000` through `20261120040000`) are therefore later than the current Staging history.

The ledger remains intentionally non-canonical in places because it contains execution-time migration versions and the previously reconciled marketplace history. Do not use `supabase db push`, reset, delete migration history, or replay the marketplace migrations as part of Batch 03.1B.

## 3. Existing database objects verified

Read-only Staging inspection confirmed:

- `public.consent_type` exists with values `terms_of_use`, `privacy_policy`, `data_processing`, `marketing_messages`, `share_with_lenders`, `share_with_buyers`, `share_with_investors`, and `share_with_partners`.
- `public.consents` already exists. Its current RLS policies allow users to read their own consents (or users with `users.read`) and record their own consent.
- `public.audit_log` already exists and has actor, action, entity, metadata, old/new values, IP, user-agent and timestamp fields.
- `public.admin_actions` already exists with actor, permission, action, entity, reason and timestamp fields.
- `public.has_permission(text)` is an existing SECURITY DEFINER helper that grants all permissions to `super_admin` and otherwise checks `public.admin_role_permissions`.
- `public.execute_account_deletion(uuid,text)` is the lease-fenced Batch 02.5 implementation. M2 must patch this exact current definition and preserve its advisory locking, deletion-state idempotency, Storage queueing, organisation transfer/archive, marketplace safeguards and audit behaviour.
- `pg_cron` 1.6.4 and `pgcrypto` 1.3 are installed. `vector` is not currently installed in Staging. Prior extension discovery found vector 0.8.2 available.
- The current permission catalogue does **not** contain `audit.read`, `ai.manage`, or `system.settings`. Existing permissions include `privacy.manage` (mapped to `support_disputes`), and `super_admin` bypasses permission lookup.

## 4. Migration implementation sequence

The intended order remains:

| Migration | Purpose | Current readiness |
|---|---|---|
| M1 | Enable `vector` in `extensions`; add `ai_intelligence` to `public.consent_type` | Ready for code and tests |
| M2 | Private actor directory, internal functions and deletion anonymisation hook | Implemented on branch; awaiting CI and review |
| M3 | Append-only AI audit events, trusted writer and constrained feedback RPC | Ready for code after RLS and append-only tests |
| M4 | Audited, concurrency-safe compliance lookup | Implemented on branch; latest CI verification pending; disabled by default pending operational approval |
| M5 | Immutable prompt versions, active pointers and audited activation/rollback | Activation permission key requires owner decision |

M1 must not reference the newly added enum label in a data statement in the same migration transaction. Extension installation must use the unpinned form `CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions`; Supabase deprecated explicit extension version clauses from 2026-08-05.

## 5. Decisions required before M4 and M5 implementation

The current Staging permission catalogue has no `audit.read` permission. The architecture proposal's M4 permission therefore cannot be implemented as written without adding a permission and deciding which admin role receives it. `privacy.manage` exists but is broader and should not be silently substituted.

M5 also needs a dedicated permission decision. The cleanest least-privilege option is a new `ai.manage` permission, granted only to `super_admin` initially; this is a proposal, not an approved policy.

The M4 provisional rate limits remain: 10 attempts per principal per 15 minutes, 5 denied/unsuccessful attempts per principal per 15 minutes, and 30 attempts system-wide per 15 minutes. These are engineering defaults, not legal limits, and need explicit approval before enforcement.

## 6. Security-advisor baseline

The read-only Staging security advisor currently reports pre-existing findings, including RLS-enabled tables with no policies, SECURITY DEFINER functions executable by anon/authenticated, and disabled leaked-password protection. These are baseline findings, not regressions introduced by Batch 03.1B. New migrations must not increase the relevant findings; targeted grant checks and advisor comparisons will be required after Staging application.




## 10. M3 final security review and M4 implementation record

### M3 final security review

M3's database migration and 29-assertion pgTAP suite passed complete CI on commit `f5d5d9167f6fb19ee8ca9dba4a3952aa8426fb4b`, workflow run `44790090869`. Typecheck, lint, unit tests, production build, clean migration replay, pgTAP, concurrency, Storage integration and live API/database integration all passed.

The final review confirms that audit-event and feedback tables are append-only; direct application-role table writes are revoked; event reads are farm-scoped; the trusted writer is PostgreSQL-owned, SECURITY DEFINER, empty-search-path and service_role-only; the feedback RPC is authenticated-only, derives the submitting identity from `auth.uid()`, and cannot mutate the original event. Trace ID idempotency rejects conflicting replays. Context references reject unrecognised fields and require source and record identifiers.

The remaining boundary is explicit and intentional: `private.write_ai_audit_event` accepts a profile identifier and farm identifier from the trusted server caller. Since Next.js server modules share the Supabase service-role credential, PostgreSQL cannot establish which module invoked the writer. The future central `apps/web/src/lib/ai-audit.ts` must verify the JWT identity, active account, AI consent and farm membership under the caller's JWT before invoking the writer. The database writer must not be called directly from route handlers or arbitrary server modules. This is an application-level trust boundary, not an independent PostgreSQL identity boundary.

### M4 implementation

M4 has been implemented in `20261120030000_batch_03_1_compliance_lookup_rpc.sql`.

It creates two private, RLS-enabled, application-inaccessible tables. `private.ai_compliance_lookup_limits` stores principal-keyed attempts, requested subject, purpose code, outcome and timestamp. `private.ai_compliance_lookup_config` stores the operational switch and rate thresholds. The default configuration is disabled, with provisional thresholds of 10 attempts per principal, 5 denied attempts per principal and 30 attempts system-wide in a 15-minute rolling window.

`public.compliance_lookup_ai_actor(uuid,text)` is PostgreSQL-owned, SECURITY DEFINER, uses an empty search path and is executable only by `authenticated`. It requires an active account and `public.has_permission('audit.read')`, validates a fixed purpose-code allowlist, returns only the minimum actor attribution fields, and returns no actor data for denied, throttled or disabled requests. The existing permission catalogue does not grant `audit.read` to ordinary staff roles; therefore, only super-admins currently satisfy the permission check. No permission grant to other roles is introduced by this migration.

Two transaction-scoped advisory locks are acquired in a stable order, system-wide first and principal second. This serialises counter evaluation and insertions, prevents concurrent requests from exceeding configured limits, and prevents subject-ID rotation from bypassing the principal-level ceiling. Every returned outcome is written to the existing append-only `public.audit_log`; audit-write errors abort the lookup and return no actor data. Old counter records are pruned after one hour.

The dedicated pgTAP suite is `26_batch_03_1_compliance_lookup.test.sql`. It covers disabled-by-default behaviour, function/table privileges, permission denial, purpose validation, permitted and unknown subjects, principal denial limits, system-wide limits, and durable audit outcomes. The repository concurrency suite now also runs two genuinely concurrent authenticated lookup requests against a system limit of one, asserting exactly one permitted response, one throttled response and two audit records.

**Operational restriction:** M4 does not enable compliance lookup in Staging or Production. The feature remains disabled until the owner approves the operating thresholds and an authorised database operation enables it. No hosted database changes have been made.

## 9. M3 implementation record

M3 has been implemented in `20261120020000_batch_03_1_ai_audit_events.sql`.

The migration creates `public.ai_audit_events` with one immutable execution record per unique `trace_id`, farm-scoped visibility, a pseudonymous actor reference, provider/model/prompt-version identifiers, execution outcome, bounded guardrail metadata, bounded context references and memory-item identifiers. Raw prompts, model responses, images, credentials and arbitrary request payloads are not accepted by the writer contract.

The audit-event table is append-only through the existing `private.forbid_change()` trigger on UPDATE and DELETE. Direct table writes are revoked from all application roles. Authenticated users receive SELECT only, protected by RLS requiring an active account and `private.can_view_farm(farm_id)`. `service_role` has no direct table privileges.

`private.write_ai_audit_event(...)` is a postgres-owned SECURITY DEFINER function with an empty search path. It is executable only by `service_role`, validates the event contract, resolves the pseudonymous actor internally, and provides first-write-wins idempotency for repeated trace submissions. Reuse of a trace ID with different actor, farm or event content is rejected. As explicitly documented in ADR-005, farm membership and caller identity must be verified by the central server audit client under the caller's JWT before the shared service-role credential invokes this function; PostgreSQL cannot distinguish individual Next.js server modules sharing that credential.

The migration also creates append-only `public.ai_audit_feedback` and `public.record_ai_feedback(trace_id, outcome, note)`. The RPC derives the submitting user from `auth.uid()`, checks account activity, verifies access to the farm attached to the existing user execution, restricts outcomes to `accepted`, `rejected` or `modified`, and permits one feedback record per actor per trace. Feedback cannot alter the original AI execution event.

The dedicated regression suite is `supabase/tests/database/25_batch_03_1_ai_audit_register.test.sql`. It covers table and function privileges, RLS, append-only triggers, unique trace IDs, writer idempotency, payload allowlists, farm-scoped visibility, feedback outcome and duplicate constraints, and rejection of cross-farm feedback.

**Verification status:** M3 source and pgTAP tests have been committed to the Batch 03.1B branch. CI for M3 is pending. No Staging or Production migration has been applied.

## 8. M2 implementation record

M2 has been implemented in `20261120010000_batch_03_1b_ai_actor_directory.sql`.

The migration creates `private.ai_actor_directory` with stable pseudonymous `actor_subject_id`, `actor_kind`, nullable profile attribution, creation/update timestamps and deletion timestamp. A partial unique index permits only one active user actor mapping per profile. Constraints distinguish user and system actors and prevent a deleted actor from retaining profile attribution. RLS is enabled and all table privileges are revoked from `PUBLIC`, `anon`, `authenticated` and `service_role`.

Three `SECURITY DEFINER` functions use an empty search path and are owned by `postgres`, with execution revoked from application roles:

- `private.resolve_or_create_ai_actor(uuid)` validates an existing, non-deleted profile, takes a key-share lock to coordinate with account deletion, and creates or returns its stable actor subject.
- `private.anonymise_ai_actor(uuid)` idempotently nulls the profile reference and records `deleted_at`; it does not alter the subject identifier or any AI audit event.
- `private.lookup_ai_actor_subject(uuid)` provides a minimal internal lookup and is not directly executable by application roles or `service_role`.

The migration replaces `public.execute_account_deletion(uuid,text)` using the exact lease-safe, operationally guarded implementation from the current Batch 02.5 hardening migration. The only functional addition is an internal call to `private.anonymise_ai_actor(p_user_id)` in the same transaction, before the existing account-deletion audit-log insertion. Existing idempotency, advisory locks, super-admin protection, booking/order/fulfilment/escrow/settlement blockers, organisation transfer/archive, Storage queueing, PII anonymisation and audit behaviour are retained. The existing `service_role`-only execute grant is retained.

Regression coverage adds three assertions to the existing account-deletion lifecycle test for stable actor resolution, application-role access restrictions and anonymisation. It also verifies the anonymised subject remains internally resolvable, deleted profiles cannot be remapped, and nonexistent profiles are rejected. A dedicated M2 pgTAP file checks schema/table/function ACLs, RLS, identity constraints, the partial unique index and the SECURITY DEFINER/empty-search-path boundary.

**Verification status:** source and test files are committed to the Batch 03.1B branch. CI has not yet been run for this branch. No Staging or Production migration has been applied.

## 7. Execution boundary

This preflight did not change any hosted database, migration history, application environment, feature flag, or deployment. M1–M5 migration application to `CultivaNode-Staging` remains a separate operation requiring explicit authorisation. Production changes remain out of scope.
