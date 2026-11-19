# PR 0 — Batch 01 Marketplace Reconciliation Report

**Date:** 2026-11-19  
**Repository:** `farmconnect-ux/cultivanode`  
**Branch:** `chore/reconcile-batch-01-marketplace-commits`  
**Base (`origin/main`):** `0f3ee8d49f5ce774ce52a79052be6bdc740e7534`  
**Source Branch Audited:** `origin/security/batch-01-marketplace-hardening` (merge-base with `origin/main`: `34ff3e42481894455199af1e58ef66ae8afd28d8`)  
**Staging Status:** **UNMODIFIED / NOT YET RECONCILED** — This PR is repository-only. Staging `schema_migrations` alignment remains a separate, explicitly authorised post-merge operation.

---

## 1. Executive Summary

Twelve commits (`8ee4f43`..`a8e47dc`) were pushed to `origin/security/batch-01-marketplace-hardening` after PR #6 (`a3179012`) merged into `main`, and their five SQL migrations were applied directly to `CultivaNode-Staging` (`xdbqndgwisshhjqqksbe`) under execution-time version stamps (`20261117120305`–`20261117153350`).

A commit-by-commit audit confirmed:
1. **Zero overlap with `main`:** None of the 13 changed paths were modified on `main` between merge-base `34ff3e42` and `0f3ee8d4`, and none of the Batch 02 migrations (`20261118000000`–`20261118060000`) modify the five marketplace functions.
2. **Critical chronological replay bug identified and resolved:** Commit `f60d498` added `20261117180000_marketplace_fulfilment_receipt_guard.sql` (applied to Staging at `15:18:22`) *before* commit `a8e47dc` added `20261117170000_marketplace_seller_delivery_dispatch.sql` (applied to Staging at `15:33:50`). Both migrations execute `CREATE OR REPLACE FUNCTION public.seller_update_fulfilment(...)`. On a fresh database replaying in filename timestamp order, `180000` would have overwritten `170000` and silently regressed `ready_for_pickup -> dispatched` for seller-delivery orders. **Resolution:** Adapted `a8e47dc`'s migration filename to `20261117190000_marketplace_seller_delivery_dispatch.sql` so chronological replay matches true commit order and Staging execution order.
3. **Broken pgTAP dollar-quoting bug fixed:** Commit `3a2859a` introduced `$select ...$` instead of `$$select ...$$` in `19_marketplace_order_security.test.sql` (which had never been run through CI on the post-merge branch). Fixed and expanded with 9 additional regression assertions covering temp-table isolation, notification RLS, `ready_for_pickup -> dispatched`, pre-handover receipt guard, buyer/seller access boundaries, and terminal `accepted`-state protection.

---

## 2. Commit-by-Commit Audit (`8ee4f43`..`a8e47dc`)

