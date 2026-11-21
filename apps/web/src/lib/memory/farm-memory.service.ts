import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ALLOWED_AUDIT_CONTEXT_SOURCES,
  MEMORY_CATEGORIES,
  MEMORY_SCOPES,
  MEMORY_SOURCE_KINDS,
  MEMORY_SYNC_STATES,
  MEMORY_TRANSITION_ACTIONS,
  UnconfiguredEmbeddingProvider,
  formatPgVector,
  normalizeAuditContextReferences,
  sanitizeUntrustedRetrievedText,
  type AuditContextReference,
  type Database,
  type EmbeddingProvider,
  type FarmMemoryItemRecord,
  type Json,
  type MemoryCategory,
  type MemoryLifecycleStatus,
  type MemoryRetrievalResult,
  type MemoryScope,
  type MemorySourceKind,
  type MemorySyncState,
  type MemoryVerificationStatus,
} from "@cultivanode/shared";
import { recordAiAuditEvent } from "@/lib/ai-audit";
import type { VerifiedAiFarmCallerContext } from "@/lib/engines-api-helper";

/**
 * CultivaNode 3.0 — Batch 03.2 Server-Mediated Persistent Farm Memory Services (ADR-002, ADR-004, ADR-008, ADR-009).
 *
 * Security invariants:
 * - Server-only.
 * - Executes 100% of memory reads and mutations through the authenticated caller's JWT-bound
 *   Supabase client (`caller.client`), backed by Postgres RLS + SECURITY DEFINER RPCs.
 * - ZERO `service_role` reads of farm or profile memory.
 * - Farm-scoped writes and lifecycle transitions emit structured audit events through the
 *   existing central `recordAiAuditEvent(...)` client (failing closed if audit persistence fails).
 */

const SourceRefSchema = z
  .object({
    source: z.enum(ALLOWED_AUDIT_CONTEXT_SOURCES),
    record_id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9:_-]{0,63}$/),
    observed_at: z.string().optional(),
  })
  .strict();

export const CreateMemoryInputSchema = z
  .object({
    memoryScope: z.enum(MEMORY_SCOPES),
    farmId: z.string().uuid().nullable().optional(),
    category: z.enum(MEMORY_CATEGORIES),
    memoryType: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(200),
    structuredContent: z.record(z.string(), z.unknown()),
    sourceKind: z.enum(MEMORY_SOURCE_KINDS),
    sourceRefs: z.array(SourceRefSchema).max(50).default([]),
    confidence: z.number().min(0).max(1).default(0.5),
    syncState: z.enum(MEMORY_SYNC_STATES).default("synced"),
    idempotencyKey: z.string().trim().min(1).max(128).optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    requestConfirm: z.boolean().default(false),
    traceId: z.string().uuid().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.memoryScope === "farm" && !val.farmId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "farmId is required for farm-scoped memory.",
        path: ["farmId"],
      });
    }
    if (val.memoryScope === "profile") {
      if (val.farmId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "farmId must be omitted for profile-scoped memory.",
          path: ["farmId"],
        });
      }
      if (val.category !== "preference") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Profile-scoped memory only permits category='preference'.",
          path: ["category"],
        });
      }
    }
  });

export type CreateMemoryInput = z.input<typeof CreateMemoryInputSchema>;

export const TransitionMemoryInputSchema = z.object({
  memoryId: z.string().uuid(),
  action: z.enum(MEMORY_TRANSITION_ACTIONS),
  newTitle: z.string().trim().min(1).max(200).optional(),
  newStructuredContent: z.record(z.string(), z.unknown()).optional(),
  newSourceRefs: z.array(SourceRefSchema).max(50).optional(),
  traceId: z.string().uuid().optional(),
});

export type TransitionMemoryInput = z.input<typeof TransitionMemoryInputSchema>;

