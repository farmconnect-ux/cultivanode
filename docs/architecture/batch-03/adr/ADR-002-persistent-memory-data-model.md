# ADR-002: Persistent Memory Data Model

**Status:** Proposed (Batch 03.0) | **Date:** 2026-11-19

## Context
CultivaNode currently retains zero cross-session or cross-season memory. Conversations and `crop_observations.ai_diagnosis` exist in isolation without structured recall or farmer confirmation.

## Decision
Model persistent farm memory in a single unified `farm_memory_items` table partitioned by `category` (`episodic`, `semantic`, `procedural`, `preference`, `unresolved`), `farm_id` (NOT NULL FK `farms`), optional `plot_id`/`crop_cycle_id`/`profile_id`, `source_kind`, `verification_status` (`proposed | confirmed | disputed | superseded | deleted`), `confidence`, and `review_after`/`expires_at`.

## Alternatives & Trade-offs
- **Five separate category tables:** Stronger per-category columns, but duplicates RLS policies, embedding indexes, and lifecycle triggers.
- **Unstructured chat-history dump:** Easy to store, but mixes unverified AI hallucinations with confirmed farm facts (rejected).

## Security & Cost Implications
- Enforces `can_view_farm(farm_id)` for reads and `can_edit_farm(farm_id)` for confirmations; AI inferences default to `verification_status = 'proposed'`.
- Single table with composite `(farm_id, category, verification_status)` index minimizes storage and maintenance overhead.
