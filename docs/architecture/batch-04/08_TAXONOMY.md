# Batch 04.0 — Agricultural Knowledge Taxonomy

**Status:** Proposed | **Date:** 2026-11-22 | **ADR:** ADR-015

## Current state

- Crops: 18 in `packages/shared/src/engines/agronomy/catalogue.ts` (maize, cassava, yam, rice, cowpea, plantain,
  egusi, sweet_potato, tomato, pepper, okra, amaranth, ewedu, cucumber, watermelon, cocoa, oil_palm, cashew), each
  with varieties, growth stages (relative days), spacing, local names (`yo`, `pcm`, `ha`, `ig`) per
  `packages/shared/src/engines/agronomy/types.ts`.
- Standards use free-text `crop_or_livestock_id`; `soybean` (published), `onion`, `millet`, `sorghum`, `groundnut`
  (draft) are not in the catalogue.
- Zones: `farm_zone` enum (3 values). Season: `AgronomySeason` (`early_rainy`, `late_rainy`, `dry_irrigated`).

## Data model (Batch 04.3)

| Table | Key fields |
|---|---|
| `taxonomy_terms` | id, term_type, code (stable, e.g. `crop.lettuce`), preferred label, scientific name, status (`active`, `retired`), replaced_by, version, approved_by |
| `taxonomy_relations` | from_term, relation (`is_variety_of`, `has_stage`, `maps_to_principal_stage`, `hosts_pest`, `suitable_in_zone`, `contains_nutrient`, `part_of`), to_term, qualifiers (jsonb) |
| `taxonomy_synonyms` | term, language (`en`, `yo`, `ha`, `ig`, `pcm`), label, kind (`common`, `local`, `trade_name`, `misspelling`), reviewed_by |
| `passage_tags` / `farm_fact_tags` | passage or fact id, term id, source of tag (`extracted`, `reviewer`, `inferred`), confidence |

Terms are never deleted; retired terms point to their replacement so old tags resolve. `catalogue.ts` becomes the
seed for the first load and is then generated from the tables.

## Term types and scope

| Term type | Scope for 04.3 | Notes |
|---|---|---|
| `crop` | Catalogue crops + soybean, onion, millet, sorghum, groundnut, lettuce | Crop group (cereal, legume, root/tuber, fruit vegetable, leafy vegetable, tree crop) |
| `variety` | Released varieties per crop with release body and year | Source: institute release lists |
| `growth_stage` | Per crop, with day ranges | Mapped to principal stages: establishment, vegetative, flowering, fruit/tuber development, maturity, post-harvest |
| `livestock_species` / `production_type` / `breed` | Poultry (layer, broiler) first | Matches published `LIVESTOCK_LAYER_V1`, `LIVESTOCK_BROILER_FEED_V1` |
| `agro_ecological_zone` | 8 Nigerian zones (ADR-018) | `farm_zone` mapped |
| `season` | 3 existing values + NiMet season attributes per year | |
| `soil_class` | Texture class, pH band, OM band, drainage | Same classes as iSDAsoil texture output |
| `practice` | Land preparation, planting, nutrient management, irrigation, weed, pest, disease, harvest, post-harvest, storage | Matches operation templates |
| `organism` | Pests, diseases, weeds with scientific names; host crops and stages | |
| `input_product` | Fertiliser products with nutrient content and basis (oxide/elemental); pesticides by active ingredient with registration status | Registration status from NAFDAC (to confirm) |
| `nutrient` | N, P, K, secondary, micro, with unit conventions | Supports ADR-020 typed units |
| `geography` | Country, state, LGA | From approved boundary dataset |

## Example: lettuce

`crop.lettuce` (Lactuca sativa, group leafy vegetable) → varieties (to be sourced) → stages (nursery, transplant
establishment, vegetative/head formation, harvest) → principal stages → synonyms (en "lettuce", local labels to be
confirmed by native speakers) → practices. With no published standard, any answer must state that no approved
CultivaNode standard exists for lettuce (ADR-020).
