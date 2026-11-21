# CultivaNode 3.0 — Batch 03.3 Architecture, Security Review & Staging Verification Plan
## Scheduler Identity, Privilege Hardening and Machinery Telemetry Provenance

**Date:** 2026-11-21  
**Repository:** `farmconnect-ux/cultivanode`  
**Branch:** `feat/batch-03-3-scheduler-telemetry-provenance`  
**Base (`main`):** `eb1e1669990b418a37f74c99c05303ead8fdab50`  
**Hosted Environments:** **CultivaNode-Staging (`xdbqndgwisshhjqqksbe`) and CultivaNode-Production (`vqbtnftnxyfaembwgfrk`) were NOT modified. No hosted migrations were applied.**

---

## 1. Workstream A — Scheduler Identity & Supabase Hosted `pg_cron` Feasibility

### A1. Dedicated Role & Narrow Wrapper Architecture
- Created `cultivanode_scheduler` (`NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`) with `USAGE` on `private` ONLY and zero direct privileges on `public.*` tables or individual scheduled task functions (`private.expire_bookings()`, `private.wake_notify_worker()`, `private.auto_confirm_bookings()`).
- Created explicit task allowlist `private.scheduled_task_registry`, structured execution ledger `private.scheduled_task_runs`, and narrow wrapper `private.run_scheduled_task(p_task_name text)` (`SECURITY DEFINER`, `SET search_path = ''`, owned by `postgres`, granted exclusively to `cultivanode_scheduler`):
  - Rejects JWT-authenticated sessions (`request.jwt.claim.sub is not null`).
  - Validates `session_user in ('cultivanode_scheduler', 'postgres', 'supabase_admin')`.
  - Validates strict identifier format (`^[a-z][a-z0-9_]{2,63}$`) and `is_enabled = true` in `private.scheduled_task_registry`.
  - Uses static `CASE` dispatch ONLY (zero dynamic `EXECUTE` SQL).
  - Enforces per-task concurrency fencing via `pg_try_advisory_xact_lock(hashtextextended('cultivanode_scheduler:' || p_task_name, 0))`, recording `skipped_concurrent` when locked.
  - Wraps each task in a subtransaction so task failures roll back partial writes cleanly while durably persisting the `failed` ledger row with `trace_id`, `duration_ms`, and `error_code`.

### A2. Honest Supabase Hosted `pg_cron` Feasibility Finding
- On Supabase Hosted (`PostgreSQL 17.12`), `cron.alter_job` is owned by `supabase_admin` and `postgres` is non-superuser (`rolsuper = false`, `rolcreaterole = true`).
- `pg_cron` restricts non-superuser callers from reassigning `cron.job.username` to a different role (`must be superuser to alter username` in `pg_cron`).
- Therefore, migration `20261123000000_batch_03_3_scheduler_identity_and_wrapper.sql`:
  1. Re-registers all 3 jobs cleanly to invoke `select private.run_scheduled_task('<task_name>')` (eliminating direct task calls and duplicate jobs).
  2. Attempts `cron.alter_job(job_id, username := 'cultivanode_scheduler')` inside a guarded exception block.
  3. Records the **actual** resulting `cron.job.username` in `private.scheduled_task_registry.effective_cron_username` and `username_assignment_note` — never falsely claiming `cultivanode_scheduler` if Hosted `pg_cron` retained `postgres`.
- **Staging Verification Plan (separate authorised phase):** After applying `20261123000000` to `CultivaNode-Staging`, run:
  ```sql
  select j.jobid, j.jobname, j.schedule, j.username, j.command, r.effective_cron_username, r.username_assignment_note
    from cron.job j
    left join private.scheduled_task_registry r on r.cron_job_name = j.jobname
   order by j.jobname;
  ```

---

## 2. Workstream B — Machinery Telemetry Provenance & Farm Context Integration

- Extended `public.machinery_telemetry` in-place (no duplicate telemetry table) via `20261123010000_batch_03_3_machinery_telemetry_provenance.sql`:
  - Added `public.machinery_device_links` (`FORCE RLS`, unique active device link, cross-farm machinery trigger).
  - Added `source_category` (`device_authenticated`, `trusted_provider_integration`, `farmer_observation`, `staff_observation`, `unverified_provisional`), `source_device_id`, `source_provider`, `actor_id`, `ingested_at`, `validation_status`, `trust_classification`, `device_event_id`, `trace_id`, and `payload_sha256`.
  - Enabled `FORCE ROW LEVEL SECURITY` on `public.machinery_telemetry` and revoked direct `UPDATE` and `DELETE` from `authenticated`, `anon`, and `service_role`.
  - Enforced cross-farm machinery binding, timestamp bounds, physical sensor ranges, anti-spoofing, and strict immutability in `private.guard_machinery_telemetry_provenance()`.
  - Added `service_role`-only `public.ingest_authenticated_device_telemetry(...)` (verifying `public.devices.auth_token_hash = sha256(p_device_token)` and active `machinery_device_links` inside PostgreSQL) and `public.ingest_provider_machinery_telemetry(...)`, restricted by ESLint rule `cultivanode/no-direct-telemetry-trusted-writer` to `apps/web/src/lib/iot/machinery-telemetry-ingestion.service.ts`.
  - Updated `packages/shared/src/engines/farm-context/provenance.ts` and `apps/web/src/lib/farm-context/live-farm-context.service.ts` so `rejected` telemetry is excluded as `invalid_rejected` and `farmer_observation` / `staff_observation` / `provisional` telemetry is NEVER promoted to `verified_current`.

