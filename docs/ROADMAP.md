# Roadmap (Phase 1)

Revised 2026-09-28 to take in the independent MVP audit ("CultivaNode — Independent MVP Audit and Roadmap").
The master build plan's milestones M0–M7 and its 12 modules stay the Phase 1 scope. What changes is the order:
after M1, a four-week **MVP track, "first real jobs"**, pulls the hiring flow and the admin controls it needs
forward from M4, M5, M7 and module 12, and runs it without money. The rest of Phase 1 follows the MVP.

Requirement-level status: [`requirements-matrix.md`](requirements-matrix.md). Every MVP item there carries its week (W1–W4).

## Why the order changed

M0 and M1 built everything needed to become a trusted person on the platform (sign-in, roles, documents, ID
checks, approvals, agents). Nothing a verified person would come to *do* exists yet. The MVP proves the riskiest
assumption, that farmers and providers will transact through the platform, and it produces the trust data
(completed jobs, ratings, disputes) that escrow and credit depend on later.

**MVP definition.** A farmer can hire a verified machinery owner or service provider for a job at their farm,
and both sides and CultivaNode staff can see that the job was agreed, done, proven and confirmed. The MVP is
done when real jobs run through the platform, not when M1 is finished. Listing moderation, the bookings view,
dispute resolution and user suspension are MVP items.

**Payment boundary (confirmed 2026-10-02).** No money moves through CultivaNode in the MVP. A booking records the agreed
price in kobo; the farmer pays the provider directly (cash or transfer) and both mark the job paid. No
commission in the pilot, and the site says so. Escrow, ledger and commission start in M5 after the fintech
lawyer's sign-off. `PAYMENT_MODE` stays `test`. Paystack is registered in `integration_providers`
(kind `payment`, test mode, `implemented: false`) so the M5 adapter already has its configuration home; no charge
or escrow code ships before legal sign-off.

**Mobile.** The job flow is built once, as responsive web for Android Chrome (camera and GPS through the
browser). Native parity comes after the MVP, with offline sync (M7).

## Sequence

| # | Milestone | Master plan source | Status | Gate |
|---|---|---|---|---|
| 1 | M0 Foundations | M0 | ✅ done | – |
| 2 | M1 Website and identity | M1, modules 1–2 | ✅ done (leftovers listed below) | – |
| 3 | **MVP W1** Safe foundation, supply online | M1 leftovers, M4, module 12 | ✅ code done and live on the hosted project 2026-09-28 (marketplace switch still closed) | – |
| 4 | **MVP W2** Booking agreed | M4, M7 (notifications) | ✅ done: code 2026-09-29, verified live on the hosted project 2026-10-01 (migration, worker, Vault, cron) | W1 |
| 5 | **MVP W3** Job done, proven, confirmed | M4, M5 (disputes, no money) | 🟡 database live 2026-10-02; review fixes 2026-10-03; web job pages go live with the fix push (earlier builds failed); on-device pilot test pending | W2 |
| 6 | **MVP W4** Operable pilot | module 12, M5 (cancellation, no money), M7 (agents) | ⬜ | legal review of direct-payment terms |
| 7 | Closed beta: 5 providers, 10 farmers, one cluster | pilot plan step 4 | ⬜ | W4 |
| 8 | M5 Payments and escrow (money parts) | M5 | ⬜ | fintech lawyer, Paystack/Flutterwave accounts |
| 9 | M2 Farms and crop engine | M2, modules 3–4 | ⬜ | agronomist content |
| 10 | M3 Weather, inventory, farm books | M3, modules 5–6, 9 | ⬜ | M2; WeatherAPI plan with 14 days |
| 11 | M6 AI assistant | M6, module 10 | ⬜ | M2 content, knowledge base |
| 12 | M4 remainder: availability calendar, demand-nearby, tier 3 | M4 | ⬜ | booking history |
| 13 | M7 Hardening: native parity, offline sync, agent dashboard, push, load and security tests, Play Store | M7, modules 8, 11 | ⬜ | – |

