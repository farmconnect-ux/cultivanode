# Batch 02.5 Completion Report — Mobile Role Expansion and Account Deletion Workflow

**Branch:** `stabilization/batch-02-5-mobile-roles-account-deletion`  
**Base Commit (`main`):** `e14e3ac` (following PR #10 / Batch 02.4)  
**Date:** 2026-11-18  
**Status:** Open for review ([PR #11](https://github.com/farmconnect-ux/cultivanode/pull/11), not merged)

---

## 1. Initial Audit & Independent Verification Findings

### Initial Audit
1. **Role model & database enforcement (Preserved):**
   - `packages/shared/src/roles.ts` exports all 11 `app_role` enum values and 8 `provider_type` specialties from `database.types.ts`.
   - Postgres `public.roles` governs `available`, `auto_approve`, `requires_documents`, and `min_verification_tier`. `complete_onboarding()` and `role_requests` triggers enforce server-side rules; `user_roles` cannot be written directly by `authenticated`.
2. **Mobile role gaps found:**
   - `apps/mobile/src/app/(provider)/_layout.tsx` lacked a session and role guard at the UI navigation boundary.
   - `apps/mobile/src/screens/OnboardingScreen.tsx` lacked icons for `institutional_partner` and `investor` and did not surface `requires_documents` / `min_verification_tier` guidance.
   - `apps/mobile/src/screens/RolesScreen.tsx` did not filter already-held or pending `service_provider` specialties (`provider_type`), did not show `provider_type` in active role pills, and did not warn when `verification_tier < min_verification_tier`.
   - `apps/mobile/src/screens/MeScreen.tsx` used duplicate React keys (`r.role`) for multi-specialty accounts and lacked an account deletion entry.
3. **Account deletion gaps found:**
   - Only `request_account_deletion()` (inserting an `'open'` row in `data_requests`) existed; direct `auth.admin.deleteUser()` would fail on `ON DELETE RESTRICT` FKs or cascade-delete financial/order records.

### Independent Verification Corrections Implemented
1. **Recoverable, durable Storage cleanup:** Moved Storage path tracking into `public.account_deletion_storage_cleanup` (`pending` → `processing` → `completed` / `failed`) **before** deleting `verification_documents` metadata, and separated DB anonymisation, Storage removal, and Auth removal into distinct tracked phases (`profiles.deletion_status`).
2. **Active seller fulfilment protection:** Extended blockers to refuse deletion if a seller has any non-terminal `marketplace_fulfilments` row (`placed`, `confirmed`, `preparing`, `ready_for_pickup`, `dispatched`, `in_transit`, `delivered`, `disputed`), in addition to active `bookings`, active `marketplace_orders`, held `marketplace_escrows`, and `pending`/`processing` `marketplace_settlements`.
3. **Concurrency protection:** Added `pg_advisory_xact_lock` serialisation per-user and globally for `super_admin` deletions, plus `BEFORE INSERT` triggers on `bookings`, `marketplace_orders`, and `marketplace_fulfilments` rejecting new transactions for deleted/deleting accounts.
4. **Mobile success handling & fresh post-OTP token:** Removed the duplicate `onDeleted()` call in `AccountDeleteScreen.tsx`, added `deletingRef` double-submit guard, and added `getFreshAccessToken()` (`supabase.auth.getSession()`) after OTP re-authentication.
5. **Organization archival:** Organizations owned by a deleting user with no remaining `org_members` are explicitly anonymized and marked `archived_at`.
6. **Documentation accuracy:** Corrected IoT FK references to `device_installations.installed_by`, `device_alerts.acknowledged_by`, and `device_commands.created_by`.

---

## 2. Existing Functionality Preserved
- Preserved all Batch 02.1 (`provider-dispatch`), Batch 02.2 (`RolesScreen`, `expo-document-picker` + `expo-image-picker`, `verification-documents` Storage policies, signed URLs), and Batch 02.3 implementations.
- Preserved `public.roles`, `complete_onboarding()`, `request_account_deletion()`, `cancel_data_request()`, and `admin_resolve_data_request()`.
- Preserved RLS and database triggers as the authoritative permission boundary.

---

## 3. New and Corrected Mobile Role Workflows
- **`apps/mobile/src/lib/account.ts`:** Added `isProviderRole()`, `formatRoleLabel()`, `availableProviderTypesForRequest()`, `getRequestableRoles()`, `canRequestRoleWithTier()`, and `getFreshAccessToken()`.
- **`apps/mobile/src/app/(provider)/_layout.tsx`:** Added session redirect (`/(auth)/welcome`) and `isProviderRole(account)` guard showing an access-restricted screen with navigation to `/me/roles` or `/(tabs)/home`.
- **`apps/mobile/src/screens/OnboardingScreen.tsx`:** Added `institutional_partner` and `investor` icons and inline review/document/tier guidance.
- **`apps/mobile/src/screens/RolesScreen.tsx` & `MeScreen.tsx`:** Display `provider_type` alongside `service_provider` using unique keys (`${r.role}-${r.provider_type ?? 'none'}`), filter already-held/pending `provider_type` options, and surface `min_verification_tier` warnings.

---

## 4. Account-Deletion Architecture & Lifecycle
- **Mobile UI (`apps/mobile/src/screens/AccountDeleteScreen.tsx`, `apps/mobile/src/app/me/delete.tsx`, linked from `MeScreen.tsx`):**
  1. Explains permanent removal of Auth credentials, sessions, notifications, calendar feeds, role requests, bank payout details, and private Storage documents alongside anonymized retention of financial/order/booking/shared-org records.
  2. Checks session recency (`isRecentSignIn(last_sign_in_at)` within 15 minutes); if stale, runs inline SMS/Email OTP re-verification and refreshes the session token via `getFreshAccessToken()`.
  3. Requires typing `DELETE` and confirming a native `Alert`, guarded by `deletingRef` against repeated taps.
  4. On `200`, clears `cache_account_${userId}`, `cn.activeFarm`, and `cn.outbox`, calls `signOut('local')`, and invokes `onDeleted()` **exactly once**.
- **Server API (`apps/web/src/app/api/account/delete/route.ts`, `apps/web/src/lib/account-deletion.ts`, `apps/web/src/app/api/cron/account-deletions/route.ts`):**
  - Fails closed (`503`) without service-role key; verifies Bearer JWT or cookie session (`401`); validates `{ confirmation: "DELETE", reason? }` (`400`); enforces 15-minute `last_sign_in_at` recency (`403 reauth_required`).
  - **Phase 1:** Calls `execute_account_deletion(user.id, reason)` (`409` on blockers, `500` on unexpected DB errors).
  - **Phase 2:** Runs `processPendingStorageCleanup(supabaseAdmin, user.id)` (`claim_account_deletion_storage_cleanup` with `lease_expires_at` + `lease_token` fencing, `storage.remove`, and `record_account_deletion_storage_result(..., p_lease_token)`). Every `record_account_deletion_storage_result` response is checked explicitly; unrecorded removals are never counted as completed. If any item fails, remains unrecorded, or is held by an active concurrent lease, returns `500 storage_cleanup_incomplete` **without** deleting the Auth identity.
  - **Phase 3:** Only after zero pending/failed/processing Storage items remain, calls `supabaseAdmin.auth.admin.deleteUser(user.id)` and `finalize_account_deletion(user.id, true)`. Inspects `finalize_account_deletion` errors and never defaults `deletion_status` to `'completed'`; failures return `500 finalization_incomplete`. `completed` is terminal and immutable across repeated finalisation calls or late worker results.
  - **Service-Side Recovery (`/api/cron/account-deletions`, scheduled daily `0 3 * * *` via `apps/web/vercel.json`):** Protected by `CRON_SECRET` (`timingSafeEqual`, requires `CRON_SECRET` configured in the deployment environment), runs `reconcileIncompleteAccountDeletions()` to reclaim stale `'processing'` Storage leases, remove remaining Storage objects, reconcile Auth identity state (`getUserById` / `deleteUser`), and finalize orphaned `auth_pending` deletions.

---

## 5. Data-Retention and Financial-Integrity Safeguards
- **Operational & financial blockers (`P0001` → HTTP `409`):** Refuses deletion while the user has active `bookings` (`requested`, `accepted`, `in_progress`, `awaiting_confirmation`, `disputed`), active buyer `marketplace_orders` (`placed`, `payment_pending`, `paid`, `processing`, `partially_fulfilled`, `disputed`), active seller `marketplace_fulfilments` (`placed`, `confirmed`, `preparing`, `ready_for_pickup`, `dispatched`, `in_transit`, `delivered`, `disputed`), held `marketplace_escrows` (`held`), pending/processing `marketplace_settlements` (`pending`, `processing`), or is the last `super_admin`.
- **Preservation & anonymization:**
  - Deletes personal-only rows (`notifications`, `calendar_feeds`, `role_requests`, `user_roles`, `verification_documents`, `bank_accounts`, `admin_roles`, `org_members`).
  - Transfers `organizations.owner_id` to the earliest remaining member; if no members remain, anonymizes `name = 'Deleted organization'`, clears `cac_number`, and sets `archived_at`.
  - Pauses active `marketplace_listings`, suspends/anonymizes `marketplace_sellers`, redacts `marketplace_orders.delivery_address` (`{"redacted": true}`), anonymizes `profiles`, and preserves `marketplace_journal_entries`, `marketplace_payments`, `marketplace_escrows`, `marketplace_settlements`, `marketplace_orders`, `bookings`, and `audit_log`.
  - Keeps `data_requests.status = 'open'` until `finalize_account_deletion` confirms zero remaining Storage items and successful Auth removal.

---

## 6. Security, Concurrency & Database Migrations
- **Migrations:**
  - `supabase/migrations/20261118020000_account_deletion_workflow.sql`: Adds `profiles.deleted_at`, drops `profiles_id_fkey` so `auth.admin.deleteUser()` does not cascade into financial/order tables, and sets `ON DELETE SET NULL` on `device_installations.installed_by`, `device_alerts.acknowledged_by`, and `device_commands.created_by`.
  - `supabase/migrations/20261118030000_account_deletion_hardening.sql`: Adds `profiles.deletion_status`, `organizations.archived_at`, `public.account_deletion_storage_cleanup` (RLS-enabled, revoked from `public`/`anon`/`authenticated`), serialised `pg_advisory_xact_lock` in `execute_account_deletion`, and `service_role`-only cleanup/finalisation RPCs.
  - `supabase/migrations/20261118040000_account_deletion_reliability.sql`
  - `supabase/migrations/20261118050000_account_deletion_lease_fencing.sql`: Adds `lease_expires_at` stale-claim recovery to `claim_account_deletion_storage_cleanup(uuid, integer)`, clears `lease_expires_at` in `record_account_deletion_storage_result`, adds `service_role`-only `list_incomplete_account_deletions(integer)`, and upgrades `guard_not_deleting_booking()`, `guard_not_deleting_order()`, and `guard_not_deleting_fulfilment()` to `BEFORE INSERT OR UPDATE OF <party_fk>` using deadlock-safe `FOR KEY SHARE` locking on `public.profiles`.
  - `supabase/migrations/20261118050000_account_deletion_lease_fencing.sql`: Adds `lease_token uuid` fencing to `account_deletion_storage_cleanup`, enforces lease ownership and expiry in `record_account_deletion_storage_result(..., p_lease_token)`, and protects terminal `completed` deletion state in both `record_account_deletion_storage_result` and `finalize_account_deletion`.

---

## 7. Automated Tests & CI Evidence
- **Mobile unit tests:**
  - `apps/mobile/src/lib/__tests__/account-roles-docs.test.ts`: Multi-role labels, provider permissions, specialty filtering, Tier 1+ gates.
  - `apps/mobile/src/lib/__tests__/account-deletion.test.ts`: Session recency, confirmation/token validation, `403 reauth_required`, `409 deletion_blocked`, network failure, cache cleanup, and `getFreshAccessToken()`.
- **Web API tests (`apps/web/src/__tests__/batch-02-5.test.ts`):**
  - Covers `503` fail-closed, `401`/`400`/`403`/`409`, partial Storage failure + retry recovery, `record_account_deletion_storage_result` RPC failure, active-lease skip blocking Auth deletion, Auth deletion failure + idempotent retry, `finalize_account_deletion` error/invalid payload returning `500`, and `/api/cron/account-deletions` post-Auth reconciliation.
- **Database pgTAP (`supabase/tests/database/22_batch_02_5_account_deletion.test.sql`):**
  - 32 assertions covering `service_role`-only RPC/table grants, `42501` role-escalation protection, active booking / active seller fulfilment (multi-seller order) / held escrow / processing settlement blockers, solo org archival, durable Storage queue capture, lease-based stale claim recovery, `lease_token` fencing rejection, terminal `completed` protection in `finalize_account_deletion`, INSERT + party-reassignment UPDATE guards (without blocking lifecycle updates), and `data_requests` gating.
- **Database concurrency (`supabase/tests/concurrency-check.mjs` Sections 4a–4g):**
  - Deterministic concurrent `super_admin` deletion test (4a), concurrent deletion + `bookings` race (4b), controlled `pg_locks` booking-first -> deletion-blocked (4c), deletion-first -> booking-rejected (4d), concurrent Storage cleanup lease isolation + expired lease recovery (4e), stale Worker A failure rejected after Worker B completion & finalisation (4f), and reverse ordering where stale Worker A completion is rejected after Worker B failure (4g).
- **Live local Supabase integration (`supabase/tests/api-db-integration-check.mjs` Section 6):**
  - Live Auth, Storage API, PostgREST, and Postgres test simulating Storage failure, active-lease isolation, stale `'processing'` lease expiry & reclaim, `lease_token` fencing (`400` on stale token), deleting the actual Storage object, deleting the Auth user via GoTrue Admin API, verifying `list_incomplete_account_deletions` + Auth `404` reconciliation, finalizing, and verifying order preservation + PII redaction.
- **CI Workflow & Build Results:**
  - **Latest Code/Test Run [`44327725720`](https://github.com/farmconnect-ux/cultivanode/actions/runs/44327725720) (commit `cd7c79af807a019248137dbd2d128890e5cdd13c`):**
    - `Database migrations and RLS tests` (`1m32s`, `SUCCESS`): `pgTAP` (`Files=22, Tests=782, Result: PASS`), `concurrency-check.mjs` (Sections 1, 2, 3a–3c, 4a–4g `PASS`), `storage-api-check.mjs` (`PASS`), `api-db-integration-check.mjs` (Sections 1–6 `PASS`).
    - `Typecheck, lint and unit tests` (`4m1s`, `SUCCESS`): `typecheck` (`4/4` tasks), `lint` (`1/1` task), `test` (`20` node tests + `21`, `71`, `358` vitest tests across `4/4` tasks), and Next.js `build`.
    - Vercel Preview deployment: `SUCCESS`.
  - **Prior Milestone Runs (preserved for audit history):**
    - Run [`44323436860`](https://github.com/farmconnect-ux/cultivanode/actions/runs/44323436860) (commit `9df0f38649cf834ac32ac90d3d55aadd3dac87aa`): `Database migrations and RLS tests` (`1m9s`, `SUCCESS`), `Typecheck, lint and unit tests` (`3m29s`, `SUCCESS`), `Vercel` (`SUCCESS`).
    - Run [`44322513288`](https://github.com/farmconnect-ux/cultivanode/actions/runs/44322513288) (commit `af0618bd5dcb92a6c5b26ff62ecfc7b5ec03d9db`): `pgTAP` (`Files=22, Tests=780, Result: PASS`), `concurrency-check.mjs` (Sections 1–4e `PASS`), `storage-api-check.mjs` (`PASS`), `api-db-integration-check.mjs` (Sections 1–6 `PASS`), `Typecheck, lint and unit tests` (`3m7s`, `SUCCESS`), `Vercel` (`SUCCESS`).

---

## 8. Known Limitations & Outstanding Physical-Device Tests
- **Operational configuration:** `CRON_SECRET` must be configured in the deployment environment before `/api/cron/account-deletions` can authenticate scheduled recovery runs (fails closed with HTTP `503` if unset).
- Physical Android and iOS handset testing was not executed in CI (no physical devices connected); end-to-end on-device OTP re-authentication, keyboard/modal ergonomics, and native pickers require physical-device QA prior to store release.
- Production Supabase (`vqbtnftnxyfaembwgfrk`), Staging Supabase (`xdbqndgwisshhjjqksbe`), Vercel Production settings, and PR #10 were not modified or merged.

---

## 9. Files Changed & Branch / PR Metadata
- **Branch:** `stabilization/batch-02-5-mobile-roles-account-deletion`
- **Pull Request:** [PR #11](https://github.com/farmconnect-ux/cultivanode/pull/11) (`OPEN`, targeting `main`, not merged)
- **Files changed:**
  - `supabase/migrations/20261118020000_account_deletion_workflow.sql`
  - `supabase/migrations/20261118030000_account_deletion_hardening.sql`
  - `supabase/migrations/20261118040000_account_deletion_reliability.sql`
  - `supabase/migrations/20261118050000_account_deletion_lease_fencing.sql`
  - `packages/shared/src/database.types.ts`
  - `apps/web/src/lib/account-deletion.ts`
  - `apps/web/src/app/api/account/delete/route.ts`
  - `apps/web/src/app/api/cron/account-deletions/route.ts`
  - `apps/web/vercel.json`
  - `apps/web/src/__tests__/batch-02-5.test.ts`
  - `apps/mobile/src/lib/account.ts`
  - `apps/mobile/src/app/(provider)/_layout.tsx`
  - `apps/mobile/src/app/(tabs)/me.tsx`
  - `apps/mobile/src/app/me/delete.tsx`
  - `apps/mobile/src/screens/AccountDeleteScreen.tsx`
  - `apps/mobile/src/screens/MeScreen.tsx`
  - `apps/mobile/src/screens/OnboardingScreen.tsx`
  - `apps/mobile/src/screens/RolesScreen.tsx`
  - `apps/mobile/src/lib/__tests__/account-roles-docs.test.ts`
  - `apps/mobile/src/lib/__tests__/account-deletion.test.ts`
  - `supabase/tests/database/22_batch_02_5_account_deletion.test.sql`
  - `supabase/tests/concurrency-check.mjs`
  - `supabase/tests/api-db-integration-check.mjs`
  - `docs/testing/BATCH_02_5_COMPLETION_REPORT.md`
