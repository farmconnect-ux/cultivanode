# Batch 01 — Production Readiness, CI Audit & Preview Safety

**Date:** 2026-11-17  
**Baseline Commit:** `3b47573` (Batch 01 local changes uncommitted/unpushed)  
**Hosted Supabase Project:** `vqbtnftnxyfaembwgfrk` (`eu-west-1`, Postgres 17)

---

## 1. CI Workflow Audit (`.github/workflows/ci.yml`)

| Requirement | Current `.github/workflows/ci.yml` State | Status | Proposed Minimal Correction |
|---|---|---|---|
| **Node version is 22** | `node-version-file: .nvmrc` (`.nvmrc` = `22`) | **Pass** | None |
| **npm compatible with `npm@10.9.7`** | Node 22 ships npm `10.9.x` | **Pass** | None |
| **Install from `package-lock.json`** | `npm ci \|\| npm install` (line 18) | **Gap** | Change to `npm ci` so lockfile drift fails CI instead of silently falling back. |
| **Typecheck runs** | `npm run typecheck` (line 19) | **Pass** | None |
| **Lint runs** | `npm run lint` (line 20) | **Pass** | None |
| **Unit tests run** | `npm run test` (line 21) | **Partial** | `apps/web` has no test files; `apps/mobile` has 3 Vitest files but no `test` script in `apps/mobile/package.json`. |
| **Production build runs** | Not present in `ci.yml` (`next.config.ts:37` also sets `ignoreBuildErrors: true`) | **Missing** | Add `- run: npm run build` after `npm run test` in `apps` job (and remove `ignoreBuildErrors: true` in `next.config.ts` in Batch 02). |
| **Supabase DB tests run** | `supabase/setup-cli@v1` + `supabase db start` + `supabase test db` (lines 28–43) | **Pass** | None (replays all migrations including `20261117080000` and runs pgTAP `01`–`19`). |
| **Edge Function Deno tests** | Not present in `ci.yml` | **Missing** | Add a job/step using `denoland/setup-deno` running `deno test supabase/functions/_shared/__tests__/`. |

---

## 2. Vercel Preview vs. Production Environment Safety (Task 5)

Vercel **Preview** deployments for the Batch 01 PR must **never** point at Production Supabase or Live payment/SMS/identity credentials. Verify in **Vercel > Project > Settings > Environment Variables** (scoped separately to `Preview` vs `Production`):

| Variable / Secret | Preview Scope Requirement | Production Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Use a **staging/branch Supabase project** (never `vqbtnftnxyfaembwgfrk`) | `vqbtnftnxyfaembwgfrk` |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging/branch service-role key only | Production secret (never in Preview) |
| `PAYMENT_MODE` | `test` | `test` until legal sign-off (`LIVE_PAYMENTS_APPROVED=yes`) |
| `LIVE_PAYMENTS_APPROVED` | `no` | `no` (until legal sign-off) |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_WEBHOOK_SECRET` | **Test** (`sk_test_*`) keys only | Production/test per `PAYMENT_MODE` |
| `FLUTTERWAVE_SECRET_KEY` / `FLUTTERWAVE_WEBHOOK_HASH` | **Test** (`FLWSECK_TEST-*`) keys only | Production/test per `PAYMENT_MODE` |
| `APP_ENV` (Supabase Edge Functions) | `development` on staging | `production` (blocks `mock_sms` / `mock_identity`) |
| Integration Vault keys (SMS / Identity) | Sandbox / `mock_sms` / `mock_identity` on staging | Live Termii/Twilio & Prembly before real users |

---

## 3. Production Provider Configuration (Task 4)

- **Why `mock_sms` and `mock_identity` are active:** Default seed in `20260926133412_integrations.sql` sets `mock_sms` and `mock_identity`; `20261108120000_phone_sign_in_switch.sql` sets `phone_sign_in = false` so sign-in defaults to Email OTP until a live SMS provider is configured.
- **Enabling Genuine Providers (Admin / Dashboard Steps):**
  1. Configure **Custom SMTP** in Supabase Auth Settings + `{{ .Token }}` in Magic Link template for reliable Email OTP.
  2. In `/admin/integrations`, enter live **Termii**/**Twilio** & **Prembly** keys -> test via `integration-test` -> switch to live -> ensure `APP_ENV=production` on Edge Functions -> enable `phone_sign_in` after a real-device SMS OTP passes.
  3. Keep `PAYMENT_MODE=test` / `LIVE_PAYMENTS_APPROVED=no` until fintech legal sign-off (`docs/PAYMENTS.md`).

---

## 4. Backup, Recovery & Security Configuration (Tasks 6 & 7)

- **Free Plan Risk:** `docs/DEPLOYMENT.md` records `vqbtnftnxyfaembwgfrk` on the **Supabase Free Plan** (no automated daily backups or PITR). Upgrade to **Supabase Pro + PITR** and run a staging restore drill before scaling.
- **Dashboard Security Controls:** Enable **Leaked Password Protection** in Supabase Auth Settings (flagged disabled in 3 Nov Advisors) and reconcile `ai_photo_diagnosis=ON` with the admin switch description.
