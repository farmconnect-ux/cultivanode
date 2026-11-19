# Batch 03.0 — Target Architecture: Farm Intelligence Engine (FIE)

**Date:** 2026-11-19  
**Status:** Proposed Architecture (Discovery & Design Only — No Implementation in Batch 03.0)

---

## 1. Proposed FIE Architecture

```mermaid
flowchart TB
  subgraph Clients["Clients (Web & Mobile)"]
    UI["Web / Mobile App (Online + Offline Outbox)"]
  end

  subgraph EdgeOrch["FIE Server Orchestration (User-JWT Scoped)"]
    AuthGate["Auth, Account Active & Consent Gate"]
    CtxSvc["Live Farm Context Service"]
    MemSvc["Persistent Farm Memory Service (5 Categories)"]
    AgronRAG["Published Agronomy Standards & Deterministic Calculators"]
    PromptAsm["Delimited Prompt & Guardrail Wrapper"]
    LLMRouter["LLM Router (Claude -> Gemini -> OpenAI -> Rule Engine)"]
    SafetyChk["Post-Generation NAFDAC & Schema Guardrail"]
    AuditWriter["AI Audit Register Writer"]
  end

  subgraph Supabase["Supabase PostgreSQL 17 (+ pgvector)"]
    FarmDB["Canonical Farm Tables (farms, plots, soil, crops, livestock, iot, finance)"]
    MemDB["farm_memory_items + pgvector embeddings"]
    AuditDB["ai_audit_events (Append-Only)"]
    PrivStorage["Private Storage (scouting-photos)"]
  end

  UI -->|"Bearer JWT + farm_id"| AuthGate
  AuthGate --> CtxSvc
  AuthGate --> MemSvc
  CtxSvc -->|"RLS: can_view_farm(farm_id)"| FarmDB
  MemSvc -->|"RLS: can_view_farm(farm_id)"| MemDB
  AuthGate --> AgronRAG
  CtxSvc --> PromptAsm
  MemSvc --> PromptAsm
  AgronRAG --> PromptAsm
  PromptAsm --> LLMRouter
  LLMRouter --> SafetyChk
  SafetyChk -->|"Advisory response + proposed memory"| UI
  SafetyChk --> AuditWriter
  AuditWriter --> AuditDB
  UI -->|"Farmer confirmation (can_edit_farm)"| MemDB
```

---

## 2. Live Farm Context Retrieval Architecture

### Context Retrieval Flow
```mermaid
sequenceDiagram
  participant Caller as Authenticated Caller
  participant Orch as FIE Orchestrator
  participant DB as Supabase (User JWT + RLS)
  participant Wx as Weather Cache / Provider

  Caller->>Orch: Request(farm_id, plot_id?, query, trace_id)
  Orch->>DB: Verify auth.uid(), account_active(), can_view_farm(farm_id)
  alt Denied
    DB-->>Orch: 0 rows / 42501
    Orch-->>Caller: 403 Forbidden (logged to ai_audit_events)
  else Allowed
    par Parallel Domain Queries (RLS-scoped)
      Orch->>DB: Identity, plots, boundaries, active crop_cycles, standards
      Orch->>DB: Recent soil_records, crop_observations, crop_alerts, tasks
      Orch->>DB: Telemetry rollups (15m/1h/1d), irrigation, livestock, inventory, finance summary
      Orch->>DB: Relevant farm_memory_items (structured + pgvector top-K)
      Orch->>Wx: Latest regional/coordinate weather + forecast
    end
    Orch->>Orch: Reconcile conflicts, score freshness & provenance, cap token budget
    Orch-->>Caller: Typed LiveFarmContextSnapshot
  end
```

### Context Contract, Freshness, Conflict Reconciliation & Ranking
- **Typed `LiveFarmContextSnapshot`** separates every fact into four provenance buckets:
  1. `current_observations`: active `crop_cycles`, open `crop_alerts`/`device_alerts`, latest `telemetry_rollups`, recent `crop_observations` (last 30d).
  2. `historical_records`: prior `crop_harvests`, completed `crop_cycle_operations`, `soil_records`, `farm_financial_transactions` summaries, `farm_livestock_production_logs`.
  3. `external_sources`: `weather_cache` / NiMet / Open-Meteo forecasts, published `farm_agronomic_standards`.
  4. `ai_derived`: `farm_memory_items` (`status = 'proposed' | 'confirmed'`) and prior `crop_observations.ai_diagnosis` (explicitly tagged non-authoritative unless confirmed).
- **Conflict Reconciliation Rules (Deterministic):**
  - **Soil pH / nutrients:** `soil_records` (`agent_verified`/`platform_verified` > `self_reported` by latest `tested_on`) overrides `plots.soil_*` and `farms.soil_information`.
  - **Soil moisture:** `telemetry_rollups` (`quality_flag = 'valid'`, `< 6h` old) overrides `irrigation_zones.current_moisture_pct`.
  - **Active crop:** `crop_cycles` (`status = 'active'`) overrides `plots.current_crop`.
  - **Machinery hours:** `machinery_telemetry.engine_hours` (if active) or sum of `farm_machinery_usage_logs` overrides stale `farm_machinery_assets.engine_hours`.
