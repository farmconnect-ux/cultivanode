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
| M2 | Private actor directory, internal functions and deletion anonymisation hook | Ready for code after exact deletion-function and ownership/ACL tests |
| M3 | Append-only AI audit events, trusted writer and constrained feedback RPC | Ready for code after RLS and append-only tests |
| M4 | Audited, concurrency-safe compliance lookup | Permission key and provisional rate thresholds require owner decision |
| M5 | Immutable prompt versions, active pointers and audited activation/rollback | Activation permission key requires owner decision |

M1 must not reference the newly added enum label in a data statement in the same migration transaction. Extension installation must use the unpinned form `CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions`; Supabase deprecated explicit extension version clauses from 2026-08-05.

## 5. Decisions required before M4 and M5 implementation

The current Staging permission catalogue has no `audit.read` permission. The architecture proposal's M4 permission therefore cannot be implemented as written without adding a permission and deciding which admin role receives it. `privacy.manage` exists but is broader and should not be silently substituted.

M5 also needs a dedicated permission decision. The cleanest least-privilege option is a new `ai.manage` permission, granted only to `super_admin` initially; this is a proposal, not an approved policy.

The M4 provisional rate limits remain: 10 attempts per principal per 15 minutes, 5 denied/unsuccessful attempts per principal per 15 minutes, and 30 attempts system-wide per 15 minutes. These are engineering defaults, not legal limits, and need explicit approval before enforcement.

## 6. Security-advisor baseline

The read-only Staging security advisor currently reports pre-existing findings, including RLS-enabled tables with no policies, SECURITY DEFINER functions executable by anon/authenticated, and disabled leaked-password protection. These are baseline findings, not regressions introduced by Batch 03.1B. New migrations must not increase the relevant findings; targeted grant checks and advisor comparisons will be required after Staging application.

## 7. Execution boundary

This preflight did not change any hosted database, migration history, application environment, feature flag, or deployment. M1–M5 migration application to `CultivaNode-Staging` remains a separate operation requiring explicit authorisation. Production changes remain out of scope.
