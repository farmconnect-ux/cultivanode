# Existing System Inventory — CultivaNode

**Audit Date:** 2026-11-17  
**Repository:** `https://github.com/farmconnect-ux/cultivanode`  
**Audited Commit (`main`):** `792f0b5` (*Sign-in: email only until an SMS provider is set up; staff can sign in by email*)  
**Workspace Note:** Local working tree has been restored and fast-forwarded to `origin/main` (`792f0b5`); `packages/`, `supabase/`, `scripts/`, and `patches/` are present on disk.

---

## 1. Repository & Monorepo Structure

| Path | Type | Status in Working Tree | Purpose & Contents |
|---|---|---|---|
| `package.json` | Root workspace config | Present on disk | npm workspaces (`apps/*`, `packages/*`), Turborepo (`turbo run ...`), Node `>=22` (`.nvmrc`: `22`), Supabase CLI scripts (`db:types:remote` targeting `vqbtnftnxyfaembwgfrk`). |
| `turbo.json` | Build orchestration | Present on disk | Defines `build`, `dev`, `lint`, `typecheck`, `test` tasks. |
| `apps/web` | Next.js 16 App Router | Present on disk | Full web application: marketing pages (`EN`/`YO`), user account workspaces, marketplace, AI assistant, admin console, API routes, webhooks. |
| `apps/mobile` | Expo SDK 57 / RN 0.86.3 | Present on disk | Android/iOS mobile app (`com.cultivanode.app`), farmer & provider screens, AsyncStorage offline outbox, scouting AI photo upload. |
| `packages/shared` | Shared TypeScript package | In `git HEAD` (deleted on disk) | Brand tokens, Zod validation, Nigerian phone/money/geo helpers, `database.types.ts`, and 11 domain engines with Vitest unit tests. |
| `packages/iot` | Standalone IoT simulator & server | In `git HEAD` (deleted on disk) | `@cultivanode/iot-module`: Express server, LoRaWAN/cellular adapters, soil/weather simulator, alert rules engine, 4 standalone SQL migrations, 7 test files. **Not imported by `apps/web`, `apps/mobile`, or `supabase/functions/`.** |
| `supabase/` | Database & Edge Functions | In `git HEAD` (deleted on disk) | `config.toml`, 57 SQL migrations, 6 Edge Functions + `_shared/` + 7 Deno unit test suites, 18 pgTAP database test suites, `seed.sql`, `seed_demo.sql`, demo cleanup scripts. |
| `scripts/` | Utility scripts | In `git HEAD` (deleted on disk) | `brand-icons.ts` (generates web/mobile SVG icons) and `agronomy/import-shared-catalogue.ts` (logs catalogue counts only; no DB writes). |
| `.github/workflows/` | CI/CD pipelines | Present on disk | `ci.yml` (typecheck, lint, unit tests, `supabase test db`) and `android.yml` (APK build & release to `farmconnect-ux/cultivanode-android`). |
| `docs/` | Project documentation | Present on disk | Architecture, security, deployment, payments, integrations, AI, roadmap, and `requirements-matrix.md` (several docs are stale relative to code). |
| `doc/` | Untracked HTML export | Present on disk (untracked) | Static HTML snapshots of root config files (`Master Build.md.html`, etc.). |

---

## 2. Git Branch State

