# Database and Backend Audit — CultivaNode

**Audit Date:** 2026-11-17  
**Source Inspected:** `main` (`792f0b5`) under `supabase/` (58 migrations, 6 Edge Functions, 18 pgTAP test files, `config.toml`, seeds)  
**Hosted Migration Status (per `docs/RELEASE_LEDGER.md`, 3 Nov snapshot):** Applied migrations on hosted `vqbtnftnxyfaembwgfrk` end at `20261025212753_fk_indexes_rls_initplan`. The 4 November 3 migrations (`20261103*`) and `20261108120000_phone_sign_in_switch.sql` (5 pending migrations total) are committed in `main` but not yet applied to production.

---

## 1. Migration & Schema Inventory

- **PostgreSQL Version:** 17 (`supabase/config.toml`)
- **Total Migrations:** 58 (`20260926020957_extensions_and_types.sql` through `20261108120000_phone_sign_in_switch.sql`)
- **Schemas:** `public`, `private` (internal helpers & trigger functions, unexposed to PostgREST), `extensions`, `vault`, `storage`, `cron`, `net`.

### Tables & Views by Domain
1. **Identity, RBAC, KYC & Compliance (`20260926021050`, `20260926091849`, `20260926150328`, `20260928164741`):**
   - `profiles`, `organizations`, `org_members`, `admin_roles`, `permissions`, `admin_role_permissions`, `roles`, `role_requests`, `user_roles`, `verifications`, `verification_documents`, `bank_accounts`, `consents`, `current_consents` (view), `data_requests`, `agent_onboarding_codes`, `id_claims`, `audit_log`, `admin_actions`.
2. **Site Content, Forms & Integrations (`20260926023713`, `20260926133412`, `20260926210948`, `20260927011448`):**
   - `waitlist_signups`, `contact_messages`, `integration_providers`, `integration_settings`, `integration_configs`, `integration_secrets` (Vault pointers), `integration_events`, `hero_slides`, `page_view_daily`, `weather_cache`.
3. **Farms, Agronomy, Livestock, Tasks & IoT (`20260926021117`, `20261008130000`, `20261009100000`, `20261013020100`, `20261025130000`, `20261103120000`):**
   - `farms`, `plots`, `soil_records`, `farm_zones`, `farm_agronomic_standards`, `crop_cycles`, `crop_cycle_operations`, `crop_observations` (with `ai_diagnosis`, `ai_model`, `ai_analysed_at`), `crop_harvests`, `crop_alerts`, `farm_workers`, `farm_inventory`, `farm_financial_transactions`, `farm_livestock*` (6 tables), `farm_general_records`, `farm_attendance_records`, `farm_operational_tasks`, `farm_machinery*` (3 tables), `farm_equipment_assets`, `farm_inventory_locations`, `farm_inventory_transactions`, `farm_budgets`, `farm_budget_lines`, `farm_plan_actual_variances`, `calendar_feeds`.
   - 10 IoT tables: `device_models`, `sensor_channels`, `devices`, `device_installations`, `telemetry_readings`, `telemetry_rollups`, `device_events`, `alert_rules`, `device_alerts`, `device_commands`.
4. **Service & Equipment Bookings (`20260926021137`, `20260926091916`, `20260929090000`, `20261002095258`):**
   - `listings`, `listing_rates`, `bookings`, `booking_events`, `booking_proofs`, `ratings`, `notifications`, `sms_outbox`.
5. **Marketplace, Double-Entry Ledger & Disputes (`20261008140000`–`20261008180000`, `20261025090000`, `20261025120000`, `20261103140000`):**
   - `marketplace_categories`, `marketplace_products`, `marketplace_variants`, `marketplace_fee_rules`, `marketplace_sellers`, `marketplace_seller_payout_accounts`, `marketplace_listings`, `marketplace_produce_provenance`, `marketplace_inventory_lots`, `marketplace_orders`, `marketplace_order_items`, `marketplace_fulfilments`, `marketplace_ledger_accounts`, `marketplace_journal_entries`, `marketplace_journal_postings`, `marketplace_payments`, `marketplace_escrows`, `marketplace_settlements`, `marketplace_shipments`, `marketplace_delivery_proofs`, `buyer_requests`, `buyer_request_responses`, `marketplace_reviews`, `marketplace_disputes`.
6. **Ecosystem Modules (`20261011100000`, `20261011121000`):**
   - 23 tables (`irrigation_zones`, `irrigation_events`, `machinery_telemetry`, `offtake_contracts`, `contract_deliveries`, `processing_batches`, `market_prices`, `message_threads`, `message_participants`, `messages`, `support_tickets`, `support_ticket_messages`, `loan_applications`, `insurance_policies`, `insurance_claims`, `grant_programmes`, `grant_applications`, `investment_offerings`, `investment_commitments`, `impact_programmes`, `programme_beneficiaries`, `research_trials`, `cooperative_aggregations`) + views `machinery_telemetry_points`, `farm_points`.

---

## 2. Functions, Triggers, Cron Jobs & Feature Flags

