# Agronomy engine (crops, templates, standards, fertiliser and spray planning)

**Status: not built (milestone M2–M3).** What exists: the `farm_zone` enum and `farm_zones` table
(rainforest, derived savanna), `farms`/`plots`/`soil_records`, the `agronomy_editor` admin sub-role with
`crops.manage`, `standards.publish`, `products.manage` permissions, and the public crops page.

## Rules for the build
- Crops, varieties, templates, stages, operations, standards and products are **database records**, edited by
  agronomy editors. No crop rule is hard-coded in React or React Native components.
- Templates are keyed by crop, zone, season (`early_rainy`, `late_rainy`, `dry_irrigated`), version and status.
  Operations use `relative_start_day`/`relative_end_day` from the planting date.
- Standards are `published` (controlled, versioned) or `custom` (belong to a farmer/organisation and never
  modify a published standard).
- Every recommendation carries `standard_id`, `standard_version`, `source`, `zone`, `season`,
  `approved_by`, `approved_at`, and the UI shows it.
- Fertiliser and spray quantities come from a **deterministic calculation** in shared code, unit tested.
  AI may explain a result but never invents rates or schedules.
- Only approved/registered agrochemicals can be recommended, always with rate, pre-harvest interval,
  re-entry interval and safety information.
- Zone detection: farms get their zone from `farm_zones.boundary` when an agronomist-approved map is
  loaded (trigger already in place); until then the farmer or staff choose, and staff can correct with
  `correct_farm_zone()`.
- **Acceptance (M2):** a maize and a tomato planting generate agronomist-reviewable schedules.
