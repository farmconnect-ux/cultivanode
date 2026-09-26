# Deployment

## Web (Vercel)
- Project `tillmate` in team `quadriolapadegmailcoms-projects`, root directory `apps/web`, framework Next.js.
- Every push to `main` deploys to production (https://tillmate.vercel.app); other branches get previews.
- Environment variables (Project > Settings > Environment Variables):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (set);
  optional `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_WHATSAPP`, `NEXT_PUBLIC_CONTACT_PHONE`,
  `NEXT_PUBLIC_CONTACT_EMAIL`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `PAYMENT_MODE`.
  Do not leave a variable present but empty: remove it instead.

## Database (Supabase)
- Project `tillmate`, ref `vqbtnftnxyfaembwgfrk`, region eu-west-1, Postgres 17, Free plan
  (upgrade to a paid plan with backups/PITR before the pilot).
- Apply migrations with `npx supabase db push` after `npx supabase link --project-ref vqbtnftnxyfaembwgfrk`.
  Never change the production schema by hand; every change is a reviewed migration.
- After a schema change: `npm run db:types:remote` and commit `packages/shared/src/database.types.ts`.

## Sign-in codes and identity checks
Providers are chosen in the admin console (see INTEGRATIONS.md). The platform pieces are set once:

1. **Edge Functions** `send-sms`, `verify-identity`, `integration-test` are deployed from
   `supabase/functions` (`npx supabase functions deploy <name>`; `send-sms` has JWT verification off).
2. **Auth hook:** Authentication > Auth Hooks > Send SMS hook > HTTPS, URL
   `https://vqbtnftnxyfaembwgfrk.supabase.co/functions/v1/send-sms`, generate a secret.
3. **Function secrets** (Edge Functions > Secrets): `SEND_SMS_HOOK_SECRET` = that secret (`v1,whsec_...`);
   `APP_ENV` = `production` before real users (turns off the test providers).
4. **Phone sign-in:** Authentication > Sign In / Providers > Phone: enabled.
5. **First admin:** temporarily add your number under Phone > test phone numbers with a code of your choice,
   sign in at `/admin/sign-in`, get `super_admin` (README), then remove the test number.
6. In `/admin/integrations`: add the Termii sender ID and key, send a test SMS, "Use this provider";
   add the Prembly sandbox key, run the sandbox check, "Use this provider". Switch to live when ready.

## Mobile (Android)
- Test APK: GitHub Actions > Android build > Run workflow > download `tillmate-android-apk`.
- Store builds: EAS (`npx eas-cli build -p android --profile production`), which manages the upload key.

## CI (GitHub Actions)
- `ci.yml`: typecheck (including the Edge Functions), lint, unit tests (shared package and Edge Functions);
  database job starts local Supabase and runs pgTAP.
- `android.yml`: builds the test APK when mobile or shared code changes.

## Checklist before a release
Typecheck, lint, unit tests, pgTAP and web build pass; Supabase advisors reviewed; no secrets in the diff;
docs and `requirements-matrix.md` updated.
