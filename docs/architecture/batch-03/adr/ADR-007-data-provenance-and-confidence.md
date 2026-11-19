# ADR-007: Data Provenance and Confidence

**Status:** Proposed (Batch 03.0) | **Date:** 2026-11-19

## Context
Currently `record_source` exists only on `farms` and `soil_records`; 15+ farm/livestock/machinery/irrigation tables lack `created_by` or `source`, and `ai_diagnosis` is stored without a uniform confidence/verification model.

## Decision
Standardise a `source_kind` taxonomy (`farmer_reported`, `staff_verified`, `sensor`, `external_weather`, `ai_inferred`) and `confidence` (`0.00`–`1.00`) across `LiveFarmContextSnapshot`, `farm_memory_items`, and `ai_audit_events`. Enforce strict precedence: verified human/lab records > valid sensor rollups > farmer-reported > external weather > AI-inferred. AI-inferred outputs can never self-promote to `'confirmed'`.

## Alternatives & Trade-offs
- **Equal weighting of all records:** Allows unverified AI summaries or faulty sensors to corrupt agronomic recommendations (rejected).

## Security & Cost Implications
- Prevents sensor-poisoning and hallucination feedback loops; minimal schema/CPU overhead.
