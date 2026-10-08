# CultivaNode — Integrated Build Plan

**Planning baseline:** 6 October 2026 · **Status:** proposed execution plan · **Scope:** Phase 1 completion through a safe, measurable pilot and the next production foundations.

This plan is the execution companion to the original M0–M7 master plan. It reconciles that plan with the repository as it exists on 6 October 2026, where the codebase has progressed beyond several status documents. It does **not** treat a feature as live merely because its component, migration, or shared engine exists in the repository.

## 1. Product archaeology: what CultivaNode is building

### Mission

CultivaNode is building **connected intelligence for agriculture**: a trusted working partner for farmers, service providers, field agents, and operations staff. It starts in South-West Nigeria with the practical work that must happen before more ambitious products are useful: trustworthy identities, farms, service jobs, and reliable records.

### Vision

The long-term vision is connected farming infrastructure for Africa. A farmer should be able to manage a farm, find vetted help, record work and inputs, receive grounded advice, and eventually use appropriate financial services without surrendering control of farm data.

### Near-term product promise

In the pilot, a farmer can find a verified provider, agree a service job, see evidence of work, confirm the outcome, and leave a rating. CultivaNode records the agreed price but does **not** move money in the pilot: the farmer pays the provider directly. This boundary is important for legal safety, honest website copy, and operational focus.

### Strategic objectives

| Objective | Product evidence | Primary measure |
|---|---|---|
| Establish trust before transactions | Phone OTP, identity tiers, role approval, provider moderation, account suspension, audit logs | Verified provider activation; identity-fraud rate; approval turnaround |
| Make real farm-service jobs succeed | Listings, nearby search, bookings, GPS check-in, proof, confirmation, ratings, staff resolution | Completed jobs; completion rate; dispute rate; repeat booking rate |
| Become the farmer’s operational system | Farms, fields/plots, crop cycles, operations, inputs, harvests, records, farm books | Weekly active farms; operations recorded on time; farm-record completeness |
| Improve decisions without inventing agronomy | Deterministic planning/calculators now; approved standards and grounded AI later | Advice acceptance; unsafe recommendation rate = 0; agronomist approval coverage |
| Work under real field conditions | Android-first responsive web, large touch targets, low-bandwidth behaviour, agents, English and Yorùbá | Task completion on low-end Android/3G; agent-assisted completion; language QA pass |
| Protect people and the business | RLS, masked identity values, consent, auditability, direct-payment boundary, provider adapters | Security-test pass rate; PII exposure incidents = 0; reconciliation accuracy |

## 2. Current-state assessment

### What is established

- The monorepo is a sound base: Next.js web app, Expo mobile app, shared TypeScript package, Supabase/PostGIS, Edge Functions, generated database types, CI, and shared design tokens.
- The public website, phone-first onboarding, roles, identity flow, business memberships, field-agent onboarding, permission-based admin, consent/privacy requests, and integration management are implemented.
- Marketplace W1 and W2 are implemented in the checked-out code: provider listings, nearby search, marketplace switch, moderation, booking transitions, inbox, and SMS queue/worker.
- Marketplace W3 has the required technical building blocks: check-in, private proof storage, confirmation/dispute/marked-paid states, ratings, booking pages, database tests, and the auto-confirm worker. A real-device pilot pass remains a release gate.
- Recent 6 October changes add real persistence/UI for farm enterprise records and crop cycles: fields/plots, crop operations, scouting, measurements, inputs, harvests, alerts, livestock, workers, inventory, financial records, and farm records.
- The repository type-checks and its automated TypeScript test suite passes at this baseline: 23 test files and 248 tests.

### What is not yet proven or should not be called complete

