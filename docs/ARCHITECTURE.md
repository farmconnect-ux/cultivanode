# Architecture

Status: M0 foundations and the public website are built. Everything below describes what exists
today unless it is marked **Planned**.

## Shape of the system

```
apps/web      Next.js 16 (App Router). Public website today; authenticated portal and admin console from M1.
apps/mobile   Expo SDK 57 / React Native. Android first, iOS-compatible. Farmer and field-agent app from M1.
packages/shared
              Code both apps share: brand config, design tokens, generated database types, enum lists,
              Zod validation schemas, structured errors, money (kobo), geo (PostGIS EWKT) and phone helpers.
supabase      Postgres + PostGIS migrations, pgTAP tests, local config. The database is the source of truth
              and enforces permissions with Row Level Security.
docs          This folder.
```

Hosting: web on Vercel (project `tillmate`, root `apps/web`, auto-deploys from `main`), database/auth/
storage on Supabase (`tillmate`, ref `vqbtnftnxyfaembwgfrk`, eu-west-1), code on GitHub
(`farmconnect-ux/tillmate`). Android test builds come from GitHub Actions (`.github/workflows/android.yml`).

## Principles in force

- **Business rules live once.** Permission rules, role approval rules, verification tiers, provenance and
  price validation are enforced in Postgres (RLS policies, constraints, SECURITY DEFINER functions).
  Input shape rules live in `packages/shared/src/validation.ts` and are reused by web and mobile.
- **Never trust the client** for owner, role, tier, price, commission or payment state. Those columns are
  either not granted to app roles or are overwritten by triggers.
- **Vendor adapters.** Monitoring goes through `apps/web/src/lib/monitoring.ts`. Payment, SMS, identity,
  weather, maps and AI providers get the same treatment when they are built (**Planned**, M1–M6).
- **Rename-safe branding.** The product name, tagline, logo and domain come from
  `packages/shared/src/brand.ts`. "Tillmate" is a working name (see README).
- **Enum values come from the database.** `packages/shared/src/roles.ts` re-exports the enums in the
  generated `database.types.ts`, so TypeScript cannot drift from Postgres.

## Web app

- Routes live under `app/[lang]` (`en`, `yo`), statically generated. `src/proxy.ts` picks the language.
- All copy is in `src/i18n/dictionaries/*.ts`; Yorùbá must have the same keys as English (typed).
- Forms post to server actions (`src/actions/forms.ts`) that validate with shared Zod schemas, call a
  database function with the publishable key, and map database errors to safe message keys.
- Security headers and CSP: `next.config.ts`. Monitoring: `src/instrumentation*.ts` (Sentry when a DSN is set).
- Structured, redacted server logs: `src/lib/logger.ts`.

## Mobile app

- `app.config.ts` reads the brand name from `@tillmate/shared/brand`; icons are generated from SVG.
- UI kit in `src/ui` uses the shared design tokens. Screens beyond the placeholder arrive in M1.
- **Planned (M7):** offline-first storage and sync (see OFFLINE_SYNC.md).

## Milestones

M0 foundations ✔ · M1 website ✔ + identity (database ✔, sign-in/onboarding/admin UI pending) · M2 farms and
crop engine · M3 weather, inventory, farm books · M4 marketplace · M5 payments and escrow · M6 AI · M7 hardening.
The requirement-by-requirement status is in `requirements-matrix.md`.