Rows 8 and 9 wait on outside work (lawyer, agronomist), so both start collecting inputs now and are built in
whichever order their gate clears first. The master plan times the pilot for early-season planting
(March–April): the crop engine needs to be ready for that, so agronomist content collection starts in W1.

**Time.** Four weeks means four weeks of full-time-equivalent focus. Alongside 12-hour shifts, plan six to eight
calendar weeks and keep the week order. If time runs short, cut W4 hardening items before cutting W1–W3.

## The four MVP weeks

### W1 — Safe foundation and supply online

Status (2026-09-28): done. Migration `20260928164741_mvp_week1.sql` is applied on the hosted project and all five
Edge Functions are redeployed with the fail-closed check; suspension (auth ban + ending sessions) was smoke-tested there
and rolled back. Still to do by staff: open the marketplace switch for the beta cluster when providers are ready; keep
Termii and Prembly in live mode with working keys. The marketplace switch follows the state on each person's profile.

Goal: safe to invite real providers; an approved provider can publish a listing a farmer can find.

- Fail closed on test providers: refuse test-only providers unless `APP_ENV` is explicitly `development` or the Supabase URL is local; unit test.
- Hosted configuration (dashboard, no code): `APP_ENV=production`, live Termii and Prembly, Send SMS hook on, WeatherAPI key rotated, `id_hash_pepper` in Vault, `pg_cron` enabled.
- Website truth pass (EN and YO): remove the escrow and licensed-partner claim; label unbuilt features "coming soon"; FAQ and terms say payment is direct in the pilot.
- Unique index on verified ID fingerprints (closes the duplicate NIN/BVN race).
- Account suspension and flagging (`suspended_at` checked by RLS and functions, plus an auth ban), force sign-out, both audited.
- `feature_flags` kill switch: `marketplace_live`, optionally per pilot state.
- Admin: Users search (phone, name, organisation, roles, tier); queue counts and median approval time on the Overview; list and revoke agent codes and business staff memberships.
- Provider listing screens on `/account/listings`: create, edit, pause, rates by unit, service radius, pin.
- Farmer search: pick a farm, call `nearby_listings()`; distance, rates, verified badge. Fix the farm list so business farms show.
- Admin listing moderation: suspend and unsuspend, audited.
- Repo hygiene: delete the committed `.patch` file; README and matrix in line with the code.

Done when: a tier-2 approved machinery owner's tractor listing is found by a farmer 10 km away and not by one 60 km
away; a suspended listing or owner disappears from search and the owner is signed out and blocked; turning
`marketplace_live` off hides search; a fake NIN cannot verify on the hosted project; the Overview shows queue counts.

### W2 — Booking agreed

Status (2026-10-01): done and live. Migration `20260929090000_mvp_week2.sql` is applied on the hosted project,
`send-notifications` is deployed, `functions_base_url` is in Vault and both cron jobs (notification wake-up and
request expiry) are active; SMS was switched from the mock to live Twilio (SID, token and sender set in Admin ›
Integrations and Vault). pgTAP `12_mvp_week2` and worker tests `send-notifications.test.ts` cover the flow.
Decisions made while building: a request expires after 24 hours or at the end of the job day, whichever is sooner;
the switch is judged by the farmer's state; declining and cancelling stay possible when the marketplace is closed
(new requests and accepting do not); an agreed job can be called off by either side, with a reason, until the end of
the job day (windows and strikes come in W4); the provider sees the farm pin, directions and the farmer's phone only
while the job is agreed, and the farmer sees the provider's phone at the same point. Booking SMS carry no price,
reason or phone number. Yorùbá SMS and screen copy need native review.

Goal: a farmer and a provider agree a job through the platform, and each is told.

