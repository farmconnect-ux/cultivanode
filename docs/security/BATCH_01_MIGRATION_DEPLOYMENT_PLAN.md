# Batch 01 — Migration & Deployment Plan (Vercel Preview + Hosted Supabase)

**Date:** 2026-11-17  
**Hosted Migration Head (per `docs/RELEASE_LEDGER.md`, 3 Nov):** `20261025212753_fk_indexes_rls_initplan`  
**Local Migration Head (`main` + Batch 01):** `20261117080000_marketplace_orders_security_lockdown`  
**Status:** **NOT APPLIED** to hosted Supabase (`vqbtnftnxyfaembwgfrk`); Batch 01 **NOT PUSHED** to `main`.

---

## 1. Plan A: Vercel Preview Deployment Plan (PR Branch)

Because `place_marketplace_order()` (`20261025120000`) is already applied on Supabase, the updated web checkout (`apps/web/src/actions/checkout.ts`) is backwards-compatible with the current schema.

1. **Verify Vercel Preview Environment Isolation:** Confirm Vercel `Preview` env vars point to a **staging/branch Supabase project** and **test** Paystack/Flutterwave keys (`PAYMENT_MODE=test`, `LIVE_PAYMENTS_APPROVED=no`), never Production credentials.
2. **Create & Push PR Branch:** Push Batch 01 (`checkout.ts`, `20261117080000`, `19_marketplace_order_security.test.sql`, `docs/*`) to a feature branch (e.g., `security/batch-01-marketplace-lockdown`) and open a PR against `main`.
3. **Verify GitHub Actions (`.github/workflows/ci.yml`):**
   - `apps` job passes `typecheck`, `lint`, `test` (and run `npm run build` locally/in CI).
   - `database` job replays all 59 migrations on fresh local Supabase and passes all 19 pgTAP suites including `19_marketplace_order_security.test.sql` (`20` assertions).
4. **Smoke-Test Vercel Preview URL:** Verify cart checkout (direct-payment mode and escrow validation) on the Preview URL against staging Supabase.

---

## 2. Plan B: Hosted Supabase Migration Plan (Sequenced After Preview & PR Merge)

### Pending Migrations in Exact Execution Order
| Order | Migration File | Purpose | Destructive Ops? | Dependencies & Risks |
|---|---|---|---|---|
| **1** | `20261103000000_mvp_week4_dispute_resolution.sql` | W4 booking dispute resolution RPCs & `booking_events` constraint update. | Drops & recreates `booking_events_event_check` (additive values only). | Requires `bookings` / `booking_events` (applied). |
| **2** | `20261103120000_agronomy_standards_governance.sql` | Draft/review/publish governance, `farm_standards_immutability` trigger, policies on `farm_agronomic_standards`. | Drops/recreates trigger & policies on `farm_agronomic_standards`. | Requires `farm_agronomic_standards` (applied). |
| **3** | `20261103130000_seed_crop_catalogue_draft_standards.sql` | Seeds draft agronomy standards from shared crop catalogue. | None (`ON CONFLICT`). | Depends on `20261103120000`. |
| **4** | `20261103140000_marketplace_disputes_w4.sql` | Marketplace dispute lifecycle, seller RLS, arbitration RPCs, `marketplace_disputes` flag. | Drops/recreates 3 policies on `marketplace_disputes`. | Depends on `marketplace_orders`, `marketplace_fulfilments`, `marketplace_disputes`. |
| **5** | `20261108120000_phone_sign_in_switch.sql` | Inserts `phone_sign_in` feature flag (`enabled = false`). | None (`ON CONFLICT DO NOTHING`). | Requires `feature_flags` (applied). |
| **6** | `20261117080000_marketplace_orders_security_lockdown.sql` *(Batch 01)* | Revokes direct writes on `marketplace_orders`, `marketplace_order_items`, `marketplace_fulfilments`; adds partial unique indexes & `ORDER_ALREADY_SETTLED` lock in `process_payment_webhook()`; hardens `device_commands`. | Drops 5 permissive RLS policies. **Check before push:** verify no existing duplicate `'successful'` payments, duplicate escrows, or duplicate `'order_payment'` journal rows exist in production. | **CRITICAL:** Deploy `checkout.ts` to Vercel Production (`main`) **before** pushing `20261117080000`, or live web checkout will fail with `42501`. |

### Pre-Push Duplicate Data Check (Run Read-Only Before Pushing Migration 6)
```sql
select order_id, count(*) from public.marketplace_payments where status = 'successful' group by order_id having count(*) > 1;
select fulfilment_id, count(*) from public.marketplace_escrows where fulfilment_id is not null group by fulfilment_id having count(*) > 1;
select reference_id, count(*) from public.marketplace_journal_entries where reference_type = 'order_payment' group by reference_id having count(*) > 1;
```

### Execution Sequence
1. Upgrade `vqbtnftnxyfaembwgfrk` to **Supabase Pro + PITR** (or take a manual `pg_dump`).
2. Merge the CI-passing Batch 01 PR to `main` and confirm Vercel Production (`www.cultivanode.com`) finishes deploying `checkout.ts`.
3. Run the 3 read-only duplicate checks above on hosted Supabase.
4. Run `npx supabase link --project-ref vqbtnftnxyfaembwgfrk` and `npx supabase db push`.
5. Verify `supabase migration list` shows all 6 migrations applied and re-run Supabase Security/Performance Advisors.
