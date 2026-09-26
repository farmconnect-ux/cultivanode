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

## Mobile (Android)
- Test APK: GitHub Actions > Android build > Run workflow > download `tillmate-android-apk`.
- Store builds: EAS (`npx eas-cli build -p android --profile production`), which manages the upload key.

## CI (GitHub Actions)
- `ci.yml`: typecheck, lint, unit tests; database job starts local Supabase and runs pgTAP.
- `android.yml`: builds the test APK when mobile or shared code changes.

## Checklist before a release
Typecheck, lint, unit tests, pgTAP and web build pass; Supabase advisors reviewed; no secrets in the diff;
docs and `requirements-matrix.md` updated.
