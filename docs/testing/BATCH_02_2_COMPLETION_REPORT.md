# Batch 02.2 Completion Report — Complete, Integrate and Verify Existing Platform Functionality

**Branch:** `stabilization/batch-02-2-complete-integrations`  
**Base Commit (`main`):** `529773d` (*Batch 02.1: Stabilise mobile provider dispatch workflows*)  
**Date:** 2026-11-18

---

## 1. Workstream Summaries

### Workstream A — Admin Finance Dashboard
- **Original Issue:** `apps/web/src/app/admin/(console)/finance/page.tsx` rendered static sample `PlatformFinance` (`INITIAL_LEDGER`) with no `requireStaff()`, no permission checks, and no DB queries. No settlement approval RPC existed.
- **Changes Made:**
  - Added `public.admin_process_marketplace_settlement(uuid, text, text)` in [20261118000000_admin_settlement_rpc.sql](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/migrations/20261118000000_admin_settlement_rpc.sql) (`SECURITY DEFINER SET search_path = ''`, gated by `payouts.approve`, validates transitions, posts balanced `'payout'` double-entry ledger entries, writes `admin_actions`).
  - Added `processSettlementAction` in [admin-finance.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/actions/admin-finance.ts), live [FinanceConsole](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/components/admin/finance-console.tsx), and live [admin/(console)/finance/page.tsx](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/app/admin/(console)/finance/page.tsx) querying `marketplace_ledger_accounts`, `marketplace_journal_entries`, `marketplace_journal_postings`, `marketplace_payments`, `marketplace_escrows`, and `marketplace_settlements` with search/status/provider/date filters.
  - Added `perm: ["ledger.read", "payments.read", "payouts.approve"]` in [nav-config.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/components/ds/nav-config.ts).

### Workstream B — Admin Support Dashboard & User Ticket Thread
- **Original Issue:** `apps/web/src/app/admin/(console)/support/page.tsx` rendered static `SupportDesk` (`TICKETS` array) with no DB integration; users had no reply/thread UI on `/account/settings` and `createSupportTicket` revalidated `/settings` instead of `/${lang}/account/settings`.
- **Changes Made:**
  - Added [admin-support.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/actions/admin-support.ts) (`updateSupportTicketAction` with `ALLOWED_TICKET_TRANSITIONS`, `postSupportMessageAction` for public replies and `is_internal = true` staff notes), gated by `website_inbox.manage`.
  - Replaced `SupportDesk` on [admin/(console)/support/page.tsx](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/app/admin/(console)/support/page.tsx) with live [SupportConsole](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/components/admin/support-console.tsx).
  - Added `replyToSupportTicket` in [ecosystem.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/actions/ecosystem.ts) and thread/reply UI in [account/settings/page.tsx](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/app/[lang]/account/settings/page.tsx) (RLS hides `is_internal = true` notes from requesters).
  - Added `perm: ["website_inbox.manage"]` in [nav-config.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/components/ds/nav-config.ts).

