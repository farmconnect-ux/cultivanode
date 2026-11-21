/**
 * Grounded Evidence Package Assembler & Untrusted-Content Sanitizer (Batch 03.2 Section 7).
 *
 * Non-negotiable invariants:
 * - Retrieved documents, memories, and user text are UNTRUSTED DATA and must NEVER
 *   override system instructions, security policies, consent, or tool permissions.
 * - Verified current farm facts from Live Farm Context ALWAYS take precedence over
 *   older historical memories.
 * - Published agronomic standards are strictly separated from farm-specific measurements.
 */

import { normalizeAuditContextReferences } from '../farm-context/provenance';
import type { AuditContextReference, LiveFarmContextSnapshot } from '../farm-context/types';
import type {
  FarmMemoryItemRecord,
  GroundedEvidencePackage,
  PublishedStandardPassage,
} from './types';

const PROMPT_INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|prior|system)\s+(instructions?|rules?)/gi,
  /override\s+(system|safety|guardrail|consent|security)\s*(instructions?|policy|rules?)?/gi,
  /^\s*(system|assistant|developer|tool)\s*:/gim,
  /<\s*\/?\s*(system|prompt|instructions?|tool_call)\s*>/gi,
];

/**
 * Neutralises prompt-injection directives in untrusted retrieved passages or memory text
 * while preserving legitimate agricultural information.
 */
export function sanitizeUntrustedRetrievedText(raw: string, maxLength = 2000): string {
  let text = raw.replace(/\u0000/g, '').trim();
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    text = text.replace(pattern, '[REDACTED_INSTRUCTION_LIKE_TEXT]');
  }
  if (text.length > maxLength) {
    text = `${text.slice(0, maxLength)}…`;
  }
  return text;
}

/**
 * Assembles the strict multi-tier GroundedEvidencePackage for the Farm Intelligence Engine.
 */
export function assembleGroundedEvidencePackage(params: {
  liveFarmContext: LiveFarmContextSnapshot;
  memories: readonly FarmMemoryItemRecord[];
  publishedStandards: readonly PublishedStandardPassage[];
  assembledAt?: string;
}): GroundedEvidencePackage {
  const assembledAt = params.assembledAt ?? new Date().toISOString();
  const reconciliationNotes: string[] = [];

  const confirmedHistoricalMemories: FarmMemoryItemRecord[] = [];
  const provisionalMemories: FarmMemoryItemRecord[] = [];
  const profilePreferences: FarmMemoryItemRecord[] = [];

  const soilVerifiedAt =
    params.liveFarmContext.domains.soil_chemistry_and_nutrients.data?.ph.state === 'verified_current'
      ? params.liveFarmContext.domains.soil_chemistry_and_nutrients.data.ph.provenance?.observedAt ?? null
      : null;

  for (const mem of params.memories) {
    // Hard guard: never admit rejected, withdrawn, expired, superseded, or deleted memories.
    if (
      mem.lifecycleStatus === 'rejected' ||
      mem.lifecycleStatus === 'withdrawn' ||
      mem.lifecycleStatus === 'expired' ||
      mem.lifecycleStatus === 'superseded' ||
      mem.lifecycleStatus === 'deleted'
    ) {
      continue;
    }
    if (mem.expiresAt && new Date(mem.expiresAt).getTime() <= new Date(assembledAt).getTime()) {
      continue;
    }

    const sanitizedMem: FarmMemoryItemRecord = {
      ...mem,
      title: sanitizeUntrustedRetrievedText(mem.title, 200),
    };

    if (sanitizedMem.memoryScope === 'profile') {
      profilePreferences.push(sanitizedMem);
      continue;
    }

    // Tenant defense-in-depth: never admit another farm's memory into this farm's package.
    if (sanitizedMem.farmId !== params.liveFarmContext.farmId) {
      continue;
    }

    // Explicit reconciliation rule: verified current farm record takes precedence over older memory.
    if (
      soilVerifiedAt &&
      sanitizedMem.memoryType.toLowerCase().includes('soil') &&
      sanitizedMem.updatedAt < soilVerifiedAt
    ) {
      reconciliationNotes.push(
        `Verified current soil_records observation (${soilVerifiedAt}) supersedes older farm memory "${sanitizedMem.id}" (${sanitizedMem.updatedAt}).`,
      );
    }

    if (sanitizedMem.lifecycleStatus === 'confirmed' && sanitizedMem.verificationStatus === 'confirmed') {
      confirmedHistoricalMemories.push(sanitizedMem);
    } else {
      provisionalMemories.push(sanitizedMem);
    }
  }

  const sanitizedStandards: PublishedStandardPassage[] = params.publishedStandards.map((std) => ({
    ...std,
    sanitizedContent: sanitizeUntrustedRetrievedText(std.content),
    evidenceKind: 'published_agronomic_standard',
  }));

  const memoryItemIds = [
    ...confirmedHistoricalMemories.map((m) => m.id),
    ...provisionalMemories.map((m) => m.id),
    ...profilePreferences.map((m) => m.id),
  ];

  const extraRefs: AuditContextReference[] = [
    ...memoryItemIds.map((id) => ({ source: 'farm_memory_items' as const, record_id: id })),
    ...sanitizedStandards.map((std) => ({
      source: 'agronomic_standard_chunks' as const,
      record_id: std.chunkId,
      ...(std.publishedAt ? { observed_at: std.publishedAt } : {}),
    })),
  ];

  const auditContextRefs = normalizeAuditContextReferences(
    [...params.liveFarmContext.auditContextRefs, ...extraRefs],
    100,
  );

  return {
    farmId: params.liveFarmContext.farmId,
    assembledAt,
    verifiedCurrentFarmFacts: params.liveFarmContext,
    confirmedHistoricalMemories,
    provisionalMemories,
    profilePreferences,
    publishedAgronomicStandards: sanitizedStandards,
    missingOrUnavailable: params.liveFarmContext.missingInformation,
    reconciliationNotes,
    auditContextRefs,
    memoryItemIds,
    untrustedContentSanitized: true,
  };
}
