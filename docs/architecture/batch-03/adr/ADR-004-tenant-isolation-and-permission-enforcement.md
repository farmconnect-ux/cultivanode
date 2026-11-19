# ADR-004: Tenant Isolation and Permission Enforcement

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
Existing `/api/engines/ai/ground` accepts client-supplied `context.farmerId` without matching `auth.user.sub`, `device_commands` has RLS enabled with no policies, and client-direct memory writes would risk bypassing consent and verification rules.

## Decision
1. **Read Path:** All interactive context and memory reads run under the **caller's verified Supabase JWT** (`auth.uid()`), enforcing `private.can_view_farm(farm_id)` for `scope = 'farm'` and `profile_id = auth.uid()` for `scope = 'profile'`.
2. **Server-Mediated Memory Write Path:** Clients NEVER write directly to `farm_memory_items`. A server-side Memory Write Service validates `auth.uid()`, `private.account_active(auth.uid())`, `'ai_intelligence'` consent, `memory_scope` rules, and `private.can_edit_farm(farm_id)` (for `'farm'` confirmations), backed by Postgres RLS + `CHECK` constraints.
3. **Caller-Bound Audit Writer (`ADR-005`):** Derives human identity strictly from `auth.uid()` and restricts `actor_kind = 'system'` to `service_role`.

## Alternatives & Trade-offs
- **Client-direct PostgREST writes with RLS:** Insufficient for enforcing AI-vs-human provenance (`source_kind = 'ai_inferred'` cannot self-promote to `'confirmed'`) and consent orchestration.

## Security & Cost Implications
- Defense-in-depth at both server orchestration and Postgres RLS layers; eliminates IDOR and client-side privilege escalation.
