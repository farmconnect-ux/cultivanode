# CultivaNode 3.0 — Batch 03.1C, 03.1D & 03.1E Implementation Report

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
   - Implements the **eight canonical agricultural domains** (`FARM_CONTEXT_DOMAINS`) and **seven canonical fact states** (`verified_current`, `unverified_provisional`, `stale`, `missing`, `conflicting`, `awaiting_sync`, `invalid_rejected`) per ADR-001 and ADR-007.
   - Executes 100% of domain queries through `caller.client` (zero `service_role` reads of farm data).
   - Inspects initial `farms` and `plots` query errors explicitly (`farmQueryStatus`, `plotsQueryStatus`, `coreQueryErrors`) so query failures (`auth_error`, `rls_denied`, `timeout`, `database_error`) are never converted into empty arrays or verified missing facts.
   - Paginates `farm_inventory_transactions` and `farm_machinery_usage_logs` to avoid 200-row / 100-row silent truncation, explicitly flagging incomplete ledgers/histories rather than misrepresenting bounded subsets as complete totals.
   - Queries `machinery_telemetry` in descending timestamp order (`recorded_at DESC`) to capture the newest 200 readings, then sorts chronologically ascending before running monotonic, duplicate-timestamp, implausible-value, and staleness checks.
   - Matches `weather_cache` strictly to verified farm coordinates (`<= 100 km`) or normalised `farm.state` (never attaching another location's weather) and reports `unavailable` when caller RLS denies direct `weather_cache` access.
   - Scopes marketplace records strictly to orders linked through `marketplace_produce_provenance.farm_id -> listing_id -> marketplace_order_items.order_id`, excluding unassociated or ambiguous buyer-side orders.
   - Attributes every fact to its actual evidence table and record ID (including `irrigation_zones`, `irrigation_events`, `farm_inventory_transactions`, `machinery_telemetry`, and `farm_machinery_usage_logs`) without fabricating IDs.
   - Exposes a typed Batch 03.2 extension point (`memoryExtension: { available: false, reason: 'batch_03_2_pending' }`) without assuming `farm_memory_items` exists.
3. **Central Trusted AI Audit Client (`apps/web/src/lib/ai-audit.ts`):**
   - Accepts only the branded `VerifiedAiFarmCallerContext`.
   - Persists **structured audit metadata only** (`trace_id`, `farm_id`, `provider`, `model_id`, `prompt_version`, `execution_outcome`, `guardrail_result`, `context_refs`, `memory_item_ids`). Raw user prompts, generated AI responses, and prompt/response cryptographic hashes are **not** stored by `ai-audit.ts` or `public.ai_audit_events`.
   - Validates all inputs with strict Zod schemas (rejecting unexpected keys, raw prompts, images, tokens, credentials, unsupported sources, malformed IDs, and duplicate context references).
   - Invokes `createServiceClient().rpc('write_ai_audit_event', ...)` via the approved narrow `service_role`-only `public.write_ai_audit_event(...)` wrapper migration (`20261121020000_batch_03_1c_ai_audit_writer_rpc_wrapper.sql`), failing closed on any configuration, conflict (`23505`), or persistence error.
4. **AI Route Integration & Explicit Audit Policy:**
   - `/api/engines/ai/ground` (`apps/web/src/app/api/engines/ai/ground/route.ts`) enforces `authorizeAiFarmRequest`, retrieves live farm context via `getLiveFarmContextSnapshot`, binds `farmerId` to `auth.caller.user.id`, and persists audit traces (`completed` or `failed`), failing closed (`409` on duplicate `traceId`, `503` on audit failure).
   - `/api/ai/assistant` (`apps/web/src/app/api/ai/assistant/route.ts`) enforces an explicit fail-closed audit policy:
     - **Farm-specific requests (`context.farmId` present):** Enforce `authorizeAiFarmRequest`, load `LiveFarmContextSnapshot`, execute the assistant, and persist `completed`, `blocked`, `fallback`, or `failed` audit outcomes (`409` on duplicate `traceId`, `503` on audit failure, `502` when provider fails after persisting a `failed` audit record).
     - **Farm-independent requests (`context.farmId` omitted):** After authentication (`401`), active-account (`403`), and consent (`403`) checks, **fail closed with `422 FARM_CONTEXT_REQUIRED_FOR_AUDIT`** because `public.ai_audit_events.farm_id` is `NOT NULL` and no farm-independent audit schema is approved yet. No unaudited AI execution is permitted.
5. **Enforceable ESLint Boundary (`apps/web/eslint.config.mjs`):**
   - Custom AST rule `cultivanode/no-direct-ai-audit-writer` blocks modules outside `apps/web/src/lib/ai-audit.ts` from statically referencing or invoking `write_ai_audit_event` via direct literals, schema-qualified names, template literals, string concatenation, array `.join(...)`, constant/object bindings, aliased clients, destructured/aliased `.rpc` methods, and wrapper functions, while allowing unrelated `service_role` RPCs (`process_payment_webhook`, `execute_account_deletion`).

---

## 2. Database API Boundary & Migration

- **Approved Migration (Batch 03.1C):** `supabase/migrations/20261121020000_batch_03_1c_ai_audit_writer_rpc_wrapper.sql`
- **Batch 03.1D Migrations Introduced:** **None.** All nine Batch 03.1D findings were remediated without introducing any unapproved database migration.
- **pgTAP Coverage:** `supabase/tests/database/29_batch_03_1c_ai_audit_wrapper.test.sql` (`10` assertions verifying ownership, `SECURITY DEFINER`, `search_path = ""`, zero `PUBLIC` grant, `anon`/`authenticated` `42501` denial, `service_role` delegation, idempotency, conflict rejection, and underlying writer validation).

---

## 3. Security Limitations & Pending Schema/API Dependencies

1. **Shared `service_role` credential & ESLint static-analysis limits (ADR-005):** ESLint is a static-analysis guardrail, not a PostgreSQL identity boundary. Runtime-obfuscated strings (e.g., decoded from environment variables or base64 at runtime) cannot be statically proven by AST analysis alone; PostgreSQL ACLs and `private.write_ai_audit_event` remain the authoritative database privilege boundary.
2. **Irrigation audit reference whitelist gap (requires future approved migration):** `ContextProvenance` accurately attributes irrigation facts to `irrigation_zones` and `irrigation_events`, but PostgreSQL's `private.write_ai_audit_event` (`c_allowed_sources` in `20261120020000`) does not yet whitelist `irrigation_zones` or `irrigation_events`. Adding those two table names to `c_allowed_sources` requires a separate, narrowly scoped migration approved prior to rollout.
3. **Farm-independent AI audit schema gap (requires future approved migration if desired):** `public.ai_audit_events.farm_id` is `NOT NULL` (`20261120020000`). `/api/ai/assistant` currently fails closed (`422`) when `context.farmId` is omitted. Supporting farm-independent assistant execution in a future batch requires an approved schema extension (e.g., a separate profile-scoped audit table/RPC or nullable `farm_id` with revised RLS).
4. **Weather cache RLS restriction:** `public.weather_cache` revokes all access from `anon` and `authenticated` (`20260927011448_weather_providers.sql`). Under caller RLS, `weather_and_environment` therefore reports `status: 'unavailable'` unless a farm-location-scoped read view/RPC is later approved.
5. **Buyer-side marketplace order ambiguity:** `public.marketplace_orders` has no `farm_id` column; only seller-side produce orders traceable through `marketplace_produce_provenance.farm_id` are included in farm context.
6. **Batch 03.2 Persistent Memory (`farm_memory_items`):** Intentionally not implemented in Batch 03.1C/D; represented via `PersistentMemoryExtensionPoint`.
7. **Provisional Soil-Test Validity (`365` days):** Explicitly labelled provisional pending qualified agronomy validation (ADR-007).
8. **Offline Outbox (`awaiting_sync`):** The mobile outbox is client-local (`apps/mobile/src/lib/outbox.ts`) and not yet bridged to a server table (Batch 03.3).
9. **Staging Prerequisites:** Batch 03.1B (`M1`–`M5`) and `20261121020000` have **not** been applied to `CultivaNode-Staging` or `CultivaNode-Production`. Hosted application requires separate explicit authorisation.


---

## 4. Batch 03.1E Corrective Pass

**Implementation date:** 2026-11-21  
**Scope:** Repository-only corrections arising from the second independent review. No database migration, hosted database change, deployment, secret change, feature-flag change, or merge was performed.

### 4.1 Crop-cycle lifecycle compatibility

- Corrected `loadCropIdentityDomain` to filter using the actual lifecycle values permitted by the `crop_cycles.status` check constraint: `land_preparation`, `planting`, `establishment`, `maintenance`, and `harvesting`.
- Excluded `planning` because it is not yet active cultivation, and excluded terminal states `completed` and `abandoned`.
- Added a regression test covering all eight permitted database statuses and asserting that only the five active cultivation states are returned.
- This removes the previous invalid `status = 'active'` predicate.

### 4.2 Weather timestamp and provenance semantics

- Confirmed from generated database types that `weather_cache.provider` is the table's unique key and a one-to-one foreign key to `integration_providers.code`. It is therefore a valid cache-row identifier; the earlier review's concern that it was not a row identifier is corrected.
- Retained `provider` as the `weather_cache` provenance `record_id`, but removed `fetched_at` from the audit reference's `observed_at` field. `fetched_at` is retained as retrieval metadata only.
- If the provider payload omits `now.observedAt`, the context now reports the observation timestamp as missing with null provenance rather than substituting retrieval time.
- Daily forecast rainfall is no longer labelled with an observation timestamp. Its temporal meaning is a forecast-period value, not an observed measurement.
- Added a regression test proving that missing observation time remains missing while `fetchedAt` remains available.

### 4.3 Audit metadata validation

- Restricted `modelId` to a documented identifier character set and `promptVersion` to a short version identifier character set. Free-form natural-language strings are rejected.
- Expanded secret-pattern rejection to include common `sk_live_` / `sk_test_` forms and key/secret/password assignment patterns, in addition to bearer tokens, JWT-shaped values, existing secret patterns, and image data URIs.
- Added negative tests for natural-language prompt text, free-form prompt-version text, live/test secret-shaped values, and key assignment strings.
- These checks are defence in depth, not a guarantee that every possible secret can be detected. Application call sites remain responsible for passing metadata only.

### 4.4 Remaining limitations and approval boundaries

- Irrigation facts continue to be attributed accurately in the in-memory context, but `irrigation_zones` and `irrigation_events` remain excluded from persisted audit references because the private database writer whitelist does not yet permit them. No whitelist migration was created or applied; a narrowly scoped migration requires separate approval.
- Farm-independent assistant requests continue to fail closed with HTTP 422 because the current audit schema requires a non-null `farm_id`. No schema change was introduced.
- Weather cache reads remain unavailable when caller RLS denies access. No privileged farm-data read or weather RPC was introduced.
- The changes above are committed to the existing feature branch. CI for the final corrective commit must pass, followed by a fresh independent review. PR #22 remains open and unmerged.


---

## 5. Batch 03.1F Corrective Pass

**Implementation date:** 2026-11-21  
**Scope:** Repository-only remediation of the two follow-up review findings. No database migration, hosted database change, deployment, feature-flag change, or merge was performed.

### 5.1 Guardrail audit metadata

- Replaced permissive length-only validation of `guardrail_result.rule_ids` and `guardrail_result.reason_codes` with a strict lowercase `snake_case` identifier schema.
- Applied the shared secret/data-URI rejection check to every rule ID and reason code. Free-form prose, prompt fragments, bearer/JWT-shaped strings, `sk_live_` / `sk_test_` values, and key/secret/password assignment strings are rejected before creation of the service-role client.
- Added regression tests for both arrays covering natural-language prompt fragments, secret-shaped values, bearer/JWT-shaped values, and arbitrary hyphenated text. Tests assert that invalid payloads do not invoke the service-role client or audit RPC.

### 5.2 Weather observation validity

- Separated weather-cache retrieval freshness from current-condition observation validity.
- Current temperature, humidity, and wind facts can be `verified_current` only when the cache is not stale, the farm is matched by coordinates, and the provider observation timestamp is valid, timezone-qualified ISO 8601, no more than five minutes in the future, and no older than 12 hours at retrieval.
- Missing observation timestamps leave current-condition measurements `unverified_provisional`; malformed or future-dated timestamps produce `invalid_rejected`; observations older than 12 hours produce `stale`.
- State-only location matches remain `unverified_provisional` even when their observation timestamp is valid.
- Cache `fetched_at` remains separately available as retrieval metadata. Forecast-period rainfall remains distinct from current observed conditions.
- Added regression coverage for missing, malformed, future, stale, and fresh observation timestamps, and for state-only location matching.

### 5.3 Verification status

- Regression tests were added to the existing AI audit and Live Farm Context test suite. They exercise the service through mocked caller-scoped Supabase clients; they are not live database-backed weather-service integration tests.
- CI must pass on the final Batch 03.1F commit. A fresh independent review is required before merge.
- Existing limitations remain: irrigation audit-source whitelist support, farm-independent audit schema support, and caller-RLS access to weather cache. No privileged farm-data read or unapproved schema change was introduced.
- PR #22 remains open and unmerged. No Staging or Production database changes, migrations, or deployments were performed.
