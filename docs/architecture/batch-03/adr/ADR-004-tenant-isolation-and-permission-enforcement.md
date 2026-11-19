# ADR-004: Tenant Isolation and Permission Enforcement

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
Existing `/api/engines/ai/ground` accepts client-supplied `context.farmerId` without matching `auth.user.sub`, `device_commands` has RLS enabled with no policies, client-direct memory writes would risk bypassing consent/verification rules, and granting `EXECUTE` on a general AI audit writer to `authenticated` would allow clients to fabricate AI execution or guardrail records.

## Decision
1. **Read Path:** All interactive context and memory reads run under the **caller's verified Supabase JWT** (`auth.uid()`), enforcing `private.can_view_farm(farm_id)` for `scope = 'farm'` and `profile_id = auth.uid()` for `scope = 'profile'`.
2. **Server-Mediated Memory Write Path:** Clients NEVER write directly to `farm_memory_items`. A server-side Memory Write Service validates `auth.uid()`, `private.account_active(auth.uid())`, `'ai_intelligence'` consent, non-null `memory_scope` rules, and `private.can_edit_farm(farm_id)` (for `'farm'` confirmations), backed by Postgres RLS + `CHECK` constraints.
3. **Two-Pathway Audit Boundary (`ADR-005`):** Ordinary `authenticated` clients CANNOT invoke the general AI audit writer directly via RPC (`PUBLIC, anon, authenticated` revoked). Trusted server-generated AI events originate exclusively from authenticated server-side orchestration; any narrow human feedback (`accepted|rejected|modified`) uses either the server API or a dedicated feedback-only RPC that cannot set `provider`, `model_id`, `prompt_version`, `guardrail_result`, or `actor_kind = 'system'`.

## Alternatives & Trade-offs
- **Granting `EXECUTE` on general audit writer to `authenticated`:** Allows clients to forge AI model/guardrail traces via PostgREST RPC even if `actor_id` is JWT-bound (rejected).