| Area | Why it is not yet a production claim | Required next action |
|---|---|---|
| W3 job flow | The roadmap records a real-phone pilot as outstanding. | Run and record end-to-end provider/farmer tests on real Android devices, including GPS, camera, upload, SMS, auto-confirm, and dispute paths. |
| W4 operability | Admin booking/dispute views exist in recent code, but the original W4 acceptance gate is not documented as complete. | Finish evidence/outcome workflow, cancellation policy, agent booking, support runbooks, alerts, and pilot rehearsal. |
| Crop and agronomy programme | The new crop-cycle schema stores `crop_id`/`variety_id` as text and the catalogue/templates are shared-code data. That conflicts with the master-plan rule that agronomy content must be approved, versioned database records. | Build the controlled catalogue, varieties, standards, and approval/version workflow before presenting advice as agronomist-approved. |
| AI assistant | The UI and deterministic grounding/guardrail engine exist, but no approved knowledge base, provider adapter, evaluation corpus, or production answer audit trail is evident. | Treat AI as an internal/pre-production assistant until the M6 gate is completed. |
| Ledger/escrow | The shared ledger/escrow engine is tested domain code, not a regulated payment implementation: the planned tables, verified webhooks, provider adapter, and legal approval are absent. | Keep direct payment as the only live model; do not expose escrow or wallet language. |
| Offline capability | The mobile app includes early sync utilities and crop screens, but the documented offline-first system and deterministic conflict rules are not released. | Run an M7 offline spike and field validation before promising offline use. |
| Remote production status | Local migration files and documentation describe hosted deployment, but remote state was not independently inspected in this review. | Reconcile remote migrations, functions, cron, storage policies, auth, provider modes, and secrets with the connected Supabase project. |

### Documentation drift to resolve first

`ROADMAP.md`, `requirements-matrix.md`, `ARCHITECTURE.md`, `DATABASE.md`, `AGRONOMY_ENGINE.md`, `AI.md`, `PAYMENTS.md`, and `OFFLINE_SYNC.md` have material status differences from the 6 October implementation. The first deliverable of this plan is one status ledger that separates **designed**, **coded**, **migrated**, **deployed**, **device-tested**, and **pilot-proven**. No marketing or user-facing copy should use a stronger status than the ledger permits.

### Hosted-project verification — 6 October 2026

The connected production project is healthy and its schema is current through the 6 October `crop_management` and `farm_enterprise_subsections` migrations. The expected Edge Functions are active, the booking expiry/SMS wake-up/auto-confirm cron jobs are active, and the proof and verification buckets are private. This is a strong technical base, but the live configuration creates immediate P0 work:

| Finding | Planning consequence |
|---|---|
| `marketplace_live` is enabled for Oyo, Ogun, Osun, Ondo, Ekiti, and Lagos. | Treat the marketplace as externally reachable now, not as a closed pre-pilot environment. Do not invite or market to real users until the configuration and readiness gates below are resolved. |
| Active SMS and identity providers are `mock_sms` and `mock_identity`. | This contradicts the earlier “live provider” documentation. Before accepting real users, either close the marketplace or configure, test, and evidence the approved live providers; otherwise sign-in/verification trust cannot be assumed. |
| The database has three profiles, no bookings/proofs/ratings, two crop cycles, and two inventory records. | There is no evidence of a completed job pilot yet. Preserve this as a pre-pilot baseline; do not use it to infer field success. |
| Supabase reports nine anonymous-callable `SECURITY DEFINER` functions, including farm/cycle helper RPCs; it also reports 70 signed-in callable definer functions. | Public contact/waitlist/page-view functions are intentional only if rate-limited. Farm/cycle helpers must be triaged and restricted to the minimum required role, or moved to the private schema. Verify every definer function has fixed `search_path`, explicit grants, and an authorization check. |
| Several new farm-enterprise policies use the `public` role and duplicate permissive `SELECT`/`ALL` policies. | Replace them with least-privilege `TO authenticated` policies, combine duplicate policies, revoke unintended `anon` access, and prove anonymous reads/writes are denied. |
| Nine server-oriented tables have RLS with no policies. | This may be correct only if their table grants are also absent. Explicitly revoke Data API access to server-only tables and add a regression check for every one. |

Supabase will enforce explicit Data API exposure for existing projects on **30 October 2026**. P0 must therefore make application grants explicit for browser-accessed tables/RPCs and make server-only access explicit for all other objects; it cannot rely on historical default exposure.

## 3. Product and UI principles

These are mandatory across the public site, account workspace, mobile app, and admin console.

