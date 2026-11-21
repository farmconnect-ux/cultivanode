# CultivaNode 3.0 — Batch 03.1C Implementation Report

**Date:** 2026-11-21  
**Repository:** `farmconnect-ux/cultivanode`  
**Branch:** `feat/batch-03-1c-application-integration`  
**Starting Commit:** `acc80a1732187957d1e1c144c841e3649b05fe71` (synced via fast-forward merge with `origin/main` @ `5e4a5e35ced9450ba581dc64d12c151cfc556748`, incorporating PR #21)  
**Hosted Environments:** **CultivaNode-Staging and CultivaNode-Production were NOT modified.**

---

## 1. Architecture & Data Flow

1. **Authenticated Server Gate (`apps/web/src/lib/engines-api-helper.ts`):**
   - `authorizeFarmRequest(req, farmId, options)` verifies the caller's Supabase Bearer JWT via `client.auth.getUser(token)` (never `getSession()`, never `user_metadata`), verifies active-account status against `public.profiles` (`suspended_at IS NULL && deleted_at IS NULL && deletion_status IS NULL`), verifies farm visibility against `public.farms` under the caller's RLS-scoped JWT, and verifies `ai_intelligence` consent against `public.current_consents` (`security_invoker = true`).
   - `authorizeAiFarmRequest(req, farmId)` enforces all four gates and returns a module-branded `VerifiedAiFarmCallerContext`.
2. **RLS-Scoped Live Farm Context (`apps/web/src/lib/farm-context/live-farm-context.service.ts` + `packages/shared/src/engines/farm-context/`):**
   - Executes 100% of domain queries through `caller.client` (zero `service_role` reads of farm data).
   - Retrieves all 8 canonical domains in parallel with explicit column selection and bounded row limits.
   - Applies ADR-007 7-state provenance, staleness, and conflict rules; distinguishes domain query errors (`status: 'error'`) from absent data (`status: 'empty'`); never coerces null/missing values to zero.
   - Exposes a typed Batch 03.2 extension point (`memoryExtension: { available: false, reason: 'batch_03_2_pending' }`) without assuming `farm_memory_items` exists.
3. **Central Trusted AI Audit Client (`apps/web/src/lib/ai-audit.ts`):**
   - Accepts only the branded `VerifiedAiFarmCallerContext`.
   - Validates all inputs with strict Zod schemas (rejecting raw prompts, response bodies, images, tokens, credentials, unexpected keys, unsupported sources, malformed IDs, and duplicate context references).
   - Invokes `createServiceClient().rpc('write_ai_audit_event', ...)` via the approved narrow `service_role`-only `public.write_ai_audit_event(...)` wrapper migration (`20261121020000_batch_03_1c_ai_audit_writer_rpc_wrapper.sql`), failing closed on any configuration, conflict (`23505`), or persistence error.
4. **AI Route Integration:**
   - `/api/engines/ai/ground` (`apps/web/src/app/api/engines/ai/ground/route.ts`) enforces `authorizeAiFarmRequest`, retrieves live farm context via `getLiveFarmContextSnapshot`, binds `farmerId` to `auth.caller.user.id`, and records the audit trace via `recordAiAuditEvent` (failing closed with `503` on audit failure).
   - `/api/ai/assistant` (`apps/web/src/app/api/ai/assistant/route.ts`) enforces active account + `ai_intelligence` consent on all requests; when `context.farmId` is supplied, enforces `authorizeAiFarmRequest`, retrieves live farm context, and records `completed`/`blocked`/`fallback` audit traces without storing raw prompts, outputs, or images.
5. **Enforceable ESLint Boundary (`apps/web/eslint.config.mjs`):**
   - Custom AST rule `cultivanode/no-direct-ai-audit-writer` blocks every module outside `apps/web/src/lib/ai-audit.ts` from referencing or invoking `write_ai_audit_event` (bare, `public.`, `private.`, computed property, template literal, or variable indirection), while allowing unrelated `service_role` RPCs (`process_payment_webhook`, `execute_account_deletion`).

---

## 2. Database API Boundary & Migration

- **Migration:** `supabase/migrations/20261121020000_batch_03_1c_ai_audit_writer_rpc_wrapper.sql`
- **Rationale:** `supabase/config.toml` exposes only `["public", "graphql_public"]`; exposing the entire `private` schema to PostgREST would be disproportionate. A single `postgres`-owned `SECURITY DEFINER` (`SET search_path = ''`) wrapper in `public`, delegating strictly to `private.write_ai_audit_event(...)` with `EXECUTE` revoked from `PUBLIC, anon, authenticated, service_role` and granted exclusively to `service_role`, matches M5 (`public.get_active_ai_prompt`) and Batch 02.5 (`public.execute_account_deletion`).
- **pgTAP Coverage:** `supabase/tests/database/29_batch_03_1c_ai_audit_wrapper.test.sql` (`10` assertions verifying ownership, `SECURITY DEFINER`, `search_path = ""`, zero `PUBLIC` grant, `anon`/`authenticated` `42501` denial, `service_role` delegation, idempotency, conflict rejection, and underlying writer validation).

---

## 3. Security Limitations & Unimplemented Dependencies

1. **Shared `service_role` credential (ADR-005):** Isolating `write_ai_audit_event` inside `apps/web/src/lib/ai-audit.ts` is an application-architecture and ESLint boundary, not an independent PostgreSQL identity boundary.
2. **Batch 03.2 Persistent Memory (`farm_memory_items`):** Intentionally not implemented in Batch 03.1C; represented via `PersistentMemoryExtensionPoint`.
3. **Provisional Soil-Test Validity (`365` days):** Explicitly labelled provisional pending qualified agronomy validation (ADR-007).
4. **Offline Outbox (`awaiting_sync`):** The mobile outbox is client-local (`apps/mobile/src/lib/outbox.ts`) and not yet bridged to a server table (Batch 03.3); the contract helper supports `awaiting_sync` once synced server-side.
5. **Staging Prerequisites:** Batch 03.1B (`M1`–`M5`) and this Batch 03.1C wrapper migration (`20261121020000`) have **not** been applied to `CultivaNode-Staging` or `CultivaNode-Production`. Hosted application requires separate explicit authorisation.
