# Batch 04.0 — Security Threat Assessment

**Status:** Proposed | **Date:** 2026-11-22

| # | Threat | Vector | Existing control (evidence) | Gap | Batch 04 control |
|---|---|---|---|---|---|
| S1 | Prompt injection through documents | Instructions hidden in PDF text, OCR output or translations | Model-safe serialisation into `<untrusted_evidence_json>` (`prompt-builder.ts:154`, 03.2G) | OCR and translation are new text channels | Same boundary for all derivatives; flag instruction-like passages at review |
| S2 | Source poisoning | Fabricated "institute" PDF uploaded as authoritative | `authority_verified` denied to ordinary ingestion (`20261122030000`) | No source register; authority is free text | ADR-011 register; authority verified only via provider-confirmed channel; second review for high-risk |
| S3 | Malicious files | PDF exploits, decompression bombs, oversized files | 10 MB limit, MIME/magic checks, private bucket (03.2G) | PDF parsing not yet implemented | Sandboxed extraction without network, page and time limits |
| S4 | Licence breach | Ingesting or showing restricted text | None | No licence model | Permission matrix enforced in RPCs (05) |
| S5 | Unsafe numbers | Model or fallback emits rates | Banned-pesticide name check only (`chemical-guardrail.ts`) | Fallback gives rates for any crop (02) | ADR-020 fail-closed engines; ADR-016 numeric validator |
| S6 | Citation spoofing | Model invents passage ids or pages | None | — | Server-side citation validation |
| S7 | Review bypass | Super admin publishes own standard | Four-eyes with super-admin override (`20261103120000:237-240`) | Silent override | ADR-021: no bypass; recorded, time-limited emergency path |
| S8 | Post-publication tampering | Editing limits after publish | `forbid_published_standard_mutation` (`20261103120000:58`) | `max_nitrogen_kg_ha`, zone, dates, authority not frozen | Extend trigger to every agronomic field |
| S9 | Ungoverned AI entry point | `askFarmAssistantAction` calls the LLM without evidence package or AI audit (`apps/web/src/actions/ai-assistant.ts`) | Route-level audit on `/api/ai/assistant` | Second, unaudited path | Single audited entry point |
| S10 | Cross-tenant leakage | Farm memory or logs exposed in retrieval | Forced RLS (03.2), farm-scoped memory search | Retrieval logs planned | Logs store tags and ids only, no farmer text |
| S11 | Third-party data processing | Passages and farm facts sent to LLM and embedding providers | `ai_intelligence` consent (03.1) | No per-provider assessment | Provider data-processing terms reviewed (D-L3); minimise farm data in prompts |
| S12 | Silent model change | Provider updates a model behind a name | Model id recorded in AI audit (03.1B) | Embedding model not versioned in use | Pin model + version; re-run evaluation gate on change |
| S13 | Cost and availability abuse | Request floods triggering rerank and LLM calls | Auth on routes | No quota | Per-account rate limits and budgets |
| S14 | Mistranslation | Translated dose or warning changes meaning | None | — | Numbers never translated by the model; translations reviewed; ND licences block translation |