export const RetrieveMemoryQuerySchema = z.object({
  farmId: z.string().uuid().nullable().optional(),
  includeProfile: z.boolean().default(true),
  categories: z.array(z.enum(MEMORY_CATEGORIES)).max(5).optional(),
  includeProvisional: z.boolean().default(true),
  queryText: z.string().max(1000).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export type RetrieveMemoryQuery = z.input<typeof RetrieveMemoryQuerySchema>;

type MemoryRow = Database["public"]["Tables"]["farm_memory_items"]["Row"];

function mapMemoryRow(
  row: Omit<MemoryRow, "consent_verified_at" | "deleted_at" | "embedding" | "embedding_model" | "embedding_version" | "idempotency_key" | "superseded_by_id" | "supersedes_id"> & {
    similarity_score?: number | null;
  },
): FarmMemoryItemRecord {
  const rawRefs = Array.isArray(row.source_refs) ? (row.source_refs as unknown as AuditContextReference[]) : [];
  return {
    id: row.id,
    memoryScope: row.memory_scope as MemoryScope,
    farmId: row.farm_id,
    profileId: row.profile_id,
    category: row.category as MemoryCategory,
    memoryType: row.memory_type,
    title: sanitizeUntrustedRetrievedText(row.title, 200),
    structuredContent:
      row.structured_content && typeof row.structured_content === "object" && !Array.isArray(row.structured_content)
        ? (row.structured_content as Record<string, unknown>)
        : {},
    sourceKind: row.source_kind as MemorySourceKind,
    sourceRefs: normalizeAuditContextReferences(rawRefs, 50),
    lifecycleStatus: row.lifecycle_status as MemoryLifecycleStatus,
    verificationStatus: row.verification_status as MemoryVerificationStatus,
    confidence: Number(row.confidence),
    syncState: row.sync_state as MemorySyncState,
    createdBy: row.created_by,
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at,
    updatedBy: row.updated_by,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    similarityScore: typeof row.similarity_score === "number" ? row.similarity_score : null,
  };
}

export async function createFarmMemory(
  params: {
    client: SupabaseClient<Database>;
    farmCaller?: VerifiedAiFarmCallerContext | null;
    embeddingProvider?: EmbeddingProvider;
  },
  input: CreateMemoryInput,
): Promise<
  | { ok: true; memory: FarmMemoryItemRecord; traceId: string | null }
  | { ok: false; status: number; code: string; error: string }
> {
  const parsed = CreateMemoryInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "invalid_memory_payload",
      error: parsed.error.issues[0]?.message || "Invalid memory payload.",
    };
  }

  const data = parsed.data;
  if (data.memoryScope === "farm" && (!params.farmCaller || params.farmCaller.farmId !== data.farmId)) {
    return {
      ok: false,
      status: 403,
      code: "unverified_farm_caller",
      error: "Verified farm authorisation is required for farm-scoped memory writes.",
    };
  }

  const provider = params.embeddingProvider ?? new UnconfiguredEmbeddingProvider();
  const embedText = `${data.title}\n${JSON.stringify(data.structuredContent)}`;
  let pgVector: string | null = null;
  let embeddingModel: string | null = null;
  let embeddingVersion: string | null = null;

  try {
    const emb = await provider.embed(embedText);
    if (emb.ok) {
      pgVector = formatPgVector(emb.vector);
      embeddingModel = emb.model;
      embeddingVersion = emb.version;
    }
  } catch {
    // Embedding provider errors degrade cleanly to structured storage without blocking writes.
  }

  const { data: created, error } = await params.client.rpc("create_farm_memory_item", {
    p_memory_scope: data.memoryScope,
    p_farm_id: data.memoryScope === "farm" ? (data.farmId ?? null) : null,
    p_category: data.category,
    p_memory_type: data.memoryType,
    p_title: data.title,
    p_structured_content: data.structuredContent as unknown as Json,
    p_source_kind: data.sourceKind,
    p_source_refs: data.sourceRefs as unknown as Json,
    p_confidence: data.confidence,
    p_sync_state: data.syncState,
    p_idempotency_key: data.idempotencyKey ?? null,
    p_expires_at: data.expiresAt ?? null,
    p_embedding: pgVector,
    p_embedding_model: embeddingModel,
    p_embedding_version: embeddingVersion,
    p_request_confirm: data.requestConfirm,
  });

  if (error || !created) {
    const status = error?.code === "42501" ? 403 : error?.code === "22023" ? 400 : 500;
    return {
      ok: false,
      status,
      code: error?.code ?? "memory_write_failed",
      error: error?.message || "Unable to create persistent memory item.",
    };
  }

  const memory = mapMemoryRow(created);
  let traceId: string | null = null;

  if (data.memoryScope === "farm" && params.farmCaller) {
    traceId = data.traceId ?? randomUUID();
    const audit = await recordAiAuditEvent(params.farmCaller, {
      traceId,
      provider: "rule-engine",
      modelId: "memory-write-service",
      promptVersion: "memory-governance-v1",
      executionOutcome: "completed",
      guardrailResult: {
        status: "not_applicable",
        rule_ids: [],
        reason_codes: [],
        blocked: false,
      },
      contextRefs: normalizeAuditContextReferences([
        { source: "farm_memory_items", record_id: memory.id, observed_at: memory.createdAt },
        ...memory.sourceRefs,
      ]),
      memoryItemIds: [memory.id],
    });

    if (!audit.ok) {
      return {
        ok: false,
        status: audit.code === "trace_conflict" ? 409 : 503,
        code: audit.code,
        error: audit.error,
      };
    }
  }

  return { ok: true, memory, traceId };
}

export async function transitionFarmMemory(
  params: {
    client: SupabaseClient<Database>;
    farmCaller?: VerifiedAiFarmCallerContext | null;
    embeddingProvider?: EmbeddingProvider;
  },
  input: TransitionMemoryInput,
): Promise<
  | { ok: true; memory: FarmMemoryItemRecord; traceId: string | null }
  | { ok: false; status: number; code: string; error: string }
