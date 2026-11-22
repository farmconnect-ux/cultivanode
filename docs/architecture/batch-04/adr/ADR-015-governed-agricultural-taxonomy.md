# ADR-015: Governed Agricultural Taxonomy

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22

## Context
Crops, varieties and stages are TypeScript constants (`catalogue.ts`, 18 crops, no lettuce, no soybean although
`GAP_SOYBEAN_V1` is published). Zones are the 3-value `farm_zone` enum.

## Decision
`taxonomy_terms`, `taxonomy_relations`, `taxonomy_synonyms` (en, yo, ha, ig, pcm) and tag tables, staff-edited,
versioned, never deleted. Per-crop stages map to shared principal stages. `farm_zone` is populated from the AEZ
layer (ADR-018) by mapping, not changed. `catalogue.ts` seeds the tables, then is generated from them.
Detail: `08_TAXONOMY.md`.

## Alternatives
- Keep constants: blocks new crops and synonyms without a release (rejected).
