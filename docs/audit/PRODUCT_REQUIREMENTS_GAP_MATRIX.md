# Product Requirements Gap Matrix (Requirements A–N) — CultivaNode

**Audit Date:** 2026-11-17  
**Baseline:** Inspected `main` (`21e595b`) across `apps/web`, `apps/mobile`, `packages/shared`, `packages/iot`, and `supabase/`.

---

## A. Proactive AI Farm Intelligence Engine
- **Requirement:** Continuous, event- and schedule-driven AI monitoring that detects agronomic, weather, pest, and operational risks and delivers proactive recommendations.
- **Current implementation:** Pull-only chat (`AiFarmAssistant`) and photo diagnosis (`/api/scouting/analyse`); deterministic `evaluateCropWeatherHazards` API (`/api/engines/agronomy/weather-alerts`); unused `packages/iot/src/engine/alert-rules-engine.ts` simulator.
- **Relevant file paths:** `apps/web/src/components/account/ai-farm-assistant.tsx`, `packages/shared/src/engines/inputs/weather-alerts.ts`, `packages/iot/src/engine/alert-rules-engine.ts`, `supabase/migrations/20261009100000_farm_iot_module_system.sql`.
- **Existing database structures:** `crop_alerts`, `device_alerts`, `alert_rules`, `telemetry_readings`, `weather_cache`, `notifications`, `sms_outbox`.
- **Missing functionality:** Scheduled/event-triggered intelligence orchestrator (`pg_cron` / Edge Function), cross-signal correlation (weather + crop stage + IoT + scouting), proactive notification dispatch, and deduplication/cooldown logic.
- **Dependencies:** Persistent farm memory (B), RAG knowledge base (D), live weather/IoT ingestion, notification outbox.
- **Security implications:** Must enforce strict tenant isolation (`owner_id` / `org_id`) in background jobs running under `service_role`, plus per-farm rate/cost caps.
- **Recommended implementation:** Build a background worker (Edge Function woken by `pg_cron` or DB triggers) that evaluates deterministic rules first, invokes LLM synthesis only on triggered anomalies, and writes to `crop_alerts` + `notifications`.
- **Testing requirements:** Unit tests for rule triggers/cooldowns, pgTAP RLS tests for generated alerts, integration tests for background worker batching.
- **Priority:** **P2**

---

