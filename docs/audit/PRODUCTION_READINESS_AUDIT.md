# Production Readiness Audit — CultivaNode

**Audit Date:** 2026-11-17  
**Repository:** `https://github.com/farmconnect-ux/cultivanode`  
**Production URL Checked:** `https://www.cultivanode.com`

---

## 1. Confirmed Production & Repository Evidence

| Area | Confirmed Evidence | Source |
|---|---|---|
| **GitHub `main` branch** | Latest commit `792f0b5` (*Sign-in: email only until an SMS provider is set up; staff can sign in by email*), synced with `origin/main`. | Local git log (`git fetch` + `merge --ff-only`) |
| **Live Production Website** | `HEAD https://www.cultivanode.com` returned **HTTP 200 OK** (`Server: Vercel`, `X-Matched-Path: /en`, `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY`). | Live HTTP check (2026-11-17) |
| **Vercel Configuration** | Project `cultivanode`, team `quadriolapadegmailcoms-projects`, root `apps/web`, auto-deploys `main` to `cultivanode.vercel.app` & `cultivanode.com`. No `apps/web/vercel.json`. | `docs/DEPLOYMENT.md`, `apps/web/next.config.ts` |
| **CI/CD (`ci.yml`)** | Runs `typecheck`, `lint`, `test` (`npm run ...`), plus `supabase db start` and `supabase test db` (pgTAP) on PRs and pushes to `main`. | `.github/workflows/ci.yml` |
| **Android APK CI (`android.yml`)** | Builds release APK (`com.cultivanode.app`), uploads `cultivanode-android-apk` artifact, and publishes `--latest` release to `farmconnect-ux/cultivanode-android` if `RELEASES_TOKEN` is set. `/download/android` redirects to it. | `.github/workflows/android.yml`, `apps/web/next.config.ts` |
| **Local `.env.local` (`apps/web`)** | Exists on disk with keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `AI_PRIMARY_MODEL`, `AI_FALLBACK_MODEL`, `AI_TIMEOUT_MS`, `PAYMENT_MODE`, `SUPABASE_SERVICE_ROLE_KEY`. *(Values not read/exposed.)* | `apps/web/.env.local` |
| **Supabase Project & Migrations** | Project ref `vqbtnftnxyfaembwgfrk` (`eu-west-1`, Postgres 17, `ACTIVE_HEALTHY`). Per `docs/RELEASE_LEDGER.md` (3 Nov), applied migrations end at `20261025212753_fk_indexes_rls_initplan` — **5 November migrations are pending** (`20261103*` and `20261108120000_phone_sign_in_switch.sql`). | `docs/RELEASE_LEDGER.md`, `package.json` |
| **Live Providers & Flags (3 Nov Ledger)** | SMS = `mock_sms`, Identity = `mock_identity` (test-only); Weather = `nimet`; Payment = `flutterwave`; Maps = `google_maps`. `marketplace_live` ON (6 states), `ai_photo_diagnosis` ON, `escrow_payments` OFF, `hiring_escrow` OFF, `marketplace_disputes` OFF. | `docs/RELEASE_LEDGER.md` |

---

## 2. Items That Cannot Be Independently Verified From This Environment

Because `gh`, `supabase`, and `vercel` CLIs are not installed in this environment and no live database/Vercel/Supabase dashboard credentials are available:
1. **GitHub Actions Run Status:** Latest pass/fail status of `ci.yml` and `android.yml` on `21e595b` on GitHub.
2. **Applied Supabase Migrations (since 3 Nov):** Confirm whether the 5 pending November migrations (`20261103*` and `20261108120000`) have been pushed since the 3 Nov `RELEASE_LEDGER.md` snapshot.
3. **Deployed Edge Functions & Vault Secrets:** `docs/RELEASE_LEDGER.md` confirms all 6 Edge Functions (`send-sms`, `send-notifications`, `verify-identity`, `integration-test`, `agent-onboard`, `weather`) are `ACTIVE`, but `APP_ENV=production`, Vault secrets, and custom SMTP for Email OTP cannot be independently verified from this environment.
4. **Live Provider Credentials:** `docs/RELEASE_LEDGER.md` confirms production SMS is still `mock_sms` and Identity is `mock_identity` (both test-only), and `flutterwave` is selected for payments—live credentials/settlement are unverified.
5. **Production Feature Flags (since 3 Nov):** Whether `phone_sign_in`, `marketplace_disputes`, or `escrow_payments` have been toggled since 3 Nov.
6. **Supabase Plan & Backups:** `docs/DEPLOYMENT.md` states the hosted project is on the **Free plan** (*"upgrade to a paid plan with backups/PITR before the pilot"*); whether it has been upgraded cannot be verified.
7. **Vercel Environment Variables:** Whether `GEMINI_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYMENT_MODE`, `LIVE_PAYMENTS_APPROVED`, `PAYSTACK_*`, `FLUTTERWAVE_*`, and `SENTRY_DSN` are configured in Vercel Production.

---

## 3. CI/CD & Release Readiness Gaps

| Gap | Severity | Evidence |
|---|---|---|
| **CI does not run `next build`** | **P1** | `.github/workflows/ci.yml` runs `typecheck`, `lint`, `test`, `supabase test db`, but never runs `npm run build` (`next build`). |
| **`ignoreBuildErrors: true` in Next.js config** | **P1** | `apps/web/next.config.ts:37` ignores TypeScript errors during `next build`. |
| **Android APK signature check ignored (`\|\| true`)** | **P1** | `.github/workflows/android.yml:119` runs `apksigner verify ... \|\| true`, and lines 61–92 silently skip signing config if `ANDROID_KEYSTORE_BASE64` is empty. |
| **Zero automated tests in `apps/web`; broken mobile test runner** | **P1** | `apps/web` has no test suite; `apps/mobile` has 3 Vitest files but no `test` script or `vitest` dependency in `apps/mobile/package.json`. |
| **No automated Edge Function / DB migration deployment** | **P2** | `docs/DEPLOYMENT.md` relies on manual `supabase db push` and `supabase functions deploy`. |
| **Unmerged branches on origin** | **P1** | `origin/fix/farmer-live-records` (`4dd26ac`) and `origin/vercel/install-vercel-web-analytics-bhrs3k` (`b01aebe`) contain unmerged commits. |
| **Free-tier Supabase without PITR backups** | **P0** | Documented in `docs/DEPLOYMENT.md:13-14`; must be upgraded before scaling real users/transactions. |
