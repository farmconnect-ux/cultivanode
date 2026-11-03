# Requirements matrix (Phase 1)

Every major requirement of the Phase 1 master specification, where it lives, and its status.
Status: ✅ done · 🟡 partly done · ⬜ not started. Update this file in the same change as the code.
Build order: [`ROADMAP.md`](ROADMAP.md). After M1 comes the MVP track "first real jobs" (weeks W1–W4, section below);
rows pulled into it from later milestones are marked **→ MVP Wn**.

## Current release evidence — 3 November 2026

The detailed snapshot is the [current release ledger](RELEASE_LEDGER.md). It is the source of truth for release readiness; the milestone rows below map requirements and code locations, and older checkmarks do not imply deployment or field validation.

| Journey | Current release reading |
|---|---|
| Identity and account | Web/native code exists; production Supabase currently selects test-only mock SMS and identity providers. |
| Farm and crop operations | Real-data workflows exist; agronomy governance/catalogue migrations from 3 Nov are pending in Supabase. |
| Service hiring | W1–W4 code exists; W4 migration is pending. Marketplace is enabled in six states; real-device and field-pilot proof is absent. |
| Goods marketplace | Checkout/order code exists; escrow is off and order-dispute switch is absent/off; latest dispute migration is pending. |
| Weather | Weather Edge Function is active; live provider selection is NiMet. |
| AI assistant | Assistant/photo-analysis code exists; photo-diagnosis switch is ON, but agronomy review/evaluation and handset results are unverified. |
| Native/offline | Native journeys and an outbox/cache exist; complete offline behavior and device validation are unproven. |
| Admin dispute/agronomy | Latest UI and logic are in GitHub; four Nov 3 database changes are not yet deployed. |

**Cross-cutting release gate:** the production marketplace switch is ON while SMS and identity select test-only mocks. Resolve this before onboarding real users. The ledger records the deployed migration head, current flags, Vercel evidence, device results, and pilot provenance separately.

## M0 Foundations

| ID | Requirement | Database | Server logic | Web UI | Mobile UI | Tests | Status |
|---|---|---|---|---|---|---|---|
| REQ-M0-001 | Monorepo (Turborepo, TypeScript, shared package) | – | – | apps/web | apps/mobile | CI | ✅ (npm workspaces, not pnpm: kept deliberately) |
| REQ-M0-002 | Supabase project, PostGIS, migration framework | supabase/migrations | – | – | – | pgTAP in CI | ✅ |
| REQ-M0-003 | CI: typecheck, lint, tests, DB tests | – | – | – | – | .github/workflows/ci.yml | ✅ |
| REQ-M0-004 | Web deploys | – | – | Vercel `cultivanode` | – | live check | ✅ |
| REQ-M0-005 | Android build | – | – | – | android.yml APK | CI build green | 🟡 builds; first on-device launch still to confirm |
| REQ-M0-006 | Environment management, `.env.example` for every provider | – | shared/config.ts | .env.example | .env.example | validation.test.ts (payment mode) | ✅ |
| REQ-M0-007 | Shared types from the database | database.types.ts | – | typed clients | typed client | shared.test.ts | ✅ |
| REQ-M0-008 | Shared validation (Zod) | – | shared/validation.ts | actions/forms.ts | – (M1 screens) | validation.test.ts | ✅ |
| REQ-M0-009 | Structured errors, no internals exposed | – | shared/errors.ts | actions/forms.ts | – | validation.test.ts | ✅ |
| REQ-M0-010 | Logging with redaction, Sentry monitoring | – | lib/logger.ts, lib/monitoring.ts | instrumentation*.ts | src/lib/monitoring.ts (off without DSN, PII scrubbed) | redact tests | ✅ |
| REQ-M0-011 | Design system (tokens, components, contrast) | – | shared/design/tokens.ts | components/ui | src/ui | tokens.test.ts | ✅ |
| REQ-M0-012 | Central brand configuration | – | shared/brand.ts | logo, header, footer, copy | app.config.ts, App.tsx | validation.test.ts | ✅ |
| REQ-M0-013 | Security headers, CSP | – | next.config.ts | all pages | – | manual header check | ✅ |
| REQ-M0-014 | Documentation set | – | – | docs/ | – | – | ✅ |

