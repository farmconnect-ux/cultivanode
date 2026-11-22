# Batch 04.0 — Source Authority, Evidence Quality and Conflict Resolution (Correction 3)

**Status:** Proposed | **Date:** 2026-11-22 | **ADR:** ADR-019 (replaces the T1–T5 ranking in revision 1)

## Why the T1–T5 ranking is withdrawn

A single rank mixes four different questions: is it legally binding, how strong is the science, how recent is it,
and does it apply to this farm. A 2012 national guide can be authoritative but outdated; a 2024 multi-site trial in
Oyo can be stronger evidence than an older institutional leaflet. Ranking by source type alone would hide that.

## Five independent attributes per source and passage

| Attribute | Values | Set by |
|---|---|---|
| **Legal status** | `binding_regulation` (e.g. NAFDAC bans and registrations), `official_guidance` (ministry, national programme), `institutional_guidance` (research institute, extension), `none` | Source registration, legal review |
| **Evidence quality** | `systematic_review`, `multi_site_multi_season_trial`, `single_site_trial`, `expert_guideline_with_method`, `extension_practice_guide`, `unknown_method` | Agronomic reviewer |
| **Recency** | publication date, data-collection years, edition, superseded flag; topic-specific shelf life (e.g. pesticide registration short, soil chemistry long) | Source metadata + taxonomy topic |
| **Geographic applicability** | per farm: `match`/`partial`/`mismatch`/`unknown` on region, AEZ, rainfall, soil (ADR-018) | Computed at query time |
| **Crop and stage applicability** | crop, variety, stage match per taxonomy (ADR-015) | Computed at query time |

Source integrity (provenance tier `staff_asserted` → `file_hash_verified` → `authority_verified`,
`agronomic_standard_documents`, `20261122020000`–`040000`) and licence (ADR-011) are gates, not ranking factors.

## Conflict resolution procedure

1. **Legal constraints are constraints, not evidence.** A banned product is excluded; a statutory maximum caps any
   rate. If guidance contradicts regulation, regulation applies and the conflict is shown.
2. **Detect conflicts.** Two applicable passages conflict when they recommend different actions, or quantities that
   differ beyond a tolerance set per quantity type by the agronomy lead (decision register D-A3).
3. **Immaterial difference:** present the shared range and cite both.
4. **Material difference:** show both with their attributes (quality, date, place, crop match). The answer may say
   which fits this farm better, giving the reason in those attributes. It never picks one silently and never gives a
   single number unless an approved resolution exists.
5. **Escalate.** Unresolved material conflicts go to an agronomist review queue.
6. **Record the resolution.** A `knowledge_conflict_resolutions` record (passages, decision, rationale, scope by crop and
   zone, reviewer, expiry) becomes reusable evidence and is cited like a passage.

## Source register (checked 2026-11-22; not legal advice)

| Source | Legal status | Typical evidence quality | Licence as published | Notes |
|---|---|---|---|---|
| [NIHORT production manuals](https://nihort.gov.ng/production-manuals/) | institutional_guidance | extension_practice_guide | "©2026 NIHORT. All Rights Reserved." | Tomato 2023, amaranth, corchorus, green peas, ugu, pineapple, citrus; no lettuce |
| Federal Fertilizer Department, *Fertilizer Use and Management Practices for Crops in Nigeria* (4th ed., 2012) | official_guidance | expert_guideline_with_method | No official online copy or licence found | National rates; 14 years old |
| [NAERLS bulletins](https://naerls.gov.ng/bulletins/) | institutional_guidance | extension_practice_guide | "© 2026 All rights reserved" | 40 PDFs |
| [IITA on CGSpace](https://cgspace.cgiar.org/collections/1df39f25-a92a-4c1e-818b-ed997488cf36) | institutional_guidance | varies per item | Per item: 99 CC BY 4.0, 110 all rights reserved, 12 other | Filter by item licence |
| [FAO](https://openknowledge.fao.org/bitstreams/6e7af061-3928-4c55-99c5-6b5e4cb8e3f0/download) | none (international) | varies | CC BY 4.0 default from 2024-07-01; Jun 2018–Dec 2024 items keep CC IGO 3.0 | |
| [iSDAsoil](https://www.isda-africa.com/isdasoil/open-soil-data/) | none | modelled data | CC BY 4.0 | Soil priors only (ADR-018) |
| [NiMet SCP](https://nimet.gov.ng/scp) | official_guidance | forecast | No reuse statement | 2026 edition, 5 languages |
| [CABI PlantwisePlus](https://www.cabi.org/terms-and-conditions/) | none | expert_guideline_with_method | CC BY-NC-ND 4.0 (technical factsheets); CC BY-NC-SA 4.0 (decision guides) | Non-commercial terms |
| [Ghana MoFA lettuce guide (2021)](https://mofa.gov.gh/site/images/pdf/production_guides/lettuce_Production_Guide.pdf) | official_guidance (Ghana) | extension_practice_guide | Short extracts, non-profit only | Partial geographic match for Nigeria |
| NAFDAC pesticide registrations and bans | binding_regulation | n/a | To confirm | Needed for constraint rules; not yet checked |
