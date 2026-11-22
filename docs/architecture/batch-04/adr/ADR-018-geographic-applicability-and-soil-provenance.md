# ADR-018: Geographic Applicability and Soil Provenance

**Status:** Proposed (Batch 04.0) | **Date:** 2026-11-22

## Context
`farm_zone` has 3 values; `public.farm_zones` boundaries are all NULL in Production, so
`private.detect_farm_zone()` (`20260926091849_identity_alignment.sql:660`) never assigns a zone. Soil values carry
only `record_source` and free-text `lab_name`; nothing separates lab results from estimates.

## Decision
- Farms record `location_source` and `location_accuracy_m`.
- A derived, versioned `farm_geo_profiles` per farm: admin area, AEZ (8 Nigerian zones), climate descriptors,
  terrain, soil prior with uncertainty, each with dataset name and version.
- Evidence passages carry `geo_scope`; applicability is scored per dimension (`match`/`partial`/`mismatch`/`unknown`).
- Soil values carry an evidence class: `lab_confirmed`, `field_kit`, `farmer_reported`, `modelled_estimate`. Only
  `lab_confirmed` values within their validity period may drive a single numeric rate; estimates give labelled
  ranges; modelled values are never stored as measurements.

Detail: `03_GEOGRAPHIC_APPLICABILITY_AND_SOIL_PROVENANCE.md`. Datasets: D-A1, D-L6.