## B. Persistent Farm and User Memory
- **Requirement:** Long-term structured and conversational memory per farm and user (soil profile, crop history, past fertiliser/chemical applications, user preferences, and prior AI conversations).
- **Current implementation:** `AiFarmAssistant` stores chat messages only in React `useState` and hardcodes `stageName: "Vegetative"`. `profiles.preferred_language` exists, but no AI memory or chat history exists.
- **Relevant file paths:** `apps/web/src/components/account/ai-farm-assistant.tsx`, `apps/web/src/actions/ai-assistant.ts`, `apps/web/src/app/api/ai/assistant/route.ts`, `packages/shared/src/engines/ai-assistant/prompt-builder.ts`.
- **Existing database structures:** `farms`, `plots`, `soil_records`, `crop_cycles`, `crop_cycle_operations`, `crop_observations`, `farm_inventory_transactions`, `profiles`.
- **Missing functionality:** `ai_conversations` & `ai_messages` tables, `farm_memory_facts` / summary store, context assembler querying real `crop_cycles`, `soil_records`, and `crop_cycle_operations` (fertiliser/spray history).
- **Dependencies:** Existing farm management tables (`20261008130000`).
- **Security implications:** Conversation logs and farm memory contain sensitive operational/financial data; require strict owner/org RLS, NDPA export/deletion support (`export_my_data`, `request_account_deletion`), and PII scrubbing before LLM calls.
- **Recommended implementation:** Add `ai_sessions`, `ai_messages`, and `ai_farm_memory` tables with RLS; replace hardcoded `"Vegetative"` context with a server-side context loader pulling live farm, plot, soil, crop cycle, and recent operation records.
- **Testing requirements:** pgTAP RLS isolation tests, unit tests for context assembly and token-budget truncation, NDPA export verification.
- **Priority:** **P2** (context wiring of existing DB tables can begin in **P1**/**P2**).

---

## C. Super-Admin Intelligence Register
- **Requirement:** Super-admin console to inspect, govern, audit, and tune AI prompts, models, safety guardrails, knowledge sources, usage/cost telemetry, and intelligence accuracy/feedback.
- **Current implementation:** `/admin/agronomy` manages `farm_agronomic_standards` (draft/review/publish); `/admin/features` toggles `ai_photo_diagnosis`; `/admin/health` shows integration metrics. No AI register, prompt/model registry, or AI audit/feedback log exists.
- **Relevant file paths:** `apps/web/src/app/admin/(console)/agronomy/page.tsx`, `apps/web/src/app/admin/(console)/features/page.tsx`, `packages/shared/src/engines/ai-assistant/chemical-guardrail.ts`.
- **Existing database structures:** `farm_agronomic_standards`, `feature_flags`, `admin_actions`, `audit_log`, `integration_events`.
- **Missing functionality:** AI invocation log table (model, latency, token/cost, guardrail triggers, user feedback), prompt/guardrail version registry, super-admin UI for reviewing flagged diagnoses and AI safety events.
- **Dependencies:** `has_permission('knowledge.manage')` / `super_admin` RBAC, persistent AI logging (B).
- **Security implications:** Admin views must not expose raw PII unnecessarily; prompt/guardrail changes must be audited in `admin_actions` and `audit_log` (append-only).
- **Recommended implementation:** Add `ai_execution_logs` and `ai_feedback` tables; surface an `/admin/intelligence` console gated by `super_admin` / `knowledge.manage` showing usage, guardrail blocks, and low-confidence diagnoses.
- **Testing requirements:** pgTAP permission tests (non-admin blocked), integration tests for guardrail logging.
- **Priority:** **P2**

---

## D. Agricultural PDF Knowledge Base and RAG
- **Requirement:** Ingestion of approved agricultural PDFs/extension manuals, chunking, vector embeddings, hybrid search (`pgvector`), and citation-backed retrieval into AI responses.
- **Current implementation:** Static in-memory `CROP_CATALOGUE` / `TEMPLATES` / `PUBLISHED_STANDARDS` in `packages/shared/src/engines/agronomy/` and static `GUIDES` in `agronomy-library.tsx`. `/admin/content` knowledge base section is sample-only. Zero `pgvector` or PDF ingestion exists.
- **Relevant file paths:** `packages/shared/src/engines/ai-assistant/grounding.ts`, `packages/shared/src/engines/agronomy/standards.ts`, `apps/web/src/components/screens/agronomy-library.tsx`, `apps/web/src/app/admin/(console)/content/page.tsx`.
- **Existing database structures:** `farm_agronomic_standards` (`20261103120000`); `extensions` schema (available for `vector`).
- **Missing functionality:** `pgvector` extension enablement, `knowledge_documents` & `knowledge_chunks` (`vector` column + HNSW/IVFFlat index), PDF upload/parsing/chunking worker, embedding generation, hybrid retrieval RPC, and citation UI.
- **Dependencies:** `knowledge.manage` governance workflow, embedding provider adapter (Gemini/OpenAI).
- **Security implications:** Only staff with `knowledge.manage` may upload/publish official documents; PDF parsing must run in a sandboxed worker with strict size/type limits; prompt-injection sanitization on retrieved chunks.
- **Recommended implementation:** Enable `pgvector` in a migration, create `knowledge_documents` (with draft/published status) and `knowledge_chunks`, build an Edge Function/background worker for PDF extraction + chunk embedding, and update `retrieveGroundedContext` to query DB `farm_agronomic_standards` + `knowledge_chunks`.
- **Testing requirements:** pgTAP tests for `knowledge.manage` RLS and vector RPC, evaluation suite against >=100 agronomy Q&As (per `docs/AI.md`).
- **Priority:** **P2**

---

## E. Proactive Crop Management
- **Requirement:** Stage-aware crop alerts, schedule drift detection, weather-triggered spray/fertiliser advisories, and scouting follow-ups.
- **Current implementation:** CRUD for `crop_cycles`, `crop_cycle_operations`, `crop_observations`, and `crop_alerts` on web; basic stage list + `markJobDone`/`moveJob` on mobile; pull-based `/api/engines/agronomy/{schedule,fertiliser,spray,weather-alerts}`.
- **Relevant file paths:** `apps/web/src/actions/farm-ops.ts`, `apps/web/src/app/[lang]/account/crops/*`, `apps/mobile/src/screens/FarmScreen.tsx`, `packages/shared/src/engines/inputs/*`.
- **Existing database structures:** `crop_cycles`, `crop_cycle_operations`, `crop_observations`, `crop_alerts`, `farm_agronomic_standards`, `soil_records`.
- **Missing functionality:** Automated overdue-operation escalation, weather-window conflict detection against scheduled sprays/fertiliser, DB-backed agronomy standard comparison (connecting `farm_agronomic_standards` to active cycles).
- **Dependencies:** Proactive AI Engine (A), weather cache/forecast per farm GPS.
- **Security implications:** Tenant isolation on `crop_cycles` and `crop_alerts`; chemical safety guardrails on all generated spray advisories.
- **Recommended implementation:** Wire `farm_agronomic_standards` into `CropPlanner` and a scheduled job that compares `crop_cycle_operations` + `weather_cache` to emit actionable `crop_alerts`.
- **Testing requirements:** Unit tests for hazard/schedule rules, pgTAP tests for alert creation and RLS.
- **Priority:** **P2**

---

## F. Advanced Livestock Management and Nutritional Intelligence
- **Requirement:** Ration formulation, feed/DM/protein/energy calculations, growth/FCR tracking, withdrawal-period enforcement, and veterinary image/symptom triage.
- **Current implementation:** Web/mobile CRUD for `farm_livestock_groups`, feeding, health, and production logs (`module_livestock` flag). `FarmLivestockEngine` (`calculateFCR`, `calculateADG`, `evaluateHealthWithdrawal`) exists in `packages/shared` but is **unused in `apps/`**. No ration formulation or livestock AI vision exists.
- **Relevant file paths:** `apps/web/src/app/[lang]/account/livestock/page.tsx`, `apps/mobile/src/screens/AnimalsScreen.tsx`, `packages/shared/src/engines/farm-management/livestock-engine.ts`.
- **Existing database structures:** `farm_livestock_groups`, `farm_livestock_animals`, `farm_livestock_feedings`, `farm_livestock_health_events`, `farm_livestock_production_logs`.
- **Missing functionality:** Wiring `FarmLivestockEngine` into web/mobile UI, deterministic ration/nutrition calculator by species/weight/stage, livestock health/vet AI triage with withdrawal-period guardrails.
- **Dependencies:** Livestock schema (`20261008130000`), AI Engine (A) for triage.
- **Security implications:** Veterinary/medication recommendations must enforce withdrawal-period warnings before sale/slaughter.
- **Recommended implementation:** First wire `FarmLivestockEngine` (FCR, ADG, withdrawal alerts) into `account/livestock` and `AnimalsScreen`; then add deterministic ration tables and AI veterinary triage.
- **Testing requirements:** Unit tests for ration/nutrition math and withdrawal blocks; UI/API integration tests.
- **Priority:** **P2**

---

## G. Intelligent Inventory Replenishment
- **Requirement:** Automated burn-rate calculation, crop/livestock plan demand forecasting, low-stock/expiry alerts, and replenishment proposals.
- **Current implementation:** Web/mobile inventory CRUD (`farm_inventory`, `farm_inventory_transactions`) with basic reorder-level/expiry display. `FarmInventoryEngine` in `packages/shared` is **unused in `apps/`**.
- **Relevant file paths:** `apps/web/src/app/[lang]/account/inventory/page.tsx`, `apps/mobile/src/screens/StoreScreen.tsx`, `packages/shared/src/engines/farm-management/inventory-engine.ts`.
- **Existing database structures:** `farm_inventory`, `farm_inventory_locations`, `farm_inventory_transactions`, `crop_cycle_operations`.
- **Missing functionality:** Wiring `FarmInventoryEngine`, forecasting input requirements from active `crop_cycles` and `farm_livestock_groups`, automated low-stock/expiry alerts, and replenishment draft generation.
- **Dependencies:** Active crop/livestock plans, supplier discovery (H).
- **Security implications:** Prevent negative stock race conditions; tenant isolation on inventory data.
- **Recommended implementation:** Wire `FarmInventoryEngine` into `account/inventory`; add a forecasting helper comparing upcoming 14-day operation input needs against `farm_inventory` balances.
- **Testing requirements:** Unit tests for demand forecasting and negative-stock guards.
- **Priority:** **P2**

---

## H. Automated Supplier Discovery and Procurement
- **Requirement:** Match farm input shortages/schedules to verified marketplace agro-dealers, compare landed prices/distances/ratings, and propose/initiate purchase orders.
- **Current implementation:** Marketplace listings, cart, checkout, and RFQs (`buyer_requests`) exist on web/mobile. `BuyWhatINeedService` (`packages/shared/src/engines/marketplace/buy-what-i-need.ts`) is **unused** and hardcodes `priceScore = 20`.
- **Relevant file paths:** `packages/shared/src/engines/marketplace/buy-what-i-need.ts`, `packages/shared/src/engines/marketplace/ai-service.ts`, `apps/web/src/app/[lang]/marketplace/*`, `apps/web/src/actions/checkout.ts`.
- **Existing database structures:** `marketplace_listings`, `marketplace_variants`, `marketplace_sellers`, `marketplace_inventory_lots`, `buyer_requests`, `marketplace_orders`.
- **Missing functionality:** Real price/distance/rating ranking (replacing hardcoded `priceScore = 20`), automated RFQ/cart proposal from inventory deficits, integration with `marketplace_orders` (`place_marketplace_order`).
- **Dependencies:** **[P0-SEC-01]** fix on `marketplace_orders` RLS/grants; Intelligent Inventory (G).
- **Security implications:** Must never auto-commit purchases without explicit user approval (K); server-side price/stock validation via `place_marketplace_order`.
- **Recommended implementation:** Fix `marketplace_orders` security first; replace hardcoded scoring in `BuyWhatINeedService` with live DB pricing + PostGIS distance; expose "Buy Missing Inputs" flow from `account/inventory`.
- **Testing requirements:** Unit tests for ranking logic; pgTAP & checkout integration tests.
- **Priority:** **P2**

---

## I. Proactive Labour and Machinery Recommendations
- **Requirement:** Recommend machinery hiring or labour scheduling ahead of bottlenecks based on farm size, crop stage, weather windows, and local provider availability.
- **Current implementation:** Farmer booking search (`nearby_listings_for_farm` RPC), `farm_workers`, `farm_operational_tasks`, `farm_machinery_assets` exist. Provider dispatch on mobile has demo fallbacks and bugs.
- **Relevant file paths:** `apps/web/src/app/[lang]/account/find/page.tsx`, `apps/web/src/app/[lang]/account/tasks/page.tsx`, `apps/web/src/app/[lang]/account/machinery/*`, `apps/mobile/src/lib/provider-dispatch.ts`.
- **Existing database structures:** `listings`, `listing_rates`, `bookings`, `farm_workers`, `farm_attendance_records`, `farm_operational_tasks`, `farm_machinery_assets`.
- **Missing functionality:** Workload/capacity gap detection, proactive booking recommendations before planting/harvest windows, provider reliability ranking.
- **Dependencies:** Stabilizing mobile provider dispatch (**P1**), Crop Management (E).
- **Security implications:** Do not expose private farmer coordinates to unbooked providers (`nearby_listings_for_farm` privacy rules).
- **Recommended implementation:** Fix mobile provider dispatch first; add a recommendation query matching upcoming `crop_cycle_operations` requiring equipment/labour against `nearby_listings_for_farm` and `farm_workers`.
- **Testing requirements:** pgTAP tests for `nearby_listings_for_farm` privacy; unit tests for scheduling gap detection.
- **Priority:** **P2**

---

## J. AI-Assisted Financial Management
- **Requirement:** Automated expense/income categorisation, budget-vs-actual variance explanation, cashflow forecasting, and credit-readiness summaries.
- **Current implementation:** Web/mobile cash book (`farm_financial_transactions`), budgets (`farm_budgets`), and variance page (`account/variance`). `/admin/finance` is sample data (**D**), and `/api/engines/ledger/transact` is in-memory only.
- **Relevant file paths:** `apps/web/src/app/[lang]/account/finance/page.tsx`, `apps/web/src/app/[lang]/account/variance/page.tsx`, `apps/web/src/app/admin/(console)/finance/page.tsx`, `apps/web/src/app/api/engines/ledger/transact/route.ts`.
- **Existing database structures:** `farm_financial_transactions`, `farm_budgets`, `farm_budget_lines`, `farm_plan_actual_variances`, `marketplace_journal_entries`, `marketplace_journal_postings`.
- **Missing functionality:** Connecting `/admin/finance` to real `marketplace_journal_*` tables, AI variance narrative & anomaly detection, cashflow projections tied to crop harvest timelines.
- **Dependencies:** Live ledger wiring (**P1**).
- **Security implications:** Financial data requires strict tenant isolation, kobo-integer precision (`bigint`), and read-only AI access.
- **Recommended implementation:** Wire `/admin/finance` to `marketplace_journal_entries` first; then add server-side financial summary builder feeding AI explanations on `account/variance` and `account/finance`.
- **Testing requirements:** Unit tests for kobo math & variance calculations; pgTAP RLS tests.
- **Priority:** **P2**

---

## K. Permission-Based Autonomous Execution
- **Requirement:** Allow AI to propose and—where explicitly permitted by user/org policy—execute bounded actions (creating tasks, drafting orders, scheduling bookings) with human-in-the-loop confirmation, undo, and full audit trails.
- **Current implementation:** **Not implemented.** AI is strictly advisory. `AIMarketplaceService.proposeDraftListing` (`requiresUserConfirmation: true`) is unused.
- **Relevant file paths:** `packages/shared/src/engines/marketplace/ai-service.ts`, `packages/shared/src/engines/ai-assistant/llm-adapter.ts`.
- **Existing database structures:** `audit_log`, `admin_actions`, `consents`.
- **Missing functionality:** `ai_action_proposals` table (pending/approved/rejected/executed), per-user/org autonomy policy settings, RBAC permission checks on proposed actions, idempotent execution engine, and audit logging.
- **Dependencies:** Persistent AI Memory (B), Intelligence Register (C), **[P0-SEC-01]** financial table hardening.
- **Security implications:** **High risk if rushed.** Prompt injection or hallucination must never bypass RLS, spend money, or modify financial/legal state without explicit cryptographic/session confirmation.
- **Recommended implementation:** Start with "propose-and-confirm" drafts only (user clicks Confirm in UI); enforce `auth.uid()` RLS on execution; log every proposal and execution to `audit_log`.
- **Testing requirements:** Security/penetration tests for prompt injection -> unauthorized action; pgTAP tests for action state machine.
- **Priority:** **P3** (after P0/P1 and P2 foundations).

---

## L. Multi-Role User Expansion Through Settings
- **Requirement:** Existing users can add/switch between multiple operational roles (Farmer, Equipment Provider, Agro-Dealer, Buyer, Field Agent, Agronomist, etc.) from Settings on both web and mobile.
- **Current implementation:** **Web (`B`):** `/[lang]/account/roles` + `WorkspaceSwitcher` (`?ws=`) + `enableFarmerRole` + `role_requests`. **Mobile (`C`):** Farmer & Provider views only; cannot request new roles or upload verification docs from mobile.
- **Relevant file paths:** `apps/web/src/app/[lang]/account/roles/page.tsx`, `apps/web/src/actions/account.ts`, `apps/web/src/lib/account/workspace.ts`, `apps/mobile/src/app/(provider)/_layout.tsx`.
- **Existing database structures:** `roles`, `user_roles`, `role_requests`, `verification_documents`.
- **Missing functionality:** Mobile role-request & document-upload UI, mobile workspace switcher for additional roles, unified settings entry point linking role expansion with KYC tier requirements.
- **Dependencies:** Existing `role_requests` & `verification-documents` bucket.
- **Security implications:** Sensitive roles must remain non-auto-approved (`role_is_auto_approved` constraint) and require staff review.
- **Recommended implementation:** Add mobile role-request + document-upload screens reusing existing `role_requests` and `verification-documents` policies; surface role expansion clearly inside `/account/settings` on web.
- **Testing requirements:** pgTAP suite `06` & `08` coverage + mobile integration tests.
- **Priority:** **P1** (completes existing multi-role architecture across mobile/web).

---

## M. Administrative Approval of New Roles
- **Requirement:** Staff workflow to review role requests, inspect submitted KYC/business documents via short-lived signed URLs, approve/reject with reasons, and audit all decisions.
- **Current implementation:** **Implemented on Web (`B`)** at `/admin/approvals` (`approveRoleRequest`, `rejectRoleRequest`, `reviewDocument` with `roles.review` / `verification.review` permissions and `admin_actions` logging).
- **Relevant file paths:** `apps/web/src/app/admin/(console)/approvals/page.tsx`, `apps/web/src/actions/admin-console.ts`, `supabase/migrations/20260926150328_m1_accounts.sql`.
- **Existing database structures:** `role_requests`, `user_roles`, `verification_documents`, `admin_actions`, `audit_log`.
- **Missing functionality:** Automated notification (SMS/in-app) on approval/rejection if missing for specific role types, SLA/queue filtering for high-volume approvals, and automated web tests.
- **Dependencies:** None (core backend & web UI already built).
- **Security implications:** Already enforces non-self-approval and signed storage URLs; maintain strict `roles.review` permission checks.
- **Recommended implementation:** Add automated tests for `/admin/approvals` actions and verify notification triggers on `approveRoleRequest`/`rejectRoleRequest`.
- **Testing requirements:** Web action integration tests + existing pgTAP `06_permissions_and_identity.test.sql`.
- **Priority:** **P1**

---

## N. Institutional Lending and Grants
- **Requirement:** End-to-end workflows for farmers/cooperatives to apply for agricultural loans and grants, share verified farm/yield/financial telemetry with consent, and allow institutional lenders/NGOs/governments to underwrite, disburse, and monitor repayments/impact.
- **Current implementation:** **Database tables & stubbed UI shells only.** `loan_applications`, `grant_programmes`, `grant_applications`, `impact_programmes`, `programme_beneficiaries` exist in `20261011100000_ecosystem_modules.sql`; web routes `/account/lender`, `/account/grants`, `/account/ngo`, `/account/gov` exist, but full underwriting, credit-scoring, and disbursement workflows are incomplete.
- **Relevant file paths:** `supabase/migrations/20261011100000_ecosystem_modules.sql`, `apps/web/src/app/[lang]/account/lender/`, `apps/web/src/app/[lang]/account/grants/`, `apps/web/src/app/[lang]/account/ngo/`, `apps/web/src/app/[lang]/account/gov/`.
- **Existing database structures:** `loan_applications`, `grant_programmes`, `grant_applications`, `impact_programmes`, `programme_beneficiaries`, `insurance_policies`, `insurance_claims`.
- **Missing functionality:** Consent-gated farm credit-readiness dossier generator, lender/grant reviewer queues & approval state machines, repayment/disbursement ledger integration, and regulatory/fintech compliance sign-off.
- **Dependencies:** Double-entry ledger hardening, KYC Tier 2/3, NDPA consent controls.
- **Security implications:** High PII/financial exposure; requires explicit `data_processing` / lender-sharing consent records and strict org-scoped RLS for institutional reviewers.
- **Recommended implementation:** Gate institutional data sharing behind explicit `consents` records; implement state-machine RPCs for `loan_applications` and `grant_applications` (mirroring `bookings`/`marketplace_orders`).
- **Testing requirements:** pgTAP RLS tests for lender/applicant isolation, state-transition tests, consent-revocation tests.
- **Priority:** **P3**
