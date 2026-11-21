/**
 * Canonical Untrusted-Evidence Transformation Boundary & Grounded Evidence Assembler (Batch 03.2G Finding 5).
 *
 * Non-negotiable invariants:
 * - EVERY model-facing field originating from database records, user input, uploaded documents,
 *   or retrieved metadata passes through this canonical transformation boundary:
 *   `memoryType`, `category`, `title`, nested `structuredContent` keys/values, `standardCode`,
 *   `version`, `sourceAuthority`, `sectionRef`, `documentTitle`, `cropOrLivestockId`, `agroZone`,
 *   passage text, and farm context descriptive metadata.
 * - Enumerated fields are validated strictly against their domain definitions.
 * - Unicode control characters, bidi overrides, zero-width characters, unusual whitespace,
 *   XML/delimiter breakout tags, and prompt-injection directives are neutralised.
 * - Sanitisation is defence-in-depth ONLY — paired with JSON delimiter escaping (`\u003c`/`\u003e`)
 *   and strict system instruction hierarchy in `prompt-builder.ts`.
 * - Never promotes provisional evidence into verified facts or alters confidence/status.
 */

import { normalizeAuditContextReferences } from '../farm-context/provenance';
import type { AuditContextReference, LiveFarmContextSnapshot } from '../farm-context/types';
import {
  DOCUMENT_EXTRACTION_METHODS,
  DOCUMENT_PROVENANCE_STATUSES,
  MEMORY_CATEGORIES,
  MEMORY_LIFECYCLE_STATUSES,
  MEMORY_SCOPES,
  MEMORY_SOURCE_KINDS,
  MEMORY_SYNC_STATES,
  MEMORY_VERIFICATION_STATUSES,
  type DocumentExtractionMethod,
  type DocumentProvenanceStatus,
  type EvidenceRetrievalOutcome,
  type FarmMemoryItemRecord,
  type GroundedEvidencePackage,
  type MemoryCategory,
  type MemoryLifecycleStatus,
  type MemoryScope,
  type MemorySourceKind,
  type MemorySyncState,
  type MemoryVerificationStatus,
  type ModelSafeMemoryRecord,
  type ModelSafeStandardPassage,
  type PublishedStandardPassage,
} from './types';

// Unicode control chars (C0/C1), bidi overrides, zero-width characters, line/paragraph separators.
const CONTROL_AND_BIDI_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const UNUSUAL_WHITESPACE_RE = /[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g;

const PROMPT_INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|prior|system)\s+(instructions?|rules?)/gi,
  /override\s+(system|safety|guardrail|consent|security)\s*(instructions?|policy|rules?)?/gi,
  /^\s*(system|assistant|developer|tool)\s*:/gim,
  /<\s*\/?\s*(system|prompt|instructions?|tool_call|untrusted_evidence|untrusted_evidence_json)\b[^>]*>/gi,
];

const MEMORY_SCOPE_SET = new Set<string>(MEMORY_SCOPES);
const MEMORY_CATEGORY_SET = new Set<string>(MEMORY_CATEGORIES);
const MEMORY_SOURCE_KIND_SET = new Set<string>(MEMORY_SOURCE_KINDS);
const MEMORY_LIFECYCLE_SET = new Set<string>(MEMORY_LIFECYCLE_STATUSES);
const MEMORY_VERIFICATION_SET = new Set<string>(MEMORY_VERIFICATION_STATUSES);
const MEMORY_SYNC_SET = new Set<string>(MEMORY_SYNC_STATES);
const DOC_PROVENANCE_SET = new Set<string>(DOCUMENT_PROVENANCE_STATUSES);
const DOC_EXTRACTION_SET = new Set<string>(DOCUMENT_EXTRACTION_METHODS);

function validateEnum<T extends string>(value: unknown, allowed: Set<string>, fallback: T): T {
  return typeof value === 'string' && allowed.has(value) ? (value as T) : fallback;
}

/**
 * Neutralises control chars, bidi overrides, unusual whitespace, XML/delimiter tags,
 * and prompt-injection directives in untrusted retrieved text.
 */
