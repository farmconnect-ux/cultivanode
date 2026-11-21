import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ALLOWED_AGRONOMIC_DOCUMENT_MIMES,
  MAX_AGRONOMIC_DOCUMENT_BYTES,
  UnconfiguredEmbeddingProvider,
  chunkAgronomicDocument,
  formatPgVector,
  normalizeAuditContextReferences,
  sanitizeUntrustedRetrievedText,
  sha256Hex,
  validateAgronomicDocumentMetadata,
  type AuditContextReference,
  type Database,
  type EmbeddingProvider,
  type Json,
  type PublishedStandardPassage,
} from "@cultivanode/shared";

/**
 * CultivaNode 3.0 — Batch 03.2 Published Agronomic Standards RAG & Controlled Ingestion Service.
 *
 * Security & governance invariants:
 * - Server-only.
 * - Ingestion runs strictly under the authenticated staff caller's JWT (`standards.publish` / `crops.manage`),
 *   targeting DRAFT standards ONLY, and NEVER auto-publishes.
 * - Retrieval runs strictly under the authenticated caller's JWT via `search_published_agronomic_standards`,
 *   which enforces `status = 'published'` and effective dates INSIDE PostgreSQL.
 * - Retrieved passages are explicitly marked as untrusted external reference data (`evidenceKind: 'published_agronomic_standard'`)
 *   and sanitised against prompt-injection directives.
 */

export const IngestAgronomicDocumentSchema = z.object({
  standardId: z.string().uuid(),
  documentTitle: z.string().trim().min(1).max(240),
  sourceAuthority: z.string().trim().min(1).max(120),
  mimeType: z.enum(ALLOWED_AGRONOMIC_DOCUMENT_MIMES),
  fileSizeBytes: z.number().int().min(1).max(MAX_AGRONOMIC_DOCUMENT_BYTES),
  textContent: z.string().min(1).max(2_000_000),
  externalUri: z.string().url().max(500).nullable().optional(),
  maxChunkChars: z.number().int().min(200).max(7500).optional(),
});

export type IngestAgronomicDocumentInput = z.input<typeof IngestAgronomicDocumentSchema>;

export const SearchPublishedStandardsSchema = z.object({
  cropOrLivestockId: z.string().trim().min(1).max(80).optional(),
  agroZone: z.string().trim().min(1).max(80).optional(),
  sourceAuthority: z.string().trim().min(1).max(120).optional(),
  standardCode: z.string().trim().min(1).max(80).optional(),
  queryText: z.string().trim().min(1).max(1000).optional(),
  limit: z.number().int().min(1).max(25).default(10),
});

export type SearchPublishedStandardsInput = z.input<typeof SearchPublishedStandardsSchema>;

export async function ingestAgronomicStandardDocument(
  client: SupabaseClient<Database>,
  input: IngestAgronomicDocumentInput,
  options: { embeddingProvider?: EmbeddingProvider } = {},
): Promise<
  | {
      ok: true;
      documentId: string;
      standardId: string;
      standardStatus: string;
      chunkCount: number;
      embeddingsGenerated: number;
    }
  | { ok: false; status: number; code: string; error: string }
