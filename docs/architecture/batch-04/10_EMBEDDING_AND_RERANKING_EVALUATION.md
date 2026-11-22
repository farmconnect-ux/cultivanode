# Batch 04.0 — Embedding, Reranking and Retrieval Evaluation Methodology

**Status:** Proposed — revision 4 | **Date:** 2026-11-22 | **ADRs:** ADR-014, ADR-017

## Current vector architecture (verified)

- `public.agronomic_standard_chunks.embedding vector(1536)` + HNSW `agronomic_std_chunks_embedding_hnsw_idx`
  (`20261122020000`).
- `public.farm_memory_items.embedding vector(1536)` + HNSW `farm_memory_items_embedding_hnsw_idx` (`20261122000000`);
  used by `public.search_farm_memory_items(…, extensions.vector, integer)` (line 812).
- `EMBEDDING_DIMENSIONS = 1536` and `formatPgVector` rejects any other length
  (`packages/shared/src/engines/memory-rag/embedding-provider.ts`).
- pgvector 0.8.2 in Production. Production default provider: `UnconfiguredEmbeddingProvider` (no vectors).

## Comparison methodology

### Configurations compared

1. Baseline: current 03.2 behaviour (whole-question `ILIKE`).
2. Full-text only (`tsvector` + taxonomy synonyms).
3. Each shortlisted hosted embedding model (2–4, at least one multilingual), alone and fused with full-text. Models
   are compared at their native output size, and at reduced sizes where the model supports it; no model is assumed
   to produce 1,536 dimensions.
4. Best fused configuration with each reranking option: none, a hosted cross-encoder reranker, an LLM reranker.

The shortlist is fixed at the start of the benchmark and recorded with exact model versions (D-T1). Each model is
loaded into its own partition of the proposed store (ADR-014), so comparisons run side by side.

### Corpus

A frozen snapshot of licensed documents with the production chunking settings.

### Question set (ADR-017)

Labelled by agronomists with graded relevance (0, 1, 2) per passage. Strata:

| Stratum | Examples of what it tests |
|---|---|
| Standard English agronomy | "basal application", "top-dressing", "pre-harvest interval" |
| Nigerian English farm usage | ridges, heaps, stands, "bags per plot", product trade names |
| Local crop names | ewedu, ugu, tete, ata rodo, egusi |
| Yoruba, Hausa, Igbo, Pidgin and code-mixed questions | Same intents as the English set |
| Units and numbers | kg/ha vs bags/acre, ml per 16 L knapsack |
| Noisy input | Typos, voice transcription errors |
| No-answer questions | Topics absent from the corpus (must return nothing relevant) |

### Two-level acceptance framework (ADR-017)

The initial Staging benchmark **must not** automatically become an acceptable quality baseline; a weak initial run must
never legitimise weak future performance. Release gating uses two sequential levels.

#### Level A: Absolute release requirements (provisional — requires formal sign-off)

The thresholds below are **provisional proposals**, not scientifically validated standards. They must be reviewed and
formally approved by the **product owner** (cost/latency/product risk, D-P9), **lead agronomist** (agronomic safety,
applicability, and claim accuracy, D-A8), and **engineering lead** (retrieval/system feasibility) before the first
Production release (Batch 04.5).

