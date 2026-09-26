# Tillmate

Farm management, equipment and labour hire for Nigerian farmers. Web and mobile apps on one Supabase backend.

> Working name. Rename the repo and app IDs once the name clears CAC, NIPO and domain checks.

## What's here (milestone M0)

```
apps/
  web/        Next.js 16 (App Router, TypeScript, Tailwind) - public site + web portal
  mobile/     Expo SDK 57 (React Native, TypeScript) - Android first, iOS from the same code
packages/
  shared/     Types, role lists, money (kobo) and map helpers used by both apps
supabase/
  migrations/ Database schema: identity, farms, first marketplace slice
  tests/      pgTAP tests for permissions (Row Level Security) and the nearby search
  config.toml Local Supabase settings (phone sign-up on, test OTP numbers)
```

Status:

- [x] Monorepo with shared package (Turborepo + npm workspaces)
- [x] Identity schema: profiles, business accounts and staff, admin roles, role requests with approval, ID verification tiers, audit log
- [x] Farms schema: farms with GPS pin and walked boundary (area calculated), plots, soil records
- [x] `nearby_listings()` search, ported from the prototype with fixes and tests
- [x] CI: typecheck, lint, unit tests, database tests
- [x] Hosted Supabase project `tillmate` (ref `vqbtnftnxyfaembwgfrk`, eu-west-1) with all migrations applied
- [ ] M1: sign-in screens, onboarding, admin approval queue, design system

## Prerequisites

- Node.js 22 (`.nvmrc`)
- Docker Desktop, only for running Supabase locally and the database tests
- The hosted Supabase project `tillmate` (ref `vqbtnftnxyfaembwgfrk`). Migrations are already applied.

## First-time setup

```bash
git clone https://github.com/farmconnect-ux/tillmate.git
cd tillmate
npm install
```

Commit the `package-lock.json` that `npm install` creates:

```bash
git add package-lock.json && git commit -m "Add lockfile" && git push
```

### Connect to the Supabase project

The migration files in `supabase/migrations` carry the same version numbers as the hosted project's
migration history, so `db push` only sends new ones.

```bash
npx supabase login
npx supabase link --project-ref vqbtnftnxyfaembwgfrk
npx supabase migration list   # local and remote columns should match
npx supabase db push          # applies any new migrations
```

Then create the env files. Use the **publishable** key (Project Settings > API). Never use the secret / `service_role` key in an app.

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
# URL: https://vqbtnftnxyfaembwgfrk.supabase.co
```

### Make yourself the first admin

In the Supabase SQL editor, after you have signed up once with your phone number:

```sql
insert into public.admin_roles (profile_id, admin_role)
select id, 'super_admin' from public.profiles where phone = '234XXXXXXXXXX';
```

## Run the apps

```bash
npm run dev:web       # http://localhost:3000
npm run dev:mobile    # scan the QR code with Expo Go on an Android phone
```

## Tests

```bash
npm run test          # shared package unit tests (includes a check that TS role lists match the DB enums)
npm run typecheck
npm run lint

npm run db:start      # starts local Supabase in Docker and applies migrations
npm run db:test       # pgTAP: 79 permission, search and function-exposure tests
npm run db:stop
```

## Database design notes

- **Function grants.** Supabase lets signed-in users call every new function in `public` by default. Migration `harden_function_grants` revokes that for internal and trigger functions and changes the default, so each new function must be granted explicitly. `04_function_grants.test.sql` guards it.
- **Row Level Security on every table.** Supabase grants broad table access by default, so each migration revokes it and grants back only what the apps need, down to individual columns. For example, a user can edit their name but not their verification tier.
- **Roles.** A person asks for a role through `role_requests`. Farmer roles are approved instantly; machinery owner, service provider and the rest wait for a verification officer, who calls `approve_role_request()` or `reject_role_request()`. Approved roles live in `user_roles`, which apps cannot write to. Admin powers are a separate table (`admin_roles`) and can never be requested.
- **Verification tiers.** Server code (with the service role) writes ID results to `verifications`. The tier updates automatically: NIN gives tier 1, NIN plus BVN gives tier 2. Only masked numbers are stored, never full NIN/BVN.
- **Listing needs role and tier.** Creating a listing requires the approved role and tier 2 (payout-ready).
- **Money** is stored in kobo as whole numbers (`rate_kobo`). Use `nairaToKobo()` and `formatNaira()` from `@tillmate/shared`.
- **Coordinates** go to PostGIS as EWKT, longitude first. Use `toPointEwkt()` and `toPolygonEwkt()` from `@tillmate/shared`.
- **`nearby_listings(lat, lng, radius_km, kind, category, limit)`** returns active listings nearest first. The radius is capped at 100 km and the limit at 100. A listing only shows if the farmer is also inside that provider's own service radius.

After changing the schema, regenerate TypeScript types with `npm run db:types` (needs local Supabase running).

## Phone sign-in (SMS)

Local development uses fixed test numbers from `supabase/config.toml` (`2348000000001` and `2348000000002`, code `123456`). If local sign-in asks for an SMS provider, enable one in `config.toml` with dummy values; test numbers never send real SMS. For the hosted project, turn on an SMS provider in Supabase: Authentication > Providers > Phone. Twilio, MessageBird and Vonage work out of the box. To use Termii, add a Send SMS Hook; this is planned for M1.

## Known M0 limitations

- App icons and splash screens are not added yet; Expo uses its defaults.
- Mobile sessions use AsyncStorage for now. M1 switches to encrypted storage before any real user signs in.
- The web session-refresh proxy arrives with sign-in in M1.
