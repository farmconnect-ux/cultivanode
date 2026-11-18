# Database

Postgres 17 on Supabase with PostGIS (in the `extensions` schema). Every change is a migration in
`supabase/migrations`; migration version numbers match the hosted project's history. Seed data is kept
separately in `supabase/seed.sql` (local only).

## Tables (public schema)

| Group | Tables | Notes |
|---|---|---|
| Identity | `profiles`, `organizations`, `org_members`, `roles`, `role_requests`, `user_roles`, `verifications`, `verification_documents`, `bank_accounts`, `consents` (+ view `current_consents`) | `profiles` is the account (one per person, created from `auth.users`). Businesses are `organizations` with staff in `org_members` (owner, farm_manager, storekeeper, accountant, worker), each staff member with their own login. |
| Administration | `admin_roles`, `permissions`, `admin_role_permissions`, `admin_actions`, `audit_log` | Admin sub-roles: super_admin, verification_officer, support_disputes, agronomy_editor, finance_officer. |
| Farms | `farms`, `plots`, `soil_records`, `farm_zones` | PostGIS geography points and polygons; area computed from the boundary. |
| Marketplace | `listings`, `listing_rates` | Equipment type or service type; prices per hour/day/hectare/job in kobo. |
| Website | `waitlist_signups`, `contact_messages` | Written only through rate-limited functions. |
| Integrations | `integration_providers`, `integration_settings`, `integration_configs`, `integration_secrets`, `integration_events` | Staff-chosen SMS and identity providers; keys in Supabase Vault. No app access. See INTEGRATIONS.md. |

Additional module tables (crop catalogue/standards/operations, weather cache, inventory, farm books, bookings/proofs/ratings/disputes, goods marketplace orders/payments/escrow/ledger/settlements, IoT telemetry, ecosystem modules, support tickets, and feature flags) have been added across `61` migrations in `supabase/migrations/`. Hosted application status for migrations after `20261025212753_fk_indexes_rls_initplan` is tracked in [RELEASE_LEDGER.md](RELEASE_LEDGER.md).



### Naming note: accounts
The specification lists both `accounts` and `profiles`. Here one person has exactly one `profiles` row and
a business is an `organizations` row, so a separate `accounts` table would duplicate `profiles`. If a
future need appears (for example a person holding several business accounts), `organizations` already
supports multiple memberships per person.

## Conventions

- UUID primary keys (audit tables use identity bigints), foreign keys, check constraints, unique indexes.
- `created_at`, `updated_at` (trigger `set_updated_at`) and `created_by` (defaults to `auth.uid()`, never
  granted to app roles) on user-created tables.
- Money in kobo (`bigint`). Coordinates as `geography(Point|Polygon, 4326)`, written as EWKT, longitude first.
- Enum types for fixed vocabularies; reference tables (`roles`, `permissions`, `farm_zones`) where staff
  must be able to change behaviour without a code change.
- **Provenance:** `record_source` (`self_reported`, `agent_verified`, `platform_verified`,
  `payment_verified`) on farm records, set by triggers. Needed for the Phase 3 credit profile.
- **Append-only:** `audit_log`, `admin_actions` and `consents` reject UPDATE and DELETE for everybody.
- Financial records (M5) will never be deleted; corrections will be reversing entries.

## Access control

- RLS is enabled on every table. Supabase's broad default grants are revoked in each migration and only
  the needed columns are granted back.
- Staff access uses `has_permission('<permission>')`; policies never name an admin sub-role.
- Helper functions used only by policies live in the `private` schema (not exposed by the API).
- Functions in `public` are not executable by app roles unless a migration grants them.

## Key functions

| Function | Who can call | What it does |
|---|---|---|
| `has_permission(text)`, `my_permissions()` | signed-in | Permission checks for the caller |
| `has_role`, `org_role`, `my_verification_tier` | signed-in | Describe the caller only |
| `approve_role_request`, `reject_role_request` | `roles.review` | Grant/deny a role; audit + admin action |
| `cancel_role_request` | owner | Cancel own pending request |
| `review_verification_document` | `verification.review` | Accept/reject an uploaded document (not your own) |
| `correct_farm_zone` | `farms.correct_zone` | Staff correction of a farm's zone, with reason |
| `nearby_listings` | signed-in | Priced, active listings whose service radius reaches the caller |
| `join_waitlist`, `send_contact_message` | anyone | Website forms, rate-limited |
| `admin_integration_overview`, `admin_save_integration_config`, `admin_set_integration_secret`, `admin_clear_integration_secret`, `admin_set_integration_mode`, `admin_activate_integration` | `integrations.manage` | Choose and configure providers |
| `integration_runtime`, `record_identity_verification`, `record_bank_account_verification` | service role | Edge Functions only |

## Verification tiers

Tier 0 phone verified · Tier 1 NIN verified · Tier 2 NIN + BVN + verified bank account · Tier 3 trusted.
Tiers are recomputed by triggers on `verifications` and `bank_accounts`; apps cannot write them.
Tier 3 is kept only while tier 2 conditions hold. **Planned (M4):** the automatic tier 3 rule
(5 completed jobs, rating ≥ 4.0, no upheld disputes, CAC check for businesses) once bookings and ratings exist.

## Tests

`supabase/tests/database/*.test.sql` (pgTAP: `21` files, `750` assertions on `main`) plus `concurrency-check.mjs`, `storage-api-check.mjs`, and `api-db-integration-check.mjs` cover RLS, grants, approvals, onboarding, business staff, privacy requests, field-agent codes, tiers, documents, consents, provenance, audit immutability, nearby search, marketplace security, ledger hash-chain concurrency, and `process_payment_webhook`. CI runs them against local Supabase on every push.

Regenerate TypeScript types after a schema change: `npm run db:types:remote`.

## M1 accounts (migration `20260926150328_m1_accounts`)
- `profiles.onboarded_at`; `complete_onboarding()` records details, business account, consents and role requests in one transaction.
- Role requests: only open roles (`roles.available`); approval needs the role's minimum tier and, where `requires_documents`, an accepted document.
- Business staff: `add_org_member()` (owner adds by phone), `org_member_list()` (masked numbers).
- Privacy: `data_requests`, `export_my_data()`, `request_account_deletion()`, `cancel_data_request()`, `admin_resolve_data_request()` (`privacy.manage`, given to support_disputes).
- Staff: `admin_dashboard()`, `admin_grant_admin_role()` / `admin_revoke_admin_role()` (the last super admin cannot be removed), `admin_set_contact_handled()` (direct updates to contact messages revoked).
- Field agents: `agent_onboarding_codes` (HMAC of phone + code only) and `agent_onboarding_start/verify/complete()`, service role only, called by the `agent-onboard` Edge Function.