---

## 3. Independent Security Review (Section 8 — Explicit Answers)

1. **Can an authenticated farmer forge a device identity?** **No.** Direct `INSERT` into `public.machinery_telemetry` with `source_category = 'device_authenticated'` or non-null `source_device_id` is blocked by `private.guard_machinery_telemetry_provenance()` (`42501`), and `public.ingest_authenticated_device_telemetry` is revoked from `authenticated` and verifies `auth_token_hash` inside PostgreSQL.
2. **Can a farm editor submit telemetry for machinery belonging to another farm?** **No.** Both `private.guard_machinery_telemetry_provenance()` and `private.guard_machinery_device_link()` verify `farm_machinery_assets.farm_id = new.farm_id` (`23514`).
3. **Can a device submit data without authentication?** **No.** `ingest_authenticated_device_telemetry` requires a non-revoked, active device in `public.devices` whose `auth_token_hash` matches `sha256(p_device_token)` AND an active `machinery_device_links` row (`42501`).
4. **Can a telemetry record be changed after verification?** **No.** Direct `UPDATE`/`DELETE` are revoked from `authenticated`, `anon`, and `service_role`, and `private.guard_machinery_telemetry_provenance()` rejects any mutation of reading or provenance columns (`42501`). Only audited staff quarantine/rejection via `public.transition_machinery_telemetry_trust(...)` can change trust status.
5. **Can a scheduled job execute arbitrary SQL?** **No.** `private.run_scheduled_task` validates `^[a-z][a-z0-9_]{2,63}$`, checks `private.scheduled_task_registry`, and dispatches via static `CASE` with zero dynamic `EXECUTE`.
6. **Can an authenticated user invoke the scheduler wrapper?** **No.** `EXECUTE` on `private.run_scheduled_task(text)` is revoked from `PUBLIC`, `anon`, `authenticated`, and `service_role`, and JWT sessions are rejected inside the function.
7. **Can the scheduler role bypass RLS?** **No.** `cultivanode_scheduler` is created with `NOBYPASSRLS NOSUPERUSER NOLOGIN NOINHERIT`. Note: the underlying cross-tenant maintenance functions (`expire_bookings`, `wake_notify_worker`, `auto_confirm_bookings`) remain `SECURITY DEFINER` owned by `postgres` because they process cross-tenant booking expiries and `vault.decrypted_secrets`.
8. **Can one scheduled task invoke another task's privileges?** **No.** Direct `EXECUTE` on all 3 task functions is revoked from `cultivanode_scheduler`; each task executes solely through its static `CASE` arm in `private.run_scheduled_task`.
9. **Can failed or duplicated jobs leave inconsistent state?** **No.** Duplicate concurrent runs are fenced by `pg_try_advisory_xact_lock` (`skipped_concurrent`), and task exceptions roll back the task's subtransaction while durably recording `failed` in `private.scheduled_task_runs`.
10. **Can unverified telemetry enter AI Farm Context as verified?** **No.** Both PostgreSQL (`CHECK` constraint) and `evaluateMachineryTelemetryConsistency()` enforce that `farmer_observation`, `staff_observation`, and `provisional` telemetry stay `unverified_provisional` and `rejected` telemetry becomes `invalid_rejected`.
11. **Can telemetry provenance be removed or altered without an audit record?** **No.** Provenance columns are immutable, and trust-state transitions are permitted only through `public.transition_machinery_telemetry_trust(...)`, which atomically inserts an entry into `public.audit_log`.
12. **Can the application use `service_role` in a way that defeats the database security boundary?** **Mitigated with explicit limitation.** ESLint rule `cultivanode/no-direct-telemetry-trusted-writer` confines `ingest_authenticated_device_telemetry` and `ingest_provider_machinery_telemetry` to `machinery-telemetry-ingestion.service.ts`. Even with `service_role`, PostgreSQL still enforces device token SHA-256 authentication, active `machinery_device_links`, range/timestamp validation, deduplication, and immutability — though as documented in ADR-005, Next.js server modules share `SUPABASE_SECRET_KEY`, so `ingest_provider_machinery_telemetry` relies on the application server boundary for OEM webhook signature verification.
