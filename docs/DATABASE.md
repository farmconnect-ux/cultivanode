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

Spec tables not yet created (they arrive with their milestone): crop catalogue, standards, plantings,
calendar and reminders (M2); weather, inventory, farm books (M3); bookings, proofs, ratings, disputes (M4);
ledger, payments, escrow, payouts, refunds (M5); AI tables (M6); notifications, agent visits (M1/M7).

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

## Verification tiers

Tier 0 phone verified · Tier 1 NIN verified · Tier 2 NIN + BVN + verified bank account · Tier 3 trusted.
Tiers are recomputed by triggers on `verifications` and `bank_accounts`; apps cannot write them.
Tier 3 is kept only while tier 2 conditions hold. **Planned (M4):** the automatic tier 3 rule
(5 completed jobs, rating ≥ 4.0, no upheld disputes, CAC check for businesses) once bookings and ratings exist.

## Tests

`supabase/tests/database/*.test.sql` (pgTAP, 144 tests) cover RLS, grants, approvals, tiers, documents,
consents, provenance, audit immutability and the nearby search. CI runs them on every push.
Regenerate TypeScript types after a schema change: `npm run db:types:remote`.