> {
  const parsed = IngestAgronomicDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "invalid_document_payload",
      error: parsed.error.issues[0]?.message || "Invalid agronomic document payload.",
    };
  }

  const data = parsed.data;
  const metaCheck = validateAgronomicDocumentMetadata({
    mimeType: data.mimeType,
    fileSizeBytes: data.fileSizeBytes,
    textContent: data.textContent,
  });
  if (!metaCheck.ok) {
    return { ok: false, status: 400, code: "invalid_document_metadata", error: metaCheck.error };
  }

  const chunks = await chunkAgronomicDocument(data.textContent, { maxChunkChars: data.maxChunkChars });
  if (chunks.length === 0) {
    return { ok: false, status: 400, code: "empty_chunks", error: "Document produced zero text chunks." };
  }

  const provider = options.embeddingProvider ?? new UnconfiguredEmbeddingProvider();
  let embeddingsGenerated = 0;
  const payloadChunks: Array<Record<string, unknown>> = [];

  for (const chunk of chunks) {
    let embedding: string | null = null;
    let embeddingModel: string | null = null;
    let embeddingVersion: string | null = null;

    try {
      const emb = await provider.embed(chunk.content);
      if (emb.ok) {
        embedding = formatPgVector(emb.vector);
        embeddingModel = emb.model;
        embeddingVersion = emb.version;
        embeddingsGenerated += 1;
      }
    } catch {
      // Degrade gracefully when embedding provider fails; chunk still persists for structured retrieval.
    }

    payloadChunks.push({
      chunk_index: chunk.chunkIndex,
      section_ref: chunk.sectionRef,
      page_number: chunk.pageNumber,
      paragraph_index: chunk.paragraphIndex,
      content: chunk.content,
      content_sha256: chunk.contentSha256,
      ...(embedding ? { embedding, embedding_model: embeddingModel, embedding_version: embeddingVersion } : {}),
    });
  }

  const contentSha256 = await sha256Hex(data.textContent);
  const { data: result, error } = await client.rpc("ingest_agronomic_standard_document", {
    p_standard_id: data.standardId,
    p_document_title: data.documentTitle,
    p_source_authority: data.sourceAuthority,
    p_mime_type: data.mimeType,
    p_file_size_bytes: data.fileSizeBytes,
    p_content_sha256: contentSha256,
    p_chunks: payloadChunks as unknown as Json,
    p_external_uri: data.externalUri ?? null,
  });

  if (error || !result || typeof result !== "object" || Array.isArray(result)) {
    const status = error?.code === "42501" ? 403 : error?.code === "P0002" ? 404 : error?.code === "22023" ? 400 : 500;
    return {
      ok: false,
      status,
      code: error?.code ?? "document_ingestion_failed",
      error: error?.message || "Unable to ingest agronomic standard document.",
    };
  }

  const obj = result as Record<string, unknown>;
  return {
    ok: true,
    documentId: String(obj.document_id ?? ""),
    standardId: String(obj.standard_id ?? data.standardId),
    standardStatus: String(obj.standard_status ?? "draft"),
    chunkCount: Number(obj.chunk_count ?? chunks.length),
    embeddingsGenerated,
  };
}

export async function retrievePublishedAgronomicStandards(
  client: SupabaseClient<Database>,
  input: SearchPublishedStandardsInput,
  options: { embeddingProvider?: EmbeddingProvider } = {},
): Promise<
  | {
      ok: true;
      passages: PublishedStandardPassage[];
      auditContextRefs: AuditContextReference[];
      usedSemanticSearch: boolean;
    }
  | { ok: false; status: number; code: string; error: string }
> {
  const parsed = SearchPublishedStandardsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "invalid_rag_query",
      error: parsed.error.issues[0]?.message || "Invalid agronomic standards search query.",
    };
  }

  const q = parsed.data;
  let queryVector: string | null = null;
  let usedSemanticSearch = false;

  if (q.queryText) {
    const provider = options.embeddingProvider ?? new UnconfiguredEmbeddingProvider();
    try {
      const emb = await provider.embed(q.queryText);
      if (emb.ok) {
        queryVector = formatPgVector(emb.vector);
        usedSemanticSearch = true;
      }
    } catch {
      // Fall back cleanly to structured + keyword retrieval.
    }
  }

  const { data, error } = await client.rpc("search_published_agronomic_standards", {
    p_crop_or_livestock_id: q.cropOrLivestockId ?? null,
    p_agro_zone: q.agroZone ?? null,
    p_source_authority: q.sourceAuthority ?? null,
    p_standard_code: q.standardCode ?? null,
    p_query_text: q.queryText ?? null,
    p_query_embedding: queryVector,
    p_limit: q.limit,
  });

  if (error) {
    const status = error.code === "42501" ? 403 : 500;
    return {
      ok: false,
      status,
      code: error.code ?? "rag_retrieval_failed",
      error: error.message || "Unable to retrieve published agronomic standards.",
    };
  }

  const passages: PublishedStandardPassage[] = (data ?? []).map((row) => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    standardId: row.standard_id,
    standardCode: row.standard_code,
    version: row.version,
    title: row.title,
    cropOrLivestockId: row.crop_or_livestock_id,
    agroZone: row.agro_zone,
    sourceAuthority: row.source_authority,
    publishedAt: row.published_at,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    documentTitle: row.document_title,
    sectionRef: row.section_ref,
    pageNumber: row.page_number,
    paragraphIndex: row.paragraph_index,
    content: row.content,
    sanitizedContent: sanitizeUntrustedRetrievedText(row.content),
    similarityScore: typeof row.similarity_score === "number" ? row.similarity_score : null,
    evidenceKind: "published_agronomic_standard",
  }));

  const auditContextRefs = normalizeAuditContextReferences(
    passages.map((p) => ({
      source: "agronomic_standard_chunks" as const,
      record_id: p.chunkId,
      ...(p.publishedAt ? { observed_at: p.publishedAt } : {}),
    })),
    50,
  );

  return { ok: true, passages, auditContextRefs, usedSemanticSearch };
}
