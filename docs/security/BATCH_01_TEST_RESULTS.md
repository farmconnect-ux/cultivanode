# Batch 01 — Test & Verification Results

**Date:** 2026-11-17  
**Baseline Commit:** `3b47573` (with Batch 01 uncommitted local changes: `apps/web/src/actions/checkout.ts`, `supabase/migrations/20261117080000_marketplace_orders_security_lockdown.sql`, `supabase/tests/database/19_marketplace_order_security.test.sql`)

---

## 1. Command Execution Ledger

| Check | Command | Status | Exit Code | Observed Output / Evidence |
|---|---|---|---|---|
| **Working Tree Inspection** | `git status --short` | **Passed** | `0` | Only `M apps/web/src/actions/checkout.ts`, `?? docs/audit/`, `?? docs/security/`, `?? supabase/migrations/20261117080000_marketplace_orders_security_lockdown.sql`, `?? supabase/tests/database/19_marketplace_order_security.test.sql`. Zero unrelated edits. |
| **Dependency Install** | `npm.cmd ci` | **Partial / Blocked** | `0` | Reported `added 1089 packages in 33m`, but `node_modules/` was left missing `turbo`, `tsc`, `eslint`, `vitest`, and `@swc/helpers/cjs/_interop_require_default.cjs` (local Node `v24.21.0` / npm `11.19.0` vs `packageManager: npm@10.9.7`). |
| **TypeScript Check** | `npm.cmd run typecheck` | **Blocked** | `1` | `'turbo' is not recognized as an internal or external command`. |
| **Lint** | `npm.cmd run lint` | **Blocked** | `1` | `'turbo' is not recognized as an internal or external command`. |
| **Unit Tests** | `npm.cmd run test` | **Blocked** | `1` | `'turbo' is not recognized as an internal or external command`. |
| **Web Production Build** | `npm.cmd run build` | **Blocked** | `1` | `Error: Cannot find module '...\node_modules\@swc\helpers\cjs\_interop_require_default.cjs'`. |
| **Local Supabase / pgTAP** | `supabase test db` (Suites `01`–`19`) | **Not Executed** | N/A | `supabase` and `docker` CLIs are not installed in this environment. |
| **Edge Function Deno Tests** | `deno test` (`supabase/functions/_shared/__tests__/`) | **Not Executed** | N/A | `deno` CLI is not installed in this environment. |

---

## 2. Static & Code-Level Verification (Completed)

1. **Marketplace Order Write Lockdown (`20261117080000_marketplace_orders_security_lockdown.sql`):**
   - Revokes `INSERT, UPDATE, DELETE` on `marketplace_orders`, `marketplace_order_items`, and `marketplace_fulfilments` from `anon, authenticated` and drops the 5 permissive direct-write policies.
   - Explicitly revokes all `anon, authenticated` privileges on `device_commands`.
2. **Duplicate-Settlement Protection (`process_payment_webhook()` + Partial Unique Indexes):**
   - **Database Constraints:** Added `mkt_payments_one_successful_per_order_idx` (`(order_id) WHERE status = 'successful'`), `mkt_escrows_one_per_fulfilment_idx` (`(fulfilment_id) WHERE fulfilment_id IS NOT NULL`), and `mkt_journal_one_order_payment_idx` (`(reference_id) WHERE reference_type = 'order_payment'`).
   - **Concurrency & State Validation:** Updated `process_payment_webhook()` (`SECURITY DEFINER SET search_path = ''`, `service_role`-only) to lock `marketplace_orders` `FOR UPDATE` **before** reading `marketplace_payments`, verify `v_payment.order_id = p_order_id`, return `already_processed: true` on same-reference replays, and raise `ORDER_ALREADY_SETTLED` if the order is already `paid`/`escrowed`/`released`/`refunded`/`cancelled` or has a `'successful'` payment. Failed/pending retries remain supported without overwriting prior failed payment rows.