1. **Show the next useful farm action.** Lead each workspace with what needs attention today—an unaccepted job, a crop task, a weather risk, a missing verification step—not a generic feature directory.
2. **Put field reality before visual novelty.** Pages must stay understandable in sunlight, on small Android screens, with intermittent connectivity, and for people moving between a field and a phone.
3. **Use progressive disclosure.** A farmer should not see operational, financial, and admin complexity before it is needed. Start simple; make advanced data and configuration explicit secondary paths.
4. **Make trust visible and specific.** Use plain labels such as “NIN verified”, “direct payment in this pilot”, “proof uploaded”, and “staff decision recorded”. Never imply escrow, insurance, partner status, or AI certainty that does not exist.
5. **Use one coherent design language.** Preserve the deep green/node cyan/cream system, Plus Jakarta Sans, 16px minimum body copy, 48px minimum touch targets, high contrast, and full Yorùbá diacritics. Replace decorative emoji used as primary account navigation with the existing purposeful SVG icon style.
6. **Design every state.** Each async screen needs loading, empty, offline, error, permission-denied, and success states. A blank dashboard is not a valid experience.
7. **Keep language and data safe.** English and Yorùbá launch together for core pilot journeys; strings are never embedded ad hoc in a component. Numbers use local currency/date formats and sensitive values remain masked.
8. **Measure before adding.** Every significant action has a privacy-preserving event definition and success metric. Do not add a dashboard chart unless it changes an operational decision.

### Public website UI direction

The public website should work as a clear field-ready onboarding and trust surface, rather than a catalogue of future ambitions.

- Make the hero promise one outcome: **manage the farm, find verified help, and keep work visible**. Give two equal, explicit entries: “I farm” and “I provide services”. Keep the agent route available but secondary.
- Keep the pilot statement immediately near primary calls to action: selected geography, no platform commission in the pilot, and direct farmer-to-provider payment. Link to concise terms rather than overloading the hero.
- Organise homepage proof around three short scenes: *Plan the work*, *Hire verified help*, *Keep farm records*. Only use consented, compressed real farm images; otherwise retain the existing lightweight illustrated scenes. Do not claim IoT, protected payments, or AI diagnosis as present capability.
- Reduce top-level navigation on mobile to the audience paths and trust/help essentials. Secondary material belongs in the footer or contextual page menus.
- Turn long form pages into short, progressive forms: phone first, farm/role next, optional detail later. Show time expectation and save/resume where a journey is longer than one screen.
- Give the authenticated workspace a persistent action rail: **Today**, **My farm**, **Jobs**, **Records**, and **Help**. The role switcher changes the content and language of those areas; it should not create three unrelated products.
- Use maps, timelines, proofs, and status chips to communicate operational truth. Do not rely on colour alone for job/crop severity or completion.

## 4. Delivery model and non-negotiable gates

The plan assumes a small cross-functional team and uses full-time-equivalent (FTE) weeks. Run the tracks in order where a safety gate exists; run documentation, content preparation, research, and provider/legal preparation in parallel.

```
P0 Truth & release baseline
            └─> P1 Pilot-operable W4
                     └─> P2 Closed beta / product evidence
                     ├─> P3 Farm Operating System hardening
                     │       └─> P4 Offline + native field parity
                     └─> P5 Grounded AI
                               └─> P6 Regulated payments (legal gate)
                                          └─> P7 Scale and expansion
```

| Gate | Required evidence | Cannot be bypassed by |
|---|---|---|
| Pilot activation | Marketplace switch remains closed until provider supply, live SMS/identity checks, legal direct-payment terms, and staff runbook are signed off. | A polished landing page or passing unit tests. |
| Payment activation | Written fintech/legal approval, provider agreements, verified webhooks, ledger reconciliation, incident handling, and test/live separation. | The existence of a local ledger engine. |
| Agronomy recommendation | Versioned, approved crop standard and calculation trace. | Model output or hard-coded template alone. |
| AI public launch | Grounded approved sources, eval results, safety review, explanation/source display, and escalation route. | A functioning chat interface. |
| Offline claim | Deterministic sync behaviour proven on low-end Android with conflicts, data loss, and reconnect tests. | Local caching or a happy-path simulator. |

## 5. Phase P0 — product truth, release baseline, and operating controls (1–2 FTE weeks)

**Outcome:** one reliable source of truth and a releasable baseline before further scope expands.

### P0.1 Reconcile code, database, and environment

