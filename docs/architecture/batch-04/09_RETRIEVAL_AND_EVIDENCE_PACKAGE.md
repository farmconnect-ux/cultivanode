# Batch 04.0 — Retrieval Design and Evidence Package

**Status:** Proposed — revision 4 | **Date:** 2026-11-22 | **ADRs:** ADR-013, ADR-016, ADR-019, ADR-020

## Retrieval (Batch 04.4)

One `security definer` RPC replacing the ranking in `public.search_published_agronomic_standards`
(`supabase/migrations/20261122030000_batch_03_2g_document_provenance_chain.sql`), keeping its existing checks
(authenticated, `private.account_active`, published, active, `ingestion_status = 'indexed'`, effective dates).

1. **Query profile** built server-side: crop, variety, stage, AEZ, season, soil class, practice and organism terms
   from Live Farm Context and the question; synonyms expanded from `taxonomy_synonyms`.
2. **Hard filters:** licence grant allows A7 (staff) or A8/A9 (farmer answers); document approved; not retired.
3. **Three ranked lists:** full-text (`tsvector`, `websearch_to_tsquery`, LIKE wildcards escaped), vector (same
   model and version as the query embedding, per-model table, ADR-014), taxonomy overlap score.
4. **Fusion:** reciprocal rank fusion; a list that is unavailable (e.g. embedding provider down) is skipped and
   recorded in the retrieval outcome.
5. **Rerank** the top candidates (method chosen by benchmark, `10_EMBEDDING_AND_RERANKING_EVALUATION.md`).
6. **Evidence selection:** regulatory constraints applied first; applicability per dimension; evidence quality and
   recency; conflict detection; at most a fixed number of passages per document.
7. **Logging:** query tags, candidate ids, scores and outcome — no farmer text.

The current fallback `c.content ilike '%' || v_query || '%'` (unescaped `%`/`_`, whole question) is removed.

## Evidence package v2

Extends `GroundedEvidencePackage` (`packages/shared/src/engines/memory-rag/types.ts:247`), keeping every existing
field and the model-safe serialisation boundary.

| New field | Contents |
|---|---|
| `queryProfile` | Resolved terms and their source (farm fact, question, default) |
| `farmGeoProfile` | AEZ, climate, soil prior with dataset versions (ADR-018) |
| `soilFacts` | Each value with evidence class (`lab_confirmed`, `field_kit`, `farmer_reported`, `modelled_estimate`), unit, date |
| `constraints` | Regulatory limits and bans that apply, with source |
| `evidencePassages` | Passage text, citation (source, document version, page, section), legal status, evidence quality, date, geographic scope, applicability per dimension, `may_quote`, `may_translate`, attribution text |
| `conflicts` | Conflicting passage pairs with attributes and any approved resolution |
| `engineResults` | Deterministic calculations with inputs, coefficient ids and their citations, or the fail-closed code |
| `missingFacts` | Facts that would change the answer |
| `retrievalDiagnostics` | Which retrievers ran, counts, degraded flags |

## Answer contract (ADR-016, ADR-020)

Structured claims: `kind` (`cited_source_information`, `farm_fact`, `calculation`, `assumption`, `general_guidance`),
`citations`, `applicability`, `confidence` with reason, `conflicts`, `missing`. Server checks before display:

1. Every citation ID exists in the package; otherwise the claim is dropped and the answer marked degraded.
2. **Farm-specific numerical fertiliser prescriptions** must trace to a validated `engineResults` entry satisfying all
   nine ADR-020 conditions (approved crop-specific protocol/coefficients, calibrated lab soil provenance, units,
   applicability, and legal/safety constraints). A cited passage **cannot** independently authorise a farm-specific
   numerical fertiliser prescription (fixes path P6 in `02_FERTILISER_SAFETY_FINDING.md`).
3. **General published source information:** a numerical value quoted from a cited passage may be displayed only as
   `cited_source_information` where `may_quote = true` (licence permits), the source's context and applicability are
   explicitly disclosed, and it cannot be mistaken for a prescription for the user's farm.
4. Rates respect `constraints` and published limits (`max_nitrogen_kg_ha`).
5. When any mandatory condition is absent, inconsistent, expired, or unverified (including crops without an approved
   standard), no numerical fertiliser prescription is produced; the answer leads with what is missing and offers
   non-numerical guidance.
