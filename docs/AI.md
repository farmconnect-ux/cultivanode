# AI farm assistant

**Status: not built (milestone M6).** Reserved so far: the `knowledge.manage` permission for agronomy editors.

## Rules for the build
- Languages: English, Pidgin, Yorùbá. Text chat first; voice through an adapter; photo diagnosis.
- Answers are grounded in retrieved, approved knowledge documents (title, source, crop, zone, season,
  type, version, approval status) plus the farmer's context (crop, variety, zone, season, stage, planting,
  applicable standard). Sources used are stored with each answer for audit.
- Responses separate knowledge-backed recommendations, deterministic calculations and uncertainty.
  Diagnoses include confidence and alternatives; low confidence recommends an extension agent/agronomist.
- Chemical mentions pull rate, waiting period, re-entry interval and warnings from the approved product
  table. The model never produces pesticide or fertiliser rates on its own.
- The LLM provider sits behind an adapter; `AI_API_KEY` is a server secret.
- **Acceptance:** at least 100 agronomy questions evaluated.