1. Build a status register for every requirement: design, code, migration, remote migration, deployed UI/function, automated test, device test, and pilot proof.
2. Record the hosted-project evidence already inspected: migration history; active Edge Functions; booking cron jobs; storage bucket privacy; feature flags; active provider mode; current record counts; and advisor findings. Re-run it before every pilot expansion.
3. Compare generated `database.types.ts` with the remote schema and regenerate after any repair.
4. Treat the current marketplace/live-mock mismatch as a release blocker. The operational owner must either close the marketplace or configure and test approved live SMS/identity providers before public pilot recruitment.
5. Perform a dedicated Data API/RLS remediation review: explicit `GRANT`/`REVOKE` matrix; anonymous RPC allow-list; `SECURITY DEFINER` authorization/search-path review; `TO authenticated` farm-enterprise policies; and tests proving anonymous denial. Complete this before storing more farm/worker/financial data.
6. Run the complete release checks: typecheck, lint, unit tests, local `supabase test db`, web production build, and a preview smoke test. Treat database-test failures as release blockers.
7. Check Vercel production/preview build history and GitHub Actions results. Establish a release checklist and a rollback procedure for web, migration, and Edge Function deployments.

### P0.2 Restore document authority

1. Update architecture, database, roadmap, requirements matrix, AI, agronomy, payments, and offline documents to the reconciled statuses.
2. Keep this plan as the cross-milestone plan; keep the requirements matrix as the requirement-level source of truth; keep a short weekly delivery log for evidence and decisions.
3. Archive generated patch bundles outside the active repository history or release assets after verifying the source commits contain all changes. Do not let patch files become a competing source of truth.
4. Mark any prototype engine behind a “not a live capability” boundary until its associated database, security, and operational gate is complete.

### P0.3 Establish product instrumentation

Define a privacy-safe event taxonomy before adding new flows:

- acquisition: audience selected, waitlist/contact submitted, sign-up started/completed;
- activation: onboarding complete, role approved, verification started/completed, farm added, listing published;
- marketplace: search, booking requested/accepted/cancelled, check-in, proof uploaded, confirmed/disputed, marked paid, rated;
- farm operations: crop plan started, operation completed, observation logged, input applied, harvest logged, report printed;
- reliability: upload retry, offline queue, sync conflict, Edge Function/worker failure.

Each event must document purpose, fields, retention, owner, dashboard, and whether it contains personal data. No phone, ID number, exact farm coordinate, message body, or secret belongs in analytics.

### P0 exit criteria

- Reconciled status register is approved by product, engineering, and operations.
- Production state has been inspected; the marketplace/provider mismatch is resolved; and any migration/schema drift is resolved.
- Anonymous Data API/RPC access is reduced to an approved allow-list, server-only tables have no client grant, and the new farm-enterprise policies have least-privilege coverage tests.
- Web production build, TypeScript tests, lint, and database suite are green; the release checklist is exercised once.
- The public site and pilot terms say only what the product can presently deliver.

## 6. Phase P1 — make the pilot operable (W4 completion, 2 FTE weeks)

**Outcome:** staff can support a real, small cluster without a developer intervening.

### Workstream A — job administration and disputes

1. Make the booking console the operational source of truth: filterable jobs list, job detail timeline, participants, farm/service context, current payment-mark state, GPS/check-in state, proof count, rating state, and staff notes.
2. Complete private proof/evidence viewing through short-lived signed URLs. Record every staff access to sensitive evidence.
3. Complete dispute handling as a state machine: opened → evidence collection → staff review → decision/outcome → parties notified → closed. Require structured reason, decision, remedy, staff note, actor, and audit entry.
4. Define whether an outcome affects provider strikes, listing moderation, ratings, and future trusted-tier eligibility. Implement those consequences in the database, not only in UI code.
5. Add clear farmer/provider copy for no-show, poor work, wrong location/area, damage, and evidence deadlines. Both parties must see the same timeline but only data they are permitted to see.

### Workstream B — cancellation and field-agent operations

1. Store cancellation windows, weather reschedule rules, and provider-strike thresholds in versioned configuration data. Start with no-money rules; do not invent refunds before P6.
2. Allow an eligible field agent to request a booking only for a farmer they onboarded, with farmer confirmation, provenance, and audit logging.
3. Add agent task lists: pending farmer verification, incomplete farm profile, upcoming assisted booking, and follow-up due. Do not add a broad CRM yet.
4. Fix identity attempt limiting so every chargeable provider call counts, including failed provider calls; expose a safe support message and an internal health metric.

