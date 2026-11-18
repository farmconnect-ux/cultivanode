# Batch 02.2 Completion Report — Complete, Integrate, Verify & Independent Review Corrections

**Branch:** `stabilization/batch-02-2-complete-integrations`  
**Base Commit (`main`):** `529773da0acc6b8c30a869bc96f2961aff1fa3d9`  
**Pull Request:** [PR #8](https://github.com/farmconnect-ux/cultivanode/pull/8) (*Batch 02.2: Complete Admin, API and Mobile Platform Integrations*)  
**Date:** 2026-11-18

---

## 1. Original Batch 02.2 Requirements & Classification Summary

| Workstream | Requirement | Classification | Notes |
| --- | --- | --- | --- |
| **A. Admin Finance** | Live DB-backed `/admin/finance`, settlement approval RPC, authoritative totals & pagination | **Complete** | Verified by pgTAP (`20`, `21`), live concurrency tests, Vitest, and Next.js build |
| **B. Admin Support** | Live DB-backed `/admin/support`, atomic ticket updates/audit, pagination, user reply thread | **Complete** | Verified by pgTAP (`20`, `21`), live concurrency tests, Vitest, and Next.js build |
| **C. Web API & Actions** | Fail-closed `ENGINE_JWT_SECRET`, JSON `401`/`403`, `farmerId` binding, Zod validation, persistent ledger | **Complete** | Verified by `apps/web/src/__tests__/batch-02-2.test.ts` (8/8 tests) |
| **D. Mobile Role Requests** | Native role request form, history, cancel pending, staff approve/reject lifecycle | **Complete (logic/DB); Partially complete (device QA)** | Verified by DB pgTAP & mobile Vitest; physical device QA pending |
| **E. Mobile Verification Docs** | Native image + PDF upload, 5 MB/MIME validation, private Storage bucket, orphan cleanup, signed URLs | **Complete (logic/DB); Partially complete (device QA)** | `expo-document-picker` (`~57.0.3`) + `expo-image-picker` integrated; physical iOS/Android device QA pending |
| **F. Branch Reconciliation** | Inspect `4dd26ac`, `b01aebe`, `f982c1a` without auto-merging | **Complete** | Documented below; none merged |

---

## 2. Independent Review Corrections Implemented

### Correction A — Financial Ledger Integrity & Concurrency Protection
- **Migration:** [20261118010000_batch_02_2_financial_and_support_hardening.sql](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/migrations/20261118010000_batch_02_2_financial_and_support_hardening.sql)
- `public.record_marketplace_journal_entry` acquires `pg_advisory_xact_lock(hashtext('marketplace_journal_chain'))` before reading the latest `current_hash` and `created_at`.
- Uses strictly monotonic `clock_timestamp()` (bumping by `1 microsecond` if `clock_timestamp() <= v_last_created_at`) so `created_at` matches lock/commit order even when concurrent transactions start at different `now()` timestamps.
- Validates non-empty `p_reference_id`, `p_reference_type`, `p_description`, JSON array `p_postings` (`>= 2` lines), active `marketplace_ledger_accounts` existence, `DEBIT`/`CREDIT` direction, integer positive `amount_kobo`, and `SUM(DEBIT) = SUM(CREDIT) > 0`.
- Added partial unique index `mkt_journal_one_payout_idx` on `public.marketplace_journal_entries (reference_id) where (reference_type = 'payout')`.

### Correction B — Settlement Processing & Financial Controls
- `public.admin_process_marketplace_settlement(uuid, text, text)` (`SECURITY DEFINER SET search_path = ''`, `payouts.approve` gated at DB boundary):
  - Locks `marketplace_settlements` (`FOR UPDATE`), enforces valid transitions (`pending -> processing|completed|failed`, `processing -> completed|failed`), and blocks re-processing `'completed'`/`'failed'` rows.
  - Verifies `gross_amount_kobo = commission_kobo + net_payout_kobo`.
  - Locks linked `marketplace_escrows` row (`FOR UPDATE`) and verifies `seller_id`, `status = 'released'`, `amount_kobo`, `commission_kobo`, and `seller_net_kobo` reconciliation before updating or posting `'payout'` ledger entries.
  - Inserts `admin_actions` audit record in the same transaction.

### Correction C — Complete & Accurate Finance Dashboard
- Added authoritative DB-side RPCs in [20261118010000_batch_02_2_financial_and_support_hardening.sql](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/migrations/20261118010000_batch_02_2_financial_and_support_hardening.sql):
  - `admin_finance_summary()` (computes full ledger account debits/credits/balances, commission, payment totals by status & provider, escrow totals, and settlement totals in integer kobo; withholds ledger accounts when caller lacks `ledger.read`).
  - `admin_finance_journal_entries()`, `admin_finance_payments()`, and `admin_finance_settlements()` (server-side search, status/provider/date filtering BEFORE `LIMIT`/`OFFSET`, `pageSize = 25`).
- Updated [admin/(console)/finance/page.tsx](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/app/admin/(console)/finance/page.tsx) and [finance-console.tsx](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/components/admin/finance-console.tsx).

### Correction D — Support Ticket Atomicity, Auditing & Pagination
- Added atomic RPCs `admin_update_support_ticket(uuid, text, text, uuid)`, `admin_post_support_message(uuid, text, boolean)`, `admin_support_summary()`, and `admin_support_tickets_page(text, text, text, int, int)`.
- Ticket updates and message posts insert into `admin_actions` inside the same DB transaction (`FOR UPDATE` row lock + transition check).
- Updated [admin-support.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/actions/admin-support.ts) and [admin/(console)/support/page.tsx](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/app/admin/(console)/support/page.tsx) (`pageSize = 25`, SLA overdue metric).

### Correction E — Mobile Verification Document Uploads & Storage Policy
- Added `expo-document-picker` (`~57.0.3`) to [apps/mobile/package.json](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/mobile/package.json) and wired `"Choose PDF / file"` alongside camera & gallery in [RolesScreen.tsx](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/mobile/src/screens/RolesScreen.tsx).
- Hardened `uploadVerificationDocument()` in [apps/mobile/src/lib/account.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/mobile/src/lib/account.ts) to verify `supabase.auth.getUser()` ownership and validate actual `bytes.byteLength` (rejecting spoofed empty files).
- Added Storage `DELETE` policy `"verification documents: owner deletes own"` on `storage.objects` in [20261118010000_batch_02_2_financial_and_support_hardening.sql](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/migrations/20261118010000_batch_02_2_financial_and_support_hardening.sql) so orphan cleanup succeeds for the owner without allowing cross-user deletion.

### Correction F & G — Role Request Lifecycle & API Route Hardening
- Verified full role request lifecycle in DB pgTAP (`cancel_role_request`, `review_verification_document`, `approve_role_request` -> `user_roles`, `reject_role_request` with reason, unauthorized `42501` checks) and mobile Vitest.
- Verified all 11 API routes/actions in [batch-02-2.test.ts](file:///d:/New%20BAckup/Cultivanode/cultivanode/apps/web/src/__tests__/batch-02-2.test.ts).

---

## 3. Database Migrations & Security/Storage Changes

- [supabase/migrations/20261118000000_admin_settlement_rpc.sql](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/migrations/20261118000000_admin_settlement_rpc.sql): Initial `admin_process_marketplace_settlement` RPC.
- [supabase/migrations/20261118010000_batch_02_2_financial_and_support_hardening.sql](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/migrations/20261118010000_batch_02_2_financial_and_support_hardening.sql): Ledger advisory lock & validation, `mkt_journal_one_payout_idx`, reconciled settlement RPC, Finance & Support aggregation/pagination RPCs, atomic Support audit RPCs, and `verification-documents` owner `DELETE` Storage policy.

---

## 4. Branch Reconciliation Findings

| Remote Branch | Head SHA | Summary | Decision |
| --- | --- | --- | --- |
| `origin/fix/farmer-live-records` | `4dd26ac` | Oct 9 partial farmer-community dashboard live-records fix; superseded by Oct 9–10 `farmer-community` refactor in `main` | **Do not merge** (superseded) |
| `origin/vercel/install-vercel-web-analytics-bhrs3k` | `b01aebe` | Sep 28 `@vercel/analytics` + CSP setup | **Do not merge** (unrelated analytics feature; keep if desired in a separate PR) |
| `origin/security/batch-02-payment-reliability` | `f982c1a` | Nov 17 `docs/security/BATCH_02_PAYMENT_RELIABILITY.md` added and immediately withdrawn | **Do not merge** (withdrawn; zero unique code/security logic) |

---

## 5. Verification Evidence & Limitations

- **Storage Security (`verification-documents` bucket & `storage.objects` RLS):**
  - Inspected policies: `"verification documents: owner uploads to own folder"` (`INSERT`), `"verification documents: owner or reviewer reads"` (`SELECT` for owner or `public.has_permission('verification.review')`), `"verification documents: owner deletes own"` (`DELETE`, added in `20261118010000_batch_02_2_financial_and_support_hardening.sql`), and verified absence of any `UPDATE` policy.
  - Behavioural tests executed under `SET LOCAL ROLE authenticated` in `21_batch_02_2_hardening.test.sql` (`E1`–`E11`):
    - Owner upload to own `${uid}/...` folder succeeds (`E3`); cross-user upload to another user's folder rejected with `42501` (`E4`).
    - Owner read succeeds (`E5`); unrelated user read returns 0 rows (`E6`); support staff without `verification.review` returns 0 rows (`E7`); staff with `verification.review` reads object (`E8`).
    - Cross-user `UPDATE` cannot rename/overwrite owner object (`E9`); `DELETE` policy predicate restricts deletion to owner folder via `auth.uid()` (`E10`); no permissive `UPDATE` policy exists (`E11`).
  - **Storage Limitation:** `supabase db start` in CI starts the Postgres container without the `storage-api` HTTP container, and `storage.protect_delete()` blocks direct SQL `DELETE` on `storage.objects`. Therefore, HTTP `storage-api` signed-URL minting/fetching and `storage-api`-mediated `remove()` are covered by mocked client unit tests (`account-roles-docs.test.ts`, 600s signed URL & cleanup on DB failure) while full-stack HTTP Storage execution remains an environment-level check. Note also that an already-issued signed URL is a time-limited (600s) bearer credential.
- **Support Concurrency & Audit Verification (`supabase/tests/concurrency-check.mjs`):**
  - **Scenario 3a (`resolved` holds `FOR UPDATE` lock first):** Competing `pending` update blocked until `resolved` committed, was rejected (`Cannot move ticket from resolved to pending`), left final status `'resolved'`, and recorded exactly 1 audit row (`support_ticket_resolved`) with 0 orphan audit rows.
  - **Scenario 3b (`pending` holds `FOR UPDATE` lock first):** Competing `resolved` update blocked and then legitimately succeeded (`pending -> resolved`), leaving final status `'resolved'` and 2 sequential audit rows (`support_ticket_pending`, then `support_ticket_resolved`).
  - **Scenario 3c (uncontrolled simultaneous race):** Verified final status `'resolved'` and strictly valid serialised audit trail (`support_ticket_resolved`).
- **GitHub Actions CI Run `44248911344` (on code commit `7c7663e`):**
  - **Database migrations and RLS tests** (Job `134614500754`, `supabase test db` + `node supabase/tests/concurrency-check.mjs`): **PASS** (1m2s)
    - pgTAP: `Files=21, Tests=747, Result: PASS` (includes `20_batch_02_2_security.test.sql` and `21_batch_02_2_hardening.test.sql`).
    - Live Postgres concurrency (`supabase/tests/concurrency-check.mjs`): **PASS** (ledger hash chain, settlement race, and support concurrency scenarios `3a`, `3b`, `3c`).
  - **Typecheck, lint and unit tests** (Job `134614500454`): **PASS** (3m8s)
    - `npm run typecheck`: `4 successful, 4 total`
    - `npm run lint`: `1 successful, 1 total`
    - `npm run test`: `4 successful, 4 total` (`@cultivanode/iot-module` 20 passed; `@cultivanode/web` `batch-02-2.test.ts` 8/8 passed; `@cultivanode/mobile` 6 files / 65 tests passed including `account-roles-docs.test.ts` 6/6; `@cultivanode/shared` 32 files passed)
    - `npm run build`: **PASS**
  - **Vercel Preview:** **PASS** (`Deployment has completed`).
- **Outstanding Physical-Device & External-Service Limitations:**
  - No physical iOS or Android device was connected; `expo-document-picker` and `expo-image-picker` native file pickers require physical-device / Expo dev-client QA before mobile store release.
  - Production Supabase (`vqbtnftnxyfaembwgfrk`), Staging Supabase (`xdbqndgwisshhjjqksbe`), and Production Vercel were not modified.

---

## 6. Final Independent Verification (Storage API, Least-Privilege Reviewer & Deterministic Concurrency)

- **Code Verification CI Run:** [44251341664](https://github.com/farmconnect-ux/cultivanode/actions/runs/44251341664) on code commit `bab7916` (Jobs: `Database migrations and RLS tests` `134622507397` **PASS**, `Typecheck, lint and unit tests` `134622507041` **PASS**, `Vercel` **PASS**).
- **1. Live Supabase Storage API Integration ([storage-api-check.mjs](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/tests/storage-api-check.mjs)):**
  - **Environment:** Isolated local Supabase stack (`supabase start -x studio,inbucket,logflare,vector,analytics,pgadmin,imgproxy,edge-runtime,realtime`) exposing GoTrue Auth + PostgREST + Storage API (`127.0.0.1:54321`) and Postgres (`127.0.0.1:54322`).
  - **Disposable Accounts:** `owner`, `outsider`, `reviewer` (`admin_role = 'verification_officer'`, possessing `verification.review`, `roles.review`, `users.read`, `farms.read` — no `super_admin` or finance/support permissions), and `supportStaff` (`admin_role = 'support_disputes'`, no `verification.review`), all deleted in `finally`.
  - **Operations Exercised & Results:**
    - Bucket restrictions: Rejected disallowed `text/plain` (`400`) and `>5 MB` (`400`) uploads — **PASS**.
    - Owner access: Uploaded PDF to `${owner.id}/${uuid}.pdf` (`200`), downloaded exact bytes (`200`), created 600s signed URL (`200`), and fetched exact PDF bytes via HTTP signed URL (`200`) — **PASS**.
    - Cross-user isolation: `outsider` upload to owner folder, download, `createSignedUrl`, `x-upsert: true` overwrite, and `DELETE` were all rejected; owner download confirmed object remained intact — **PASS**.
    - Reviewer least-privilege access: `supportStaff` (without `verification.review`) denied download & `createSignedUrl`; `reviewer` (`verification_officer`) created 600s signed URL and fetched exact PDF bytes (`200`) — **PASS**.
    - Owner deletion: `owner` deleted object via `DELETE /storage/v1/object/verification-documents` (`200`, 1 deleted object), and subsequent download and `createSignedUrl` failed — **PASS**.
- **2. Narrowly Permissioned Reviewer Tests ([21_batch_02_2_hardening.test.sql](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/tests/database/21_batch_02_2_hardening.test.sql), `Files=21, Tests=750, Result: PASS`):**
  - Replaced `super_admin` with `verification_officer` (`d7000000-...007`) for `E8` (`storage.objects` read), `review_verification_document`, `F3` (`approve_role_request`), and `F5` (`reject_role_request`).
  - Verified `F2b`–`F2d`: `verification_officer` is rejected (`42501`) from `admin_finance_summary()`, `admin_support_summary()`, and `admin_process_marketplace_settlement()`.
- **3. Deterministic Support Concurrency ([concurrency-check.mjs](file:///d:/New%20BAckup/Cultivanode/cultivanode/supabase/tests/concurrency-check.mjs)):**
  - **Coordination Mechanism:** `waitForTicketLock(appName)` polls `pg_locks` (`RowExclusiveLock` on `public.support_tickets`, `granted = true`) joined with `pg_stat_activity` (`application_name` + `query LIKE '%pg_sleep%'`) before launching the competing transaction, guaranteeing `tx1` has executed `SELECT ... FOR UPDATE` and holds the uncommitted row lock.
  - **Scenario 3a (`resolved` holds lock first):** Competing `pending` transition blocked and was rejected (`Cannot move ticket from resolved to pending`), final status `'resolved'`, 1 audit row (`support_ticket_resolved:from=open, status=resolved, priority=high`), 0 orphan audit rows — **PASS**.
  - **Scenario 3b (`pending` holds lock first):** Competing `resolved` transition blocked and succeeded via `pending -> resolved`, final status `'resolved'`, 2 sequential audit rows (`support_ticket_pending` then `support_ticket_resolved`) — **PASS**.
  - **Scenario 3c (uncontrolled simultaneous race):** Final status `'resolved'` with valid serialised audit trail — **PASS**.
- **Physical-Device QA Distinction:** All automated backend, Storage API, web, and mobile unit checks are verified in CI; native `expo-document-picker` / `expo-image-picker` testing on physical Android and iOS devices remains a separate release-readiness activity.
