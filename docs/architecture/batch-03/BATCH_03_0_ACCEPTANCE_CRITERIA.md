# Batch 03.0 — Acceptance Criteria

**Date:** 2026-11-19

---

## 1. Batch 03.0 Architecture & Discovery Acceptance Checklist

| Criterion | Status | Evidence Location |
|---|---|---|
| Existing AI implementation mapped accurately | **Met** | `BATCH_03_0_EXISTING_AI_CAPABILITIES.md` |
| Existing 35-table farm database assessed | **Met** | `BATCH_03_0_FARM_DATA_INVENTORY.md` |
| Existing functionality distinguished from proposed functionality | **Met** | `BATCH_03_0_BASELINE_DISCOVERY.md` vs `BATCH_03_0_TARGET_ARCHITECTURE.md` |
| Farm context architecture has defined data contract & conflict rules | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §2 & `ADR-001` |
| Persistent memory has defined 5-category lifecycle & provenance model | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §3 & `ADR-002`, `ADR-007` |
| AI audit register has defined event model & tamper resistance | **Met** | `BATCH_03_0_TARGET_ARCHITECTURE.md` §4 & `ADR-005` |
| Cross-farm & cross-organisation access boundaries explicitly designed | **Met** | `BATCH_03_0_SECURITY_AND_GOVERNANCE.md` §1–2 & `ADR-004` |
| Security & governance risks (13 threats) assessed | **Met** | `BATCH_03_0_SECURITY_AND_GOVERNANCE.md` §2 |
| Technology choices justified (PostgreSQL + `pgvector` hybrid) | **Met** | `ADR-003` |
| Implementation dependencies & sequencing documented | **Met** | `BATCH_03_0_IMPLEMENTATION_ROADMAP.md` |
| Measurable acceptance tests specified for Batch 03.1+ | **Met** | §2 below |
| All 6 architecture diagrams & 10 ADRs internally consistent | **Met** | `BATCH_03_0_BASELINE_DISCOVERY.md`, `TARGET_ARCHITECTURE.md`, `SECURITY_AND_GOVERNANCE.md`, `adr/ADR-001`–`010` |

---

## 2. Measurable Acceptance Tests for Batch 03.1–03.5 Implementation

1. **Tenant Isolation (pgTAP + API):**
   - Authenticated Stranger (`auth.uid()` not owner, org member, or field agent) querying `LiveFarmContextService`, `farm_memory_items`, or `ai_audit_events` for another user's `farm_id` receives `0` rows / `403`.
   - Authorised `org_members` (`worker` for read, `farm_manager`/`owner` for memory confirmation) succeed according to `can_view_farm` / `can_edit_farm`.
2. **Provenance & Anti-Hallucination:**
   - AI-generated memory candidates are inserted strictly with `source_kind = 'ai_inferred'` and `verification_status = 'proposed'`, and cannot overwrite `'confirmed'` records.
   - `checkChemicalSafetyGuardrails()` blocks all NAFDAC-banned chemicals (including `aldrin`) across **all** output fields (`summary`, `likely`, `actions`, chat text).
3. **Audit Tamper-Resistance & Privacy:**
   - pgTAP `throws_ok` confirms `UPDATE` and `DELETE` on `ai_audit_events` fail for `authenticated` and `service_role` via `private.forbid_change()`.
   - Secret/PII scan on `ai_audit_events` confirms zero bearer tokens, API keys, or raw `imageBase64`.
4. **Account Deletion Compatibility:**
   - `execute_account_deletion` deletes/anonymizes personal `preference` memory while preserving anonymized `ai_audit_events` (`actor_id = NULL` or anonymized) for agronomic/safety traceability.
5. **Agronomy & Offline Reliability:**
   - `/api/engines/agronomy/fertiliser` tests verify non-`NaN` NPK/lime output when optional soil fields are omitted.
   - Golden-dataset eval suite achieves `100%` NAFDAC safety pass rate and target agronomy accuracy across `en`, `yo`, and `pcm` before Production flag enablement.