### Workstream C — experience and operations readiness

1. Conduct a task-based review on three low-end Android devices over constrained 3G: sign in, provider listing, farm selection, booking request, acceptance, GPS check-in, two-photo proof upload, confirmation, dispute, and admin resolution.
2. Add resilient image handling: client-side compression/orientation correction, EXIF stripping, upload progress, retry/resume, size/type guidance, and an accessible “proof received” state.
3. Complete Yorùbá review by a native reviewer for all job and support flows. Log unresolved wording rather than shipping guessed translations.
4. Configure Sentry/operational alerts for booking state-change failures, proof upload failures, SMS queue growth, SMS provider errors, cron/worker failures, and identity provider failures. Alerts must name an owner and runbook.
5. Publish internal runbooks: onboarding a farmer/provider; inviting a cluster; approving identity/roles; suspending an account; handling a dispute; handling low SMS/identity/weather credit; rolling back a release; and responding to a privacy request.

### P1 acceptance test

Run a supervised dry run followed by a live controlled pilot:

- at least five providers and ten farmers have been onboarded in one named pilot cluster;
- a provider listing is found by an eligible nearby farmer;
- a job passes request → accept → check-in → proof → confirm → mark-paid → rate;
- a GPS-outside-farm attempt and a forged state change are rejected;
- one dispute is opened, has evidence reviewed, is resolved by staff, and both parties are notified;
- every action can be reconstructed from booking events, staff audit, and evidence access records;
- support staff can finish the scenario without engineering help.

## 7. Phase P2 — closed beta and evidence loop (4 FTE weeks)

**Outcome:** turn the pilot into measured evidence before expanding geography or launching financial features.

### Product scope

- Keep one or two focused clusters; grow only when supply quality and operations capacity remain healthy.
- Add provider availability and blackout dates, listing photos, clear service-area explanation, and basic demand-nearby insights that aggregate farmer demand without exposing a farmer’s location.
- Implement the trusted provider tier only after the policy is agreed: verified tier-2 identity, completed-job threshold, rating threshold, upheld-dispute rule, and CAC rule for businesses. Make the rule explainable on the profile.
- Improve booking conversion: saved farm context, repeat booking, reference price explanation, cancellation explanation, and service/job templates.

### UI and research loop

1. Test five top tasks with farmers, providers, agents, and staff every two weeks. Measure time, error points, completion, confidence, and exact words users use.
2. Prioritise changes in this order: task failure, trust confusion, slow/failed upload, unreadable mobile layout, translation issue, then visual polish.
3. Keep each role workspace focused:
   - **Farmer:** today’s tasks, farm condition, upcoming jobs, current crop cycle, records.
   - **Provider:** requests requiring a response, today’s route/jobs, proof tasks, earnings history labelled as direct-payment records only.
   - **Agent:** people needing help, assisted bookings, follow-ups, cluster health.
   - **Admin:** exceptions, queues, service health, evidence, audit.
4. Add empty-state education that contains one next action, not a product tour. For example, an empty crop page guides “add a field/plot” before “create a crop cycle”.

### Metrics and decision point

Review after four weeks of live use:

| Metric | Decision use |
|---|---|
| Verified provider supply, searchable listings, and provider response time | Whether there is enough supply to expand the cluster |
| Booking request-to-accept and accept-to-complete conversion | Whether the service flow solves a real demand problem |
| Check-in/proof completion and upload failure rate | Whether field UX/infrastructure is reliable enough |
| Disputes per completed job and resolution time | Whether trust/quality operations can scale |
| Repeat bookings and 30-day active farmers | Whether the marketplace creates recurring value |
| Agent-assisted versus self-serve completion | Where the product must stay assisted |

**P2 exit:** proceed to wider beta only if completion, dispute resolution, support burden, and consented user feedback meet thresholds agreed at P0. Otherwise fix the failing stage before adding geography or features.

## 8. Phase P3 — harden the Farm Operating System (6–8 FTE weeks)

**Outcome:** the farm-management functionality becomes an authoritative, agronomist-governed operational record rather than a collection of screens and hard-coded templates.

