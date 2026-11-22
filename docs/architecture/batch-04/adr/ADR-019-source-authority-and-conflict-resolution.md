# ADR-019: Source Authority, Evidence Quality and Conflict Resolution

**Status:** Proposed — replaces the T1–T5 ranking of revision 1 (Batch 04.0) | **Date:** 2026-11-22

## Context
A single source-type ranking conflates legal force, scientific strength, recency and local fit.

## Decision
- Five independent attributes: legal status, evidence quality, recency, geographic applicability, crop/stage
  applicability. Provenance tier and licence are gates, not ranks.
- Regulatory rules act as constraints (bans, maxima), never as ranked evidence.
- Conflicts are detected by action or by quantity difference beyond agronomist-set tolerances (D-A3). Immaterial
  differences give a cited range; material ones show both sources with their attributes and no single number
  unless an approved `knowledge_conflict_resolutions` record exists; unresolved conflicts go to a review queue.

Detail: `04_SOURCE_AUTHORITY_AND_CONFLICT_RESOLUTION.md`.

## Alternatives
- Tiered precedence by source type (revision 1): withdrawn.
