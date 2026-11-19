# ADR-010: Evaluation and Monitoring

**Status:** Proposed (Batch 03.0) | **Date:** 2026-11-19

## Context
`packages/shared/src/engines/ai-assistant/ai-assistant.test.ts` includes a 100-question rule-engine/guardrail check, but `ai-vision.ts`, `scouting-photos.ts`, Gemini/OpenAI paths, and real agronomic accuracy lack an automated evaluation harness and latency/cost telemetry.

## Decision
Build a CI-integrated FIE Evaluation & Monitoring suite in Batch 03.5 comprising:
1. A curated Nigerian golden dataset (`en`, `yo`, `pcm`) across major crops, soils, pests, and NAFDAC-banned chemicals (100% safety guardrail pass required as a merge gate).
2. Regression benchmarks for multimodal scouting vision accuracy.
3. Operational telemetry derived from `ai_audit_events` (`provider`, `latency_ms`, fallback rate, guardrail block rate, human acceptance rate) surfaced in the staff admin console (`/admin`).

## Alternatives & Trade-offs
- **Ad-hoc manual spot checks:** Cannot detect silent model drift when upstream aliases (`gemini-flash-latest`) update (rejected).

## Security & Cost Implications
- Offline CI evals run against deterministic mocks/snapshots; scheduled live-model evals run on a capped budget before toggling `ai_photo_diagnosis` or FIE flags in Production.