| Branch | Head Commit | Relationship to `main` |
|---|---|---|
| `main` (`origin/main`) | `21e595b` | Primary branch. |
| `redesign/agro-enterprise-suite` | `2e74d55` | 0 unique commits; fully merged into `main` (`main` is 44 commits ahead). |
| `fix/phase-0-stop-misleading` | `6ff0a54` | 0 unique commits; fully merged into `main` (`main` is 25 commits ahead). |
| `origin/fix/farmer-live-records` | `4dd26ac` | **1 unmerged commit** ahead of `main` (*fix(farmer): show this account's farms and jobs, not sample estates*). |
| `origin/vercel/install-vercel-web-analytics-bhrs3k` | `b01aebe` | **1 unmerged commit** ahead of `main` (*Install Vercel Web Analytics*). |

---

## 3. Shared Package (`packages/shared/src/`) Inventory

### Core Utilities (Actively Used)
- `brand.ts`, `roles.ts`, `money.ts` (`nairaToKobo`, `formatNaira`), `geo.ts`, `phone.ts` (`normalizeNgPhone`), `errors.ts` (`isAppError`), `validation.ts`, `config.ts` (`resolvePaymentMode`), `places.ts`, `legal.ts` (`LEGAL_VERSIONS`), `design/tokens.ts`, `database.types.ts`, `weather.ts`, `crop-plan.ts`, `state-centroids.ts`.
- Unit tests in `packages/shared/src/__tests__/`: `phone.test.ts`, `shared.test.ts`, `tokens.test.ts`, `validation.test.ts`, `weather.test.ts`, `yoruba-font.test.ts`.

### Domain Engines (`packages/shared/src/engines/`) — 11 Modules
| Engine | Files | Production Wiring Status |
|---|---|---|
| `agronomy/` | `catalogue.ts`, `templates.ts`, `schedule-generator.ts`, `standards.ts`, `types.ts`, `agronomy.test.ts` | **Partially wired**: `getCropById`, `generatePlantingSchedule`, `retrieveGroundedContext` used in `apps/web`. `PUBLISHED_STANDARDS` / `validateAgainstStandard` unused in apps (admin uses DB `farm_agronomic_standards`). |
| `ai-assistant/` | `chemical-guardrail.ts`, `grounding.ts`, `prompt-builder.ts`, `llm-adapter.ts`, `types.ts`, `ai-assistant.test.ts` | **Wired** in `apps/web` (`actions/ai-assistant.ts`, `/api/ai/assistant`, `lib/ai-vision.ts`, `/api/engines/ai/*`). |
| `inputs/` | `fertiliser.ts`, `spray-planner.ts`, `weather-alerts.ts`, `inventory.ts`, `farm-books.ts`, `types.ts`, `inputs.test.ts` | **Partially wired**: `fertiliser`, `spray`, `weather-alerts` exposed at `/api/engines/agronomy/*`; `APPROVED_CHEMICALS_REGISTRY` used by guardrail. `inventory.ts` and `farm-books.ts` unused in apps. |
| `cancellation-disputes/` | `cancellation.ts`, `disputes.ts`, `agent-booking.ts`, `types.ts`, `cancellation-disputes.test.ts` | **Partially wired**: `evaluateCancellation` & `arbitrateDispute` exposed at `/api/engines/*`; `agent-booking.ts` unused. |
| `ledger-escrow/` | `cryptographic-ledger.ts`, `escrow.ts`, `types.ts`, `ledger-escrow.test.ts` | **Partially wired**: `/api/engines/ledger/transact` instantiates `CryptographicLedger` in-memory without DB persistence. |
| `auth-jwt/` | `jwt.ts`, `jwt.test.ts` | **Wired**: `authenticateStateless` in `apps/web/src/lib/engines-api-helper.ts`. |
| `api-gateway/` | `client.ts`, `middleware.ts`, `api-gateway.test.ts` | **Unused in apps** (unit-tested only). |
| `farm-management/` | `standard-plan-actual.ts`, `inventory-engine.ts`, `livestock-engine.ts`, `machinery-engine.ts`, `budget-cost-engine.ts`, `types.ts`, `farm-management.test.ts` | **Unused in apps** (unit-tested only; web/mobile query Supabase directly). |
| `iot/` | `alert-rules.ts`, `crop-bridge.ts`, `quality-checker.ts`, `watchdog.ts`, `types.ts`, `iot.test.ts` | **Unused in apps** (unit-tested only). |
| `marketplace/` | `ai-service.ts`, `buy-what-i-need.ts`, `farm-integration.ts`, `inventory-engine.ts`, `order-state-machine.ts`, `payment-adapters.ts`, `pricing-fees.ts`, `traceability.ts`, `types.ts`, `marketplace.test.ts`, `marketplace-flows.test.ts` | **Unused in apps** (`apps/web` and `apps/mobile` call Supabase RPCs directly). |
| `offline-sync/` | `outbox-queue.ts`, `sync-manager.ts`, `types.ts`, `offline-sync.test.ts` | **Unused in apps** (`apps/mobile/src/lib/outbox.ts` implements its own AsyncStorage queue). |

---

## 4. Unused Components, Sample/Hardcoded Data & Disconnected Interfaces

1. **Working-tree workspace breakage**: Because `packages/` is deleted on disk in this local backup, `apps/web` and `apps/mobile` cannot resolve `@cultivanode/shared*` locally until `packages/` is restored from `HEAD`.
2. **Stale documentation**: `docs/requirements-matrix.md`, `docs/AI.md`, and `docs/PAYMENTS.md` state that M3, M5 (payments/ledger), and M6 (AI) are "not built", contradicting live implementations in `apps/web` and `supabase/migrations/`.
3. **Sample/hardcoded web routes & screens**:
   - `apps/web/src/app/admin/(console)/finance/page.tsx` -> `PlatformFinance` (`INITIAL_LEDGER` sample array).
   - `apps/web/src/app/admin/(console)/support/page.tsx` -> `SupportDesk` (hardcoded `TICKETS` array).
   - `apps/web/src/app/admin/(console)/content/page.tsx` -> `<ContentAdmin />` bottom section (sample knowledge base/advisories/translations).
   - `apps/web/src/app/[lang]/onboarding/review/page.tsx` -> `<OnboardingReview />` (static design screen).
   - `apps/web/src/app/api/documents/[type]/route.ts` -> hardcoded static CSVs with placeholder company names/account numbers.
   - `apps/web/src/app/api/engines/agronomy/schedule/route.ts` (`GET`) -> hardcoded CSV string.
   - `apps/web/src/app/api/engines/ledger/transact/route.ts` -> in-memory `CryptographicLedger`, not persisted to Supabase.
   - `apps/web/src/components/screens/notification-centre.tsx` (lines 147–170) -> legacy mock handlers (`#DSAR-2026-006`).
4. **Unused web files**:
   - `apps/web/src/components/account/account-nav.tsx` (superseded by `AccountShell`).
   - `apps/web/src/lib/use-live-weather.ts` (unreferenced hook).
5. **Hardcoded/broken mobile code**:
   - `apps/mobile/src/lib/provider-dispatch.ts`: falls back to 4 hardcoded demo jobs (`job-req-001`..`job-cmp-004`) and 3 demo tractors (`machinery-01`..`machinery-03`), falls back to `'demo-provider-user'`, and stores maintenance dates only in `sessionStorage`.
   - `apps/mobile/src/app/evidence/[jobId].tsx`: calls `useProvider()` outside `ProviderContext` (runtime crash).
   - `apps/mobile/src/app/(provider)/inbox.tsx`: uses iOS-only `Alert.prompt(...)` (broken on Android).
   - `expo-sqlite` is declared in root `package.json` but missing from `apps/mobile/package.json` and unused.
6. **Zero automated web tests**: `apps/web` has no test runner or test files; `apps/mobile` has 3 Vitest files in `src/lib/__tests__/` but no `test` script or `vitest` dependency in `apps/mobile/package.json`.
