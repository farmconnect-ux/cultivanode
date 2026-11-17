# Prioritised Development Roadmap — CultivaNode

**Audit Date:** 2026-11-17  
**Guiding Rule:** Critical security, data integrity, and production stability issues (`P0`) and incomplete existing features (`P1`) are strictly prioritised ahead of new AI and ecosystem capabilities (`P2`, `P3`). Do not rebuild existing working architecture.

---

## Priority Classification

- **P0 — Critical Security, Data Integrity & Production Risks:** Must be resolved before expanding the user base or enabling live money flows.
- **P1 — Existing Functionality Stabilization:** Existing features, bugs, CI gaps, and disconnected UIs that must be completed before scaling.
- **P2 — Major New Product Capabilities:** Core AI intelligence, RAG, proactive agronomy, livestock nutrition, inventory/procurement, and financial intelligence.
- **P3 — Advanced Optimisation & Future Enhancements:** Autonomous AI execution, institutional lending/grants, and advanced telemetry.

---

## Phase 1: P0 — Critical Security & Production Hardening (Immediate / Batch 01)

| ID | Task | Why P0 | Key Files / Objects |
|---|---|---|---|
| **P0-1** | **Lock down `marketplace_orders`, `marketplace_order_items`, `marketplace_fulfilments` RLS & grants** | Authenticated buyers can currently `INSERT`/`UPDATE` order totals, commissions, and `status = 'paid'` directly via PostgREST, bypassing `place_marketplace_order()`. | New migration + `supabase/tests/database/18_marketplace_disputes.test.sql` |
| **P0-2** | **Add negative security tests to pgTAP (`04` & `18`)** | Prevent regressions on order table writes, `get_checkout_payment_credentials` grants, and `storage.objects` bucket isolation. | `supabase/tests/database/04_function_grants.test.sql`, `18_marketplace_disputes.test.sql` |
| **P0-3** | **Upgrade Supabase to Paid Plan (PITR Backups) & Verify Production Config** | `docs/DEPLOYMENT.md` indicates Free plan without PITR; verify applied migrations (`57`), `APP_ENV=production`, Edge Function deployments, Vault secrets, and custom SMTP. | Hosted Supabase `vqbtnftnxyfaembwgfrk`, Vercel env vars |
| **P0-4** | **Restore `packages/`, `supabase/`, `scripts/` in local workspace** | Local working tree has these directories deleted on disk (present in `HEAD`), breaking local builds/typechecks. | `git HEAD` (`21e595b`) |

---

## Phase 2: P1 — Existing Functionality Stabilization & Bug Fixes (Batch 02)

| ID | Task | Details | Key Files |
|---|---|---|---|
| **P1-1** | **Fix Mobile Provider Dispatch Crash & Android Bugs** | Fix `useProvider()` crash in `src/app/evidence/[jobId].tsx`; replace iOS-only `Alert.prompt` in `(provider)/inbox.tsx`; remove hardcoded demo jobs/machinery fallbacks in `provider-dispatch.ts`; fix `boundary_walk.tsx` defaults. | `apps/mobile/src/app/evidence/[jobId].tsx`, `apps/mobile/src/app/(provider)/inbox.tsx`, `apps/mobile/src/lib/provider-dispatch.ts` |
| **P1-2** | **Fix CI/CD Build & Test Blind Spots** | Add `npm run build` (`next build`) to `.github/workflows/ci.yml`; remove `ignoreBuildErrors: true` in `next.config.ts`; fail `android.yml` if keystore is missing or `apksigner verify` fails; add `vitest` + `test` script to `apps/mobile/package.json`; add core unit/integration tests for `apps/web`. | `.github/workflows/ci.yml`, `.github/workflows/android.yml`, `apps/web/next.config.ts`, `apps/mobile/package.json` |
| **P1-3** | **Connect Sample Admin Screens & Stubbed APIs to Real DB** | Wire `/admin/finance` (`PlatformFinance`) to `marketplace_journal_*`; wire `/admin/support` (`SupportDesk`) to `support_tickets`; wire `/admin/content` (`ContentAdmin`) or remove sample preview; persist or remove in-memory `/api/engines/ledger/transact` & static `/api/documents/[type]`. | `apps/web/src/components/screens/platform-finance.tsx`, `support-desk.tsx`, `apps/web/src/app/api/engines/ledger/transact/route.ts` |
| **P1-4** | **Reconcile Unmerged Branches & Stale Docs** | Review and merge/close `origin/fix/farmer-live-records` (`4dd26ac`) and `origin/vercel/install-vercel-web-analytics-bhrs3k` (`b01aebe`); update `docs/requirements-matrix.md`, `docs/AI.md`, and `docs/PAYMENTS.md` to match reality. | `docs/requirements-matrix.md`, `docs/AI.md`, `docs/PAYMENTS.md` |
| **P1-5** | **Complete Multi-Role Expansion on Mobile & Automated NDPA Deletion** | Add mobile role-request & document-upload screens (`L`); automate anonymisation/deletion execution for approved `data_requests`. | `apps/mobile/src/screens/`, `supabase/migrations/` |

