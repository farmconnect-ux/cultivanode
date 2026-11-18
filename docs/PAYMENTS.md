# Payments, escrow and the platform ledger

**Status:** Goods-marketplace checkout, escrow, hash-chained double-entry ledger, Paystack/Flutterwave webhooks, and Admin Finance settlement controls are implemented in repository code and verified against isolated local Supabase in CI (PRs #6, #8, #9). Service-hiring escrow (`hiring_escrow`), goods escrow (`escrow_payments`), hosted migration confirmation, legal sign-off (`LIVE_PAYMENTS_APPROVED`), and live external payment gateway callback verification remain pending; see [RELEASE_LEDGER.md](RELEASE_LEDGER.md).

## Already in place
- `PAYMENT_MODE` (`test` by default) and `LIVE_PAYMENTS_APPROVED` in `.env.example`.
- `resolvePaymentMode()` in `packages/shared/src/config.ts` refuses `live` unless the deployment is
  production and `LIVE_PAYMENTS_APPROVED=yes` (unit tested).
- `bank_accounts` table (server-written, last four digits only) and tier 2 requiring a verified bank account.
- Permissions reserved for finance staff: `payments.read`, `payouts.approve`, `ledger.read`, `settings.manage`.
- Money is stored in kobo (`bigint`) everywhere.
- **Goods-marketplace ledger & settlement RPCs (`supabase/migrations/20261008160000_*`, `20261117080000_*`, `20261118000000_*`, `20261118010000_*`):** `marketplace_ledger_accounts`, `marketplace_journal_entries` (hash-chained with `pg_advisory_xact_lock` and strictly monotonic `clock_timestamp()`), `marketplace_payments`, `marketplace_escrows`, `marketplace_settlements`, `process_payment_webhook()`, `record_marketplace_journal_entry()`, and `admin_process_marketplace_settlement()`.
- **Hardened payment webhooks:** `apps/web/src/app/api/webhooks/paystack/route.ts` and `apps/web/src/app/api/webhooks/flutterwave/route.ts` verify signatures (`timingSafeEqual` / HMAC-SHA512), validate payload/reference/amount/order UUID, distinguish lookup/unexpected DB errors (`500`) from domain validation errors (`422`), and preserve `already_processed` idempotency.

## Rules for live activation & service-hiring M5
- **No internal wallet.** Funds are held by a licensed payment partner (Paystack/Flutterwave) or partner bank.
  Provider balances are shown as "earnings", not stored value.
- **Legal review before real money.** Production money flows need the fintech lawyer's sign-off on the
  escrow structure; only then is `LIVE_PAYMENTS_APPROVED=yes` set.
- **Double-entry ledger:** Every entry balances (sum of debits = sum of credits), carries
  `previous_hash`/`current_hash` (hash chain), is never updated or deleted, and corrections are reversing
  entries. Apps cannot insert postings. Test and live ledgers are separated so test money can never reach the
  production ledger.
- **Webhooks:** verify the provider signature, validate the event, process idempotently, update payment state
  and ledger in one transaction, write audit entries. A client redirect never marks a payment as paid.
- **Escrow flow:** request → accept → pay → confirmed → held → check-in → proof → farmer confirms or 48-hour
  auto-release → commission → provider payable → payout. A dispute freezes release.
- **Cancellation and commission** percentages are configurable per category in the database, not in code.
- **Acceptance:** live external Paystack/Flutterwave gateway callback testing and hosted migration application must pass before enabling live money movement.
