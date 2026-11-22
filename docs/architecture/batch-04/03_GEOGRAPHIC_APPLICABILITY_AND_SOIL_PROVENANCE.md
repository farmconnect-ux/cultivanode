# Batch 04.0 — Geographic Applicability and Soil Provenance (Correction 2)

**Status:** Proposed | **Date:** 2026-11-22 | **ADR:** ADR-018

## Current state (verified)

| Object | What exists | Limitation | Evidence |
|---|---|---|---|
| `public.farms` | `location` (geography point), `boundary` (geography), `area_ha`, `area_is_measured`, `state`, `lga`, `zone` (`farm_zone`), `zone_corrected_by/at`, `slope_type`, `water_sources`, `irrigation_systems`, `soil_information` (jsonb) | No location source or accuracy; `soil_information` is unstructured | Production columns, 2026-11-22 |
| `public.farm_zone` enum | `rainforest`, `derived_savanna`, `other` | Three classes for all of Nigeria | `supabase/migrations/20260926020957_extensions_and_types.sql:52` |
| `public.farm_zones` | Zone → `boundary` MultiPolygon + `private.detect_farm_zone()` trigger | **All three boundaries are NULL in Production**, so zones are never detected; the value is whatever the farmer or staff chose | `20260926091849_identity_alignment.sql:637-674` |
| `public.soil_records` | pH, OM %, N %, P ppm, K cmol/kg, `lab_name`, `tested_on`, `source` (`record_source`: self_reported, agent_verified, platform_verified, payment_verified) | No method (Bray-1, Mehlich-3…), depth, lab accreditation, or distinction between lab, field kit and modelled values | Production columns and enum |
| Standards | `farm_agronomic_standards.agro_zone` text (`all`, `rainforest`, `derived_savanna`) | Same coarse zones | `20261103120000` |

## Target model

### 1. Farm location precision

Add to farms: `location_source` (`gps_device`, `map_pin`, `boundary_walk`, `address_geocode`, `lga_centroid`) and
`location_accuracy_m`. Applicability scoring treats `lga_centroid` and `address_geocode` as low precision: a zone
assignment near a boundary is shown as uncertain rather than guessed.

### 2. Layered agro-ecological profile per farm (derived, versioned)

A `farm_geo_profiles` record computed from the farm point or boundary, never typed by the farmer:

| Layer | Values | Source (to be approved, see decision register) |
|---|---|---|
| Administrative | state, LGA, ward if available | Authoritative boundary dataset |
| Agro-ecological zone | Nigeria's principal zones: mangrove/freshwater swamp, rainforest, derived savanna, southern Guinea savanna, northern Guinea savanna, Sudan savanna, Sahel, montane | Agronomist-approved AEZ map loaded into `farm_zones.boundary` |
| Climate | long-term rainfall band, rainy-season onset/cessation and length of growing period, temperature band | NiMet (season), long-term climatology dataset |
| Terrain | elevation, slope class | DEM |
| Soil prior | texture class, pH, OM, P, K estimates with uncertainty, depth 0–20 cm | iSDAsoil (CC BY 4.0) |

Each layer stores dataset name, version and computed-at. `farm_zone` is kept for compatibility and populated from
the AEZ layer through a mapping, so no breaking enum change is needed (ADR-015).

### 3. Geographic scope on evidence

Each source passage carries `geo_scope`: country/region, states, AEZ list, rainfall range, soil classes, and the
study or trial location when known. Applicability per dimension is `match`, `partial`, `mismatch` or `unknown`
(ADR-019). A Ghanaian lettuce guide scores `partial` on region for an Oyo farm and is labelled a regional
reference.

### 4. Soil provenance: measured versus modelled

Replace the single `source` flag with an explicit evidence class per soil value:

| Class | Meaning | May drive a numeric rate? |
|---|---|---|
| `lab_confirmed` | Lab name, method (e.g. Bray-1 P, NH₄OAc K), sample date, depth, units recorded; report file archived | Yes, within validity period |
| `field_kit` | On-farm test kit, kit model recorded | Range only, labelled |
| `farmer_reported` | Farmer's statement | No; prompts for a test |
| `modelled_estimate` | iSDAsoil or similar, with model version and uncertainty | Range only, always labelled "estimate, not a soil test" |

Rules:
- A modelled value is never stored in `soil_records` and never shown as a measurement. It lives in
  `farm_geo_profiles.soil_prior`.
- When lab and modelled values disagree beyond the model's stated uncertainty, the lab value wins and the
  difference is logged.
- Units are stored per value; the engine accepts only typed units (see `02_FERTILISER_SAFETY_FINDING.md`).
