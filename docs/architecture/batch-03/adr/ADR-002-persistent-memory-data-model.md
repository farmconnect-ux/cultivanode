# ADR-002: Persistent Memory Data Model

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
CultivaNode currently retains zero cross-session or cross-season memory. A single `farm_id NOT NULL` design conflicts with user-level preferences (language, units, tone) that span multiple farms.

## Decision
Model persistent memory in `public.farm_memory_items` with an explicit `memory_scope` discriminator (`'farm' | 'profile'`) enforced by `CHECK` constraints:
- **`memory_scope = 'farm'`:** `farm_id IS NOT NULL`, `profile_id` nullable (`created_by`), categories `episodic | semantic | procedural | preference | unresolved`, RLS read via `private.can_view_farm(farm_id)`.
- **`memory_scope = 'profile'`:** `farm_id IS NULL`, `profile_id IS NOT NULL`, category `'preference'` only, RLS read/write restricted strictly to `profile_id = auth.uid()`.
All writes (AI `proposed` candidates and human `confirmed` updates) pass through a server-mediated Memory Write Service (`ADR-004`).

## Alternatives & Trade-offs
- **Separate `profile_preferences` and `farm_memory_items` tables:** Clean separation, but duplicates embedding/audit wiring; a single `CHECK`-constrained table with `memory_scope` achieves strict isolation with unified retrieval.
- **Nullable `farm_id` without a scope discriminator:** Risks accidental cross-farm leakage or orphan rows (rejected).

## Security & Cost Implications
- `CHECK` constraint guarantees `scope = 'profile'` cannot attach a `farm_id` or leak across farms/orgs.
- Removal from `org_members` revokes `can_view_farm(farm_id)` immediately on `scope = 'farm'` rows.