- **Stale / Missing Data Handling:** Every section carries `asOf`, `stalenessHours`, and `missingReasons[]`. If telemetry `> 12h` old or `soil_records` `> 365d` old, the snapshot marks `stale: true` so the prompt instructs the LLM to state uncertainty rather than guess.
- **Relevance Ranking:** Rank by `(1) active alert / unresolved problem -> (2) target plot_id & active crop_cycle -> (3) recency decay -> (4) verification confidence -> (5) semantic similarity`.

---

## 3. Persistent Farm Memory Architecture

### Five Memory Categories
| Category | Scope | Examples | Default TTL / Review |
|---|---|---|---|
| **Episodic** | `farm_id` (+ optional `plot_id`, `crop_cycle_id`) | Pest outbreak on Plot A, flood event, treatment outcome, harvest shortfall | Season-bound (`180d` review) |
| **Semantic** | `farm_id` (+ optional `plot_id`) | Confirmed clay-loam drainage issue, recurring striga pressure, perennial crop spacing | `365d` review |
| **Procedural** | `farm_id` | Approved spray schedule timing, irrigation threshold preference, harvest grading workflow | `365d` review |
| **Preference** | `profile_id` (+ `farm_id`) | Preferred language (`en`/`yo`/`pcm`), units (ha vs acres), concise vs detailed tone | User-editable; no auto-expiry |
| **Unresolved** | `farm_id` (+ `crop_cycle_id`) | Open `crop_alerts`, pending follow-up scouting, unconfirmed AI recommendation | `14d`–`30d` review until resolved |

### Memory Record Schema & Provenance
Every `farm_memory_items` row MUST store:
- `id`, `farm_id` (NOT NULL FK `farms`), `plot_id` (nullable FK), `crop_cycle_id` (nullable FK), `profile_id` (nullable FK).
- `category` (`episodic|semantic|procedural|preference|unresolved`), `title`, `content`, `embedding vector(1536)` (nullable, hybrid retrieval).
- `source_kind` (`farmer_reported|staff_verified|sensor|external_weather|ai_inferred`), `source_table`, `source_record_id`.
- `verification_status` (`proposed|confirmed|disputed|superseded|deleted`), `confidence` (`0.00`–`1.00`).
- `created_at`, `updated_at`, `review_after`, `expires_at`, `confirmed_by`, `confirmed_at`.
- **Rule:** AI-inferred memories ALWAYS start as `verification_status = 'proposed'` and `source_kind = 'ai_inferred'`. They NEVER overwrite `'confirmed'` farmer/staff facts.

### Memory Lifecycle
```mermaid
stateDiagram-v2
  [*] --> proposed: AI extracts candidate / observation
  [*] --> confirmed: Farmer or Staff records directly
  proposed --> confirmed: Farmer / Staff confirms (can_edit_farm)
  proposed --> disputed: Farmer rejects / corrects
  confirmed --> superseded: Newer verified record replaces fact
  confirmed --> deleted: Farmer deletes / account deletion
  proposed --> deleted: Expired unconfirmed or deleted
```

### Storage Technology Decision
**Hybrid PostgreSQL 17 + `pgvector`** inside existing Supabase: relational indexes on `(farm_id, category, verification_status, review_after)` handle 90% of structured deterministic lookups, while `pgvector` HNSW indexes on `farm_memory_items.embedding` and published `farm_agronomic_standards` handle semantic cross-season recall without adding external vector DB cost or cross-tenant sync risk.

---

## 4. AI Audit Register (`ai_audit_events`) Architecture

### AI Audit Event Lifecycle
```mermaid
sequenceDiagram
  participant User as Farmer / Staff
  participant FIE as FIE Orchestrator
  participant Guard as Safety & Agronomy Guardrail
  participant Audit as ai_audit_events (Append-Only)

  User->>FIE: Prompt / Scouting Analysis (trace_id)
  FIE->>Audit: Log request metadata (actor_id, farm_id, auth_mode, model, prompt_ver, context_refs[], memory_refs[])
  FIE->>Guard: Validate LLM output (NAFDAC ban, PHI/REI, schema)
  Guard-->>FIE: guardrail_passed, appendices, blocked_terms
  FIE->>Audit: Log outcome (response_summary, confidence, guardrail_result, latency_ms, error_code)
  FIE-->>User: Return advisory response + trace_id
  opt User Feedback / Future Action
    User->>FIE: Accept / Reject / Modify recommendation
    FIE->>Audit: Append feedback/action event linked by trace_id
  end
```

- **Key Fields:** `id`, `trace_id` (uuid), `parent_event_id` (self-FK), `farm_id`, `actor_id`, `auth_role`, `interaction_kind` (`chat|vision_scouting|proactive_alert|action_proposal`), `provider`, `model_id`, `prompt_version`, `context_record_refs` (jsonb), `memory_ids_used` (uuid[]), `external_sources` (jsonb), `tools_invoked` (jsonb), `recommendation_summary` (text), `confidence`, `guardrail_passed`, `guardrail_details` (jsonb), `human_outcome` (`accepted|rejected|modified|pending`), `execution_status`, `error_code`, `created_at`.
- **Tamper Resistance & Privacy:** Protected by `private.forbid_change()` (`BEFORE UPDATE OR DELETE`). Never stores bearer tokens, API keys, raw `imageBase64`, or unredacted phone/bank PII.