| # | Full Commit SHA | Message | Changed Files | Purpose & Dependencies | Already in `main`? | Disposition |
|---|---|---|---|---|---|---|
| 1 | `8ee4f4390d2433ebd7744b4f7bf2085aa427a363` | `fix(checkout): truncate temporary order lines safely` | `supabase/migrations/20261117130000_fix_marketplace_checkout_temp_table_reset.sql` | Replaces `delete from pg_temp.order_lines` with `truncate table pg_temp.order_lines` in `public.place_marketplace_order` to satisfy safe-update protections. | No | **Integrated** (cherry-picked verbatim) |
| 2 | `ec97e151a822fb89f2860b99829e2ed143494efe` | `feat(marketplace): notify sellers and surface pending orders` | `apps/web/src/actions/notifications.ts`, `inbox/page.tsx`, `account/page.tsx`, `en-account.ts`, `yo-account.ts`, `20261117150000_marketplace_seller_order_notifications.sql`, `19_marketplace_order_security.test.sql` | Adds `private.notify_marketplace_seller_new_order()` trigger on `marketplace_fulfilments`, server action to open/mark-read notifications, and pending-order surfacing in account/inbox UI. | No | **Integrated** (cherry-picked verbatim) |
| 3 | `57c3665de447a927d3853bd0cf9b66668966b2e8` | `fix(marketplace): enforce dispatch tracking and receipt lifecycle` | `notifications.ts`, `inbox/page.tsx`, `orders/[id]/page.tsx`, `seller/page.tsx`, `en-account.ts`, `yo-account.ts`, `20261117160000_marketplace_fulfilment_lifecycle.sql` | Enforces tracking reference on seller-delivery dispatch, records `dispatched_at`/`delivered_at`/`confirmed_at`, adds `private.complete_marketplace_order_after_receipt()`, and updates UI timelines. | No | **Integrated** (cherry-picked verbatim) |
| 4 | `9119bbcdcabc3e07bfd8a928e1ca79fd960f87a2` | `fix(marketplace): load buyer receipt confirmation timestamp` | `apps/web/src/app/[lang]/account/marketplace/orders/[id]/page.tsx` | Selects `confirmed_at` on buyer order detail query. Depends on #3. | No | **Integrated** (cherry-picked verbatim) |
| 5 | `3a2859acd9b664ea4f6f93a1d1d692cfaf5a7d53` | `test(marketplace): cover seller alerts and fulfilment lifecycle` | `supabase/tests/database/19_marketplace_order_security.test.sql` | Adds pgTAP Tests `7a`–`7i` for seller notifications, dispatch tracking, timestamps, and completion. | No | **Integrated + Adapted** (cherry-picked, then fixed `$select...$` -> `$$select...$$` syntax bug and expanded with Tests `7j`–`7o`) |
| 6 | `b69855c2bd35dedf1d03672e397249f1de8392a6` | `test(marketplace): correct lifecycle test assertion plan` | `supabase/tests/database/19_marketplace_order_security.test.sql` | Updates `plan(29)` -> `plan(30)`. | No | **Integrated + Adapted** (updated to `plan(39)` with new PR 0 regression tests) |
| 7 | `11fa06ab1b8415301707cc203389c8e8588c4931` | `fix(marketplace): show fulfilment timestamps and terminal state` | `apps/web/src/app/[lang]/account/marketplace/seller/page.tsx` | Displays `dispatched_at`, `delivered_at`, `confirmed_at`, and terminal `accepted` message in seller table. | No | **Integrated** (cherry-picked verbatim) |
| 8 | `98b7d12369895252db09768dcb6418f80e287062` | `fix(marketplace): complete buyer dispatch timeline from handover state` | `apps/web/src/app/[lang]/account/marketplace/orders/[id]/page.tsx` | Marks buyer handover timeline step complete when `dispatched_at`, `delivered_at`, or `accepted && confirmed_at`. | No | **Integrated** (cherry-picked verbatim) |
| 9 | `f60d498a98561a1ddc790388162fa633596127bb` | `fix(marketplace): require handover before buyer receipt confirmation` | `supabase/migrations/20261117180000_marketplace_fulfilment_receipt_guard.sql` | Restricts `buyer_confirm_direct_delivery` so seller-delivery orders require `status = 'delivered'` (pickup allows `ready_for_pickup` or `delivered`). | No | **Integrated** (cherry-picked verbatim) |
| 10 | `5d5204cf0c73a7ad63e12225774a1d92c14814bd` | `fix(marketplace): label receipt timeline as handover` | `apps/web/src/app/[lang]/account/marketplace/orders/[id]/page.tsx` | Renames buyer step 3 label from "Dispatched" to "Handed over" and tracking label. | No | **Integrated** (cherry-picked verbatim) |
| 11 | `c7ef87479ee4bcd4f1e15fbb1328d8d0c03006c6` | `fix(marketplace): dispatch seller-delivery orders from ready state` | `apps/web/src/app/[lang]/account/marketplace/seller/page.tsx` | Surfaces `Dispatch` action in seller UI when a seller-delivery order is `ready_for_pickup`. Depends on #12. | No | **Integrated** (cherry-picked verbatim) |
| 12 | `a8e47dcda6a72e7e7cac9b6b44fe0318156ae550` | `fix(marketplace): allow dispatch after seller delivery preparation` | `supabase/migrations/20261117170000_marketplace_seller_delivery_dispatch.sql` -> **`20261117190000_marketplace_seller_delivery_dispatch.sql`** | Allows `ready_for_pickup -> dispatched` for non-pickup fulfilments in `public.seller_update_fulfilment`. | No | **Adapted** (verbatim SQL renamed from `170000` to `190000` to fix chronological replay inversion with #9 `180000`) |

---

## 3. Local vs. Staging Migration Version Mapping

| Chronological Replay Order | Repository Migration Filename (PR 0) | Staging `schema_migrations.version` (Applied 2026-11-17) | Staging `schema_migrations.name` | Notes |
|---|---|---|---|---|
| 1 | `20261117130000_fix_marketplace_checkout_temp_table_reset.sql` | `20261117120305` | `fix_marketplace_checkout_temp_table_reset` | Already executed on Staging; SQL identical |
| 2 | `20261117150000_marketplace_seller_order_notifications.sql` | `20261117142353` | `marketplace_seller_order_notifications` | Already executed on Staging; SQL identical |
| 3 | `20261117160000_marketplace_fulfilment_lifecycle.sql` | `20261117142355` | `marketplace_fulfilment_lifecycle` | Already executed on Staging; SQL identical |
| 4 | `20261117180000_marketplace_fulfilment_receipt_guard.sql` | `20261117151822` | `marketplace_fulfilment_receipt_guard` | Already executed on Staging; SQL identical |
| 5 | `20261117190000_marketplace_seller_delivery_dispatch.sql` | `20261117153350` | `marketplace_seller_delivery_dispatch` | Already executed on Staging *after* `151822`; renamed from `170000` -> `190000` so fresh-DB replay matches Staging order |

### Security & Grants Verification Across All 5 Migrations
- Every `SECURITY DEFINER` function (`public.place_marketplace_order`, `private.notify_marketplace_seller_new_order`, `public.seller_update_fulfilment`, `public.buyer_confirm_direct_delivery`, `private.complete_marketplace_order_after_receipt`) explicitly specifies `SET search_path = ''`.
- Public RPCs (`place_marketplace_order`, `seller_update_fulfilment`, `buyer_confirm_direct_delivery`) explicitly `REVOKE EXECUTE ... FROM PUBLIC, anon` and `GRANT EXECUTE ... TO authenticated`.
- Internal trigger functions in `private.*` explicitly `REVOKE ALL ... FROM PUBLIC, anon, authenticated`.
- All later Batch 02.2 / 02.5 / 02.6 security hardening (`20261118000000`–`20261118060000`), account deletion lease-fencing, mobile roles, and Batch 03.0 architecture docs remain untouched.

---

## 4. Verification & Known Limitations

- **Local workstation limitation:** Docker Engine (`127.0.0.1:54322`) and workspace `node_modules` (`turbo`) are not installed on this Windows host, so clean-DB migration replay (`supabase start`), pgTAP (`supabase test db`), DB concurrency, Storage/API integration, `typecheck`, `lint`, `test`, and `build` are verified via **GitHub Actions CI** on this PR branch (fresh PostgreSQL 17 instance replaying all `71` migrations in timestamp order).
- **Regression coverage in `19_marketplace_order_security.test.sql` (`39` pgTAP assertions):**
  - Checkout server-side totals and repeated-checkout `pg_temp.order_lines` isolation (`Test 7`, `7j`).
  - Payment webhook amount verification, idempotency, duplicate-settlement rejection, and retry (`Test 8a`–`8h`).
  - Seller notification creation, item summary, order reference, and buyer RLS isolation (`Test 7a`–`7c`, `7k`).
  - Fulfilment lifecycle transitions, dispatch tracking enforcement, `dispatched_at` / `delivered_at` / `completed_at` timestamps, and buyer dispatch notification (`Test 7d`–`7i`).
  - `ready_for_pickup -> dispatched` on seller-delivery order (`Test 7l` — directly proves `20261117190000` ran after `20261117180000`).
  - Pre-handover buyer receipt guard while `ready_for_pickup` and while `dispatched` (`Test 7m-1`, `7m-2`).
  - Buyer/seller access boundaries (`Test 7n-1`, `7n-2`).
  - Terminal `accepted`-state protection against further dispatch or delivery (`Test 7o-1`, `7o-2`).

---

## 5. Outstanding Post-Merge Staging Reconciliation Procedure (NOT YET EXECUTED)

> **Important:** Staging (`xdbqndgwisshhjqqksbe`) has **NOT** been modified during PR 0. Do **NOT** describe Staging as reconciled until the separate authorised operation below is completed and verified.

After PR 0 is approved and merged into `main`:
1. Verify read-only on `CultivaNode-Staging` that `public.place_marketplace_order`, `private.notify_marketplace_seller_new_order`, `public.seller_update_fulfilment`, `public.buyer_confirm_direct_delivery`, and `private.complete_marketplace_order_after_receipt` match the repository definitions verbatim.
2. Record the five repository timestamps (`20261117130000`, `20261117150000`, `20261117160000`, `20261117180000`, `20261117190000`) as applied in Staging `supabase_migrations.schema_migrations` via targeted `supabase migration repair --status applied` (do **not** re-run the SQL and do **not** run an indiscriminate `supabase db push`).
3. Verify Staging `supabase migration list` shows zero unapplied marketplace migrations before starting Batch 03.1 PR 2 (`M1`–`M5`).
