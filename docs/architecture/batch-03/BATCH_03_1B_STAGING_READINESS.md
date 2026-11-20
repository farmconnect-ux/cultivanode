# CultivaNode 3.0 — Batch 03.1B Final Staging Readiness Report

**Date:** 2026-11-20  
**Repository:** `farmconnect-ux/cultivanode`  
**PR:** #15 (`https://github.com/farmconnect-ux/cultivanode/pull/15`)  
**Branch:** `feat/batch-03-1b-database-foundations`  
**Base:** `main`  
**Verdict:** **READY WITH CONDITIONS** *(all technical, security, dependency, and CI acceptance criteria are satisfied; hosted Staging application, M4 operational enablement, and `public.audit_log` retention policy review remain explicit human-approved gates)*

---

## 1. M4 / M4.1 Compliance Lookup Rate-Limiting & Write-Suppression Report

### Verified Weaknesses Remediated
1. **Original unbounded row growth (`e468dad`):** `public.compliance_lookup_ai_actor(uuid, text)` inserted a new row into both `private.ai_compliance_lookup_limits` and `public.audit_log` on every rejected call.
2. **M4.1 write-amplification defect (`8509e46`):** Although `private.ai_compliance_lookup_throttle_state` bounded row cardinality to one row per scope, every repeated rejected call still executed an `UPDATE ... SET suppressed_count = suppressed_count + 1` against that row, creating unbounded persistent database write operations and contention under sustained abuse.

### Implemented M4.1 Remediation (`20261120030000_batch_03_1_compliance_lookup_rpc.sql`)
1. **Fail-fast pre-write eligibility checks:**
   - Unauthenticated callers (`auth.uid() IS NULL`) raise `28000` before acquiring locks or writing any rows.
   - Suspended, deleting, or deleted accounts (`NOT private.account_active(v_principal_id)` OR `deleted_at IS NOT NULL` OR `deletion_status IS NOT NULL`) return `{"status": "denied"}` immediately with **zero** persistent writes.
2. **Cooldown-based write suppression (`throttle_write_cooldown_seconds`, default `60`s, range `5..3600`s):**
   - `private.ai_compliance_lookup_limits` records **only admitted attempts** (`outcome IN ('permitted', 'denied')`), bounding active-window rows strictly by `system_attempt_limit`.
   - `private.ai_compliance_lookup_throttle_state` (RLS enabled, `postgres`-owned, all application roles revoked) stores at most one row per scope (`'unavailable:<principal>'`, `'principal:<principal>'`, `'system:global'`) with `window_started_at`, `sampled_suppression_events`, and `last_recorded_at`.
   - **Permitted throttle-state writes:**
     - **New rolling window** (`not found` or `window_started_at <= v_window_cutoff`, i.e., exact expiry boundary initiates a new rolling window): upserts the scope row with `sampled_suppression_events = 1` and emits **at most one** `public.audit_log` summary row for the window.
     - **Inside cooldown interval** (`last_recorded_at > v_now - throttle_write_cooldown_seconds`): executes **ZERO persistent DML** (no `INSERT`, `UPDATE`, or `DELETE`) and immediately returns `'unavailable'` or `'throttled'`.
     - **After cooldown expiry within the same rolling window** (`last_recorded_at <= v_now - throttle_write_cooldown_seconds` while `window_started_at > v_window_cutoff`): executes one atomic guarded `UPDATE` incrementing `sampled_suppression_events` and updating `last_recorded_at` **without** resetting `window_started_at` and **without** emitting extra `public.audit_log` rows.
3. **Explicit telemetry semantics (approximate vs. exact):**
   - **Total rejected requests:** Known only **approximately** under sustained load (intentionally not counted per request so persistent writes remain strictly bounded).
   - **Persisted throttle-state updates (`sampled_suppression_events`):** Because a new rolling window begins at the exact expiry boundary (`window_started_at <= v_window_cutoff`), permitted writes within one rolling window $[t_0, t_0 + W)$ occur only at $t_0 + kC < t_0 + W$, giving the exact mathematical bound $N_{\max} = \lceil W / C \rceil$. For the provisional defaults ($W = 900\text{s}, C = 60\text{s}$), $N_{\max} = \lceil 900 / 60 \rceil = 15$ sampled writes per scope per rolling window (the 16th write at $t_0 + 900\text{s}$ resets the rolling window with `sampled_suppression_events = 1`).
   - **Audit summary records (`public.audit_log`):** Strictly bounded to at most **1** `'throttled'` or `'unavailable'` summary row per scope per rolling window.
4. **Concurrency & lock ordering:**
   - Retains global-first, principal-second `pg_advisory_xact_lock` ordering; concurrent callers at both the slot boundary and the cooldown-expiry boundary are serialised atomically in PostgreSQL.
   - Rate-limit keys remain strictly tied to `auth.uid()` and `'system:global'` (rotating `p_actor_subject_id` or `p_purpose` cannot bypass limits or trigger writes inside cooldown), and principal isolation is preserved.

