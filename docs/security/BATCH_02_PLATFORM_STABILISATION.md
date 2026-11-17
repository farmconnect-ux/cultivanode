# Batch 02: Platform Stabilisation and Existing Functionality Completion

**Branch:** `stabilization/batch-02-platform-stability`  
**Base:** `main`  
**Source of scope:** `docs/audit/PRIORITISED_DEVELOPMENT_ROADMAP.md`, audit dated 17 November 2026.  
**Priority:** P1, existing functionality stabilisation.  
**Production:** No Production database, credentials, feature flags or deployment changes are authorised by this batch.

## Objective

Stabilise the existing CultivaNode web and mobile applications, remove misleading demo and in-memory behaviour, close CI/CD blind spots, and complete the most important existing cross-platform workflows. Preserve the current Turborepo, Next.js, Expo/React Native, shared TypeScript and Supabase architecture. Reuse existing database tables, RPCs and shared engines wherever practical. Do not begin the P2 Farm Intelligence Engine build in this batch.

## Workstream 1: Mobile provider dispatch defects

1. Fix the provider context crash in `apps/mobile/src/app/evidence/[jobId].tsx`. The evidence route must obtain provider identity through a valid route-level data/auth boundary, not a hook whose context provider is not an ancestor.
2. Replace iOS-only `Alert.prompt` in `apps/mobile/src/app/(provider)/inbox.tsx` with a cross-platform input/dialog flow that validates and submits the decline reason.
3. Remove hardcoded demo jobs, machinery, and `demo-provider-user` fallbacks from `apps/mobile/src/lib/provider-dispatch.ts`. If live data or required authentication is unavailable, show an explicit empty/error state and do not simulate successful work.
4. Remove local-only success paths in work evidence/check-in where an RPC fails. A failed server mutation must remain visibly failed and retryable; it must not be represented as persisted.
5. Correct farm boundary defaults in `boundary_walk.tsx`. Obtain farm identity and location from the selected farm/profile; require user input where unavailable rather than defaulting to Oyo/Ibadan or a generic farm name.
6. Add regression coverage for provider context, Android decline flow, empty/error states, failed RPC handling and evidence submission.

## Workstream 2: CI/CD and test coverage

1. Add a real Next.js production build to `.github/workflows/ci.yml`.
2. Remove `typescript.ignoreBuildErrors: true` from `apps/web/next.config.ts`; fix all errors exposed by the strict build rather than suppressing them.
3. Make Android CI fail when signing configuration is required but missing, and fail when `apksigner verify` fails. Do not use `|| true` to hide verification failures. Clearly distinguish unsigned development artifacts from release-signed artifacts.
4. Add a working Vitest dependency and `test` script to `apps/mobile/package.json`; ensure the existing mobile tests are discovered and executed in CI.
5. Establish a web test runner and add focused tests for core server actions/API routes and the highest-risk existing workflows. Do not create superficial tests that merely assert components render.
6. Keep existing shared package, database migration replay, pgTAP, Edge Function tests, lint and typecheck checks in the pipeline.
7. Verify the restored `packages/`, `supabase/` and `scripts/` workspace paths are present and resolvable in the actual checkout/build environment.

## Workstream 3: Replace sample admin screens and stubbed APIs

1. Wire `/admin/finance` to persisted marketplace journal/accounting data, using existing `marketplace_journal_*` structures. Define totals from database records, handle empty states, and enforce finance permissions. Do not invent or seed financial transactions to make the screen look populated.
2. Wire `/admin/support` to `support_tickets`, with authorised filtering, status transitions, assignment/replies where supported by the existing schema, and audit records. Do not retain hardcoded sample tickets.
3. Complete `/admin/content` against real knowledge/content records if the schema and permissions support the intended workflow; otherwise clearly mark unavailable functions and remove sample content presented as real records. Do not implement the full agricultural PDF/RAG pipeline in Batch 02.
4. Replace or remove the static CSV response in `/api/documents/[type]` and the agronomy schedule CSV stub. Endpoints must return real authorised data or an explicit unsupported response, never fabricated operational records.
5. Replace or remove the in-memory-only `/api/engines/ledger/transact` behaviour. It must not imply a transaction was durably recorded when it only exists in process memory. Reuse the established database ledger implementation if its contract is suitable; otherwise disable the route with a clear response until a persistent implementation is approved.
6. Add tests for permissions, empty datasets, persistence, invalid input and failure handling.

