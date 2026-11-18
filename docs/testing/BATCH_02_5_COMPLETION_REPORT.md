# Batch 02.5 Completion Report — Mobile Role Expansion and Account Deletion Workflow

**Branch:** `stabilization/batch-02-5-mobile-roles-account-deletion`  
**Base Commit (`main`):** `e14e3ac` (following PR #10 / Batch 02.4)  
**Date:** 2026-11-18  
**Status:** Open for review (not merged)

---

## 1. Initial Audit Findings

1. **Role model & database enforcement (Preserved):**
   - `packages/shared/src/roles.ts` exports all 11 `app_role` enum values (`crop_farmer`, `animal_farmer`, `machinery_owner`, `service_provider`, `input_supplier`, `buyer_offtaker`, `logistics_provider`, `field_agent`, `institutional_partner`, `investor`, `customer`) and 8 `provider_type` specialties straight from `database.types.ts`.
   - Postgres `public.roles` governs `available`, `auto_approve`, `requires_documents`, and `min_verification_tier`. `complete_onboarding()`, `role_requests` triggers, `approve_role_request()`, `reject_role_request()`, and `cancel_role_request()` enforce server-side rules; `user_roles` cannot be written directly by `authenticated`.
2. **Mobile role gaps found:**
   - `apps/mobile/src/app/(provider)/_layout.tsx` lacked a session and role guard at the UI navigation boundary.
   - `apps/mobile/src/screens/OnboardingScreen.tsx` lacked icons for `institutional_partner` and `investor` and did not surface `requires_documents` / `min_verification_tier` guidance for non-auto-approved roles.
   - `apps/mobile/src/screens/RolesScreen.tsx` did not filter already-held or pending `service_provider` specialties (`provider_type`), did not show `provider_type` in active role pills, and did not warn when the user's `verification_tier` was below `min_verification_tier` (e.g., `field_agent` Tier 1+).
   - `apps/mobile/src/screens/MeScreen.tsx` used duplicate React keys (`r.role`) when a user held multiple `service_provider` specialties and lacked an account deletion entry.
3. **Account deletion gaps found:**
   - Only `request_account_deletion()` (inserting an `'open'` row in `data_requests`) existed; there was no automated server-side deletion/anonymization, no Storage cleanup, no Auth user removal, no re-authentication check, and no mobile UI or API route.
   - Direct `auth.admin.deleteUser()` would previously either fail on `ON DELETE RESTRICT` foreign keys (`bookings`, `organizations`, `verifications`, `devices`) or cascade-delete financial/order/escrow records (`marketplace_orders`, `marketplace_escrows`, `marketplace_sellers`).

---

## 2. Existing Functionality Preserved
- Preserved all Batch 02.1 (`provider-dispatch`), Batch 02.2 (`RolesScreen`, `expo-document-picker` + `expo-image-picker`, `verification-documents` Storage policies, signed URLs), and Batch 02.3 implementations.
- Preserved `public.roles`, `complete_onboarding()`, `request_account_deletion()`, `cancel_data_request()`, and `admin_resolve_data_request()` for existing web/admin workflows.
- Preserved RLS and database triggers as the authoritative permission boundary.

---

## 3. New and Corrected Mobile Role Workflows
- **`apps/mobile/src/lib/account.ts`:** Added `isProviderRole()`, `formatRoleLabel()`, `availableProviderTypesForRequest()`, `getRequestableRoles()`, and `canRequestRoleWithTier()`.
- **`apps/mobile/src/app/(provider)/_layout.tsx`:** Added session redirect (`/(auth)/welcome`) and `isProviderRole(account)` guard showing an access-restricted screen with navigation to `/me/roles` or `/(tabs)/home` for non-providers.
- **`apps/mobile/src/screens/OnboardingScreen.tsx`:** Added `institutional_partner` and `investor` icons and inline review/document/tier guidance for non-auto-approved roles.
- **`apps/mobile/src/screens/RolesScreen.tsx` & `MeScreen.tsx`:** Display `provider_type` alongside `service_provider` using unique keys (`${r.role}-${r.provider_type ?? 'none'}`), filter already-held/pending `provider_type` options, and surface `min_verification_tier` warnings before submission.

---

## 4. Account-Deletion Architecture & Lifecycle
- **Mobile UI (`apps/mobile/src/screens/AccountDeleteScreen.tsx`, `apps/mobile/src/app/me/delete.tsx`, linked from `MeScreen.tsx`):**
  1. Explains permanent removal of Auth credentials, sessions, notifications, calendar feeds, role requests, bank payout details, and `verification-documents` Storage objects, alongside anonymized retention of financial/order/booking/shared-org records.
  2. Checks session recency (`isRecentSignIn(last_sign_in_at)` within 15 minutes); if stale, provides inline SMS/Email OTP re-verification (`sendCode`/`sendEmailCode` + `verifyCode`/`verifyEmailCode`).
  3. Requires typing `DELETE` and confirming a native `Alert` before calling `POST /api/account/delete` with `Authorization: Bearer <access_token>`.
  4. On `200`, clears `cache_account_${userId}`, `cn.activeFarm`, and `cn.outbox`, calls `signOut('local')`, and redirects to `/(auth)/welcome`. On `403`/`409`/network/server errors, surfaces actionable errors without falsely signing out.
- **Server API (`apps/web/src/app/api/account/delete/route.ts`):**
  - Fails closed (`503`) if service-role key is missing; authenticates caller via Bearer JWT or cookie session (`401`); validates `{ confirmation: "DELETE", reason? }` via Zod (`400`); enforces `15`-minute `last_sign_in_at` recency (`403 reauth_required`); executes `execute_account_deletion` RPC (`409` on blockers, `500` on unexpected DB errors); removes returned `verification-documents` Storage paths; calls `supabaseAdmin.auth.admin.deleteUser(user.id)`. Service-role credentials remain strictly server-side.

---

## 5. Data-Retention and Financial-Integrity Safeguards
- **Blocking checks (`P0001` -> HTTP `409`):** Refuses deletion while the user has active `bookings` (`requested`, `accepted`, `in_progress`, `awaiting_confirmation`, `disputed`), active `marketplace_orders` (`paid`, `processing`, `shipped`, `disputed`), held `marketplace_escrows` (`status = 'held'`), pending/processing `marketplace_settlements`, or is the last `super_admin`.
- **Preservation & anonymization:**
  - Deletes personal-only rows (`notifications`, `calendar_feeds`, `role_requests`, `user_roles`, `verification_documents`, `bank_accounts`, `admin_roles`, `org_members`).
  - Preserves shared `organizations` (transferring `owner_id` to the earliest remaining member when present).
  - Anonymizes `profiles` (`full_name = 'Deleted user'`, `phone = 'deleted-<uuid>'`, `state = null`, `lga = null`, `deleted_at`, `suspended_at`), `marketplace_orders.delivery_address` (`{"redacted": true}`), and `marketplace_sellers.business_name` (`'Deleted seller'`, `verification_status = 'suspended'`), while preserving `marketplace_journal_entries`, `marketplace_payments`, `marketplace_escrows`, `marketplace_settlements`, `marketplace_orders`, `bookings`, `audit_log`, and recording a `'completed'` NDPA `data_requests` row.
  - Idempotent on repeated calls (`status: 'already_deleted'`).

---

## 6. Security, RLS & Database Migrations
- **Migration:** `supabase/migrations/20261118020000_account_deletion_workflow.sql`
  - Adds `profiles.deleted_at`.
  - Drops `profiles_id_fkey` so `auth.admin.deleteUser()` removes Supabase Auth identity/sessions without cascading into financial/order records.
  - Updates `devices.installed_by`, `device_alerts.acknowledged_by`, and `device_automations.created_by` FKs to `ON DELETE SET NULL`.
  - Adds `public.execute_account_deletion(uuid, text)` (`SECURITY DEFINER SET search_path = ''`), revoked from `public`, `anon`, and `authenticated`, and granted only to `service_role`.
- **Shared types:** Added `execute_account_deletion` to `packages/shared/src/database.types.ts`.

---

## 7. Automated Tests & Verification Results
- **Mobile unit tests:**
  - `apps/mobile/src/lib/__tests__/account-roles-docs.test.ts`: Added multi-role label, provider navigation permission, `service_provider` specialty filtering, and Tier 1+ gate tests.
  - `apps/mobile/src/lib/__tests__/account-deletion.test.ts`: Added recent-sign-in, invalid confirmation/token, `403 reauth_required`, `409 deletion_blocked`, network failure, and `200` cache-clearing tests.
- **Web API tests (`apps/web/src/__tests__/batch-02-5.test.ts`):**
  - Verified `503` fail-closed, `401` unauth, `400` confirmation, `403 reauth_required`, `409 deletion_blocked`, `200` deletion + Storage removal + `auth.admin.deleteUser`, `500 auth_deletion_incomplete`, and `200 already_deleted` idempotency.
- **Database pgTAP (`supabase/tests/database/22_batch_02_5_account_deletion.test.sql`):**
  - 12 assertions verifying `service_role`-only execution, `42501` role-escalation protection, active booking blocker, `verification_documents` removal, shared `organizations` ownership transfer, `profiles` & `delivery_address` anonymization, `marketplace_journal_entries` preservation, NDPA `data_requests` completion, and idempotency.
- **Live local Supabase integration (`supabase/tests/api-db-integration-check.mjs` Section 6):**
  - End-to-end test against local Auth, Storage API, PostgREST, and Postgres: `403` for authenticated direct RPC call, `200` `execute_account_deletion`, Storage object deletion & absence check, GoTrue `DELETE /auth/v1/admin/users/:id`, and verified anonymized profile + redacted preserved order.
- **CI Workflow & Build Results (Run [`44287634478`](https://github.com/farmconnect-ux/cultivanode/actions/runs/44287634478) on code/test commit `eb7e4ed4f55ef5c7ae6399cfa46be2098811e649`):**
  - `Database migrations and RLS tests` (Job `134744297339`, 1m13s): **SUCCESS** — pgTAP `Files=22, Tests=762, Result: PASS`, `concurrency-check.mjs` PASS, `storage-api-check.mjs` PASS, `api-db-integration-check.mjs` (Sections 1–6) PASS.
  - `Typecheck, lint and unit tests` (Job `134744296784`, 3m11s): **SUCCESS** — `npm run typecheck` (`4/4`), `npm run lint` (`1/1`), `npm run test` (`4/4`: `@cultivanode/iot-module` 20 tests, `@cultivanode/web` 3 files / 17 tests, `@cultivanode/mobile` 7 files / 70 tests, `@cultivanode/shared` 33 files / 357 tests), `npm run build` PASS.
  - `Vercel` Preview: **SUCCESS**.

---

## 8. Known Limitations & Outstanding Physical-Device Tests
- Physical Android and iOS handset testing was not executed in CI (no physical devices connected); end-to-end on-device OTP re-authentication, keyboard/modal ergonomics, and native pickers require physical-device QA prior to store release.
- Production Supabase (`vqbtnftnxyfaembwgfrk`), Staging Supabase (`xdbqndgwisshhjjqksbe`), and Vercel Production settings were not modified.

---

## 9. Files Changed & Branch / PR Metadata
- **Branch:** `stabilization/batch-02-5-mobile-roles-account-deletion`
- **Pull Request:** [PR #11](https://github.com/farmconnect-ux/cultivanode/pull/11) (`OPEN`, targeting `main`, not merged)
- **Files changed:**
  - `supabase/migrations/20261118020000_account_deletion_workflow.sql`
  - `packages/shared/src/database.types.ts`
  - `apps/web/src/app/api/account/delete/route.ts`
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
  - `supabase/tests/api-db-integration-check.mjs`
  - `docs/testing/BATCH_02_5_COMPLETION_REPORT.md`