### P3.1 Controlled agronomy data model

1. Add database records for crop catalogue, varieties, seasonal/zone templates, growth stages, operations, published standards, approved products, product safety facts, sources, versions, status, approver, and effective dates.
2. Migrate shared-code catalogue/template data into a seed/import pipeline that creates reviewed records. Retain the shared deterministic algorithms, but pass them approved data and persist the input/version used.
3. Build an agronomist editor workflow: draft → review → approved → published → superseded. A published record cannot be overwritten; corrections create a new version.
4. Implement farm-zone data import and governance. Until a vetted zone map is loaded, make manual selection/correction explicit and show confidence/source.
5. Add a calculation trace to every generated plan: crop/variety, farm/plot, zone, season, template/standard version, planned date, assumptions, and reviewer.

### P3.2 Crop and farm workflows

1. Complete a plot-first planning journey: farm → field/plot → crop/variety → season → targets/budget → reviewed operation schedule → daily completion/logging → harvest → gross margin.
2. Make planned versus actual visible at each level: hectares, operations due/overdue, costs, inputs, harvest quantity, yield, and margin. State that farm books are records, not audited accounts.
3. Add inventory as immutable stock movements, not only a current quantity. Prevent negative stock server-side, link input applications to stock withdrawals, and show reorder/risk prompts.
4. Add weather cells, 14-day forecast capability, monthly outlook, and crop-aware alerts. Do not present a three-day free-provider forecast as a 14-day promise.
5. Use the booking system from crop operations where an external service is needed, so scheduled farm work and marketplace work share a traceable relationship.
6. Produce printable/exportable farm reports only after validating date ranges, totals, locale, data access, and a clear “generated on” timestamp.

### P3.3 Acceptance gates

- A maize and a tomato planting in each relevant zone generate a reviewed, traceable schedule.
- A farmer can record a crop operation, input application, scouting finding, harvest, and expense and see accurate roll-ups.
- Inventory cannot go negative under concurrent edits.
- Every recommendation shows the source and version; no unapproved product/rate can be offered.
- An agronomist can publish a change without code deployment and prior plans retain their original version trace.

## 9. Phase P4 — field reliability, offline, and native parity (5–6 FTE weeks)

**Outcome:** field-recording workflows tolerate poor networks without ever presenting financial or trust-critical actions as completed when they are not.

### P4.1 Offline architecture spike (first 1–2 weeks)

1. Compare PowerSync and WatermelonDB using a representative low-end Android device, backgrounding, limited storage, airplane mode, large photo queues, and reconnect conflict tests.
2. Choose one solution and write table-by-table sync contracts before implementation: local ID, server ID, sync state, device ID, timestamps, ownership, validation, conflict policy, and user-visible recovery.
3. Start with farms, plots, crop cycles, operation logs, observations, inventory records, and field-agent visit records. Exclude payment, identity verification, role approval, and booking confirmation from offline completion claims.

### P4.2 Mobile delivery

1. Bring the Android app to feature parity for the high-frequency field tasks: crop operation completion, scouting/photo evidence, input application, harvest, essential farm records, and agent-assisted onboarding.
2. Keep the responsive web job flow available until native booking/check-in/proof reaches the same security and device-test gates.
3. Add device observability: app version, sync health, crash-free sessions, upload queue age, and consented performance telemetry with PII redaction.
4. Test offline create/update/delete conflicts, account suspension while offline, an expired booking, duplicate submissions, and camera/GPS permission denial.

### P4 exit criteria

- The agreed offline records sync deterministically after a multi-day disconnect.
- Users can see queued, uploading, synced, rejected, and conflict states without ambiguity.
- No financial, confirmation, verification, or administrative action is falsely shown as final while offline.
- Android release candidate has manual exploratory testing, automated smoke tests, privacy disclosures, signing/release process, and Play Store readiness checklist.

## 10. Phase P5 — grounded AI assistant (4–6 FTE weeks after P3 content gate)

**Outcome:** a bounded, source-backed assistant that supports—not replaces—agronomic judgement.

### Build sequence