## M1 Website and identity

| ID | Requirement | Database | Server logic | Web UI | Mobile UI | Tests | Status |
|---|---|---|---|---|---|---|---|
| REQ-WEB-001 | Pages: /, how-it-works, farmers, machinery, service-providers, crops, about, partners, contact, faq, marketplace, privacy, terms, waitlist | – | – | app/[lang]/* | – | build (SSG), mobile-width check | ✅ (privacy/terms are drafts pending legal review) |
| REQ-WEB-002 | English + Yorùbá, translation keys, extensible to pcm/ig/ha | – | – | i18n/ | src/i18n (EN/YO, typed) | typed dictionaries | 🟡 Yorùbá needs native review |
| REQ-WEB-003 | Marketplace waitlist and contact forms | waitlist_signups, contact_messages | join_waitlist(), send_contact_message() | forms.tsx | – | 05_website_forms, validation.test.ts | ✅ |
| REQ-WEB-004 | No invented partners or claims | – | site.partners (empty) | partners page | – | – | ✅ |
| REQ-ID-001 | One account per person; individual and business accounts | profiles (+onboarded_at), organizations, org_members | complete_onboarding() | /[lang]/onboarding | OnboardingScreen (channel 'mobile') | 01, 08, mobile-lib | ✅ |
| REQ-ID-002 | Multiple roles per account; spec role names | app_role, roles, user_roles | parse_role_choices, before_role_request_insert (open roles only) | onboarding, /account/roles | onboarding roles step, Home role list | 01, 06, 08 | 🟡 adding roles later is web-only for now |
| REQ-ID-003 | Role requests with documents, review, rejection reason, resubmission | role_requests, verification_documents, storage bucket | approve (needs accepted document + min tier) / reject / cancel, review_verification_document | /account/roles (upload), /admin/approvals (signed links) | pending requests shown; uploads on web | 01, 06, 08 | 🟡 mobile uploads later |
| REQ-ID-004 | Sensitive roles never auto-granted | roles (check constraint) | role_is_auto_approved | – | – | 06 | ✅ |
| REQ-ID-005 | Verification tiers 0–2, server-controlled | profiles.verification_tier, verifications, bank_accounts | recompute_verification_tier | /account, /account/verification | tier shown on Home; checks on web | 01, 07 | 🟡 mobile ID checks later |
| REQ-ID-006 | Tier 3 trusted provider rule | – | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ needs completed bookings and ratings (after the MVP) |
| REQ-ID-007 | Business staff with own logins, org-level RLS | org_members | org_role(), add_org_member(), org_member_list() | /account/business | web only for now | 01, 02, 08 | 🟡 web done |
| REQ-AUTH-001 | Phone OTP sign-in, resend, expiry, rate limits, logout, sessions | auth (Supabase) | send-sms hook, provider chosen in admin | /[lang]/sign-in, /sign-up (60 s resend timer), sign out, sign out everywhere; admin sign-in | PhoneSignInScreen (60 s resend), sign out, sign out everywhere; AES-encrypted session (key in Keystore/Keychain) | handlers.test.ts, mobile-lib | ✅ |
| REQ-ID-008 | Identity provider adapters (Smile ID, Dojah, Prembly) | verifications (id_hash, name_match), bank_accounts | verify-identity; Prembly + mock adapters | /account/verification (consent, NIN, BVN, bank) | ⬜ | providers/handlers tests, 07 | 🟡 Prembly + mock done; Dojah/Smile ID listed, not built |
| REQ-INT-001 | Providers switchable in admin (no hard-coding), test/live, keys encrypted | integration_* tables, Vault | admin_* functions, integration_runtime, integration-test | /admin/integrations | – | 07_integrations, unit tests | ✅ |
| REQ-ADM-001 | Permission-based admin with 5 sub-roles | admin_roles, permissions, admin_role_permissions | has_permission(), admin_dashboard(), admin_grant/revoke_admin_role() | /admin: overview, approvals, users, inbox, privacy requests, audit, integrations | – | 06, 07, 08 | ✅ |
| REQ-ADM-002 | Append-only audit log with old/new values, IP, user agent | audit_log, admin_actions | write_audit, record_admin_action | /admin/audit | – | 01, 06 | ✅ |
| REQ-PRIV-001 | Consent records (NDPA), revocable | consents, current_consents | complete_onboarding() records them | onboarding, /account/privacy toggles | onboarding consents step | 06, 08, mobile-lib | 🟡 toggles on web |
| REQ-PRIV-002 | Data export / deletion requests | data_requests | export_my_data(), request_account_deletion(), admin_resolve_data_request() | /account/privacy, /api/account/export, /admin/privacy | ⬜ | 08 | 🟡 web done; deletion itself is a manual staff step |
| REQ-AGT-001 | Assisted onboarding by field agents with farmer OTP confirmation | agent_onboarding_codes, profiles.onboarded_by | agent-onboard Edge Function + agent_onboarding_* | /account/agent (register farmer, add their farm) | web only for now | agent-onboard.test.ts, 08 | 🟡 mobile agent flow with offline sync (M7) |

## M2 Farms and crop engine

| ID | Requirement | Database | Server logic | Web UI | Mobile UI | Tests | Status |
|---|---|---|---|---|---|---|---|
| REQ-FARM-001 | Farms by GPS point, polygon or typed coordinates; hectares/acres | farms, plots | compute_area_from_boundary, addFarm action | /account/farms (pin + typed area), /account/agent | ⬜ | 02 | 🟡 web: pin and area; boundary walking, plots UI and mobile pending |
| REQ-FARM-002 | Zone auto-detection and admin correction | farm_zones, farms.zone_corrected_* | detect_farm_zone, correct_farm_zone | ⬜ | ⬜ | 06 | 🟡 needs zone map data |
| REQ-FARM-003 | Soil records | soil_records | – | ⬜ | ⬜ | 02 | 🟡 |
| REQ-FARM-004 | Record provenance | record_source on farms, soil_records | set_*_source triggers | – | – | 06 | ✅ |
| REQ-CROP-001 | Crop catalogue (15 crops), varieties | draft catalogue seed (3 Nov migration pending) | agronomy governance code | crop cycle UI | partial native | governance tests in repo | 🟡 draft content only; not deployed/approved |
| REQ-CROP-002 | Templates, stages, operations by zone and season | shared catalogue + draft standards; DB governance pending | schedule generator | planner/cycle UI | partial native | unit/DB governance tests | 🟡 code present; approval/deployment incomplete |
| REQ-CROP-003 | Plantings with several varieties; schedule generation | crop cycles/operations applied through 25 Oct | shared schedule generator | crop planner and cycle detail | partial native | tests exist | 🟡 implementation present; field validation pending |
| REQ-STD-001 | Standards engine (published/custom, versioned, approved) | 3 Nov governance migration pending | approval/publishing logic in main | agronomy admin console | – | pgTAP suite in main | 🟡 code present; not deployed; draft standards not approved |
| REQ-CAL-001 | Calendar and reminders | crop operation schedule + calendar feeds applied before 25 Oct | task/calendar actions | field calendar + iCalendar feed | partial | automated coverage | 🟡 implemented; handset/pilot use unverified |

## M3 Weather, inventory, farm books

| ID | Requirement | Status |
|---|---|---|
| REQ-WX-001 | 14-day forecast via cached weather cells; monthly outlook | 🟡 active weather provider/function; verify forecast horizon and production response against current promise |
| REQ-WX-002 | Crop-aware alerts (heavy rain, dry spell, heat, wind) | 🟡 app alert workflows exist; crop/field validation and pilot evidence not recorded |
| REQ-FERT-001 | Deterministic fertiliser engine with unit tests | 🟡 schedule/standards code exists; approved standards and evaluation are pending |
| REQ-SPRAY-001 | Spray planner, approved products only, safety data | 🟡 code/guardrails exist; approved product governance and safety validation remain gates |
| REQ-INV-001 | Inventory, transactional stock movements, no negative stock, alerts | 🟡 real-data inventory code and migrations exist; reconcile rule coverage and field use in ledger |
| REQ-BOOK-001 | Farm books, reports, PDF export | 🟡 farm finance/book workflows exist; confirm reporting/export scope and pilot use |

## M4 Marketplace

| ID | Requirement | Database | Server logic | Tests | Status |
|---|---|---|---|---|---|
| REQ-MKT-001 | Equipment and service listings with hourly/daily/per-hectare rates | listings, listing_rates, equipment_type | can_create_listing (role + tier 2) | 03, 11 | ✅ web UI (/account/listings); publishing needs tier 2, an active account and the marketplace switch |
| REQ-MKT-002 | Search by type, distance, service radius | – | nearby_listings() | 03, 11 | ✅ web UI (/account/find); date/availability filters after the MVP |
| REQ-MKT-003 | Availability, photos | ⬜ | ⬜ | ⬜ | ⬜ after the MVP |
| REQ-MKT-004 | Booking state machine (shared) | bookings, booking_events | request/accept/decline/cancel_booking, expire_bookings | 12 | ✅ deployed on hosted 2026-10-01; web /account/bookings (native later) |
| REQ-MKT-005 | Proof of work (GPS, time, inside boundary) | bookings GPS columns, booking_proofs, private booking-proofs bucket | check_in_booking, submit_proof, finish_booking_work | 13_mvp_week3 | 🟡 MVP W3 database live 2026-10-02 (fixes 2026-10-03); web pages live with the fix push; real-phone pass pending |
| REQ-MKT-006 | Ratings (completed, paid, once) | ratings | rate_booking (completed jobs only), provider_card average and count | 13, 14 | 🟡 MVP W3: only completed jobs (both sides marked the same amount paid); payment is marked, not processed |
| REQ-MKT-007 | Demand-nearby clustering without exposing farmers | ⬜ | ⬜ | ⬜ | ⬜ after the MVP |

## M5 Payments and escrow

| ID | Requirement | Status |
|---|---|---|
| REQ-PAY-001 | Payment provider adapters (Paystack, Flutterwave) for service-job escrow | 🟡 provider/checkout code exists for goods commerce; live service escrow remains OFF and legally gated |
| REQ-PAY-002 | Verified, idempotent webhooks | ⬜ |
| REQ-PAY-003 | Double-entry hash-chained ledger | ⬜ |
| REQ-PAY-004 | Escrow, commission, payouts, 48-hour auto-release | 🟡 marketplace ledger/escrow code exists; escrow switch is OFF and no live end-to-end settlement is verified; service-job escrow remains gated |
| REQ-PAY-005 | Configurable cancellation rules, refunds | ⬜ rules without money **→ MVP W4**; refunds after legal sign-off |
| REQ-PAY-006 | Disputes with evidence and audited outcomes | 🟡 W4 booking and goods-dispute code is in main; November migrations pending, switches/device/staff pilot not verified |
| REQ-PAY-007 | PAYMENT_MODE test/live guard | ✅ (resolvePaymentMode) |
| REQ-FRAUD-001 | Fraud flags (duplicate NIN/BVN, GPS mismatch, patterns) | 🟡 one claimant per ID ✅ (W1); GPS check-in ✅ and before/after photos must carry GPS inside the farm boundary ✅ (W3); booking needs tier 1 (NIN) ✅; repeated-pair and payout-limit patterns later |

## M6 AI assistant

| ID | Requirement | Status |
|---|---|---|
| REQ-AI-001 | Chat in English, Pidgin, Yorùbá with retrieval and crop context | 🟡 assistant/grounding code exists; knowledge governance migration is pending; evaluation not recorded |
| REQ-AI-002 | Photo diagnosis with confidence and escalation | 🟡 photo-analysis code exists and production switch is ON; agronomist/device validation not evidenced |
| REQ-AI-003 | Chemical safety from the approved product table | 🟡 guardrail code exists; approved product table/governance and evaluation are incomplete |
| REQ-AI-004 | Knowledge base with approval workflow | 🟡 governance code exists; 3 Nov migration pending, seeded standards are drafts |

## M7 Hardening

| ID | Requirement | Status |
|---|---|---|
| REQ-OFF-001 | Offline-first mobile with deterministic sync | 🟡 local cache/outbox/retry code exists; deterministic sync, conflict validation, handset and field proof remain open |
| REQ-AGT-002 | Field-agent dashboard and visits | ⬜ booking on behalf of a farmer **→ MVP W4**; dashboard and visits later |
| REQ-NOTIF-001 | In-app, push and SMS notifications with preferences | 🟡 in-app inbox and booking SMS done (MVP W2); push and preferences later |
| REQ-OPS-001 | Monitoring dashboards, load and security testing | ⬜ |
| REQ-OPS-002 | Play Store preparation | ⬜ |

## MVP — first real jobs (W1–W4, added 2026-09-28)

The MVP is done when real jobs run through the platform. No money moves through CultivaNode: the booking records the
agreed price in kobo and both sides mark it paid. New requirements from the audit, plus the pulled-forward rows above.

| ID | Requirement | Week | Status |
|---|---|---|---|
| REQ-OPS-010 | Fail closed: test-only providers refused unless `APP_ENV=development` or a local Supabase URL; hosted project on live providers | W1 | ✅ deployed 2026-09-28 (_shared/env.ts, env.test.ts); hosted runs Termii and Prembly |
| REQ-WEB-011 | Truthful public site: no escrow or payment-partner claim, unbuilt features "coming soon", pilot terms say payment is direct (EN and YO) | W1 | ✅ (Yorùbá and legal review pending) |
| REQ-SEC-010 | One verified claimant per NIN, BVN and bank account (`id_claims` primary key, `private.claim_id`) | W1 | ✅ 11_mvp_week1 |
| REQ-ADM-012 | Suspend or flag an account with a reason (`suspended_at` + `auth.users.banned_until`), force sign-out (sessions ended), audited | W1 | ✅ /admin/users/[id]; 11_mvp_week1 |
| REQ-ADM-013 | `feature_flags` kill switch (`marketplace_live`, per pilot state), settings.manage, audited | W1 | ✅ /admin/marketplace; starts closed |
| REQ-ADM-014 | Users search (name, phone, business, filters); queue counts, oldest wait and median approval time on the Overview; agent codes and business staff views with revoke/remove | W1 | ✅ /admin/users, /admin, /admin/access |
| REQ-ADM-015 | Listing moderation: suspend and restore (as paused), audited; owners cannot lift it | W1 | ✅ /admin/marketplace |
| REQ-FARM-005 | Farm list shows my farms and my businesses' farms | W1 | ✅ /account/farms |
| REQ-MKT-001/002 | Provider listing screens; farmer search from a farm (`nearby_listings_for_farm`), provider card (first name, state, tier) | W1 | ✅ /account/listings, /account/find (web) |
| REQ-MKT-004 | Bookings, append-only booking events, request/accept/decline/cancel/expire functions, participant-only RLS, `bookings.read` | W2 | ✅ deployed and verified on hosted 2026-10-01 (20260929090000_mvp_week2.sql, 12_mvp_week2); /account/bookings (web) |
| REQ-NOTIF-002 | Notifications table and inbox; booking SMS through the active SMS provider | W2 | ✅ deployed: notifications + /account/inbox; sms_outbox drained by the send-notifications Edge Function (send-notifications.test.ts); pg_cron wake-up and expiry active on hosted |
| REQ-SMS-002 | Twilio as a second switchable SMS provider (sign-in codes and booking SMS) | W2 | ✅ adapter + tests done (providers.test.ts); Twilio live on hosted since 2026-10-01 (SID, token and sender in Admin › Integrations and Vault; active provider switched from the mock) |
| REQ-MKT-005 | GPS check-in near the farm pin; proof photos in a private bucket (EXIF stripped, GPS and time stored) | W3 | 🟡 code done and applied on hosted 2026-10-02 (check-in within 1000 m on the job day; EXIF stripped in the browser; photo GPS within 2000 m); real-phone pass pending |
| REQ-MKT-008 | Confirm or dispute within 48 hours; auto-confirm by `pg_cron`; marked paid by each side, mismatch flagged | W3 | 🟡 code done and applied on hosted 2026-10-02 (confirm_booking, dispute_booking, autoconfirm cron every 15 min, mark_paid both sides with mismatch flag) |
| REQ-MKT-006 | Ratings once per side after confirmation; average in search | W3 | 🟡 code done and applied on hosted 2026-10-02 (rate_booking, 1–5 stars plus fixed tags; average + count badge on the search card) |
| REQ-ADM-016 | Admin bookings list and detail (timeline, proofs, notes); dispute resolution with outcome and notifications | W4 | 🟡 W4 UI/logic in main; migration `20261103000000` pending Supabase; device and staff rehearsal not evidenced |
| REQ-MKT-009 | Cancellation windows, provider strikes, free weather reschedule, as settings data (no money) | W4 | ⬜ not evidenced as complete; retain as release gate |
| REQ-AGT-003 | Field agent books on behalf of a farmer they onboarded | W4 | ⬜ not evidenced as complete; retain as release gate |
| REQ-SEC-011 | Identity-check attempt limit counts provider calls | W4 | ⬜ |
| REQ-OPS-011 | Pilot runbook, Sentry alerts on booking functions, low-end Android over 3G pass, Yorùbá copy for new screens | W4 | ⬜ no runbook/device/language acceptance evidence found |

## Decisions and assumptions
- **MVP first (2026-09-28):** after M1, the "first real jobs" MVP runs before M2–M7; the job flow is responsive web first; no money through the platform until M5 and legal sign-off. See ROADMAP.md.
- **Payment boundary (confirmed 2026-10-02):** no money through the platform in the MVP; both sides mark the job paid. Paystack is registered in test mode only, as the M5 adapter's configuration home.
- **npm instead of pnpm:** kept after review; switching adds risk without product benefit.
- **`accounts` = `profiles`:** see DATABASE.md.
- **Admin is not an `app_role`:** admin powers live in `admin_roles` so they can never be self-requested.
- **Tier 2 = NIN + BVN + verified bank account** (was NIN + BVN before the spec alignment).
- **Providers are data, not code:** SMS/identity provider, settings and keys are managed in `/admin/integrations`; environment variables hold only platform secrets (hook secret, APP_ENV).
- **Brand:** CultivaNode (capital N), final name since 2026-09-26. Master tagline "Connected intelligence for agriculture"; human promise "Your farm's working partner". Code packages are `@cultivanode/*`; app ID `com.cultivanode.app`. Trademark filing with NIPO still to do.

## Website content, analytics and weather (added 2026-09-27)

| ID | Requirement | Database | Server logic | Web UI | Mobile UI | Tests | Status |
|---|---|---|---|---|---|---|---|
| REQ-WEB-010 | Home-page picture carousel managed by staff (EN/YO text, alt text, order, publish) | hero_slides, site-media bucket | admin_save/move/delete/set_hero_slide_published (site_content.manage, audited) | home hero, /admin/content | – | 09 | ✅ |
| REQ-ADM-010 | Admin analytics: sign-ups by channel, set-up completion, roles, states, verification, approvals, page views | page_view_daily | admin_analytics (analytics.read), track_page_view (path only) | /admin overview | – | 09 | ✅ |
| REQ-ADM-011 | Weather for pilot states with farm alerts | weather_cache; providers `weatherapi` (live) and `open_meteo` (test only) | `weather` Edge Function (analytics.read, 30-min cache), shared/weather.ts | /admin overview | later (farm weather, M3) | weather tests, 10_weather | ✅ admin only; free WeatherAPI plan gives 3 days, the plan promises 14 |
