/**
 * Grounded Evidence Package Assembler & Untrusted-Content Sanitizer (Batch 03.2 Findings 4 & 5).
 *
 * Non-negotiable invariants:
 * - Retrieved documents, memories (both titles AND structuredContent), and user text are
 *   UNTRUSTED DATA. Sanitisation is a defense-in-depth layer paired with strict instruction
 *   hierarchy and tool-permission controls in the prompt builder.
 * - Model-facing `publishedAgronomicStandards` strip raw unsanitised `content`, exposing ONLY
 *   `sanitizedContent`.
 * - Verified current farm facts from Live Farm Context ALWAYS take precedence over older memories.
 * - Retrieval outcomes (`ok_with_results`, `ok_empty`, `failed`, `skipped`) are explicitly tracked
 *   and surfaced via `degradedGrounding` so retrieval failures are NEVER mistaken for empty results.
 */

import { normalizeAuditContextReferences } from '../farm-context/provenance';
import type { AuditContextReference, LiveFarmContextSnapshot } from '../farm-context/types';
import type {
  EvidenceRetrievalOutcome,
  FarmMemoryItemRecord,
  GroundedEvidencePackage,
  ModelSafeStandardPassage,
  PublishedStandardPassage,
} from './types';

const PROMPT_INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|prior|system)\s+(instructions?|rules?)/gi,
  /override\s+(system|safety|guardrail|consent|security)\s*(instructions?|policy|rules?)?/gi,
  /^\s*(system|assistant|developer|tool)\s*:/gim,
  /<\s*\/?\s*(system|prompt|instructions?|tool_call|untrusted_evidence)\s*>/gi,
];

/**
 * Neutralises prompt-injection directives and control characters in untrusted retrieved text.
 * Defense-in-depth only — never a substitute for system instruction hierarchy and ACLs.
 */
export function sanitizeUntrustedRetrievedText(raw: string, maxLength = 2000): string {
  let text = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    text = text.replace(pattern, '[REDACTED_INSTRUCTION_LIKE_TEXT]');
  }
  if (text.length > maxLength) {
    text = `${text.slice(0, maxLength)}…`;
  }
  return text;
}

/**
 * Recursively sanitises all string keys and values inside a memory's `structuredContent`
 * with bounded recursion depth and key count (Finding 5).
 */
export function sanitizeStructuredContent(
  input: Record<string, unknown>,
  maxDepth = 4,
): Record<string, unknown> {
  const sanitizeValue = (val: unknown, depth: number): unknown => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return sanitizeUntrustedRetrievedText(val, 500);
    if (typeof val === 'number') return Number.isFinite(val) ? val : null;
    if (typeof val === 'boolean') return val;
    if (depth >= maxDepth) return '[TRUNCATED]';
    if (Array.isArray(val)) {
      return val.slice(0, 25).map((item) => sanitizeValue(item, depth + 1));
    }
    if (typeof val === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>).slice(0, 30)) {
        const cleanKey = sanitizeUntrustedRetrievedText(k, 80);
        out[cleanKey] = sanitizeValue(v, depth + 1);
      }
      return out;
    }
    return String(val);
  };

  return sanitizeValue(input, 0) as Record<string, unknown>;
}

/**
 * Assembles the strict multi-tier GroundedEvidencePackage for the Farm Intelligence Engine.
 */
export function assembleGroundedEvidencePackage(params: {
  liveFarmContext: LiveFarmContextSnapshot;
  memories: readonly FarmMemoryItemRecord[];
  publishedStandards: readonly PublishedStandardPassage[];
  retrievalOutcomes?: {
    persistentMemory: EvidenceRetrievalOutcome;
    publishedStandards: EvidenceRetrievalOutcome;
  };
  assembledAt?: string;
}): GroundedEvidencePackage {
  const assembledAt = params.assembledAt ?? new Date().toISOString();
  const reconciliationNotes: string[] = [];

  const confirmedHistoricalMemories: FarmMemoryItemRecord[] = [];
  const provisionalMemories: FarmMemoryItemRecord[] = [];
  const profilePreferences: FarmMemoryItemRecord[] = [];

  const soilVerifiedAt =
    params.liveFarmContext.domains?.soil_chemistry_and_nutrients?.data?.ph.state === 'verified_current'
      ? params.liveFarmContext.domains.soil_chemistry_and_nutrients.data.ph.provenance?.observedAt ?? null
      : null;

  for (const mem of params.memories) {
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
      structuredContent: sanitizeStructuredContent(mem.structuredContent ?? {}),
    };

    if (sanitizedMem.memoryScope === 'profile') {
      profilePreferences.push(sanitizedMem);
      continue;
    }

    if (sanitizedMem.farmId !== params.liveFarmContext.farmId) {
      continue;
    }

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

  // Strip raw unsanitised `content` so model-facing consumers can ONLY read `sanitizedContent`.
  const modelSafeStandards: ModelSafeStandardPassage[] = params.publishedStandards.map((std) => {
    const { content, ...rest } = std;
    return {
      ...rest,
      title: sanitizeUntrustedRetrievedText(rest.title, 200),
      documentTitle: sanitizeUntrustedRetrievedText(rest.documentTitle, 240),
      sanitizedContent: sanitizeUntrustedRetrievedText(content),
      evidenceKind: 'published_agronomic_standard',
    };
  });

  const memoryItemIds = [
    ...confirmedHistoricalMemories.map((m) => m.id),
    ...provisionalMemories.map((m) => m.id),
    ...profilePreferences.map((m) => m.id),
  ];

  const retrievalOutcomes = params.retrievalOutcomes ?? {
    persistentMemory: {
      status: memoryItemIds.length > 0 ? 'ok_with_results' : 'ok_empty',
      count: memoryItemIds.length,
    },
    publishedStandards: {
      status: modelSafeStandards.length > 0 ? 'ok_with_results' : 'ok_empty',
      count: modelSafeStandards.length,
    },
  };

  const degradedGrounding =
    retrievalOutcomes.persistentMemory.status === 'failed' ||
    retrievalOutcomes.publishedStandards.status === 'failed';

  const extraRefs: AuditContextReference[] = [
    ...memoryItemIds.map((id) => ({ source: 'farm_memory_items' as const, record_id: id })),
    ...modelSafeStandards.map((std) => ({
      source: 'agronomic_standard_chunks' as const,
      record_id: std.chunkId,
      ...(std.publishedAt ? { observed_at: std.publishedAt } : {}),
    })),
  ];

  const auditContextRefs = normalizeAuditContextReferences(
    [...(params.liveFarmContext.auditContextRefs ?? []), ...extraRefs],
    100,
  );

  return {
    farmId: params.liveFarmContext.farmId,
    assembledAt,
    verifiedCurrentFarmFacts: params.liveFarmContext,
    confirmedHistoricalMemories,
    provisionalMemories,
    profilePreferences,
    publishedAgronomicStandards: modelSafeStandards,
    missingOrUnavailable: params.liveFarmContext.missingInformation ?? [],
    reconciliationNotes,
    retrievalOutcomes,
    degradedGrounding,
    auditContextRefs,
    memoryItemIds,
    untrustedContentSanitized: true,
  };
}
