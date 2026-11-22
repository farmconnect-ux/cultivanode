# ADR-018: Geographic Applicability and Soil Provenance

**Status:** Proposed — revision 3 (Batch 04.0) | **Date:** 2026-11-22

## Context

`farm_zone` has 3 values; `public.farm_zones` boundaries are all NULL in Production, so
`private.detect_farm_zone()` (`20260926091849_identity_alignment.sql:660`) never assigns a zone. Soil values carry
only `record_source` and free-text `lab_name`; nothing separates lab results from estimates, and no extraction method,
depth or nutrient basis is recorded.

## Decision

- Farms record `location_source` and `location_accuracy_m`.
- A derived, versioned `farm_geo_profiles` per farm: admin area, agro-ecological zone (8 Nigerian zones), climate
  descriptors, terrain, soil prior with uncertainty, each with dataset name and version.
- Evidence passages carry `geo_scope`; applicability is scored per dimension (`match`/`partial`/`mismatch`/`unknown`).
- Soil values carry an evidence class: `lab_confirmed`, `field_kit`, `farmer_reported`, `modelled_estimate`.
  Modelled values are never stored in `soil_records` or shown as measurements.

### Lab-confirmed is necessary, not sufficient

A lab-confirmed result can support a single quantitative recommendation only when all of these are present and
valid:

1. the soil extraction method for each nutrient (e.g. Bray-1 or Mehlich-3 for P; ammonium acetate for K);
2. sampling depth;
3. test date within the validity period (D-A2);
4. nutrient units;
5. nutrient basis (elemental or oxide);
6. approved crop-specific coefficients;
7. agronomic calibration of soil-test values for that method, crop and region;
8. applicable cited source evidence (ADR-019).

If any item is missing, the recommendation is withheld or given as a labelled range with the missing item named
(ADR-020). Field-kit and modelled values never produce a single number.

Detail: `03_GEOGRAPHIC_APPLICABILITY_AND_SOIL_PROVENANCE.md`. Datasets: D-A1, D-L6.
