# Security

This document describes controls that exist in the code today. Items marked **Planned** are not built.

## Secrets
- Only the Supabase **publishable** key is used by the web and mobile apps. The service-role key is for
  server code only and never appears in `NEXT_PUBLIC_`/`EXPO_PUBLIC_` variables.
- Real values live in Vercel and Supabase secrets. `.env.example` files list names only.

## Database (the security boundary)
- Row Level Security on every table; broad Supabase defaults revoked; column-level grants.
- Values apps must not choose are not granted or are overwritten: `owner_id`/`profile_id` defaults to the
  caller, `verification_tier`, `source`, `created_by`, role grants, review status, listing suspension.
- Staff powers are permissions (`has_permission`), each admin sub-role holding the minimum set
  (see `admin_role_permissions`). Nobody can approve their own role request or review their own document.
- Internal functions live in the `private` schema or are not executable by app roles; tests guard this
  (`04_function_grants.test.sql`).
- Audit: `audit_log` records actor, action, entity, old/new values, IP and user agent (from request
  headers); `admin_actions` records each staff decision with its permission and reason. Both are
  append-only for every role, including the service role. Admin role and permission changes are audited
  by triggers.
- Website forms go through SECURITY DEFINER functions with rate limits (errcode 54000) and a honeypot field.

## Provider keys
- SMS and identity provider keys are entered by staff with `integrations.manage` in the admin console and
  stored in Supabase Vault (encrypted). Apps cannot read the key tables; the page shows only the last four
  characters. Only Edge Functions (service role) read keys, through `integration_runtime()`.
- The Send SMS hook checks the Standard Webhooks signature (HMAC, 5-minute window) before sending.
- Test providers are refused when `APP_ENV=production`.

## Identity data
- NIN/BVN: only masked values are stored (`*******4417`). Bank accounts: only the last four digits.
- An HMAC fingerprint (pepper in Vault) detects one NIN, BVN or bank account on two profiles; the second is
  refused as `already_linked`. ID checks need `data_processing` consent and are limited to 5 a day per person.
- Verification documents go to the private `verification-documents` bucket, into the uploader's own
  folder; 5 MB limit; JPEG/PNG/WebP/PDF only (enforced by the bucket, a table constraint and the shared
  Zod schema). Only the owner and staff with `verification.review` can read them.
  Signed, short-lived download URLs and owner `DELETE` cleanup are implemented and verified against the Storage API in CI (`storage-api-check.mjs`).

## Web
- Security headers (`apps/web/next.config.ts`): Content-Security-Policy (self, Supabase, Sentry only;
  `frame-ancestors 'none'`), HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`. The CSP allows inline scripts because pages are statically generated without nonces.
- Server actions are same-origin POSTs protected by Next.js's built-in origin check (CSRF).
- Input is validated with shared Zod schemas before any database call; errors are returned as
  translation keys (`packages/shared/src/errors.ts`), never SQL messages or stack traces.

## Logging and monitoring
- `apps/web/src/lib/logger.ts` writes JSON lines and redacts phone numbers, emails and any field whose name
  looks like a secret (password, OTP, token, NIN, BVN, account number, card).
- Sentry (only when `SENTRY_DSN` is set) is configured to collect no user info, cookies, bodies or query
  strings (`src/lib/sentry-privacy.ts`). Expected user errors (validation, rate limit) are not reported.

## Authentication
Phone OTP through Supabase Auth; codes are delivered by the `send-sms` hook through the provider chosen in
the admin console. Supabase stores only hashed codes and applies rate limits and expiry. The web proxy
refreshes the session on signed-in pages (`/admin`, `/{lang}/account`, `/{lang}/onboarding`).

Mobile sessions are encrypted at rest (`apps/mobile/src/lib/encrypted-storage.ts`): each write uses a new
random 256-bit AES-CTR key and IV; the key is kept in the Android Keystore / iOS Keychain through
expo-secure-store (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`, excluded from Android cloud backup) and only the
ciphertext goes to AsyncStorage. A copied app-storage file reveals nothing; a wrong or missing key signs the
person out. Sign-out clears both parts even when offline; "sign out on all devices" revokes every session
on the server. Mobile crash reports (Sentry) are off without a DSN and scrub phones, codes, ID numbers,
tokens and emails before sending.

## Payments (Goods Marketplace Implemented; Live Activation Gated)
See [PAYMENTS.md](PAYMENTS.md) and [RELEASE_LEDGER.md](RELEASE_LEDGER.md). `PAYMENT_MODE` defaults to `test`, and `live` mode is refused unless the deployment is an approved production environment with `LIVE_PAYMENTS_APPROVED=yes` (`resolvePaymentMode` in `packages/shared/src/config.ts`). Goods-marketplace webhooks (`paystack` and `flutterwave`), single-settlement enforcement (`20261117080000`), and hash-chained ledger/settlement RPCs (`20261118010000`) are implemented in repository code and verified in isolated local Supabase CI. Live gateway callbacks, hosted migration confirmation, and legal approval remain outstanding.


## Known warnings
Supabase's linter lists the public RPCs callable by signed-in or anonymous users. Each one is intentional
and checks permissions itself: approve/reject/cancel role request, review_verification_document,
correct_farm_zone, has_permission, my_permissions, has_role, org_role, my_verification_tier,
join_waitlist, send_contact_message.

## Reporting a vulnerability
Contact the maintainers privately; do not open a public issue.
