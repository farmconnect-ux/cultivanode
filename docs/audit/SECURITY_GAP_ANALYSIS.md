# Security Gap Analysis — CultivaNode

**Audit Date:** 2026-11-17  
**Scope:** Database RLS, `SECURITY DEFINER` RPCs, role escalation, financial controls, AI data access, storage permissions, audit logs, NDPA compliance, and web/mobile security headers.

---

## 1. Critical & High-Priority Security Findings

### [P0-SEC-01] Unrestricted Direct `INSERT`/`UPDATE` on Marketplace Order & Fulfilment Tables
- **Affected Tables:** `public.marketplace_orders`, `public.marketplace_order_items`, `public.marketplace_fulfilments`
- **Migrations:** `20261008150000_marketplace_orders_fulfilments_inventory.sql`, `20261012140000_marketplace_order_fulfilments_policy.sql`, `20261017200000_security_review.sql`
- **Issue:** While `place_marketplace_order()` (`20261025120000`) computes prices, fees, and inventory reservations server-side, `authenticated` users still retain direct `INSERT` and `UPDATE` RLS policies (`marketplace_orders_buyer_insert`, `marketplace_orders_update_admin_or_buyer`, `marketplace_order_items_insert`, `marketplace_fulfilments_buyer_insert`). Unlike `bookings` (locked to RPCs) and `marketplace_fulfilments` `UPDATE` (revoked in `20261018090000`), a malicious buyer can call PostgREST directly to forge `total_amount_kobo`, `items_subtotal_kobo`, `commission_kobo`, `status = 'paid'`, or `payment_status = 'escrowed'`.
- **Remediation:** `REVOKE INSERT, UPDATE, DELETE ON public.marketplace_orders, public.marketplace_order_items, public.marketplace_fulfilments FROM authenticated, anon;` and route all mutations exclusively through `place_marketplace_order()` / `service_role` / governed RPCs. Add negative pgTAP tests.

### [P0-SEC-02] Production Backup / PITR & Environment Verification
- **Affected Systems:** Hosted Supabase (`vqbtnftnxyfaembwgfrk`)
- **Issue:** `docs/DEPLOYMENT.md` records the database on the **Free plan** (no automated PITR backups). Additionally, `APP_ENV=production` and live `PAYMENT_MODE`/`LIVE_PAYMENTS_APPROVED` gates cannot be verified from the repo alone.
- **Remediation:** Upgrade Supabase to Pro with PITR before expanding the user base; verify `APP_ENV=production` on Edge Functions so `mock_sms` and `mock_identity` are blocked.

---

## 2. Medium-Priority Security & Governance Gaps

### [P1-SEC-03] Missing Negative Security Tests for Financial Tables & Storage Buckets
- **Issue:** `supabase/tests/database/04_function_grants.test.sql` guards internal function grants, but has no regression test for `get_checkout_payment_credentials` (remediated in `20261017200000`), no negative tests for direct `INSERT`/`UPDATE` on marketplace order tables, and no `storage.objects` cross-tenant isolation tests.
- **Remediation:** Extend pgTAP suites `04` and `18` to cover these boundaries.

### [P1-SEC-04] CSP Allows `'unsafe-inline'` for Scripts
- **File:** `apps/web/next.config.ts:10`
- **Issue:** `script-src 'self' 'unsafe-inline'` weakens XSS mitigation (documented in `docs/SECURITY.md:43` as a tradeoff for static generation without nonces).
- **Remediation:** Adopt Next.js nonce-based CSP on dynamic/authenticated routes when feasible.

### [P1-SEC-05] AI Data Access & Future Autonomous Action Boundaries
- **Files:** `apps/web/src/actions/ai-assistant.ts`, `apps/web/src/app/api/ai/assistant/route.ts`, `apps/web/src/app/api/scouting/analyse/route.ts`
- **Issue:** Currently AI only reads the caller's `farms` and `crop_observations` via user-scoped Supabase clients (safe tenant isolation). However, there is **no** AI audit log table, **no** rate limiting on `/api/ai/assistant` or `/api/scouting/analyse` (cost/abuse risk on `GEMINI_API_KEY` / `OPENAI_API_KEY`), and **no** permission/confirmation framework before any future autonomous actions are added.
- **Remediation:** Add per-user rate limiting and AI invocation logging before scaling; build an explicit human-in-the-loop approval & RBAC gate for any future write-capable AI tools.

### [P1-SEC-06] Manual NDPA Account Deletion Execution
- **File:** `supabase/migrations/20260926150328_m1_accounts.sql`, `docs/requirements-matrix.md:48`
- **Issue:** `request_account_deletion()` and `export_my_data()` exist, but actual deletion/anonymisation upon admin approval is a manual staff process, risking SLA breaches under Nigeria's NDPA as user volume grows.
- **Remediation:** Implement an automated, audited anonymisation/deletion workflow triggered on `admin_resolve_data_request` approval.

---

## 3. Verified Existing Security Controls (Strengths)

- **Tenant & Role Isolation:** `profiles` uses column-level `GRANT UPDATE (full_name, email, state, lga, preferred_language)`; `user_roles` and `admin_roles` are `SELECT`-only for `authenticated`; `role_requests` prevents self-approval; `guard_marketplace_seller` and `guard_marketplace_listing` triggers prevent self-verification or suspension bypass.
- **`SECURITY DEFINER` Hygiene:** All 181 `SECURITY DEFINER` functions include `SET search_path`; sensitive RPCs (`process_payment_webhook`, `integration_runtime`, `record_identity_verification`, `get_checkout_payment_credentials`) are restricted to `service_role`.
- **Payment Webhooks:** Paystack (`x-paystack-signature` HMAC-SHA512) and Flutterwave (`verif-hash`) webhooks verify signatures before calling `process_payment_webhook`, which enforces idempotency and exact `total_amount_kobo` matching.
- **Audit & Consents:** `audit_log`, `admin_actions`, and `consents` have append-only immutability triggers.
- **PII & Secrets:** NIN/BVN/bank numbers are masked + HMAC-fingerprinted using Vault `id_hash_pepper`; provider keys live in Supabase Vault; mobile sessions are encrypted with AES-256-CTR + `expo-secure-store` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`).
- **Storage Buckets:** All 5 buckets enforce `file_size_limit`, `allowed_mime_types`, and path/owner or role-scoped RLS.
