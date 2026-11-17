# Batch 01 — Test & Verification Results

**Date:** 2026-11-17  
**PR #6 Branch:** `security/batch-01-marketplace-hardening`  
**Base Commit (`main`):** `4d53f4a`

---

## 1. Verification Matrix (Status Breakdown)

### A. Implemented and Verified (via GitHub Actions / Vercel Preview)
- **Database Migration Replay (`20261117080000_marketplace_orders_security_lockdown.sql`):** Verified in CI (`Database migrations and RLS tests`, run `44055371755` on `bc5cbe5`, `1m12s`). All migrations replayed cleanly on fresh PostgreSQL 17 / Supabase.
- **pgTAP Security & Ledger Suites (`01`–`19`):** Suites `01`–`18` and initial `19_marketplace_order_security.test.sql` (`20` assertions) passed in CI (`44055371755`). Extended to `21` assertions (`Test 8k`: `INSUFFICIENT_RESERVED_INVENTORY` rollback) in the latest commit.
- **Monorepo Typecheck, Lint & Unit Tests (`npm run typecheck`, `npm run lint`, `npm run test`):** Passed in CI (`44055371755`, `2m27s`). Note: `packages/shared/vitest.config.mts` runs unit tests across `packages/shared/src/**`, `supabase/functions/**/__tests__/*.test.ts` (all 7 Edge Function test suites), and `apps/mobile/src/**/__tests__/*.test.ts`.
- **Web Production Build (`npm run build`):** Added to `.github/workflows/ci.yml` with `ignoreBuildErrors: true` removed from `apps/web/next.config.ts` and `npm ci || npm install` tightened to `npm ci`. Verified in latest PR #6 CI run.

### B. Implemented but Not Independently Verified
- **Multi-Session Concurrent Webhook Racing:** pgTAP runs inside a single `BEGIN ... ROLLBACK` transaction and cannot spawn two simultaneous database sessions. Concurrency safety is enforced by `SELECT ... FOR UPDATE` on `marketplace_orders` at the start of `process_payment_webhook()` plus partial unique indexes `mkt_payments_one_successful_per_order_idx`, `mkt_escrows_one_per_fulfilment_idx`, and `mkt_journal_one_order_payment_idx`. Follow-up: run a 2-connection `Promise.all` integration test against a staging DB.
- **Vercel Preview Staging Isolation & Authenticated Checkout:** Preview deployment succeeded (`HTTP 200` on `/en` and `/en/marketplace`), but Vercel `Preview`-scoped env vars and authenticated sandbox checkout could not be independently verified from outside Vercel without dashboard access and staging test credentials.

### C. Blocked by Unavailable Tools / Credentials in Local Windows Environment
- Local `npm.cmd ci` left `node_modules/` missing `turbo` / `@swc/helpers`; `docker`, `supabase`, and `deno` CLIs are not installed locally. All automated verification relies on GitHub Actions Ubuntu runners.
- CodeRabbit review was skipped automatically (`< 10` stars); manual trigger `@coderabbitai review` was posted on PR #6.

### D. Outstanding Production Dashboard Actions (Requires Owner)
- Confirm Vercel `Preview` env vars point to staging Supabase and test Paystack/Flutterwave keys (`PAYMENT_MODE=test`, `LIVE_PAYMENTS_APPROVED=no`).
- Upgrade `vqbtnftnxyfaembwgfrk` to Supabase Pro + PITR, enable Leaked Password Protection, configure Custom SMTP, and configure live SMS/Identity keys in `/admin/integrations` before enabling `phone_sign_in`.

### E. Actions Requiring Separate Approval
- Merging PR #6 into `main`, deploying to Vercel Production, and running `supabase db push` on `vqbtnftnxyfaembwgfrk`.