- `bookings` (farmer, provider, listing, farm, job date, unit, quantity, agreed price in kobo, status) and append-only `booking_events`.
- Transition functions `request_booking`, `accept_booking`, `decline_booking`, `cancel_booking`, each checking actor, status and time window; no UPDATE grant on status. All refuse suspended accounts and respect the kill switch.
- RLS: the two participants plus staff with a new `bookings.read` permission. The provider sees the farm location only after accepting.
- `notifications` table with RLS, an inbox page for each side, and booking SMS through the active SMS provider.
- `pg_cron` expires unanswered requests.
- pgTAP for every transition, including forged ones.

Done when: a farmer requests a job from search; the provider gets an SMS and accepts; the farmer sees "Accepted"
and gets an SMS; a third user cannot read the booking; a forged status change is refused by the database.

### W3 — Job done, proven, confirmed

Status (2026-10-02): code done and applied on the hosted project. Migrations `20261002094704_w3_enums.sql` (enum
values first, so they are usable in the same deploy) and `20261002095258_mvp_week3.sql` add the statuses
`in_progress`, `awaiting_confirmation`, `confirmed`, `disputed` and `completed`, the `booking_proofs` table, the
private `booking-proofs` bucket (participant-only policies), and the functions `check_in_booking`, `submit_proof`,
`finish_booking_work`, `confirm_booking`, `dispute_booking`, `mark_paid` and `rate_booking`, plus the
`cultivanode-autoconfirm-bookings` cron (every 15 minutes). Ratings feed the provider card, so the average and count
show in search. Paystack is registered in `integration_providers` in test mode with `implemented: false`. pgTAP
`13_mvp_week3` covers 97 assertions. Web job pages carry the whole flow (GPS check-in, EXIF-stripped proof upload,
confirm/dispute, mark-paid, rating form) and the search card shows the rating badge, in English and Yorùbá (Yorùbá
pending native review). Still to do: the real-phone pilot pass below.

Review (2026-10-03), fixed in `20261003185642_mvp_week3_fixes.sql` and the web/worker patch:
- Every Vercel build from the W3 web commits failed: `database.types.ts` was never regenerated, so the seven new RPCs
  did not type-check. The live site stayed on the W2 web build. Types regenerated from the hosted project.
- The two W3 migration files kept their local names while the hosted project recorded them as `20261002094704` and
  `20261002095258`; renamed so `supabase db push` and the GitHub deploy do not try to run them again.
- `13_mvp_week3` never ran: psql variables (`:'r1'`) are not substituted inside the `$$` strings pgTAP executes, so 86
  of 97 assertions died with a syntax error. Ids now come from a temporary table; all 97 pass.
- The W3 booking columns were not in the column-level read grant, so the parties could not read their own check-in
  time or confirm-by deadline. Granted (the check-in GPS point and the two payment amounts stay hidden).
- Booking SMS for the seven W3 events (checked in, proof ready, confirmed, disputed, payment marked, mismatch,
  completed) would all have failed as `bad_message`: the worker only knew the W2 wording. EN/YO wording added.
- The provider card returned `{"avg": null, "count": 0}` instead of no rating; the admin acceptance rate counted later
  stages as not accepted; the W1 card test failed. Fixed.
- Job pages had no loading or error state (a W3 requirement); added for the bookings section.
- Not changed: the proof upload policy still allows uploads from acceptance (not only after check-in); the hosted
  project does not take storage policy changes through the connector. The app only offers uploads after check-in.
- Gap against the plan: `dispute_booking` takes a reason but the farmer cannot attach evidence photos yet (only the
  provider uploads). Moved to W4 with dispute resolution.

Decided 2026-10-03 (Quadri: follow the master plan), built in `20261003200000_mvp_week3_plan_rules.sql`, pgTAP
`14_mvp_plan_rules` (40 assertions):
1. Disputes: the farmer or the provider opens one while the job runs or within the 48 hours after the proof upload
   (the farmer also for a no-show), choosing job not done, poor quality, wrong area, damage or no-show, with optional
   details; both sides add evidence photos (EXIF stripped, up to 10 each) while it is open. Resolution: W4.