## Workstream 4: Branch and documentation reconciliation

1. Inspect `origin/fix/farmer-live-records` at `4dd26ac` and `origin/vercel/install-vercel-web-analytics-bhrs3k` at `b01aebe` against the current `main`.
2. Determine whether each change is already present, safe and still relevant. Merge only if it is conflict-free, tested and in scope; otherwise close/archive with a documented reason. Do not merge blindly.
3. Update `docs/requirements-matrix.md`, `docs/AI.md` and `docs/PAYMENTS.md` so they describe the current implementation accurately, including what is implemented, partially implemented, disabled or still planned.
4. Keep the audit report and roadmap consistent with verified changes. Do not upgrade a capability's status without test or deployment evidence.

## Workstream 5: Mobile role expansion and NDPA deletion workflow

1. Add mobile role-request and verification-document upload flows by reusing `role_requests`, existing role approval rules and the private `verification-documents` storage policies.
2. Sensitive roles must remain staff-reviewed. Do not auto-approve roles that require verification.
3. Provide a mobile route to view request status and validation errors, with short-lived signed document access where appropriate.
4. Inspect the existing `request_account_deletion()`, `data_requests`, consent, audit and storage dependencies before changing deletion behaviour.
5. Implement the approved deletion/anonymisation execution workflow only where the existing data model and legal retention rules permit it. Preserve records that must legally be retained, log the decision and execution, and make retries idempotent. Do not hard-delete financial/audit records or infer consent.
6. Add tests for role isolation, document ownership, approval boundaries, deletion authorisation, retention exclusions and repeat execution.

## Engineering and safety constraints

- Work only on `stabilization/batch-02-platform-stability` and isolated test/staging environments.
- Do not change Production Supabase, Production Vercel variables, Production feature flags or Production data.
- Do not expose service-role keys or privileged credentials to mobile/web clients.
- Do not create demo records or silently fall back to hardcoded operational data.
- Preserve tenant isolation, RLS, role permissions, audit logging and existing payment/marketplace invariants from Batch 01.
- Use existing shared engines and schema where suitable; avoid parallel duplicate implementations.
- For destructive or legally consequential account deletion, inspect retention requirements and require the established authorisation path.
- Do not start Batch 03 AI memory or Farm Intelligence Engine implementation in this batch. The AI roadmap remains the next strategic phase after P1 stabilisation.

## Acceptance criteria

1. Provider evidence routes no longer crash due to missing provider context.
2. Provider decline works on Android and iOS without platform-specific prompt APIs.
3. No provider dispatch path can report demo/local work as a persisted server action.
4. Farm boundary setup never silently substitutes a fabricated farm name or location.
5. CI executes strict web production build, typecheck, lint, shared tests, mobile tests, web tests, database tests and Edge Function tests.
6. Android signing and APK verification failures are visible and fail the appropriate release job.
7. Admin finance/support/content screens display persisted authorised data or honest empty/unavailable states, not sample business records.
8. Stubbed document, agronomy schedule and ledger endpoints are either backed by real persistence/data or explicitly disabled with tested responses.
9. Both outstanding branches have a documented merge/close decision.
10. Requirements, AI and payment documentation match the verified code.
11. Mobile role requests and document uploads follow existing RBAC and storage policies.
12. Account deletion/anonymisation is authorised, auditable, idempotent and retention-aware.
13. All changes pass CI and staging regression tests; Production remains unchanged.

## Execution order

1. Inspect current `main` and the exact audit findings before edits; confirm files and current implementation have not changed since the audit.
2. Fix the mobile crash, Android interaction and unsafe demo fallbacks first.
3. Establish strict CI/build/test coverage early so later work is continuously checked.
4. Connect sample admin interfaces and stubbed APIs to persisted data or remove misleading behaviour.
5. Reconcile branches and documentation.
6. Complete mobile role expansion and the deletion workflow, subject to schema and retention review.
7. Run full regression tests, review the diff and produce a Batch 02 evidence report.
8. Request separate approval before merge or Production deployment.

## Deferred strategic work

The Farm Intelligence Engine remains a central CultivaNode objective. Its implementation is planned after P1 stabilisation: live farm context and persistent memory (Batch 03), agricultural PDF/RAG knowledge base (Batch 04), proactive monitoring and crop/livestock/inventory intelligence (Batch 05), and supplier/labour/machinery/financial intelligence (Batch 06). Permission-based autonomous execution remains a later P3 capability.
