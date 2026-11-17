# Batch 01 — Row-Level Security Remediation (10 Policy-Less Tables)

**Date:** 2026-11-17  
**Baseline Commit:** `792f0b5`

---

## 1. Investigation of the 10 RLS-Enabled Tables Without Policies

Across all 93 RLS-enabled tables in `supabase/migrations/`, exactly **10 tables** have `ENABLE ROW LEVEL SECURITY` with zero `CREATE POLICY` statements:

| # | Table | Migration | Current Grants (`anon` / `authenticated`) | PostgREST Exposure | Intentional? | Action Taken |
|---|---|---|---|---|---|---|
| 1 | `integration_providers` | `20260926133412` | `REVOKE ALL` from `anon, authenticated` | None (admin UI uses `admin_*` RPCs) | **Yes** (`service_role` / `SECURITY DEFINER` only) | None required |
| 2 | `integration_settings` | `20260926133412` | `REVOKE ALL` from `anon, authenticated` | None | **Yes** | None required |
| 3 | `integration_configs` | `20260926133412` | `REVOKE ALL` from `anon, authenticated` | None | **Yes** | None required |
| 4 | `integration_secrets` | `20260926133412` | `REVOKE ALL` from `anon, authenticated` | None (Vault pointers) | **Yes** | None required |
| 5 | `integration_events` | `20260926133412` | `REVOKE ALL` from `anon, authenticated`; `SELECT, INSERT` to `service_role` | None | **Yes** | None required |
| 6 | `agent_onboarding_codes` | `20260926150328` | `REVOKE ALL` from `anon, authenticated` | None (OTP code hashes) | **Yes** | None required |
| 7 | `weather_cache` | `20260927011448` | `REVOKE ALL` from `anon, authenticated` | None (`weather` Edge Function uses `service_role`) | **Yes** | None required |
| 8 | `id_claims` | `20260928164741` | `REVOKE ALL` from `anon, authenticated` | None (HMAC NIN/BVN fingerprints) | **Yes** | None required |
| 9 | `sms_outbox` | `20260929090000` | `REVOKE ALL` from `anon, authenticated` | None (`send-notifications` worker uses `service_role`) | **Yes** | None required |
| 10 | `device_commands` | `20261009100000` | `REVOKE ALL` from `anon` only; not granted to `authenticated` | None (safety-critical pump/valve actuator commands, unimplemented) | **Yes** (reserved for future failsafe-gated control) | **Hardened** in `20261117080000`: added explicit `REVOKE ALL ON public.device_commands FROM anon, authenticated;` + table comment + pgTAP test. |

---

## 2. Disposition Summary

- **No broad policies were added.** In Supabase/PostgreSQL, enabling RLS with zero policies + revoking `anon`/`authenticated` grants is the strongest possible deny-all posture for `service_role`-only tables.
- Supabase Security Advisor's `rls_enabled_no_policy` informational warning for tables 1–10 should be documented as **accepted / intentional deny-all** after applying `20261117080000_marketplace_orders_security_lockdown.sql`.
