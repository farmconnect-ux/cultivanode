# Requirements matrix (Phase 1)

Every major requirement of the Phase 1 master specification, where it lives, and its status.
Status: ✅ done · 🟡 partly done · ⬜ not started. Update this file in the same change as the code.

## M0 Foundations

| ID | Requirement | Database | Server logic | Web UI | Mobile UI | Tests | Status |
|---|---|---|---|---|---|---|---|
| REQ-M0-001 | Monorepo (Turborepo, TypeScript, shared package) | – | – | apps/web | apps/mobile | CI | ✅ (npm workspaces, not pnpm: kept deliberately) |
| REQ-M0-002 | Supabase project, PostGIS, migration framework | supabase/migrations | – | – | – | pgTAP in CI | ✅ |
| REQ-M0-003 | CI: typecheck, lint, tests, DB tests | – | – | – | – | .github/workflows/ci.yml | ✅ |
| REQ-M0-004 | Web deploys | – | – | Vercel `tillmate` | – | live check | ✅ |
| REQ-M0-005 | Android build | – | – | – | android.yml APK | CI build green | 🟡 builds; first on-device launch still to confirm |
| REQ-M0-006 | Environment management, `.env.example` for every provider | – | shared/config.ts | .env.example | .env.example | validation.test.ts (payment mode) | ✅ |
| REQ-M0-007 | Shared types from the database | database.types.ts | – | typed clients | typed client | shared.test.ts | ✅ |
| REQ-M0-008 | Shared validation (Zod) | – | shared/validation.ts | actions/forms.ts | – (M1 screens) | validation.test.ts | ✅ |
| REQ-M0-009 | Structured errors, no internals exposed | – | shared/errors.ts | actions/forms.ts | – | validation.test.ts | ✅ |
| REQ-M0-010 | Logging with redaction, Sentry monitoring | – | lib/logger.ts, lib/monitoring.ts | instrumentation*.ts | ⬜ (M1) | – | 🟡 web done; mobile Sentry in M1 |
| REQ-M0-011 | Design system (tokens, components, contrast) | – | shared/design/tokens.ts | components/ui | src/ui | tokens.test.ts | ✅ |
| REQ-M0-012 | Central brand configuration | – | shared/brand.ts | logo, header, footer, copy | app.config.ts, App.tsx | validation.test.ts | ✅ |
| REQ-M0-013 | Security headers, CSP | – | next.config.ts | all pages | – | manual header check | ✅ |
| REQ-M0-014 | Documentation set | – | – | docs/ | – | – | ✅ |

## M1 Website and identity