3. **Extended pgTAP Suite (`19_marketplace_order_security.test.sql`, `plan(20)`):**
   - Covers direct insert/update/commission/paid-status/cross-user/fulfilment tampering (`42501`), `device_commands` denial, `place_marketplace_order()` server-side pricing, `PAYMENT_AMOUNT_MISMATCH`, first settlement (`success: true`), same-reference replay (`already_processed: true`), second distinct reference rejection (`ORDER_ALREADY_SETTLED`), unique index enforcement against duplicate `marketplace_escrows` and duplicate `order_payment` `marketplace_journal_entries` (`23505`), unchanged escrow/ledger counts after rejected duplicates, and legitimate retry after a `'failed'` payment.
   - **Concurrency Testing Note:** pgTAP runs inside a single `BEGIN ... ROLLBACK` transaction, so true multi-session concurrent webhook racing cannot be spawned within a single pgTAP connection. Concurrency safety is enforced by `SELECT ... FOR UPDATE` on `marketplace_orders` at the start of `process_payment_webhook()` backed by the three unique indexes above.
4. **Web & Mobile Checkout Compatibility:**
   - Mobile (`apps/mobile/src/lib/market.ts`) and Web (`apps/web/src/actions/checkout.ts`) both invoke `place_marketplace_order()`.

---

## 3. Final Ledger Integrity Check (`mkt_journal_one_order_payment_idx`)

- **Ledger Architecture (`20261008160000_marketplace_payments_escrow_ledger.sql`):**
  - `public.marketplace_journal_entries` stores **one header row per transaction** (`id`, `reference_id`, `reference_type`, `previous_hash`, `current_hash`).
  - `public.marketplace_journal_postings` stores **multiple debit and credit lines per transaction** (`entry_id -> marketplace_journal_entries.id`, `account_id`, `direction`, `amount_kobo`).
  - `record_marketplace_journal_entry()` validates `sum(DEBIT) = sum(CREDIT)`, inserts 1 header row, and inserts N posting rows.
  - `process_payment_webhook()` writes 1 `'order_payment'` header (`reference_id = p_order_id::text`) with 2 balanced postings; `release_fulfilment_escrow()` writes 1 `'escrow_release'` header (`reference_id = p_fulfilment_id::text`) with 3 balanced postings.
- **Index Compatibility (`mkt_journal_one_order_payment_idx`):**
  - Because `marketplace_journal_entries` is the transaction header table and the partial unique index is scoped strictly to `WHERE reference_type = 'order_payment'`, it does **not** restrict multiple debit/credit lines in `marketplace_journal_postings` and does **not** restrict `'escrow_release'`, `'refund'`, `'payout'`, or `'adjustment'` entries.
- **Seed & Existing Data Compatibility:**
  - `supabase/seed_demo.sql` inserts 1 `'successful'` payment per order (`o1`–`o4`), 1 escrow per fulfilment (`fu1`–`fu4`), and 0 journal rows (no conflicts).
  - Live local database execution (`supabase test db` / duplicate-check SQL) could not be run in this environment because `supabase` and `docker` CLIs are not installed; run the 3 pre-migration duplicate-check queries in `BATCH_01_MIGRATION_DEPLOYMENT_PLAN.md` before `supabase db push`.
- **Ledger Integrity Verdict:** **PASS: Existing double-entry accounting is compatible with the new index.** *(Local pgTAP execution remains blocked on missing Docker/Supabase CLI and must pass in GitHub Actions `ci.yml` on PR.)*

---

## 4. Release Readiness Recommendation

**Conditional GO for a Vercel Preview PR (CI-gated); NO-GO for Production until CI & pgTAP pass.**
- Push Batch 01 to a **PR branch** (using separate Preview/staging credentials) so GitHub Actions (`.github/workflows/ci.yml`) runs `typecheck`, `lint`, `test`, and `supabase test db` (Suites `01`–`19`) cleanly on Ubuntu + Docker + Node 22 / npm 10.9.x, and Vercel builds a Preview deployment.
- Do **not** merge to `main` or push `20261117080000` to hosted Supabase until all CI jobs and Vercel Preview checkout tests pass.