---

## 2. M3 Audit-Reference Validation Report

### Implemented Changes (`20261120020000_batch_03_1_ai_audit_events.sql`)
Strengthened `private.write_ai_audit_event(...)` database-side validation of `p_context_refs` (while retaining the division of responsibility where the future central `apps/web/src/lib/ai-audit.ts` client enforces caller JWT + farm visibility + consent):
- **`source` allowlist (25 verified existing CultivaNode `public` tables):** `farms`, `plots`, `crop_cycles`, `crop_cycle_operations`, `crop_observations`, `crop_alerts`, `crop_harvests`, `soil_records`, `farm_agronomic_standards`, `farm_inventory`, `farm_inventory_transactions`, `farm_financial_transactions`, `farm_machinery_assets`, `farm_machinery_maintenance`, `farm_machinery_usage_logs`, `machinery_telemetry`, `farm_operational_tasks`, `farm_livestock`, `farm_livestock_health_events`, `farm_livestock_production_logs`, `telemetry_readings`, `telemetry_rollups`, `weather_cache`, `marketplace_orders`, `marketplace_journal_entries`.
- **`record_id` format:** Enforces `^[A-Za-z0-9][A-Za-z0-9:_-]{0,63}$`, accepting UUIDs and compact structured slugs while rejecting whitespace, email PII, JWTs/tokens, credentials, base64 image payloads, and free text.
- **`observed_at` validation:** Enforces strict ISO-8601/RFC 3339 format regex **and** `timestamptz` parsing (rejecting impossible dates like `2026-02-31T00:00:00Z`).
- **Duplicate & size guards:** Rejects duplicate `(source, record_id)` pairs within `p_context_refs`, rejects unexpected JSON keys, and caps array length at `100` (`<= 16384` bytes).

---

## 3. M5 Prompt Governance Corrections

- **Documentation reconciled:** Updated `docs/architecture/batch-03/BATCH_03_1B_M5_PROMPT_VERSION_GOVERNANCE.md` to accurately document `public.get_active_ai_prompt(text)` (PostgreSQL-owned `SECURITY DEFINER`, `SET search_path = ''`, `EXECUTE` restricted exclusively to `service_role`) instead of the erroneous `private.get_active_ai_prompt` reference.
- **Permission & integrity tests expanded (`28_batch_03_1_prompt_version_governance.test.sql`, `plan(26)`):** Verified empty initial active-pointer table, `NULL` safe return for missing active prompts, invalid prompt key rejection (`22023`), `anon` and `service_role` revocation on all 3 management RPCs, explicit negative tests rejecting ordinary authenticated users without `ai.manage` (`42501`) on create/activate/rollback, unauthenticated rejection (`28000`), server-computed SHA-256 hash integrity, and non-toggling rollback history.

---

## 4. Account-Deletion Compatibility & Audit-Log Privacy Qualification

### Verified Account-Deletion Invariants
Reviewed `20261118020000`–`20261118050000` and M2 (`20261120010000_batch_03_1b_ai_actor_directory.sql`):
- All new AI tables (`public.ai_audit_events`, `public.ai_audit_feedback`, `private.ai_prompt_versions`, `private.ai_prompt_active_pointers`, `private.ai_prompt_activation_history`) reference `private.ai_actor_directory(actor_subject_id)` — **zero** foreign keys to `public.profiles` or `auth.users`.
- `execute_account_deletion` preserves all Batch 02.5 advisory locks, super-admin protection, active booking/order/escrow/settlement blockers, Storage cleanup queueing, lease-fencing (`4a`–`4g`), and idempotency, while invoking `private.anonymise_ai_actor(p_user_id)` transactionally.
- Expanded `22_batch_02_5_account_deletion.test.sql` (`plan(42)`) proves that deleting a profile with existing `ai_audit_events`, `ai_audit_feedback`, `ai_prompt_versions`, and `ai_prompt_activation_history` rows succeeds cleanly, retains immutable records under pseudonymous `actor_subject_id`, severs `profile_id`, and remains idempotent on retry.

### Explicit `public.audit_log` Privacy Qualification (Unresolved Policy Decision)
- **Verified fact:** `public.audit_log` (`20260926021050_identity.sql`) is strictly append-only (`private.forbid_change()`) and records `actor_id` (authenticated profile UUID). `execute_account_deletion` scrubs `public.profiles` PII and deletes `auth.users`, but **does not modify or delete `public.audit_log` rows**.
- **Privacy impact:** M4 (`compliance_lookup_ai_actor`) and M5 (`create/set_active/rollback_ai_prompt_version`) write `actor_id` into `public.audit_log` for security/compliance accountability. While `public.profiles` PII is scrubbed on deletion, the profile UUID remains in `public.audit_log`; therefore, **complete anonymisation of `public.audit_log` is NOT claimed** if any external system retains a mapping to that UUID.
- **Unresolved decision:** Documenting a formal statutory retention period or deciding whether `public.audit_log` requires future pseudonymisation/archival remains a product/legal decision outside Batch 03.1B.

