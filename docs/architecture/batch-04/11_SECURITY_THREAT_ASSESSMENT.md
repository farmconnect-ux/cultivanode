# Batch 04.0 — Security Threat Assessment

**Status:** Revision 3 | **Date:** 2026-11-22

| # | Threat | Vector | Existing control (evidence) | Gap | Batch 04 control |
|---|---|---|---|---|---|
| S1 | Prompt injection through documents | Instructions hidden in PDF text, OCR output or translations | Model-safe serialisation into `<untrusted_evidence_json>` (`prompt-builder.ts:154`, 03.2G) | OCR and translation are new text channels | Same boundary for all derivatives; flag instruction-like passages at review |
| S2 | Source poisoning | Fabricated "institute" PDF uploaded as authoritative | `authority_verified` denied to ordinary ingestion (`20261122030000`) | No source register; authority is free text | ADR-011 register; authority verified only via provider-confirmed channel; second review for high-risk |
| S3 | Malicious files | PDF exploits, decompression bombs, oversized files | 10 MB limit, MIME/magic checks, private bucket (03.2G) | PDF parsing not yet implemented | Sandboxed extraction without network, page and time limits |
| S4 | Licence breach | Ingesting or showing restricted text | None | No licence model | Proposed A1–A13 policy enforced in RPCs (`05_LICENSING_CONTROLS.md`), subject to legal review |
| S5 | Unsafe numbers | Model or fallback emits rates | Banned-pesticide name check only (`chemical-guardrail.ts`) | Fallback gives rates for any crop (02) | 04.0-H prerequisite; ADR-020; ADR-016 numeric validator |
| S6 | Citation spoofing | Model invents passage ids or pages | None | — | Server-side citation validation |
| S7 | Review bypass | Super admin publishes own standard | Four-eyes with super-admin override (`20261103120000:237-240`) | Silent override | ADR-021: no bypass; recorded, time-limited emergency path |
| S8 | Post-publication tampering | Editing limits after publish | `forbid_published_standard_mutation` (`20261103120000:58`) | `max_nitrogen_kg_ha`, zone, dates, authority not frozen | Extend trigger to every agronomic field |
| S9 | Ungoverned AI entry point | `askFarmAssistantAction` calls the LLM without evidence package or AI audit (`apps/web/src/actions/ai-assistant.ts`) | Route-level audit on `/api/ai/assistant` | Second, unaudited path | Single audited entry point (04.0-H) |
| S10 | Cross-tenant leakage | Farm memory exposed through retrieval | Forced RLS (03.2), `search_farm_memory_items` checks `can_view_farm` (`20261122000000:865`) | New retrieval RPC will read farm context | ADR-013 C4–C6 |
| S11 | Third-party data processing | Passages and farm facts sent to LLM and embedding providers | `ai_intelligence` consent (03.1) | No per-provider assessment | Provider terms reviewed (D-L3); minimise farm data in prompts |
| S12 | Silent model change | Provider updates a model behind a name | Model id recorded in AI audit (03.1B) | Embedding model not versioned in use | Registry with pinned version; evaluation gate on change (ADR-014) |
| S13 | Cost and availability abuse | Request floods triggering rerank and LLM calls | Auth on routes | No quota | Per-account rate limits and budgets |
| S14 | Mistranslation | Translated dose or warning changes meaning | None | — | Numbers never translated by the model; translations reviewed; no-derivatives licences block translation |
| S15 | Farm id substitution | Caller passes another farmer's farm id to the retrieval RPC | `can_view_farm` pattern exists for memory | Not yet in the passage RPC | ADR-013 C4; pgTAP test with a foreign farm id |
| S16 | Caller-supplied context | Request body supplies crop, zone or soil to steer evidence or numbers | `/api/ai/assistant` accepts `context.cropId` (`route.ts:57`) | Client values can override farm facts (`route.ts:157`) | ADR-013 C5: farm facts read server-side; client tags only narrow |
| S17 | Licence or mode bypass | Caller requests staff review mode to see unlicensed passages | — | — | ADR-013 C7: mode decided by permission inside the function |
| S18 | Definer function abuse | `search_path` hijack, broad grants, wrong owner | Existing RPCs use `SET search_path = ''`, `postgres` owner, narrow grants (`20261122030000:489`) | Must hold for every new RPC | ADR-013 C10–C12, with pgTAP grant tests |
| S19 | Retrieval log leakage | Logs reveal what a farm asked or holds | None yet | Logs planned | ADR-013 C14: no question text or farm facts; private table; staff-only RPC; retention D-L7 |
