/**
 * CultivaNode 3.0 — Batch 03.2 Persistent Farm Memory & Published Agronomic Standards RAG Contracts.
 * Authority: ADR-002, ADR-003, ADR-004, ADR-007, ADR-008, ADR-009.
 */

import type { AuditContextReference, LiveFarmContextSnapshot } from '../farm-context/types';

export const MEMORY_SCOPES = ['farm', 'profile'] as const;
export type MemoryScope = (typeof MEMORY_SCOPES)[number];

export const MEMORY_CATEGORIES = [
  'episodic',
  'semantic',
  'procedural',
  'preference',
  'unresolved',
] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export const MEMORY_SOURCE_KINDS = [
  'farmer_explicit',
  'farm_record',
  'deterministic_derived',
  'ai_inferred',
] as const;
export type MemorySourceKind = (typeof MEMORY_SOURCE_KINDS)[number];

export const MEMORY_LIFECYCLE_STATUSES = [
  'proposed',
  'awaiting_confirmation',
  'confirmed',
  'rejected',
  'superseded',
  'expired',
  'withdrawn',
  'deleted',
] as const;
export type MemoryLifecycleStatus = (typeof MEMORY_LIFECYCLE_STATUSES)[number];

export const MEMORY_VERIFICATION_STATUSES = [
  'unverified',
  'provisional',
  'confirmed',
  'rejected',
] as const;
export type MemoryVerificationStatus = (typeof MEMORY_VERIFICATION_STATUSES)[number];

export const MEMORY_SYNC_STATES = ['synced', 'awaiting_sync'] as const;
export type MemorySyncState = (typeof MEMORY_SYNC_STATES)[number];

export const MEMORY_TRANSITION_ACTIONS = [
  'confirm',
  'reject',
  'withdraw',
  'supersede',
  'expire',
  'delete',
] as const;
export type MemoryTransitionAction = (typeof MEMORY_TRANSITION_ACTIONS)[number];

export interface FarmMemoryItemRecord {
  id: string;
  memoryScope: MemoryScope;
  farmId: string | null;
  profileId: string | null;
  category: MemoryCategory;
  memoryType: string;
  title: string;
  structuredContent: Record<string, unknown>;
  sourceKind: MemorySourceKind;
  sourceRefs: AuditContextReference[];
  lifecycleStatus: MemoryLifecycleStatus;
  verificationStatus: MemoryVerificationStatus;
  confidence: number;
  syncState: MemorySyncState;
  createdBy: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  updatedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  similarityScore: number | null;
}

export interface MemoryRetrievalResult {
  confirmedFarmMemories: FarmMemoryItemRecord[];
  provisionalFarmMemories: FarmMemoryItemRecord[];
  profileMemories: FarmMemoryItemRecord[];
  memoryItemIds: string[];
  auditContextRefs: AuditContextReference[];
  usedSemanticSearch: boolean;
}

export const ALLOWED_AGRONOMIC_DOCUMENT_MIMES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/json',
] as const;
export type AllowedAgronomicDocumentMime = (typeof ALLOWED_AGRONOMIC_DOCUMENT_MIMES)[number];

export interface AgronomicDocumentChunkDraft {
  chunkIndex: number;
  sectionRef: string | null;
  pageNumber: number | null;
  paragraphIndex: number | null;
  content: string;
  contentSha256: string;
  embedding?: string | null;
  embeddingModel?: string | null;
  embeddingVersion?: string | null;
}

export interface PublishedStandardPassage {
  chunkId: string;
  documentId: string;
  standardId: string;
  standardCode: string;
  version: string;
  title: string;
  cropOrLivestockId: string;
  agroZone: string;
  sourceAuthority: string;
  publishedAt: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  documentTitle: string;
  sectionRef: string | null;
  pageNumber: number | null;
  paragraphIndex: number | null;
  content: string;
  sanitizedContent: string;
  similarityScore: number | null;
  /** Explicitly marks retrieved text as untrusted external reference data, never a farm measurement. */
  evidenceKind: 'published_agronomic_standard';
}

export interface EmbeddingSuccess {
  ok: true;
  vector: number[];
  model: string;
  version: string;
  dimensions: number;
}

export interface EmbeddingFailure {
  ok: false;
  code: 'provider_not_configured' | 'provider_error' | 'invalid_input';
  message: string;
}

export type EmbeddingResult = EmbeddingSuccess | EmbeddingFailure;

export interface EmbeddingProvider {
  readonly name: string;
  readonly model: string;
  readonly version: string;
  readonly dimensions: number;
  embed(text: string): Promise<EmbeddingResult>;
}

/**
 * Grounded evidence package passed to the Farm Intelligence Engine.
 * Strictly separates verified current farm facts, confirmed historical memories,
 * provisional memories, published agronomic standards, and missing/unavailable data.
 */
export interface GroundedEvidencePackage {
  farmId: string;
  assembledAt: string;
  verifiedCurrentFarmFacts: LiveFarmContextSnapshot;
  confirmedHistoricalMemories: FarmMemoryItemRecord[];
  provisionalMemories: FarmMemoryItemRecord[];
  profilePreferences: FarmMemoryItemRecord[];
  publishedAgronomicStandards: PublishedStandardPassage[];
  missingOrUnavailable: Array<{ domain: string; field: string }>;
  reconciliationNotes: string[];
  auditContextRefs: AuditContextReference[];
  memoryItemIds: string[];
  untrustedContentSanitized: true;
}
