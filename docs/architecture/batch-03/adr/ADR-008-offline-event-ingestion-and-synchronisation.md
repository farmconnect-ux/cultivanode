# ADR-008: Offline Event Ingestion and Synchronisation

**Status:** Proposed (Batch 03.0) | **Date:** 2026-11-19

## Context
`apps/mobile/src/lib/outbox.ts` (`cn.outbox.v1`, fixed 20s retry, silent drop after 5 attempts, non-atomic `herd_loss` update) is disconnected from `packages/shared/src/engines/offline-sync/` (pure in-memory `DurableOutboxQueue` with exponential backoff & conflict resolution).

## Decision
In Batch 03.3, unify mobile offline mutations onto a persistent adapter implementing `packages/shared/src/engines/offline-sync/` contracts with client UUID idempotency keys, exponential backoff + jitter (`calculateBackoffMs`), server-authoritative conflict resolution (`resolveConflict`) for shared farm state, atomic RPCs for decrements (`herd_loss`), and a dead-letter retry UI instead of silent drops.

## Alternatives & Trade-offs
- **Maintaining two separate outbox implementations:** Guarantees schema drift and silent data loss in low-connectivity rural areas (rejected).

## Security & Cost Implications
- Encrypt sensitive offline outbox payloads at rest on mobile or restrict queued payloads to non-secret domain records; eliminates duplicate-write financial/inventory drift.