---

## 5. Updated M1–M5 Migration Dependency Matrix

| Migration | Prerequisites | Objects Created | Existing Objects Modified | Downstream Dependencies | Security / Hygiene Verified |
|---|---|---|---|---|---|
| **M1** `20261120000000_batch_03_1_pgvector_and_ai_consent.sql` | `extensions` schema; `public.consent_type` | Extension `extensions.vector`; enum value `'ai_intelligence'` | `public.consent_type` (additive `ADD VALUE IF NOT EXISTS`) | Batch 03.1C consent gate; Batch 03.2 `farm_memory_items` vectors | Unpinned `CREATE EXTENSION`; isolated from DML referencing `'ai_intelligence'` |
| **M2** `20261120010000_batch_03_1b_ai_actor_directory.sql` | `private` schema; `public.profiles`; `execute_account_deletion` (`20261118050000`) | `private.ai_actor_directory`; `private.resolve_or_create_ai_actor(uuid)`; `private.anonymise_ai_actor(uuid)`; `private.lookup_ai_actor_subject(uuid)` | `public.execute_account_deletion(uuid, text)` (adds idempotent `anonymise_ai_actor` call) | M3, M4, M5 | `postgres`-owned, RLS enabled, `REVOKE ALL` from `PUBLIC, anon, authenticated, service_role`; `SECURITY DEFINER SET search_path = ''` |
| **M3** `20261120020000_batch_03_1_ai_audit_events.sql` | M2; `public.farms`; `private.forbid_change()`; `private.account_active()`; `private.can_view_farm()` | `public.ai_audit_events`; `public.ai_audit_feedback`; `private.write_ai_audit_event(...)`; `public.record_ai_feedback(...)` | None | Batch 03.1C `apps/web/src/lib/ai-audit.ts`; Batch 03.2+ | Append-only triggers; `write_ai_audit_event` `service_role`-only; `record_ai_feedback` `authenticated`-only; strict `context_refs` allowlist & format checks |
| **M4** `20261120030000_batch_03_1_compliance_lookup_rpc.sql` | M2; `private.account_active()`; `public.has_permission('audit.read')`; `public.audit_log` | `private.ai_compliance_lookup_limits`; `private.ai_compliance_lookup_throttle_state`; `private.ai_compliance_lookup_config`; `public.compliance_lookup_ai_actor(uuid, text)` | None | Staff compliance tooling (disabled by default) | Bounded writes under abuse; `authenticated`-only; `postgres`-owned `SECURITY DEFINER SET search_path = ''`; atomic advisory locks |
| **M5** `20261120040000_batch_03_1_ai_prompt_version_governance.sql` | M2; `extensions.digest`; `private.forbid_change()`; `private.account_active()`; `public.has_permission('ai.manage')`; `public.audit_log` | `private.ai_prompt_versions`; `private.ai_prompt_active_pointers`; `private.ai_prompt_activation_history`; `public.create_ai_prompt_version(...)`; `public.set_active_ai_prompt_version(...)`; `public.rollback_active_ai_prompt_version(...)`; `public.get_active_ai_prompt(text)` | None | Batch 03.1C+ AI runtime & admin prompt management | Empty initial active pointers; management RPCs `authenticated` + `ai.manage`; `get_active_ai_prompt` `service_role`-only; immutable triggers |

---

## 6. Security, Permissions & Remaining Limitations

- **Verified:** Zero dynamic SQL introduced; every `SECURITY DEFINER` function is `postgres`-owned with `SET search_path = ''`; `PUBLIC` and `anon` revoked across all M2–M5 tables and RPCs; direct access to all `private.ai_*` tables revoked from `PUBLIC, anon, authenticated, service_role`.
- **Remaining non-blocking limitations (conditions):**
  1. **Shared `service_role` application boundary (`ADR-005`):** `private.write_ai_audit_event` relies on the Batch 03.1C `apps/web/src/lib/ai-audit.ts` module boundary + ESLint guard because `apps/web` modules share `SUPABASE_SECRET_KEY`.
  2. **M4 disabled by default:** Compliance lookup remains disabled (`enabled = false`) with provisional thresholds (`10`/`5`/`30` per 15 min) pending explicit operational/security sign-off.
  3. **Permission catalogue:** `audit.read` (M4) and `ai.manage` (M5) currently resolve exclusively via `super_admin` bypass; granting them to narrower staff roles requires an explicit future decision.
  4. **`public.audit_log` retention policy:** See §4 above.

---

## 7. Operations NOT Performed

- PR #15 was **not** merged.
- **No** migrations were applied to `CultivaNode-Staging` (`xdbqndgwisshhjqqksbe`) or `CultivaNode-Production` (`vqbtnftnxyfaembwgfrk`).
- **No** `supabase db push`, migration repair, Vercel deployment, feature-flag change, or environment-variable change was executed.
- Batch 03.1C / Live Farm Context implementation was **not** started.