export function sanitizeUntrustedRetrievedText(raw: string, maxLength = 2000): string {
  let text = String(raw ?? '')
    .replace(CONTROL_AND_BIDI_RE, '')
    .replace(UNUSUAL_WHITESPACE_RE, ' ')
    .trim();

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    text = text.replace(pattern, '[REDACTED_INSTRUCTION_LIKE_TEXT]');
  }

  // Neutralise any remaining angle-bracket delimiters so untrusted text cannot forge XML/tag boundaries.
  text = text.replace(/</g, '\u2039').replace(/>/g, '\u203A');

  if (text.length > maxLength) {
    text = `${text.slice(0, maxLength)}…`;
  }
  return text;
}

/**
 * Canonical single-line metadata field sanitiser (used for `memoryType`, `standardCode`,
 * `sourceAuthority`, `version`, `sectionRef`, `documentTitle`, `farmName`, etc.).
 */
export function sanitizeMetadataField(raw: string | null | undefined, maxLength = 120): string {
  if (!raw) return '';
  const collapsed = String(raw).replace(/[\r\n\t]+/g, ' ');
  return sanitizeUntrustedRetrievedText(collapsed, maxLength);
}

/**
 * Escapes JSON output so `<`, `>`, `&`, U+2028, and U+2029 can NEVER break out of
 * `<untrusted_evidence_json>` delimiters in a prompt.
 */
export function serializeUntrustedEvidenceJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Recursively sanitises all string keys and values inside a memory's `structuredContent`
 * with bounded recursion depth, array length, and key count.
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
        const cleanKey = sanitizeMetadataField(k, 80) || 'field';
        out[cleanKey] = sanitizeValue(v, depth + 1);
      }
      return out;
    }
    return sanitizeUntrustedRetrievedText(String(val), 200);
  };

  return sanitizeValue(input ?? {}, 0) as Record<string, unknown>;
}

/**
 * Transforms a raw `FarmMemoryItemRecord` into a canonical `ModelSafeMemoryRecord`.
 */
export function toModelSafeMemoryRecord(
  mem: FarmMemoryItemRecord,
  stats?: { fieldsTransformed: number; fieldsModified: number },
): ModelSafeMemoryRecord {
  const cleanType = sanitizeMetadataField(mem.memoryType, 80) || 'unspecified';
  const cleanTitle = sanitizeUntrustedRetrievedText(mem.title, 200);
  const cleanStruct = sanitizeStructuredContent(mem.structuredContent ?? {});

  if (stats) {
    stats.fieldsTransformed += 3;
    if (cleanType !== mem.memoryType) stats.fieldsModified += 1;
    if (cleanTitle !== mem.title) stats.fieldsModified += 1;
    if (JSON.stringify(cleanStruct) !== JSON.stringify(mem.structuredContent ?? {})) stats.fieldsModified += 1;
  }

  return {
    id: sanitizeMetadataField(mem.id, 64),
    memoryScope: validateEnum<MemoryScope>(mem.memoryScope, MEMORY_SCOPE_SET, 'farm'),
    farmId: mem.farmId ? sanitizeMetadataField(mem.farmId, 64) : null,
    profileId: mem.profileId ? sanitizeMetadataField(mem.profileId, 64) : null,
    category: validateEnum<MemoryCategory>(mem.category, MEMORY_CATEGORY_SET, 'semantic'),
    memoryType: cleanType,
    title: cleanTitle,
    structuredContent: cleanStruct,
    sourceKind: validateEnum<MemorySourceKind>(mem.sourceKind, MEMORY_SOURCE_KIND_SET, 'ai_inferred'),
    lifecycleStatus: validateEnum<MemoryLifecycleStatus>(mem.lifecycleStatus, MEMORY_LIFECYCLE_SET, 'proposed'),
    verificationStatus: validateEnum<MemoryVerificationStatus>(mem.verificationStatus, MEMORY_VERIFICATION_SET, 'provisional'),
    confidence: typeof mem.confidence === 'number' && Number.isFinite(mem.confidence)
      ? Math.max(0, Math.min(1, mem.confidence))
      : 0,
    syncState: validateEnum<MemorySyncState>(mem.syncState, MEMORY_SYNC_SET, 'synced'),
    updatedAt: sanitizeMetadataField(mem.updatedAt, 40),
    similarityScore: typeof mem.similarityScore === 'number' && Number.isFinite(mem.similarityScore) ? mem.similarityScore : null,
    sanitized: true,
  };
}

/**
 * Transforms a raw `PublishedStandardPassage` into a canonical `ModelSafeStandardPassage`,
 * stripping raw unsanitised `content` and sanitising EVERY metadata field.
 */