1. Define approved knowledge objects and ingestion: title, source, crop, zone, season, type, version, approval status, effective date, owner, and review deadline.
2. Implement retrieval over approved documents only. Keep the LLM provider behind an adapter; do not expose a provider key to web/mobile clients.
3. Pass only minimum necessary farm context: crop, variety, zone, season, stage, planting date, approved standard, and relevant logged observations. Redact/avoid identity and exact location data.
4. Separate in the response UI: approved-source answer, deterministic calculation, uncertainty/unknowns, and escalation suggestion. Always show source title/version and the date it was reviewed.
5. Enforce product/chemical guardrails: recommendations may only use an approved product record with rate, unit, pre-harvest interval, re-entry interval, and safety warning. The model must never generate a dose itself.
6. Launch English text chat first, then Yorùbá/Pidgin only after native-language evaluation. Add photo diagnosis after an independently evaluated image pathway with confidence and agronomist escalation.
7. Build an evaluation set of at least 100 agronomy questions, including unsafe, ambiguous, off-topic, prompt-injection, out-of-zone, and missing-context cases. Review results with an agronomist and record release criteria.

### P5 exit criteria

- 100-question evaluation meets agreed groundedness, safety, language, and escalation thresholds.
- Every user-visible answer contains its source/version or clearly says it lacks enough approved information.
- Unsafe chemical advice, ungrounded diagnosis, and unsupported financial/legal advice fail closed.
- Users can report a poor answer; staff can trace response, retrieved sources, and model/version without retaining prohibited personal data.

## 11. Phase P6 — regulated payments and escrow (6–8 FTE weeks, legal gate required)

**Outcome:** only after legal and operational approval, introduce partner-held protected payments with auditability and reconciliations.

### Prerequisites

- Written fintech/legal advice on the exact money flow, licences/partner responsibilities, terms, tax, consumer treatment, chargebacks/refunds, data processing, and dispute handling.
- Executed provider account/contracts and operations ownership for payout exceptions and incident response.
- Pilot evidence that the job/dispute flow is stable enough to protect funds.

### Build sequence

1. Create a reviewed migration for `ledger_accounts`, immutable `journal_entries`, `journal_postings`, payment intents/events, escrow states, payouts, refunds, settlement references, and reconciliation records. Test and live data must be physically/logically separated.
2. Make the double-entry ledger database-enforced: each journal balances; corrections are reversing entries; posting is service-controlled; rows are append-only; cryptographic chaining is independently verifiable.
3. Implement Paystack/Flutterwave adapter behind the existing integrations pattern, with configuration/keys in Vault, test mode first, provider health logging, and no credentials in clients.
4. Verify webhook signature, event identity, intended object, amount/currency, and state transition. Store raw event safely, process idempotently, update payment and ledger in one transaction, and reject client redirects as proof of payment.
5. Connect escrow release to the existing booking/dispute state machine. A dispute freezes release; decisions create documented release/refund/reversal actions.
6. Reconcile daily against provider settlement records; expose exception queues, not a misleading “wallet balance”. Call provider money “earnings” until the legal model explicitly permits another term.
7. Run test-mode simulation and failure drills: duplicate webhook, delayed webhook, wrong signature, partial failure, provider outage, cancellation, dispute, payout failure, manual correction, and reconciliation mismatch.

### P6 acceptance

- At least 50 automated test bookings reconcile end-to-end, including retries and reversals.
- Independent reviewer validates journal balance, hash chain, idempotency, and test/live separation.
- Staff can resolve a payout/reconciliation exception from documented procedures.
- Legal sign-off and user terms are published before any live-money feature flag is enabled.

## 12. Phase P7 — scale, security, and expansion (ongoing after the first market is stable)

1. Move Supabase to a plan with backup/PITR and write/verify recovery objectives; regularly restore into a non-production environment.
2. Run authenticated RLS/function security review, dependency updates, secret rotation, threat modelling for identity/proof/payment flows, and external penetration testing before major scale or payments.
3. Add load tests for public forms, auth/SMS, search, booking transitions, proof upload, workers, and webhook processing; define performance budgets for 3G and small Android devices.
4. Build operational dashboards from the event taxonomy: supply/demand, job health, dispute SLA, provider/integration health, crop record use, offline sync health, and privacy requests.
5. Expand location/crops only with locally reviewed agronomy content, sufficient providers/agents, local terms/support, and measured pilot success. New states are product launches, not merely a geography toggle.
6. Prepare Play Store release only after the Android app’s field tasks, privacy disclosure, support process, signing, testing, and crash/ANR targets are satisfied.