| Dimension | Metric | Provisional Level A Threshold | Approval Authority |
|---|---|---|---|
| **Critical safety** | Unsupported numerical fertiliser prescriptions in evaluation suite | **0** (zero tolerance) | Lead agronomist + Product owner (mandatory, non-waivable) |
| Citation integrity | Citation validity (cited ID exists in package & supports claim) | **≥ 98%** (provisional) | Lead agronomist + Engineering lead |
| Faithfulness | Unsupported agricultural claim rate (non-numeric) | **≤ 2%** (provisional) | Lead agronomist |
| Refusal safety | No-answer precision (correctly declines absent topics / unsupported crops) | **≥ 95%** overall; **100%** on unsupported-crop fertiliser rate probes (provisional) | Lead agronomist + Product owner |
| Retrieval recall | `Recall@5` / `Recall@20` | **≥ 0.80** (`Recall@5`) / **≥ 0.92** (`Recall@20`) overall (provisional) | Engineering lead + Lead agronomist |
| Ranking quality | `nDCG@10` / `MRR` | **≥ 0.78** (`nDCG@10`) / **≥ 0.80** (`MRR`) overall (provisional) | Engineering lead |
| Multilingual equity | Per-language floors across English, Nigerian English, Yoruba, Hausa, Igbo, Pidgin | No language stratum below **0.70 `Recall@5`**, **0.85 `Recall@20`**, or **90%** no-answer precision; **0** unsupported numerical fertiliser prescriptions in every language (provisional) | Lead agronomist + Product owner |
| Units & numbers | Unit and numerical interpretation accuracy (e.g. `cmol/kg` ↔ `mg/kg`, bags/acre, 16 L knapsack) | **≥ 99%** on deterministic unit conversions; **0** silent unit conversions (provisional) | Lead agronomist + Engineering lead |
| Applicability | Geographic (AEZ) and crop-stage applicability accuracy | **≥ 95%** (provisional) | Lead agronomist |
| Latency & cost | Retrieval p95 latency (embed + DB search + rerank) and cost per 1,000 queries | Within owner-approved Staging capacity & monthly budget ceiling (D-P1, ADR-003 provisional `< 50 ms` DB vector search gate) | Product owner + Engineering lead |

**Vendor selection rule:** A candidate embedding/reranking configuration is acceptable only if it satisfies Level A,
beats full-text-only on the local-name and non-English strata (not only English), stays within D-P1 budgets, and does
not reduce no-answer precision.

#### Level B: Regression requirements (active after Level A is approved and achieved)

1. Compare each release against the **last accepted benchmark** across all slices.
2. Block promotion if any material metric regresses beyond its approved tolerance (provisional regression tolerance:
   **0** tolerance on unsupported numerical fertiliser prescriptions; **≤ 1.0 percentage point** drop on citation
   validity, no-answer precision, or applicability; **≤ 0.02** drop on `Recall@5`, `Recall@20`, `nDCG@10`, or `MRR`
   on any slice — subject to D-P9 / D-A8 sign-off).
3. Preserve immutable benchmark version IDs, labelled questions, expected evidence IDs, model/index versions, and
   run results with bootstrap confidence intervals.
4. Require independent agronomist review for any material change to agricultural answers.
5. Replay the exact same benchmark harness in **CI** (against fixture documents) and on **Staging** (against
   appropriately licensed documents).

#### Required reporting slices

Every benchmark run must report metrics separately by:
- **Language:** English, Nigerian English, Yoruba, Hausa, Igbo, Pidgin (and code-mixed).
- **Crop:** each of the ten proposed priority crops (where covered) plus out-of-scope crop probes (e.g. lettuce).
- **Agricultural topic:** soil/fertiliser, pest/disease, planting/spacing, irrigation/weather, harvest/storage.
- **Query difficulty:** direct lookup, noisy/typo/voice-transcribed, multi-factor/conflicting evidence.
- **No-answer category:** unsupported crop, absent topic, missing lab soil provenance, unlicensed/metadata-only source.

## Storage for different dimensions

See ADR-014 for the full comparison. In summary:

- A typed `vector(n)` column holds one size; vectors from different models are not comparable even at equal size.
- pgvector HNSW indexes support up to 2,000 dimensions for `vector` and 4,000 for `halfvec`; larger models use
  `halfvec` or a supported reduced size.
- Recommended: a `passage_embeddings` table list-partitioned by model, one partition per model with a dimension check
  and its own HNSW index, driven by an `embedding_models` registry (candidate → shadow → active → standby → retired).
  Alternatives compared: dimension-specific tables, and one table with an untyped column and per-model expression
  indexes.
- Switching models is a registry update in one transaction; rollback flips back to the standby model; retirement
  drops its partition.
- Farm memory (`farm_memory_items`, `search_farm_memory_items`) stays on its own `vector(1536)` column and is not
  moved, unless a separate ADR approves it (D-L3).