> {
  const parsed = TransitionMemoryInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "invalid_transition_payload",
      error: parsed.error.issues[0]?.message || "Invalid memory transition payload.",
    };
  }

  const data = parsed.data;
  let pgVector: string | null = null;
  let embeddingModel: string | null = null;
  let embeddingVersion: string | null = null;

  if (data.action === "supersede" && data.newStructuredContent) {
    const provider = params.embeddingProvider ?? new UnconfiguredEmbeddingProvider();
    try {
      const emb = await provider.embed(`${data.newTitle ?? ""}\n${JSON.stringify(data.newStructuredContent)}`);
      if (emb.ok) {
        pgVector = formatPgVector(emb.vector);
        embeddingModel = emb.model;
        embeddingVersion = emb.version;
      }
    } catch {
      // Degrade cleanly if embedding fails.
    }
  }

  const { data: updated, error } = await params.client.rpc("transition_farm_memory_item", {
    p_memory_id: data.memoryId,
    p_action: data.action,
    p_new_title: data.newTitle ?? null,
    p_new_structured_content: (data.newStructuredContent ?? null) as unknown as Json,
    p_new_source_refs: (data.newSourceRefs ?? null) as unknown as Json,
    p_new_embedding: pgVector,
    p_new_embedding_model: embeddingModel,
    p_new_embedding_version: embeddingVersion,
  });

  if (error || !updated) {
    const status = error?.code === "42501" ? 403 : error?.code === "P0002" ? 404 : error?.code === "22023" ? 400 : 500;
    return {
      ok: false,
      status,
      code: error?.code ?? "memory_transition_failed",
      error: error?.message || "Unable to transition persistent memory item.",
    };
  }

  const memory = mapMemoryRow(updated);
  let traceId: string | null = null;

  if (memory.memoryScope === "farm" && params.farmCaller && params.farmCaller.farmId === memory.farmId) {
    traceId = data.traceId ?? randomUUID();
    const audit = await recordAiAuditEvent(params.farmCaller, {
      traceId,
      provider: "rule-engine",
      modelId: `memory-transition-${data.action}`,
      promptVersion: "memory-governance-v1",
      executionOutcome: "completed",
      guardrailResult: {
        status: "not_applicable",
        rule_ids: [],
        reason_codes: [],
        blocked: false,
      },
      contextRefs: normalizeAuditContextReferences([
        { source: "farm_memory_items", record_id: memory.id, observed_at: memory.updatedAt },
      ]),
      memoryItemIds: [memory.id],
    });

    if (!audit.ok) {
      return {
        ok: false,
        status: audit.code === "trace_conflict" ? 409 : 503,
        code: audit.code,
        error: audit.error,
      };
    }
  }

  return { ok: true, memory, traceId };
}

export async function retrieveFarmMemories(
  client: SupabaseClient<Database>,
  query: RetrieveMemoryQuery,
  options: { embeddingProvider?: EmbeddingProvider } = {},
): Promise<
  | { ok: true; result: MemoryRetrievalResult }
  | { ok: false; status: number; code: string; error: string }
> {
  const parsed = RetrieveMemoryQuerySchema.safeParse(query);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "invalid_memory_query",
      error: parsed.error.issues[0]?.message || "Invalid memory retrieval query.",
    };
  }

  const q = parsed.data;
  let queryVector: string | null = null;
  let usedSemanticSearch = false;

  if (q.queryText?.trim()) {
    const provider = options.embeddingProvider ?? new UnconfiguredEmbeddingProvider();
    try {
      const emb = await provider.embed(q.queryText);
      if (emb.ok) {
        queryVector = formatPgVector(emb.vector);
        usedSemanticSearch = true;
      }
    } catch {
      // Fall back cleanly to structured retrieval.
    }
  }

  const { data, error } = await client.rpc("search_farm_memory_items", {
    p_farm_id: q.farmId ?? null,
    p_include_profile: q.includeProfile,
    p_categories: q.categories ?? null,
    p_include_provisional: q.includeProvisional,
    p_query_embedding: queryVector,
    p_limit: q.limit,
  });

  if (error) {
    const status = error.code === "42501" ? 403 : 500;
    return {
      ok: false,
      status,
      code: error.code ?? "memory_retrieval_failed",
      error: error.message || "Unable to retrieve persistent memories.",
    };
  }

  const rows = (data ?? []).map((r) => mapMemoryRow(r));
  const confirmedFarmMemories: FarmMemoryItemRecord[] = [];
  const provisionalFarmMemories: FarmMemoryItemRecord[] = [];
  const profileMemories: FarmMemoryItemRecord[] = [];

  for (const mem of rows) {
    if (mem.memoryScope === "profile") {
      profileMemories.push(mem);
    } else if (mem.lifecycleStatus === "confirmed" && mem.verificationStatus === "confirmed") {
      confirmedFarmMemories.push(mem);
    } else {
      provisionalFarmMemories.push(mem);
    }
  }

  const memoryItemIds = rows.map((r) => r.id);
  const auditContextRefs = normalizeAuditContextReferences(
    rows.map((r) => ({ source: "farm_memory_items" as const, record_id: r.id, observed_at: r.updatedAt })),
    100,
  );

  return {
    ok: true,
    result: {
      confirmedFarmMemories,
      provisionalFarmMemories,
      profileMemories,
      memoryItemIds,
      auditContextRefs,
      usedSemanticSearch,
    },
  };
}