## 13. Team lanes and weekly operating rhythm

| Lane | Accountable work | Weekly artefact |
|---|---|---|
| Product & field operations | Pilot cohort, support scripts, policy decisions, user research, metrics review | Risk/decision log and cohort health report |
| Web/mobile product engineering | User flows, responsive UI, localisation, instrumentation, accessibility | Demo against acceptance scenarios |
| Platform/Supabase engineering | Migrations, RLS, functions, workers, storage, type generation, provider integration | Migration/test/release evidence |
| Agronomy/content | Catalogue, standards, products, source governance, language review | Approved content/version register |
| Security/legal/finance | Privacy, terms, identity, payment design, access review, incident readiness | Gate sign-off or explicit blocker |

**Weekly cadence:** Monday scope/risk review; daily engineering sync; mid-week device/field test; Thursday release-candidate review; Friday evidence review and decision log. A story is not “done” until its database/security, UI states, translation, tests, telemetry, documentation, and operating owner are complete.

## 14. Definition of done for every delivery

- Product owner has a written acceptance scenario and metric.
- UI is responsive, keyboard-accessible, readable in high contrast, has 48px touch targets, and uses Plus Jakarta Sans for Yorùbá.
- Loading, empty, error, permission-denied, offline, and success states are designed and translated.
- New data has a migration, constraints, indexes, RLS, least-privilege grants, audit requirement, retention decision, and generated TypeScript types.
- Business rules that protect trust, payments, identity, or role permissions live in the database/server boundary, not in a client component.
- Tests include the happy path, authorisation/RLS, invalid transition, concurrency/idempotency where relevant, and regression coverage. High-risk changes also have a real-device/manual test record.
- Analytics contains only approved non-sensitive fields; logging/redaction and alerts are verified.
- Documentation and the status register are updated in the same change.

## 15. Priority decisions to make at P0

1. Name the first pilot cluster, its maximum farmer/provider capacity, and the operations owner.
2. Approve the exact W4 dispute remedies and cancellation/strike policy for a direct-payment pilot.
3. Decide whether crop/farm operations remain in a controlled beta behind a feature flag while their agronomy data model is made authoritative.
4. Assign an agronomist/editor owner and source budget for the first crop/zone standards.
5. Approve a Supabase production reliability plan: paid tier/backup timing, remote-state access, secret ownership, and release authority.
6. Start the fintech legal review now, but explicitly defer any live-money build/deployment until P6 prerequisites are met.

## 16. First two sprints, in implementation order

### Sprint 1 — truth and pilot release candidate

1. Inspect remote Supabase/Vercel/GitHub release state and create the status register.
2. Fix any migration/type/policy drift; run full local and hosted release verification.
3. Complete job console proof viewing, staff notes, and the dispute decision/audit/notification path.
4. Implement configuration-backed cancellation/weather-reschedule/strike rules.
5. Make agent-assisted booking enforce farmer relationship and confirmation.
6. Add alerting and runbooks; complete English/Yorùbá UI review.
7. Execute the device test matrix and record defects.

### Sprint 2 — controlled jobs and evidence

1. Prepare/approve providers, farmers, agents, and pilot communications.
2. Run a dry booking/dispute exercise with staff.
3. Turn on the marketplace only for the approved pilot state/cluster.
4. Run five monitored real jobs; hold daily support and data-quality review.
5. Fix only task-blocking, trust, safety, or reliability defects during the active pilot.
6. Review evidence against P1 exit criteria and decide: repeat pilot, expand closed beta, or remediate a named failure.

---

## Source basis and limitations

This plan was derived from the checked-out `main` branch, including the current `README`, design/roadmap/requirements documentation, migration history, app routes/components, shared engines, test suites, and recent commits through `6373041` (6 October 2026). Typecheck and the repository unit-test suite were run successfully during the review. The hosted Supabase project was then inspected: migrations, functions, cron jobs, buckets, active integration settings, feature flags, selected non-sensitive record counts, and Supabase advisors informed the P0 blockers above. The GitHub connection still did not have remote-API access to this repository, so local Git history remains the source for commit-level archaeology.
