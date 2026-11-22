# ADR-015: Governed Agricultural Taxonomy

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22

## Context
Crops, varieties and growth stages are TypeScript constants (`catalogue.ts`, 18 crops, no lettuce). Zones are the
`farm_zone` enum (rainforest, derived_savanna, other). Adding a crop needs a code release.

## Decision
Database tables for taxonomy terms (type, code, label, scientific name), relationships (crop→variety,
crop→stage, pest→host crop, state/LGA→zone) and synonyms (en, yo, ha, ig, pcm). Staff-edited, versioned, never
deleted: a retired term maps forward to its replacement. Passages and farm facts are tagged with term IDs.
Per-crop stages map to shared principal stages so evidence can cross crops. `farm_zone` is widened through a
farm→zone mapping derived from location, not a breaking enum change. `catalogue.ts` becomes a seed, then a cache.

## Consequences
- A crop without standards (e.g. lettuce) can exist; the AI must state that no approved standard exists.

## Alternatives
- Keep constants: blocks new crops and local synonyms (rejected).
