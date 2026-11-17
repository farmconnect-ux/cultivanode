# Batch 02: Marketplace Payment Reliability and Safe Gateway Boundaries

**Branch:** `security/batch-02-payment-reliability`  
**Base:** `main`  
**Scope:** staging-first hardening of the existing Paystack and Flutterwave marketplace payment flow.  
**Production:** no Production database changes, environment-variable changes, live payment activation, or deployment are included.

## Why this batch follows Batch 01

Batch 01 moved checkout order creation behind the database-authoritative `place_marketplace_order()` RPC and hardened settlement idempotency. The multi-vendor fulfilment lifecycle has also passed a transaction-scoped staging regression. The next material risk is the boundary between checkout initialization, provider references, webhook verification, and the database settlement function.

The current implementation requires further controls before online escrow can be enabled. In particular, checkout reads a payment mode but does not consistently enforce the shared `resolvePaymentMode()` policy; fallback logic can select a different provider from the configured provider; the Flutterwave webhook currently passes a gateway transaction identifier to settlement where the pending payment record is keyed by `tx_ref`; and webhook RPC failures are logged but acknowledged with HTTP 200, preventing provider retries.

## Work packages

### 02.1 Enforce payment mode and provider selection
- Apply the shared `resolvePaymentMode()` policy to every checkout and retry path.
- Default missing or unknown configuration to test mode; fail closed when a live mode is not explicitly approved.
- Resolve one active provider and use only that provider's credentials and API endpoint.
- Remove cross-provider environment fallbacks.
- Reject unsupported, unimplemented, or test-only providers in production.

### 02.2 Make payment initialization durable
- Validate authenticated order ownership and eligible payment state before creating a gateway transaction.
- Ensure the reference is unique and is persisted against the order and provider.
- Handle database persistence failure after gateway initialization without falsely reporting a successful checkout redirect.
- Prevent duplicate active attempts or safely record each retry without overwriting payment history.
- Keep amounts in kobo internally and validate provider amount/currency before settlement.

### 02.3 Correct webhook reference and retry handling
- For Paystack, settle against the exact payment reference created during initialization.
- For Flutterwave, settle against the original `tx_ref` stored in `marketplace_payments.payment_reference`; retain the provider transaction ID in gateway metadata.
- Verify webhook signatures against the correct provider-specific secret.
- Return a retryable non-2xx response when settlement fails; acknowledge only successfully processed or safely idempotent events.
- Validate event type, transaction status, currency, amount, provider, reference and order association.
- Preserve idempotency for repeated delivery and reject reference reuse across orders/providers.

### 02.4 Automated regression coverage
- Add focused unit tests for payment mode resolution, provider selection, reference parsing and webhook signature validation.
- Add webhook route tests for valid, invalid, replayed, mismatched and database-failure events.
- Add database tests for amount/currency/provider mismatch, reference reuse, duplicate settlement, and atomic rollback.
- Add a staging-only integration test for checkout initialization and webhook settlement using test credentials.
- Keep the two-connection concurrency test as a separate acceptance check where the available staging harness supports concurrent sessions.

### 02.5 Documentation and release evidence
- Replace the stale `docs/PAYMENTS.md` status statement with an accurate description of implemented code and remaining gates.
- Record test results, staging configuration evidence and known limitations in `docs/security/BATCH_02_TEST_RESULTS.md`.
- Update the release ledger only when evidence supports a status change.

## Explicit exclusions and safety gates

- Do not enable `escrow_payments` or `marketplace_live` in Production.
- Do not change Production secrets or payment-provider settings.
- Do not perform real-money transactions.
- Do not implement payouts, refunds, or legal escrow operations as part of this batch.
- Do not treat a successful unit test or staging webhook as legal or operational approval for live payments.
- Staging must use the isolated Supabase project and test-mode provider credentials only.
- Production payment activation remains blocked pending legal/compliance sign-off, operational recovery arrangements, and explicit owner approval.

## Acceptance criteria

1. A missing or invalid payment mode cannot silently resolve to live.
2. A configured Paystack transaction can only use Paystack credentials and webhook settlement; the same rule applies to Flutterwave.
3. A Flutterwave webhook settles against the exact persisted `tx_ref`.
4. Invalid signatures and mismatched provider, reference, currency or amount cannot settle an order.
5. A temporary database settlement failure receives a retryable response from the webhook route.
6. Replayed valid webhooks are idempotent and cannot create duplicate successful payments, escrows or journal entries.
7. Failed initialization or persistence leaves an accurate, recoverable order/payment state.
8. CI typecheck, lint, unit tests, database migration replay, pgTAP and production build pass.
9. Staging evidence is recorded; Production remains unchanged.

## Implementation sequence

1. Inspect current payment functions, migrations, integration settings and test harness.
2. Add tests that reproduce the identified failure modes.
3. Implement the smallest safe code and migration changes.
4. Run full CI and staging regression tests.
5. Review the resulting diff and document any unresolved provider-specific limitations.
6. Request separate approval before any Production action.