| ID | Requirement | Database | Server logic | Web UI | Mobile UI | Tests | Status |
|---|---|---|---|---|---|---|---|
| REQ-WEB-001 | Pages: /, how-it-works, farmers, machinery, service-providers, crops, about, partners, contact, faq, marketplace, privacy, terms, waitlist | – | – | app/[lang]/* | – | build (SSG), mobile-width check | ✅ (privacy/terms are drafts pending legal review) |
| REQ-WEB-002 | English + Yorùbá, translation keys, extensible to pcm/ig/ha | – | – | i18n/ | ⬜ | typed dictionaries | 🟡 Yorùbá needs native review; mobile i18n in M1 |
| REQ-WEB-003 | Marketplace waitlist and contact forms | waitlist_signups, contact_messages | join_waitlist(), send_contact_message() | forms.tsx | – | 05_website_forms, validation.test.ts | ✅ |
| REQ-WEB-004 | No invented partners or claims | – | site.partners (empty) | partners page | – | – | ✅ |
| REQ-ID-001 | One account per person; individual and business accounts | profiles, organizations, org_members | handle_new_user, handle_new_organization | ⬜ | ⬜ | 01_identity | 🟡 database done |
| REQ-ID-002 | Multiple roles per account; spec role names | app_role, roles, user_roles | – | – | – | 01, 06 | 🟡 database done |
| REQ-ID-003 | Role requests with documents, review, rejection reason, resubmission | role_requests, verification_documents, storage bucket | approve/reject/cancel_role_request, review_verification_document | ⬜ | ⬜ | 01, 06 | 🟡 database done |
| REQ-ID-004 | Sensitive roles never auto-granted | roles (check constraint) | role_is_auto_approved | – | – | 06 | ✅ |
| REQ-ID-005 | Verification tiers 0–2, server-controlled | profiles.verification_tier, verifications, bank_accounts | recompute_verification_tier | ⬜ | ⬜ | 01 | 🟡 provider integration pending |
| REQ-ID-006 | Tier 3 trusted provider rule | – | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ needs bookings/ratings (M4) |
| REQ-ID-007 | Business staff with own logins, org-level RLS | org_members | org_role() | ⬜ | ⬜ | 01, 02 | 🟡 |
| REQ-AUTH-001 | Phone OTP sign-in, resend, expiry, rate limits, logout, sessions | auth (Supabase) | SMS hook (Termii) ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| REQ-ID-008 | Identity provider adapters (Smile ID, Dojah, Prembly) | verifications | ⬜ Edge Function + mock | – | – | ⬜ | ⬜ |
| REQ-ADM-001 | Permission-based admin with 5 sub-roles | admin_roles, permissions, admin_role_permissions | has_permission() | ⬜ admin console | – | 06 | 🟡 database done |
| REQ-ADM-002 | Append-only audit log with old/new values, IP, user agent | audit_log, admin_actions | write_audit, record_admin_action | ⬜ | – | 01, 06 | ✅ database |
| REQ-PRIV-001 | Consent records (NDPA), revocable | consents, current_consents | – | ⬜ sign-up screen | ⬜ | 06 | 🟡 database done |
| REQ-PRIV-002 | Data export / deletion requests | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| REQ-AGT-001 | Assisted onboarding by field agents with farmer OTP confirmation | profiles.onboarded_by, farms.onboarded_by | policies | ⬜ | ⬜ | 02, 06 | 🟡 |

## M2 Farms and crop engine

| ID | Requirement | Database | Server logic | Web UI | Mobile UI | Tests | Status |
|---|---|---|---|---|---|---|---|
| REQ-FARM-001 | Farms by GPS point, polygon or typed coordinates; hectares/acres | farms, plots | compute_area_from_boundary | ⬜ | ⬜ | 02 | 🟡 database done |
| REQ-FARM-002 | Zone auto-detection and admin correction | farm_zones, farms.zone_corrected_* | detect_farm_zone, correct_farm_zone | ⬜ | ⬜ | 06 | 🟡 needs zone map data |
| REQ-FARM-003 | Soil records | soil_records | – | ⬜ | ⬜ | 02 | 🟡 |
| REQ-FARM-004 | Record provenance | record_source on farms, soil_records | set_*_source triggers | – | – | 06 | ✅ |
| REQ-CROP-001 | Crop catalogue (15 crops), varieties | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| REQ-CROP-002 | Templates, stages, operations by zone and season | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| REQ-CROP-003 | Plantings with several varieties; schedule generation | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| REQ-STD-001 | Standards engine (published/custom, versioned, approved) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| REQ-CAL-001 | Calendar and reminders | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

## M3 Weather, inventory, farm books

| ID | Requirement | Status |
|---|---|---|
| REQ-WX-001 | 14-day forecast via cached weather cells; monthly outlook | ⬜ |
| REQ-WX-002 | Crop-aware alerts (heavy rain, dry spell, heat, wind) | ⬜ |
| REQ-FERT-001 | Deterministic fertiliser engine with unit tests | ⬜ |
| REQ-SPRAY-001 | Spray planner, approved products only, safety data | ⬜ |
| REQ-INV-001 | Inventory, transactional stock movements, no negative stock, alerts | ⬜ |
| REQ-BOOK-001 | Farm books, reports, PDF export | ⬜ |

## M4 Marketplace

| ID | Requirement | Database | Server logic | Tests | Status |
|---|---|---|---|---|---|
| REQ-MKT-001 | Equipment and service listings with hourly/daily/per-hectare rates | listings, listing_rates, equipment_type | can_create_listing (role + tier 2) | 03 | 🟡 database done |
| REQ-MKT-002 | Search by type, distance, service radius | – | nearby_listings() | 03 | 🟡 date/availability filters pending |
| REQ-MKT-003 | Availability, photos | ⬜ | ⬜ | ⬜ | ⬜ |
| REQ-MKT-004 | Booking state machine (shared) | ⬜ | ⬜ | ⬜ | ⬜ |
| REQ-MKT-005 | Proof of work (GPS, time, inside boundary) | ⬜ | ⬜ | ⬜ | ⬜ |
| REQ-MKT-006 | Ratings (completed, paid, once) | ⬜ | ⬜ | ⬜ | ⬜ |
| REQ-MKT-007 | Demand-nearby clustering without exposing farmers | ⬜ | ⬜ | ⬜ | ⬜ |

## M5 Payments and escrow

| ID | Requirement | Status |
|---|---|---|
| REQ-PAY-001 | Payment provider adapters (Paystack, Flutterwave) in test mode | ⬜ |
| REQ-PAY-002 | Verified, idempotent webhooks | ⬜ |
| REQ-PAY-003 | Double-entry hash-chained ledger | ⬜ |
| REQ-PAY-004 | Escrow, commission, payouts, 48-hour auto-release | ⬜ |
| REQ-PAY-005 | Configurable cancellation rules, refunds | ⬜ |
| REQ-PAY-006 | Disputes with evidence and audited outcomes | ⬜ |
| REQ-PAY-007 | PAYMENT_MODE test/live guard | ✅ (resolvePaymentMode) |
| REQ-FRAUD-001 | Fraud flags (duplicate NIN/BVN, GPS mismatch, patterns) | ⬜ |

## M6 AI assistant

| ID | Requirement | Status |
|---|---|---|
| REQ-AI-001 | Chat in English, Pidgin, Yorùbá with retrieval and crop context | ⬜ |
| REQ-AI-002 | Photo diagnosis with confidence and escalation | ⬜ |
| REQ-AI-003 | Chemical safety from the approved product table | ⬜ |
| REQ-AI-004 | Knowledge base with approval workflow | ⬜ |

## M7 Hardening

| ID | Requirement | Status |
|---|---|---|
| REQ-OFF-001 | Offline-first mobile with deterministic sync | ⬜ |
| REQ-AGT-002 | Field-agent dashboard and visits | ⬜ |
| REQ-NOTIF-001 | In-app, push and SMS notifications with preferences | ⬜ |
| REQ-OPS-001 | Monitoring dashboards, load and security testing | ⬜ |
| REQ-OPS-002 | Play Store preparation | ⬜ |

## Decisions and assumptions
- **npm instead of pnpm:** kept after review; switching adds risk without product benefit.
- **`accounts` = `profiles`:** see DATABASE.md.
- **Admin is not an `app_role`:** admin powers live in `admin_roles` so they can never be self-requested.
- **Tier 2 = NIN + BVN + verified bank account** (was NIN + BVN before the spec alignment).
- **Brand:** "Tillmate" is a working name; another company uses it for a POS app (see project notes).
