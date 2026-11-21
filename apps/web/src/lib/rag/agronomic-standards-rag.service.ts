import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ALLOWED_AGRONOMIC_DOCUMENT_MIMES,
  DOCUMENT_EXTRACTION_METHODS,
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
  type DocumentExtractionMethod,
  type DocumentProvenanceStatus,
  type EmbeddingProvider,
  type Json,
  type PublishedStandardPassage,
} from "@cultivanode/shared";

/**
 * CultivaNode 3.0 — Batch 03.2 Published Agronomic Standards RAG & Verified Document Ingestion Service.
 *
 * Security & provenance invariants (Finding 6):
 * - Server-only.
 * - Computes `fileSizeBytes` and SHA-256 hashes server-side from actual uploaded file bytes
 *   (`sourceFileBase64`) or actual UTF-8 `textContent` — never blindly trusts caller-supplied size.
 * - Explicitly distinguishes `staff_asserted` text entries from `file_hash_verified` source files.
 * - Ingestion runs strictly under authenticated staff JWT on DRAFT standards ONLY (never auto-publishes).
 * - Retrieval runs strictly under authenticated caller JWT via `search_published_agronomic_standards`,
 *   enforcing `status = 'published'` and effective dates INSIDE PostgreSQL.
 */

export const IngestAgronomicDocumentSchema = z.object({
  standardId: z.string().uuid(),
  documentTitle: z.string().trim().min(1).max(240),
  sourceAuthority: z.string().trim().min(1).max(120),
  mimeType: z.enum(ALLOWED_AGRONOMIC_DOCUMENT_MIMES),
  /** Optional raw source file bytes (base64). When provided, server computes originalFileSha256 and actual byte size. */
  sourceFileBase64: z.string().max(14_000_000).optional(),
  /** Optional Supabase Storage path referencing the archived original source file. */
  storageObjectPath: z.string().trim().min(1).max(500).nullable().optional(),
  extractionMethod: z.enum(DOCUMENT_EXTRACTION_METHODS).optional(),
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
      computedFileSizeBytes: number;
      originalFileSha256: string | null;
      provenanceVerificationStatus: DocumentProvenanceStatus;
      extractionMethod: DocumentExtractionMethod;
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

  // Independently compute byte size and original file hash server-side.
  let computedFileSizeBytes: number;
  let originalFileSha256: string | null = null;
  let provenanceVerificationStatus: DocumentProvenanceStatus = "staff_asserted";

  if (data.sourceFileBase64) {
    const rawBytes = Buffer.from(data.sourceFileBase64, "base64");
    if (rawBytes.length === 0 || rawBytes.length > MAX_AGRONOMIC_DOCUMENT_BYTES) {
      return {
        ok: false,
        status: 400,
        code: "invalid_source_file_size",
        error: `Source file must be between 1 byte and ${MAX_AGRONOMIC_DOCUMENT_BYTES} bytes.`,
      };
    }
    computedFileSizeBytes = rawBytes.length;
    originalFileSha256 = createHash("sha256").update(rawBytes).digest("hex");
    provenanceVerificationStatus = "file_hash_verified";
  } else {
    computedFileSizeBytes = Buffer.byteLength(data.textContent, "utf8");
    provenanceVerificationStatus = "staff_asserted";
  }

  const extractionMethod: DocumentExtractionMethod =
    data.extractionMethod ??
    (data.sourceFileBase64
      ? data.mimeType === "text/markdown"
        ? "markdown_file"
        : data.mimeType === "application/pdf"
          ? "pdf_text_extractor"
          : data.mimeType === "application/json"
            ? "json_structured_file"
            : "plain_text_file"
      : "staff_entered_text");

  const metaCheck = validateAgronomicDocumentMetadata({
    mimeType: data.mimeType,
    fileSizeBytes: computedFileSizeBytes,
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
    p_file_size_bytes: computedFileSizeBytes,
    p_content_sha256: contentSha256,
    p_chunks: payloadChunks as unknown as Json,
    p_external_uri: data.externalUri ?? null,
    p_original_file_sha256: originalFileSha256,
    p_storage_object_path: data.storageObjectPath ?? null,
    p_extraction_method: extractionMethod,
    p_provenance_verification_status: provenanceVerificationStatus,
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
    computedFileSizeBytes,
    originalFileSha256,
    provenanceVerificationStatus,
    extractionMethod,
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
    extractionMethod: (row.extraction_method as DocumentExtractionMethod) ?? "staff_entered_text",
    provenanceVerificationStatus: (row.provenance_verification_status as DocumentProvenanceStatus) ?? "staff_asserted",
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