---

## Phase 3: P2 — Major New Product Capabilities (Batches 03–06)

1. **Batch 03 — AI Context & Persistent Farm Memory (Req B, C):**
   - Add `ai_sessions`, `ai_messages`, `ai_farm_memory`, `ai_execution_logs`, and `ai_feedback` tables with strict RLS.
   - Replace hardcoded `stageName: "Vegetative"` in `AiFarmAssistant` with live DB context (`crop_cycles`, `plots`, `soil_records`, `crop_cycle_operations`, `farm_agronomic_standards`).
   - Build Super-Admin Intelligence Register (`/admin/intelligence`) for model/prompt/guardrail/feedback governance.
2. **Batch 04 — Agricultural PDF Knowledge Base & RAG (Req D):**
   - Enable `pgvector`; add `knowledge_documents` & `knowledge_chunks` tables; build PDF ingestion/chunking/embedding pipeline and hybrid retrieval RPC; wire citations into `retrieveGroundedContext` and `/admin/content`.
3. **Batch 05 — Proactive Farm Intelligence Engine & Crop/Livestock/Inventory Intelligence (Req A, E, F, G):**
   - Build `pg_cron` + Edge Function proactive monitoring loop evaluating weather hazards, crop stage drift, and IoT rules -> `crop_alerts` + `notifications`.
   - Wire unused `FarmLivestockEngine` and `FarmInventoryEngine` from `packages/shared` into `apps/web` & `apps/mobile`; add livestock ration calculator and veterinary image triage.
4. **Batch 06 — Automated Procurement, Labour/Machinery Matching & Financial Intelligence (Req H, I, J):**
   - Replace hardcoded `priceScore = 20` in `BuyWhatINeedService` with live DB pricing + PostGIS distance; connect inventory deficits to marketplace cart/RFQ proposals.
   - Add proactive labour/machinery bottleneck recommendations and AI-assisted cashflow/variance narratives.

---

## Phase 4: P3 — Advanced Optimisation & Future Enhancements

1. **Permission-Based Autonomous Execution (Req K):** Propose-and-confirm action framework (`ai_action_proposals`), per-org autonomy policies, RBAC enforcement, and immutable audit trails.
2. **Institutional Lending & Grants (Req N):** Consent-gated farm credit-readiness dossiers, state-machine RPCs for `loan_applications` and `grant_applications`, and disbursement/repayment ledger integration.
3. **Mobile Offline SQLite Migration & Full Parity:** Migrate `AsyncStorage` outbox to `expo-sqlite` (already in root `package.json`), add conflict resolution, and expand mobile workspaces (Agent, Agronomist, Buyer).