- **`SECURITY DEFINER` Functions:** 181 definitions across migrations; **100% set `search_path`** (predominantly `set search_path = ''`).
- **Triggers:** Append-only immutability triggers on `audit_log`, `admin_actions`, `consents`; provenance triggers (`set_*_source`); seller/listing guard triggers (`private.guard_marketplace_seller`, `private.guard_marketplace_listing` in `20261018090000`); published agronomy standard immutability trigger (`20261103120000`).
- **Scheduled Jobs (`pg_cron` + `pg_net`):**
  - `cultivanode-expire-bookings` (`*/5 * * * *`) -> `private.expire_bookings()`
  - `cultivanode-wake-sms-worker` (`* * * * *`) -> `private.wake_notify_worker()` (HTTP POST to `send-notifications` with Vault `notify_worker_secret`)
  - `cultivanode-autoconfirm-bookings` (`*/15 * * * *`) -> `private.auto_confirm_bookings()`
- **Feature Flags (`public.feature_flags`, `public.feature_on(text)`):**
  - `marketplace_live`, `escrow_payments`, `ai_photo_diagnosis`, `marketplace_disputes` (plus UI-referenced `module_livestock`, `module_farm_map`, etc.). Controlled via `admin_set_feature_flag()`.

---

## 3. Storage Buckets (`storage.buckets`)

| Bucket | Visibility | Size Limit | Allowed MIME Types | Access Policy |
|---|---|---|---|---|
| `verification-documents` | Private | 5 MiB | `jpeg`, `png`, `webp`, `pdf` | Owner folder (`auth.uid()`) or staff (`verification.review`). |
| `booking-proofs` | Private | 5 MiB | `jpeg`, `png`, `webp` | Strict UUID folder regex + booking party or staff. |
| `scouting-photos` | Private | 8 MiB | `jpeg`, `png`, `webp` | Owner folder (`auth.uid()`). |
| `site-media` | Public | 5 MiB | `jpeg`, `png`, `webp` | Write restricted to `site_content.manage` in `hero/`. |
| `listing-photos` | Public | 5 MiB | `jpeg`, `png`, `webp` | Write restricted to owner folder (`auth.uid()`). |

---

## 4. Edge Functions (`supabase/functions/`)

| Function | `verify_jwt` | Purpose | Key Security Controls |
|---|---|---|---|
| `agent-onboard` | `true` | Field agent assisted farmer onboarding & OTP confirmation | Validates caller `currentUserId()`, NG phone, HMAC-SHA256 code hash, rolls back `/auth/v1/admin/users` on failure. |
| `integration-test` | `true` | Admin console provider connectivity test (SMS, weather, identity) | Requires `has_permission('integrations.manage')`; refuses test providers when `APP_ENV=production`. |
| `send-notifications` | `false` | `pg_cron`-triggered worker draining `sms_outbox` | Checks `x-worker-secret` (`>= 32` chars) via `notify_worker_authorized()` against Vault secret. |
| `send-sms` | `false` | Supabase Auth Send SMS hook | Verifies Standard Webhooks HMAC signature (`SEND_SMS_HOOK_SECRET`, 5-min window, constant-time compare). |
| `verify-identity` | `true` | NIN, BVN, and bank account verification via Prembly/mock | Requires `data_processing` consent, 5 attempts/user/day cap, Vault-peppered HMAC `id_hash`, stores masked ID only. |
| `weather` | `true` | Cached weather fetch for admin analytics | Requires `has_permission('analytics.read')`, 30-min `weather_cache` TTL. |

7 Deno unit test files cover `_shared/` helpers, handlers, and provider adapters.

---

## 5. Database Tests (`supabase/tests/database/`)

18 pgTAP suites (`01_identity.test.sql`–`18_marketplace_disputes.test.sql`) test identity, RBAC, RLS, function grants (`04_function_grants.test.sql`), website forms, integrations, weather, bookings, crop management, agronomy governance, and marketplace disputes.

**Test Gaps:**
- No negative pgTAP test attempting direct `INSERT`/`UPDATE` on `marketplace_orders`, `marketplace_order_items`, or `marketplace_fulfilments`.
- No regression test in `04_function_grants.test.sql` for `get_checkout_payment_credentials` privilege boundary.
- No `storage.objects` RLS isolation tests across buckets.

---

## 6. Critical Backend / Security Finding (P0)

- **Unrestricted Direct `INSERT`/`UPDATE` on `marketplace_orders`, `marketplace_order_items`, and `marketplace_fulfilments`** (`20261008150000`, `20261012140000`, `20261017200000`):
  - Unlike `bookings` (locked to RPCs) and `marketplace_fulfilments` `UPDATE` (revoked in `20261018090000`), `authenticated` buyers still retain direct `INSERT` and `UPDATE` RLS policies on `marketplace_orders` (`marketplace_orders_buyer_insert`, `marketplace_orders_update_admin_or_buyer`), `marketplace_order_items`, and `marketplace_fulfilments` (`INSERT`).
  - A malicious authenticated user can bypass `place_marketplace_order()` via PostgREST to insert or alter `total_amount_kobo`, `items_subtotal_kobo`, `commission_kobo`, `status = 'paid'`, or `payment_status = 'escrowed'`.
  - **Fix:** `REVOKE INSERT, UPDATE, DELETE` from `authenticated, anon` on these three tables and route all mutations exclusively through `place_marketplace_order()` / `service_role` / governed RPCs.