2. Ratings only on completed, paid jobs (both sides marked the same amount).
3. Before and after photos must carry GPS inside the farm: within 100 m of the mapped boundary, or 1 km of the pin when
   the farm has no boundary. Uploads are allowed only after check-in.
4. Booking needs verification tier 1 (NIN). Until the Prembly wallet is topped up, no farmer can reach tier 1, so no new
   bookings can be made.

Goal: the job is carried out and closed with evidence; both sides rate each other.

- `check_in_booking`: provider only, on the job day, browser GPS within a set distance of the farm pin (PostGIS).
- Private `booking-proofs` bucket (`booking_id/uid/…`), EXIF stripped on upload, GPS and time stored per photo by `submit_proof`.
- `confirm_booking` or `dispute_booking` (reason, evidence) by the farmer within 48 hours; `pg_cron` auto-confirms after 48 hours of silence.
- `mark_paid` by each side (no money handled); a mismatch flags the booking for staff.
- Ratings: one per side per booking, only after confirmation, 1–5 plus tags; the provider's average shows in search.
- Job pages for each side with loading, empty and error states.

Done when: on a real Android phone a provider checks in and uploads two photos; the farmer confirms, marks paid and
rates; the rating shows in the next search; check-in from 5 km away is refused; a silent job auto-confirms after 48 hours.

### W4 — Operable pilot

Goal: staff can run a small real pilot without a developer.

- Admin bookings list and detail (timeline, proofs by signed link, notes).
- Dispute resolution with a written outcome, audit entry and both parties notified.
- Cancellation rules without money (windows, provider strikes, free weather reschedule) as data in a settings table.
- Field agent books on behalf of a farmer they onboarded.
- Identity-check attempt limit counts provider calls, not only stored results.
- Yorùbá copy for all new screens (native review); low-end Android over 3G pass (tap targets, photo compression, offline errors).
- Pilot runbook: agent onboarding script, dispute playbook, how to suspend, low-balance checks for Prembly, Termii and WeatherAPI.
- Sentry DSN set; alerts on booking-function errors.

Done when: in one cluster at least five real jobs run end to end, one test dispute is resolved by staff in the
admin console, and every booking is traceable there.

## What moved where

| Master plan item | Was | Now |
|---|---|---|
| Listings UI, search UI (REQ-MKT-001/002) | M4 | MVP W1 |
| Booking state machine (REQ-MKT-004) | M4 | MVP W2 |
| Proof of work, ratings (REQ-MKT-005/006) | M4 | MVP W3 |
| Disputes with evidence and audited outcomes (REQ-PAY-006) | M5 | MVP W3–W4, without money |
| Cancellation rules (REQ-PAY-005) | M5 | MVP W4 without money; refunds stay M5 |
| Booking notifications: in-app and SMS (part of REQ-NOTIF-001) | M7 | MVP W2; push and preferences stay M7 |
| Field-agent booking on behalf (part of REQ-AGT-002) | M7 | MVP W4; agent dashboard and visits stay M7 |
| Admin: suspension, bookings, disputes, listing moderation (module 12) | M5–M7 | MVP W1–W4 |
| Duplicate NIN/BVN protection (part of REQ-FRAUD-001) | M5 | MVP W1 |
| Farm weather per farm (REQ-WX-001) | M3 | M3 (optional MVP hardening, needs a 14-day plan) |
| Availability calendar, demand-nearby (REQ-MKT-003/007) | M4 | after the MVP |
| Escrow, ledger, commission, payouts (REQ-PAY-001–004) | M5 | after the MVP and legal sign-off |

## In parallel, outside the code (start now)

- Agronomist content for the 15 crop templates and published standards (gate for M2).
- Fintech lawyer consultation on escrow and payouts (gate for M5); legal review of privacy, terms and the direct-payment pilot terms (gate for W4 beta).
- Recruit and approve supply first: tractor owners, operators, sprayers and farm hands in the beta cluster.
- CAC registration and NIPO filing for CultivaNode; native Yorùbá review.
