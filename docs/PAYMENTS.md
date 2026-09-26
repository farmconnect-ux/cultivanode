# Payments, escrow and the platform ledger

**Status: not built (milestone M5).** No payment code, webhook or ledger table exists yet. This document
records the rules the implementation must follow and the pieces that already exist.

## Already in place
- `PAYMENT_MODE` (`test` by default) and `LIVE_PAYMENTS_APPROVED` in `.env.example`.
- `resolvePaymentMode()` in `packages/shared/src/config.ts` refuses `live` unless the deployment is
  production and `LIVE_PAYMENTS_APPROVED=yes` (unit tested).
- `bank_accounts` table (server-written, last four digits only) and tier 2 requiring a verified bank account.
- Permissions reserved for finance staff: `payments.read`, `payouts.approve`, `ledger.read`, `settings.manage`.
- Money is stored in kobo (`bigint`) everywhere.

## Rules for the M5 build
- **No internal wallet.** Funds are held by a licensed payment partner (Paystack/Flutterwave) or partner bank.
  Provider balances are shown as "earnings", not stored value.
- **Legal review before real money.** Production money flows need the fintech lawyer's sign-off on the
  escrow structure; only then is `LIVE_PAYMENTS_APPROVED=yes` set.
- **Double-entry ledger:** `ledger_accounts`, `journal_entries`, `journal_postings`. Every entry balances
  (sum of debits = sum of credits), carries `previous_hash`/`current_hash` (hash chain), is never updated or
  deleted, and corrections are reversing entries. Apps cannot insert postings. Test and live ledgers are
  separated so test money can never reach the production ledger.
- **Webhooks:** verify the provider signature, validate the event, store the raw event, process
  idempotently, update payment state and ledger in one transaction, write audit entries. A client redirect
  never marks a payment as paid.
- **Escrow flow:** request → accept → pay → confirmed → held → check-in → proof → farmer confirms or 48-hour
  auto-release → commission → provider payable → payout. A dispute freezes release.
- **Cancellation and commission** percentages are configurable per category in the database, not in code.
- **Acceptance:** at least 50 automated test bookings reconcile.
