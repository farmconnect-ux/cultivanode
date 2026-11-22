# Batch 04.0 — Proposed First Ten Crops

**Status:** Retained for planning by the product owner (D-P2, 2026-11-22); **awaiting final agronomist validation
(D-A7)** | **Date:** 2026-11-22

Selection rationale: the pilot is South-West Nigeria (`farm_zones` descriptions name Oyo, Ogun, Osun, Ondo, Ekiti,
Lagos; `supabase/migrations/20260926091849_identity_alignment.sql:649-652`); a mix of staples and high-value
vegetables; reuse of existing catalogue and standards; and lettuce as the reference case from the Batch 04 brief.

| # | Crop | Why | Catalogue (`catalogue.ts`) | Standard in Production | Fertiliser engine | Evidence identified | Gaps |
|---|---|---|---|---|---|---|---|
| 1 | Cassava | Main staple; pilot crop | Yes — 2 varieties, 4 stages | `GAP_CASSAVA_V1` published, `max_nitrogen_kg_ha` NULL | Coefficient + API allow-list | IITA research crop (CGSpace items to filter by licence); NAERLS bulletin no. 04 | Standard has no source document; no N limit |
| 2 | Maize | Main cereal | Yes — 3 varieties, 6 stages | `GAP_MAIZE_V1` published (rainforest only), N limit NULL | Coefficient + allow-list | IITA; national fertiliser guide (permission needed) | Derived-savanna standard missing; hard-coded protocol text in `apps/web/src/components/screens/agronomy-library.tsx:46` is unsourced |
| 3 | Yam | Staple, high value | Yes — 2 varieties, 4 stages | `GAP_YAM_V1` draft | Coefficient + allow-list | IITA research crop | Draft only |
| 4 | Tomato | Top vegetable in Oyo markets | Yes — 2 varieties, 4 stages | `GAP_TOMATO_V1` draft | Coefficient + allow-list | NIHORT tomato guide 2023; NAERLS irrigated tomato bulletins (both all rights reserved) | Permissions |
| 5 | Pepper | High-value vegetable | Yes — 3 varieties, 4 stages | `GAP_PEPPER_V1` draft | No coefficient; not allow-listed | NAERLS irrigated pepper bulletins (all rights reserved) | Coefficients, permission |
| 6 | Okra | Common smallholder vegetable | Yes — 2 varieties, 3 stages | `GAP_OKRA_V1` draft | No coefficient | None checked yet | Sources to find |
| 7 | Amaranth (tete) | Leafy vegetable, short cycle | Yes — 1 variety, 3 stages | None | No coefficient | NIHORT amaranth guide (all rights reserved) | Standard, coefficients, permission |
| 8 | Cowpea | Legume, rotation | Yes — 2 varieties, 4 stages | `GAP_COWPEA_V1` draft | No coefficient | IITA research crop | Draft only |
| 9 | Soybean | Legume; already published | **Not in catalogue** | `GAP_SOYBEAN_V1` published | No coefficient | IITA research crop | Catalogue entry, stages, varieties |
| 10 | **Lettuce** | Reference case; urban and peri-urban demand | **Not in catalogue** | None | No coefficient | Nearest found: Ghana MoFA 2021 guide (non-commercial extracts only); NIHORT lists no lettuce guide | Everything: taxonomy, stages, spacing, standard, Nigerian source |

Alternatives considered: ewedu (NIHORT corchorus guide exists), plantain, rice (coefficient exists, no standard).
Per-crop evidence counts and licences are verified in Batch 04.1, not assumed here.

Until each crop has an approved standard, calibrated coefficients and lab-confirmed soil inputs meeting ADR-018,
ADR-020 applies: no numeric rate is given for it. All-rights-reserved sources listed here stay metadata-only until
permission is granted (`05_LICENSING_CONTROLS.md`).
