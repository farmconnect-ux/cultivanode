# ADR-013: Hybrid Retrieval in PostgreSQL and Retrieval RPC Security

**Status:** Proposed — revision 3 (Batch 04.0) | **Date:** 2026-11-22 | **Extends:** ADR-003

## Context

`public.search_published_agronomic_standards` (`20261122030000`) ranks by vector distance only when an embedding is
supplied; otherwise it filters with `ILIKE '%<whole question>%'` with unescaped wildcards. It checks `auth.uid()` and
`private.account_active` but takes no farm and does not check `ai_intelligence` consent. `public.search_farm_memory_items`
(`20261122000000:812`) shows the stricter pattern: active account (line 857), consent (line 861) and
`private.can_view_farm(p_farm_id)` (line 865). Both are granted `EXECUTE` to `authenticated` only (`20261122030000:489`,
`20261122000000:926`).

## Decision

One retrieval RPC combining full-text (`tsvector` + taxonomy synonyms), vector (ADR-014 store) and taxonomy-overlap
lists through reciprocal rank fusion, then reranking and evidence selection (ADR-019). Detail:
`09_RETRIEVAL_AND_EVIDENCE_PACKAGE.md`.

## Mandatory security controls

| # | Control | Requirement |
|---|---|---|
| C1 | Caller identity | `auth.uid()` must be non-null; no user-id parameter; identity never taken from the request body |
| C2 | Active account | `private.account_active(auth.uid())` |
| C3 | Consent | `private.has_ai_intelligence_consent(auth.uid())` whenever farm context is used, as in `search_farm_memory_items` |
| C4 | Farm access | A farm id may only choose which of the caller's farms to use. It is checked with `private.can_view_farm(p_farm_id)` before any read; on failure the function raises without revealing whether the farm exists |
| C5 | No caller-supplied farm facts | Crop, stage, zone and soil attributes are read inside the function from farm tables the caller can view. Caller-supplied tags may only narrow the search and must be valid taxonomy terms; they never widen access |
| C6 | Tenant isolation | Passages are shared published knowledge; the function returns no farm data other than the caller's own and never joins farm memory |
| C7 | Licence permissions | Joins `knowledge_licence_grants`: farmer-answer mode requires A8/A9; staff review mode requires A7 and a staff permission checked inside the function, never a mode flag trusted from the caller |
| C8 | Status | Standard `published` and `is_active`; document approved and `indexed`; source not retired; licence grant in force today |
| C9 | Effective dates | `effective_from <= current_date` and `effective_to` null or `>= current_date`, for the standard and the licence grant |
| C10 | `search_path` | `SET search_path = ''` and schema-qualified names throughout |
| C11 | Ownership | `SECURITY DEFINER`, `OWNER TO postgres`; helper functions in `private` revoked from all app roles |
| C12 | Grants | `REVOKE ALL … FROM public, anon, service_role`; `GRANT EXECUTE … TO authenticated` only |
| C13 | Input bounds | Limit clamped (existing 1–25); query length capped; full-text via `websearch_to_tsquery`; any LIKE pattern escaped; query embedding must match the active model's dimensions; model id read from the registry, not the caller |
| C14 | Retrieval logs | Written only by the definer function into a `private` table with no grants to app roles. Stored: farm id, query term ids, candidate passage ids, scores, model id, outcome, timestamp. Not stored: question text, soil values, farm names, location. Readable only through a staff RPC with a dedicated permission; retention period D-L7; covered by account deletion (ADR-009) |
| C15 | Errors | Generic error messages; no hint of restricted or unlicensed documents |

Required tests (pgTAP) for 04.2: one per control, including another farmer's farm id → `42501`, `anon` and
`service_role` cannot execute, a lapsed licence grant hides passages, a retired source hides passages, and the log row
contains no question text.

## Alternatives

- External search engine: second copy of the data and access model (rejected).
