# ADR-002: Persistent Memory Data Model

**Status:** Proposed — Revised (Batch 03.0) | **Date:** 2026-11-19

## Context
CultivaNode currently retains zero cross-session or cross-season memory. A nullable `memory_scope` could allow `NULL` values to bypass `CHECK` constraints, and overloading `profile_id` for both ownership and creator attribution conflates two distinct relationships.

## Decision
Model persistent memory in `public.farm_memory_items` with a **`NOT NULL` `memory_scope` discriminator** (`'farm' | 'profile'`) and explicit **separation of ownership from attribution**:
- **Database `CHECK` constraints** (row consistency only; paired with RLS and server-side authorisation):
  - `memory_scope text NOT NULL CHECK (memory_scope IN ('farm', 'profile'))`
  - `(memory_scope = 'farm' AND farm_id IS NOT NULL AND profile_id IS NULL AND category IN ('episodic', 'semantic', 'procedural', 'preference', 'unresolved')) OR (memory_scope = 'profile' AND farm_id IS NULL AND profile_id IS NOT NULL AND category = 'preference')`
- **Ownership:** `farm_id` owns `'farm'` rows (`private.can_view_farm(farm_id)` / `can_edit_farm(farm_id)`); `profile_id` owns `'profile'` rows (`profile_id = auth.uid()` only).
- **Attribution:** Separate nullable FKs (`created_by`, `confirmed_by`, `updated_by` -> `public.profiles(id) ON DELETE SET NULL`) plus `source_kind` and timestamps (`created_at`, `confirmed_at`, `updated_at`) track who created, confirmed, or last modified a memory without changing its owner.
All writes pass through the server-mediated Memory Write Service (`ADR-004`).

## Alternatives & Trade-offs
- **Separate `profile_preferences` and `farm_memory_items` tables:** Clean separation, but duplicates embedding/audit wiring; a single `NOT NULL` + `CHECK`-constrained table achieves strict isolation with unified retrieval.
- **Overloading `profile_id` for creator attribution:** Breaks clarity when a farm manager confirms or edits another member's farm memory (rejected).

## Security & Cost Implications
- Non-null `memory_scope` + `CHECK` constraint prevents invalid scope combinations or cross-farm preference leakage.
- Deleting a creator's account nulls attribution (`created_by`/`confirmed_by`/`updated_by`) on surviving org `'farm'` memories while preserving legitimate farm knowledge (`ADR-009`).