### Workstream C — API Routes & Security Defects
- **[engines-api-helper.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/lib/engines-api-helper.ts):** Removed critical fallback to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and hardcoded `'cultivanode-stateless-engine-secret-key-2026'`; fails closed (`503`) when `ENGINE_JWT_SECRET` is unset. Added `parseJsonBody()` Zod helper.
- **[/api/ai/health](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/app/api/ai/health/route.ts):** Returns `401` JSON when unauthenticated and `403` JSON when non-staff (instead of `307` redirect).
- **[/api/ai/assistant](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/app/api/ai/assistant/route.ts) & [ai-assistant.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/actions/ai-assistant.ts):** Bound `farmerId` to the authenticated user, added Zod validation, and returned `400` on malformed JSON.
- **[/api/engines/ledger/transact](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/app/api/engines/ledger/transact/route.ts):** Replaced ephemeral in-memory `new CryptographicLedger()` with `record_marketplace_journal_entry` RPC persistence (via `createServiceClient()`, `503` if unconfigured).
- **[/api/engines/agronomy/* & /api/engines/ai/*](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/app/api/engines/agronomy/schedule/route.ts):** Added Zod validation on all `POST` endpoints; replaced hardcoded 5-row CSV in `GET /api/engines/agronomy/schedule` with dynamic CSV from `CROP_CATALOGUE`.
- **[/api/documents/[type]](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/app/api/documents/[type]/route.ts):** Unknown `type` returns `404` instead of falling back to `whitepaper`.

### Workstream D & E — Mobile Role Requests & Document Uploads
- **[apps/mobile/src/lib/account.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/mobile/src/lib/account.ts):** Added `loadRoleRequests()`, `loadVerificationDocuments()`, `requestRole()` (`23505`/`P0001` error mapping), `cancelRoleRequest()`, `validateVerificationFile()`, `uploadVerificationDocument()` (private `verification-documents` bucket `${userId}/${uuid}.${ext}` + orphan cleanup on DB failure), and `getVerificationDocumentSignedUrl()` (600s signed URLs).
- **[RolesScreen.tsx](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/mobile/src/screens/RolesScreen.tsx), [me/roles.tsx](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/mobile/src/app/me/roles.tsx), [MeScreen.tsx](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/mobile/src/screens/MeScreen.tsx), [(tabs)/me.tsx](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/mobile/src/app/(tabs)/me.tsx):** Added native Roles & Documents screen supporting role requests, request history/review notes, cancel pending, and camera/gallery verification document upload + signed URL viewing.

### Workstream F — Branch Reconciliation
- Inspected `origin/fix/farmer-live-records` (`4dd26ac`, superseded Oct 9 `farmer-community` refactor), `origin/vercel/install-vercel-web-analytics-bhrs3k` (`b01aebe`, unrelated feature), and `origin/security/batch-02-payment-reliability` (`f982c1a`, withdrawn scope). None merged into Batch 02.2.

---

## 2. Automated Tests Added
- **pgTAP ([20_batch_02_2_security.test.sql](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/tests/database/20_batch_02_2_security.test.sql), `plan(12)`):** Settlement permission/transition/ledger posting (`1`–`4`), support internal-note isolation (`5`–`7`), duplicate role request / non-self-approval / document path & size checks (`8`–`12`).
- **Web Vitest ([batch-02-2.test.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/__tests__/batch-02-2.test.ts), `apps/web/vitest.config.mts`):** API auth fail-closed, `/api/ai/health` `401`/`403`, `/api/ai/assistant` `400`/`401`, `/api/engines/agronomy/schedule` CSV, `/api/documents/[type]` `404`, `processSettlementAction`, and `updateSupportTicketAction`/`postSupportMessageAction`.
- **Mobile Vitest ([account-roles-docs.test.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/mobile/src/lib/__tests__/account-roles-docs.test.ts)):** Role request validation/errors, `cancel_role_request`, 5 MB / MIME validation, storage cleanup on DB failure, and 600s signed URLs.

---

## 3. Verification & Limitations
- **CI Execution (PR [#8](https://github.com/farmconnect-ux/cultivanode/pull/8), GitHub Actions Run `44205478491` on commit `e2d488a`):**
  - **Database migrations and RLS tests** (Job `134470178866`): **PASS** (`Files=20, Tests=709`, `Result: PASS`, including all 12 assertions in `20_batch_02_2_security.test.sql`).
  - **Typecheck, lint and unit tests** (Job `134470179278`): **PASS**:
    - `npm run typecheck`: `4 successful, 4 total` (`@cultivanode/iot-module`, `@cultivanode/shared`, `@cultivanode/mobile`, `@cultivanode/web`).
    - `npm run lint`: `1 successful, 1 total`.
    - `npm run test`: `4 successful, 4 total` (`@cultivanode/iot-module` 20 passed, `@cultivanode/web` 1 file / 7 tests passed, `@cultivanode/mobile` 6 files passed including `account-roles-docs.test.ts` 5 tests, `@cultivanode/shared` 32 files passed).
    - `npm run build`: **PASS**.
- **Physical Device / PDF Picker Limitation:** Mobile document upload uses `expo-image-picker` (camera/gallery JPEG/PNG/WebP); `expo-document-picker` for native PDF selection was not added to avoid native binary/Expo prebuild changes in this batch. Physical Android/iOS device QA remains pending.
- **Production Safety:** Production Supabase (`vqbtnftnxyfaembwgfrk`) and Production Vercel remain untouched.
