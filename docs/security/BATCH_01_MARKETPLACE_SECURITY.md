# Batch 01 — Marketplace Financial Security

**Date:** 2026-11-17  
**Baseline Commit:** `792f0b5`  
**Status:** Code & migration changes implemented locally (uncommitted, unpushed, not applied to hosted Supabase)

---

## 1. Root Cause & Vulnerability Summary

| Severity | Finding | Root Cause | Affected Objects |
|---|---|---|---|
| **Critical (P0)** | Authenticated buyers could bypass `place_marketplace_order()` and forge order totals, commissions, seller earnings, payment status, and fulfilment rows via PostgREST. | `20261008150000_marketplace_orders_fulfilments_inventory.sql` and `20261012140000_marketplace_order_fulfilments_policy.sql` granted `authenticated` direct `INSERT` / `UPDATE` RLS policies (`marketplace_orders_buyer_insert`, `marketplace_orders_update_admin_or_buyer`, `marketplace_order_items_insert`, `marketplace_fulfilments_buyer_insert`). While `20261018090000` revoked `UPDATE` on `marketplace_fulfilments` and `20261025120000` introduced `place_marketplace_order()` for mobile, `apps/web/src/actions/checkout.ts` still used direct table `INSERT`s. | `public.marketplace_orders`, `public.marketplace_order_items`, `public.marketplace_fulfilments`, `apps/web/src/actions/checkout.ts` |

### Verified Safe Components (No Changes Needed)
- **Payment Webhooks:** `apps/web/src/app/api/webhooks/paystack/route.ts` (HMAC-SHA512 `x-paystack-signature`) and `apps/web/src/app/api/webhooks/flutterwave/route.ts` (`verif-hash`) verify provider signatures before calling `process_payment_webhook()` via `createServiceClient()` (`service_role`).
- **`process_payment_webhook()` (`20261008160000`):** `SECURITY DEFINER`, `service_role`-only, checks idempotency (`payment_reference` + `status = 'successful'`), locks order `FOR UPDATE`, enforces `p_amount_kobo = v_order.total_amount_kobo`, and posts balanced double-entry ledger entries.
- **Direct Payments, Fulfilments & Disputes:** `report_direct_payment()`, `confirm_direct_payment()`, `seller_update_fulfilment()`, `release_fulfilment_escrow()`, `open_marketplace_dispute()`, `admin_resolve_marketplace_dispute()` are all `SECURITY DEFINER` RPCs with caller/role checks.

---

## 2. Remediation Implemented

### A. Database Lockdown Migration
- **File:** [supabase/migrations/20261117080000_marketplace_orders_security_lockdown.sql](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/migrations/20261117080000_marketplace_orders_security_lockdown.sql)
- **Changes:**
  1. `REVOKE INSERT, UPDATE, DELETE ON public.marketplace_orders, public.marketplace_order_items, public.marketplace_fulfilments FROM anon, authenticated;`
  2. Dropped permissive direct-write policies: `marketplace_orders_buyer_insert`, `marketplace_orders_update_admin_or_buyer`, `marketplace_order_items_insert`, `marketplace_fulfilments_buyer_insert`, `marketplace_fulfilments_seller_update`.
  3. Preserved `SELECT` RLS policies (`marketplace_orders_buyer_select`, `marketplace_order_items_select`, `marketplace_fulfilments_select`) and all `SECURITY DEFINER` RPCs / `service_role` paths.

### B. Web Checkout Alignment
- **File:** [apps/web/src/actions/checkout.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/actions/checkout.ts)
- **Changes:**
  - Replaced direct `.from("marketplace_orders").insert(...)`, `.from("marketplace_order_items").insert(...)`, `.from("marketplace_fulfilments").insert(...)`, and `reserve_inventory_for_order` in `checkoutCart()` with `loose.rpc("place_marketplace_order", { p_lines, p_address, p_notes })`.
  - When `escrow_payments` is ON, reads the authoritative server-computed `order_number` and `total_amount_kobo` from `marketplace_orders` before initiating Paystack/Flutterwave.
  - `startFlutterwave` / `startPaystack` status updates (`payment_pending`) continue to run via `createServiceClient()` (`service_role`).

### C. Negative Security Test Suite
- **File:** [supabase/tests/database/19_marketplace_order_security.test.sql](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/tests/database/19_marketplace_order_security.test.sql)
- **Coverage:** 12 pgTAP assertions verifying direct insert/update/commission/paid-status/cross-user/fulfilment tampering are rejected with `42501`, while `place_marketplace_order()` and `process_payment_webhook()` succeed.
- **Execution Status:** Written and structurally reviewed; **not yet executed** in this environment because `supabase` CLI / Docker are not installed locally (must be run in CI `ci.yml` or local Docker).
