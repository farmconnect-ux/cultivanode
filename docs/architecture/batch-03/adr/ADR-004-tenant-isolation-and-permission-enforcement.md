# ADR-004: Tenant Isolation and Permission Enforcement

**Status:** Proposed (Batch 03.0) | **Date:** 2026-11-19

## Context
Existing `/api/engines/ai/ground` accepts client-supplied `context.farmerId` without matching `auth.user.sub`, while `device_commands` has RLS enabled with no policies. Multi-user cooperatives (`org_members`) and field agents (`onboarded_by`) require nuanced read vs write boundaries.

## Decision
Enforce a **user-JWT-first boundary** for all interactive FIE calls: `actor_id` is always bound to `auth.uid()`, reads are gated by `private.can_view_farm(farm_id)` (owner, org member, onboarding field agent, or `farms.read` staff), and memory/action confirmations are gated by `private.can_edit_farm(farm_id)` (owner, org `owner`/`farm_manager`, or onboarding field agent). Any `SECURITY DEFINER` helper must set `SET search_path = ''`, revoke `PUBLIC, anon`, and check `private.account_active(auth.uid())`.

## Alternatives & Trade-offs
- **Application-layer checks over `service_role` client:** Prone to IDOR bugs if any route forgets a check (rejected).

## Security & Cost Implications
- Defense-in-depth at both API route and Postgres RLS layers; zero extra runtime cost.
