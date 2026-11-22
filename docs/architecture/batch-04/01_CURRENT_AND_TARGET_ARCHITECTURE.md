# Batch 04.0 — Current and Target Architecture

**Status:** Proposed | **Date:** 2026-11-22

## Current state (`main` @ `ddad3b0`, Production checked 2026-11-22)

```mermaid
flowchart TD
  UI["Web assistant UI<br/>ai-farm-assistant.tsx"] --> SA["Server action askFarmAssistantAction<br/>actions/ai-assistant.ts<br/>no evidence package, no AI audit"]
  API["POST /api/ai/assistant<br/>route.ts"] --> LFC["Live Farm Context<br/>live-farm-context.service.ts"]
  API --> MEM["search_farm_memory_items<br/>vector(1536)"]
  API --> STD["search_published_agronomic_standards<br/>ILIKE whole question when no embedding"]
  STD --> CH[("agronomic_standard_chunks<br/>0 rows")]
  STD --> DOC[("agronomic_standard_documents<br/>0 rows")]
  STD --> FS[("farm_agronomic_standards<br/>5 published, 14 draft")]
  LFC --> EP["GroundedEvidencePackage<br/>memory-rag/types.ts"]
  MEM --> EP
  STD --> EP
  EP --> LLM["askGroundedAiAssistant<br/>llm-adapter.ts"]
  SA --> LLM
  LLM -->|all providers fail| RULE["Rule-engine fallback<br/>fixed NPK/urea rates for any crop"]
  LLM --> GR["Chemical guardrail<br/>banned names only"]
  RULE --> GR
  FERT["POST /api/engines/agronomy/fertiliser<br/>5-crop allow-list"] --> ENG["calculateFertiliserRecommendation<br/>default coefficients for unknown crops"]
  EMB["EmbeddingProvider<br/>Unconfigured in production"] -.-> MEM
  EMB -.-> STD
```

## Target state (end of Batch 04.5)

```mermaid
flowchart TD
  SRC["knowledge_sources + licence grants<br/>ADR-011"] --> ING["Ingestion: archive, page images,<br/>text layer / OCR, tables<br/>ADR-012"]
  ING --> REV["Extraction review + agronomic approval<br/>+ high-risk second review<br/>ADR-021"]
  REV --> PUB[("Published passages<br/>tsvector + per-model embeddings + taxonomy tags")]
  TAX["Governed taxonomy<br/>ADR-015"] --> ING
  GEO["farm_geo_profiles<br/>AEZ, climate, soil prior<br/>ADR-018"] --> QB
  Q["Farmer question<br/>(single audited AI entry point)"] --> QB["Query builder<br/>tags, synonyms, licence/state filters"]
  LFC["Live Farm Context<br/>lab vs modelled soil"] --> QB
  QB --> R1["Full-text"] & R2["Vector"] & R3["Taxonomy match"]
  PUB --> R1 & R2 & R3
  R1 & R2 & R3 --> F["Rank fusion + rerank<br/>ADR-013"]
  F --> SEL["Evidence selection<br/>legal constraints, quality, recency,<br/>applicability, conflicts<br/>ADR-019"]
  SEL --> EP["Evidence package v2"]
  ENG["Deterministic engines<br/>fail closed, typed units<br/>ADR-020"] --> EP
  EP --> M["LLM: structured claims"]
  M --> V["Server validation<br/>citations, numbers, limits<br/>ADR-016"]
  V --> A["Answer + citations + audit"]
  EVAL["Evaluation gate<br/>ADR-017"] -.-> F
  EVAL -.-> V
```

The 02 fertiliser finding (rule-engine numbers, server-action bypass) is removed in the target: there is one AI
entry point, no default coefficients, and no number reaches a farmer without an engine result or a cited passage.