export function toModelSafeStandardPassage(
  std: PublishedStandardPassage,
  stats?: { fieldsTransformed: number; fieldsModified: number },
): ModelSafeStandardPassage {
  const { content, ...rest } = std;
  const cleanCode = sanitizeMetadataField(rest.standardCode, 80);
  const cleanVersion = sanitizeMetadataField(rest.version, 40);
  const cleanTitle = sanitizeMetadataField(rest.title, 200);
  const cleanDocTitle = sanitizeMetadataField(rest.documentTitle, 240);
  const cleanAuthority = sanitizeMetadataField(rest.sourceAuthority, 120);
  const cleanCrop = sanitizeMetadataField(rest.cropOrLivestockId, 80);
  const cleanZone = sanitizeMetadataField(rest.agroZone, 80);
  const cleanSection = rest.sectionRef ? sanitizeMetadataField(rest.sectionRef, 200) : null;
  const cleanContent = sanitizeUntrustedRetrievedText(content, 2000);

  if (stats) {
    stats.fieldsTransformed += 9;
    if (cleanCode !== rest.standardCode) stats.fieldsModified += 1;
    if (cleanVersion !== rest.version) stats.fieldsModified += 1;
    if (cleanTitle !== rest.title) stats.fieldsModified += 1;
    if (cleanDocTitle !== rest.documentTitle) stats.fieldsModified += 1;
    if (cleanAuthority !== rest.sourceAuthority) stats.fieldsModified += 1;
    if (cleanCrop !== rest.cropOrLivestockId) stats.fieldsModified += 1;
    if (cleanZone !== rest.agroZone) stats.fieldsModified += 1;
    if (cleanSection !== (rest.sectionRef ?? null)) stats.fieldsModified += 1;
    if (cleanContent !== content) stats.fieldsModified += 1;
  }

  return {
    ...rest,
    chunkId: sanitizeMetadataField(rest.chunkId, 64),
    documentId: sanitizeMetadataField(rest.documentId, 64),
    standardId: sanitizeMetadataField(rest.standardId, 64),
    standardCode: cleanCode,
    version: cleanVersion,
    title: cleanTitle,
    documentTitle: cleanDocTitle,
    sourceAuthority: cleanAuthority,
    cropOrLivestockId: cleanCrop,
    agroZone: cleanZone,
    sectionRef: cleanSection,
    extractionMethod: validateEnum<DocumentExtractionMethod>(
      rest.extractionMethod,
      DOC_EXTRACTION_SET,
      'staff_entered_text',
    ),
    provenanceVerificationStatus: validateEnum<DocumentProvenanceStatus>(
      rest.provenanceVerificationStatus,
      DOC_PROVENANCE_SET,
      'staff_asserted',
    ),
    sanitizedContent: cleanContent,
    evidenceKind: 'published_agronomic_standard',
    sanitized: true,
  };
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
  const stats = { fieldsTransformed: 0, fieldsModified: 0 };

  const confirmedHistoricalMemories: ModelSafeMemoryRecord[] = [];
  const provisionalMemories: ModelSafeMemoryRecord[] = [];
  const profilePreferences: ModelSafeMemoryRecord[] = [];

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

    const safeMem = toModelSafeMemoryRecord(mem, stats);

    if (safeMem.memoryScope === 'profile') {
      profilePreferences.push(safeMem);
      continue;
    }

    if (safeMem.farmId !== params.liveFarmContext.farmId) {
      continue;
    }

    if (
      soilVerifiedAt &&
      safeMem.memoryType.toLowerCase().includes('soil') &&
      safeMem.updatedAt < soilVerifiedAt
    ) {
      reconciliationNotes.push(
        `Verified current soil_records observation (${soilVerifiedAt}) supersedes older farm memory "${safeMem.id}" (${safeMem.updatedAt}).`,
      );
    }

    if (safeMem.lifecycleStatus === 'confirmed' && safeMem.verificationStatus === 'confirmed') {
      confirmedHistoricalMemories.push(safeMem);
    } else {
      provisionalMemories.push(safeMem);
    }
  }

  const modelSafeStandards: ModelSafeStandardPassage[] = params.publishedStandards.map((std) =>
    toModelSafeStandardPassage(std, stats),
  );

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
    sanitizationSummary: {
      fieldsTransformed: stats.fieldsTransformed,
      fieldsModified: stats.fieldsModified,
      delimiterEscapingApplied: true,
    },
    untrustedContentSanitized: true,
  };
}
