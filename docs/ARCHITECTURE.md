# Architecture

Status: Core platform modules (identity/accounts, farms/crop engine, weather, goods marketplace, service hiring W1–W4, Admin Finance/Support, and AI assistant) are implemented in repository code (`main`). Live deployment, hosted migration, device-QA, and pilot readiness are tracked separately in [RELEASE_LEDGER.md](RELEASE_LEDGER.md).

## Shape of the system

```
apps/web      Next.js 16 (App Router). Public website, authenticated account portal, API routes, and admin console.
apps/mobile   Expo SDK 57 / React Native. Android first, iOS-compatible. Farmer, provider, and field-agent app.
packages/shared
              Code both apps share: brand config, design tokens, generated database types, enum lists,
              Zod validation schemas, structured errors, money (kobo), geo (PostGIS EWKT) and phone helpers.
packages/iot-module
              IoT telemetry and module helpers.
supabase      Postgres + PostGIS migrations (61 files), pgTAP tests (21 files, 750 assertions), local config, and Edge Functions.
              The database is the source of truth and enforces permissions with Row Level Security.
docs          This folder.
```

Hosting: web on Vercel (project `cultivanode`, root `apps/web`, auto-deploys from `main`), database/auth/
storage on Supabase (`cultivanode`, ref `vqbtnftnxyfaembwgfrk`, eu-west-1), code on GitHub
(`farmconnect-ux/cultivanode`). Android test builds come from GitHub Actions (`.github/workflows/android.yml`).

## Principles in force

- **Business rules live once.** Permission rules, role approval rules, verification tiers, provenance,
  ledger balance/hash-chain invariants, and price validation are enforced in Postgres (RLS policies,
  constraints, SECURITY DEFINER functions). Input shape rules live in `packages/shared/src/validation.ts`
  and are reused by web and mobile.
- **Never trust the client** for owner, role, tier, price, commission or payment state. Those columns are
  either not granted to app roles or are overwritten by triggers/RPCs.
- **Vendor adapters.** Monitoring goes through `apps/web/src/lib/monitoring.ts`. SMS, identity, weather,
  and payment providers are adapter-driven (see `INTEGRATIONS.md` and `PAYMENTS.md`).
- **Rename-safe branding.** The product name, tagline, logo and domain come from
  `packages/shared/src/brand.ts` (CultivaNode; see README).
- **Enum values come from the database.** `packages/shared/src/roles.ts` re-exports the enums in the
  generated `database.types.ts`, so TypeScript cannot drift from Postgres.

## Web app

- Routes live under `app/[lang]` (`en`, `yo`). `src/proxy.ts` picks the language.
- All copy is in `src/i18n/dictionaries/*.ts`; Yorùbá must have the same keys as English (typed).
- Server actions (`src/actions/*.ts`) and API routes (`src/app/api/**/route.ts`) validate with Zod schemas,
  enforce session/JWT/HMAC checks, call Supabase RPCs/queries, and map database errors safely.
- Security headers and CSP: `next.config.ts`. Monitoring: `src/instrumentation*.ts` (Sentry when a DSN is set).
- Structured, redacted server logs: `src/lib/logger.ts`.
- Admin console under `app/admin` (own root layout, English, never indexed): overview, approvals, users,
  inbox, finance, support, privacy requests, audit, integrations, content. `src/proxy.ts` refreshes the Supabase session there.

## Mobile app

- `app.config.ts` reads the brand name from `@cultivanode/shared/brand`; icons are generated from SVG.
- UI kit in `src/ui` uses the shared design tokens; provider dispatch, farm, marketplace, role requests,
  and document upload screens live in `src/app` and `src/screens`.
- **Offline sync:** local cache/outbox code exists; deterministic sync and physical Android/iOS device QA remain pending (see [OFFLINE_SYNC.md](OFFLINE_SYNC.md) and [RELEASE_LEDGER.md](RELEASE_LEDGER.md)).

## Milestones

M0–M6 and MVP W1–W4 core code implementations are present in `main`; release gates (hosted migrations, provider/switch reconciliation, physical Android/iOS device QA, live payment callbacks, and field-pilot proof) are tracked in [RELEASE_LEDGER.md](RELEASE_LEDGER.md) and [requirements-matrix.md](requirements-matrix.md).
