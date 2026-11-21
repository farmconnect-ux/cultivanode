import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sanitizeStructuredContent,
  sanitizeUntrustedRetrievedText,
  type Database,
  type MemorySourceKind,
  type MemoryTransitionAction,
} from "@cultivanode/shared";

/**
 * Batch 03.2I (PR #23 review finding 2): provenance an app client may assert for a memory it writes.
 * `farm_record` and `deterministic_derived` are reserved for a future trusted server-side derivation path.
 * PostgreSQL enforces the same rule for every end-user request (trigger
 * `farm_memory_items_client_provenance_guard`); this check only returns a clear 400 earlier.
 */
export const CLIENT_MEMORY_SOURCE_KINDS = ["farmer_explicit", "ai_inferred"] as const satisfies readonly MemorySourceKind[];

export function isClientAssertableSourceKind(kind: string): boolean {
  return (CLIENT_MEMORY_SOURCE_KINDS as readonly string[]).includes(kind);
}

/**
 * Batch 03.2I (PR #23 review finding 1): lifecycle actions a farmer can still take after withdrawing
 * `ai_intelligence` consent. Only `confirm` and `supersede` require consent.
 */
export const CONSENT_INDEPENDENT_MEMORY_ACTIONS = [
  "reject",
  "withdraw",
  "expire",
  "delete",
] as const satisfies readonly MemoryTransitionAction[];

export function memoryActionRequiresConsent(action: string): boolean {
  return !(CONSENT_INDEPENDENT_MEMORY_ACTIONS as readonly string[]).includes(action);
}

export const ListMemoriesForManagementSchema = z.object({
  farmId: z.string().uuid().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListMemoriesForManagementQuery = z.input<typeof ListMemoriesForManagementSchema>;

export type ManagedMemoryItem = {
  id: string;
  memoryScope: string;
  farmId: string | null;
  category: string;
  memoryType: string;
  title: string;
  structuredContent: Record<string, unknown>;
  sourceKind: string;
  lifecycleStatus: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Batch 03.2I (PR #23 review finding 1): lets a farmer see what is stored about them so they can
 * reject, withdraw or delete it, including after withdrawing `ai_intelligence` consent.
 * Reads only through the caller's JWT-bound client, so row-level security limits results to the
 * caller's own profile memories and memories of farms they can view; deleted rows are never returned.
 * Not used to ground AI answers (that path still goes through `search_farm_memory_items`).
 */
export async function listMemoriesForManagement(
  client: SupabaseClient<Database>,
  query: ListMemoriesForManagementQuery,
): Promise<
  | { ok: true; memories: ManagedMemoryItem[] }
  | { ok: false; status: number; code: string; error: string }
> {
  const parsed = ListMemoriesForManagementSchema.safeParse(query);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "invalid_memory_query",
      error: parsed.error.issues[0]?.message || "Invalid memory query.",
    };
  }

  let builder = client
    .from("farm_memory_items")
    .select(
      "id, memory_scope, farm_id, category, memory_type, title, structured_content, source_kind, lifecycle_status, verification_status, created_at, updated_at",
    );

  if (parsed.data.farmId) {
    builder = builder.eq("farm_id", parsed.data.farmId);
  }

  const { data, error } = await builder.order("updated_at", { ascending: false }).limit(parsed.data.limit);
  if (error) {
    return {
      ok: false,
      status: 500,
      code: error.code ?? "memory_list_failed",
      error: "Unable to list stored memories.",
    };
  }

  const memories: ManagedMemoryItem[] = (data ?? []).map((row) => {
    const content =
      row.structured_content && typeof row.structured_content === "object" && !Array.isArray(row.structured_content)
        ? (row.structured_content as Record<string, unknown>)
        : {};
    return {
      id: row.id,
      memoryScope: row.memory_scope,
      farmId: row.farm_id,
      category: row.category,
      memoryType: sanitizeUntrustedRetrievedText(row.memory_type, 80),
      title: sanitizeUntrustedRetrievedText(row.title, 200),
      structuredContent: sanitizeStructuredContent(content),
      sourceKind: row.source_kind,
      lifecycleStatus: row.lifecycle_status,
      verificationStatus: row.verification_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  return { ok: true, memories };
}
