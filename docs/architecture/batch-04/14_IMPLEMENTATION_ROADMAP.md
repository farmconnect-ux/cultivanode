# Batch 04.0 — Implementation Roadmap

**Status:** Proposed | **Date:** 2026-11-22

| Phase | Scope | Depends on | Gate (evidence in the PR) |
|---|---|---|---|
| 04.0-H (recommended, D-P6) | Fail-closed fertiliser fallback, single audited AI entry point, `cropId` default removed | Owner approval | Tests listed in `02_FERTILISER_SAFETY_FINDING.md` pass |
| 04.1 Ingestion and governance | Source register and licence grants; PDF text layer + OCR with page provenance; review roles and audit record; immutability fixes | D-P3, D-P4, D-L1, D-T2 | First licensed documents published with full audit records; no ingest without a cleared source |
| 04.3 Taxonomy core (parallel with 04.1) | Term tables, synonyms, AEZ mapping, ten priority crops, geo profiles | D-A1, D-P2 | Every published passage and farm tagged |
| 04.2 Hybrid retrieval | Full-text, vectors (per-model table), taxonomy match, fusion, rerank, evaluation set | D-T1, D-T3, D-P1 | Beats the 03.2 baseline on every stratum incl. local names and non-English |
| 04.4 Evidence-grounded recommendations | Evidence package v2, answer contract and validator, fail-closed engines with typed units, conflict queue | 04.2, D-A3, D-A5 | No uncited number reaches a farmer in the test set |
| 04.5 Validation and release | Full evaluation, threat tests (S1–S14), latency and cost on Staging | All | Staging sign-off by owner and a qualified reviewer; then Production |
