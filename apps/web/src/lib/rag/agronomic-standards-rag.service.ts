import "server-only";
import { createHash, randomUUID } from "node:crypto";
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
  type AllowedAgronomicDocumentMime,
  type AuditContextReference,
  type Database,
  type DocumentExtractionMethod,
  type DocumentProvenanceStatus,
  type EmbeddingProvider,
  type Json,
  type PublishedStandardPassage,
} from "@cultivanode/shared";
import {
  authorizeAgronomicStaffUploader,
  completeVerifiedAgronomicDocumentIngestion,
  type VerifiedAgronomicStaffContext,
} from "@/lib/rag/trusted-document-verifier";

/**
 * CultivaNode 3.0 — Batch 03.2G Verifiable Agronomic Document-to-Passage Provenance Service (Finding 6).
 *
 * Verifiable Provenance Chain:
 *   Original source bytes -> private Storage bucket (`agronomic-standard-sources`) ->
 *   re-downloaded byte SHA-256 verification -> deterministic server-side extraction from
 *   archived bytes -> extracted text SHA-256 -> chunks -> embeddings -> published RAG retrieval.
 *
 * Strictly enforces TWO mutually exclusive ingestion modes:
 * 1. File-backed (`sourceFileBase64` supplied, `textContent` MUST be omitted):
 *    - Validates actual bytes (rejects NUL/binary bytes for text/markdown, validates JSON for JSON,
 *      rejects PDF until a verified server-side PDF text extractor is installed).
 *    - Uploads exact original bytes to private `agronomic-standard-sources` bucket under staff JWT.
 *    - Downloads back the archived object and verifies SHA-256 matches `originalFileSha256`.
 *    - Extracts text EXCLUSIVELY from those verified archived bytes; never mixes caller `textContent`.
 *    - Database RPC verifies `storage.objects` existence before assigning `file_hash_verified`.
 * 2. Staff-entered text (`textContent` supplied, `sourceFileBase64` omitted):
 *    - Unconditionally classified as `staff_asserted` / `staff_entered_text` by PostgreSQL.
 */

export const AGRONOMIC_SOURCES_BUCKET = "agronomic-standard-sources";
export const SERVER_EXTRACTION_VERSION = "1.0";

export const IngestAgronomicDocumentSchema = z
  .object({
    standardId: z.string().uuid(),
    documentTitle: z.string().trim().min(1).max(240),
    sourceAuthority: z.string().trim().min(1).max(120),
    mimeType: z.enum(ALLOWED_AGRONOMIC_DOCUMENT_MIMES),
    /** Raw source file bytes (base64). Mutually exclusive with `textContent` to prevent hash/text mismatch. */
    sourceFileBase64: z.string().min(1).max(14_000_000).optional(),
    /** Staff-entered text (no original file). Mutually exclusive with `sourceFileBase64`. */
    textContent: z.string().min(1).max(2_000_000).optional(),
    externalUri: z.string().url().max(500).nullable().optional(),
    maxChunkChars: z.number().int().min(200).max(7500).optional(),
  })
  .superRefine((val, ctx) => {
    const hasFile = Boolean(val.sourceFileBase64);
    const hasText = Boolean(val.textContent);
    if (!hasFile && !hasText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either sourceFileBase64 (file-backed) or textContent (staff-entered) is required.",
      });
    }
    if (hasFile && hasText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "File-backed ingestion derives text exclusively from the archived source file; do not supply separate textContent.",
      });
    }
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

function extensionForMime(mimeType: AllowedAgronomicDocumentMime): string {
  switch (mimeType) {
    case "text/markdown":
      return "md";
    case "application/json":
      return "json";
    case "application/pdf":
      return "pdf";
    default:
      return "txt";
  }
}

/**
 * Inspects actual raw file bytes (not just caller-supplied MIME) and deterministically
 * extracts text from those exact bytes. Rejects binary/NUL payloads masquerading as text
 * and rejects PDFs until a verified server-side PDF extractor is installed.
 */
export function extractTextFromVerifiedSourceBytes(
  rawBytes: Buffer,
  mimeType: AllowedAgronomicDocumentMime,
):
  | { ok: true; extractedText: string; extractionMethod: DocumentExtractionMethod }
  | { ok: false; status: number; code: string; error: string } {
  if (mimeType === "application/pdf") {
    return {
      ok: false,
      status: 422,
      code: "pdf_extractor_not_configured",
      error:
        "Server-side PDF text extraction is not yet installed; submit plain text/markdown/JSON source files or staff-entered text.",
    };
  }

  // Reject binary/executable signatures (NUL bytes, PDF magic, PNG/ZIP headers) masquerading as text/JSON.
  if (rawBytes.includes(0x00)) {
    return {
      ok: false,
      status: 400,
      code: "invalid_file_signature",
      error: "Binary/NUL bytes detected in text/JSON source file.",
    };
  }
  const head4 = rawBytes.subarray(0, 4).toString("latin1");
  if (head4 === "%PDF" || head4 === "\x89PNG" || head4.startsWith("PK\x03\x04")) {
    return {
      ok: false,
      status: 400,
      code: "mime_signature_mismatch",
      error: `Uploaded file signature does not match declared MIME type (${mimeType}).`,
    };
  }

  const decoded = new TextDecoder("utf-8", { fatal: true });
  let text: string;
  try {
    text = decoded.decode(rawBytes);
  } catch {
    return {
      ok: false,
      status: 400,
      code: "invalid_utf8_source",
      error: "Uploaded source file is not valid UTF-8.",
    };
  }

  if (mimeType === "application/json") {
    try {
      const parsed = JSON.parse(text);
      const formatted = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
      return { ok: true, extractedText: formatted, extractionMethod: "json_structured_file" };
    } catch {
      return {
        ok: false,
        status: 400,
        code: "invalid_json_source",
        error: "Uploaded application/json source file failed JSON parsing.",
      };
    }
  }

  return {
    ok: true,
    extractedText: text,
    extractionMethod: mimeType === "text/markdown" ? "markdown_file" : "plain_text_file",
  };
}

export async function ingestAgronomicStandardDocument(
  client: SupabaseClient<Database>,
  input: IngestAgronomicDocumentInput,
  options: {
    embeddingProvider?: EmbeddingProvider;
    actorUserId?: string;
    verifiedStaffContext?: VerifiedAgronomicStaffContext;
    /** Test-only injection passed through to the trusted verification boundary. */
    serviceClientOverride?: SupabaseClient<Database>;
  } = {},
): Promise<
  | {
      ok: true;
      documentId: string;
      standardId: string;
      standardStatus: string;
      ingestionStatus: "indexed";
      chunkCount: number;
      embeddingsGenerated: number;
      computedFileSizeBytes: number;
      originalFileSha256: string | null;
      extractedTextSha256: string | null;
      storageObjectPath: string | null;
      provenanceVerificationStatus: DocumentProvenanceStatus;
      extractionMethod: DocumentExtractionMethod;
      extractionVersion: string;
      verificationTraceId: string | null;
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
  let computedFileSizeBytes: number;
  let originalFileSha256: string | null = null;
  let extractedTextSha256: string | null = null;
  let storageObjectPath: string | null = null;
  let extractionMethod: DocumentExtractionMethod = "staff_entered_text";
  let textToChunk: string;
  let staffContext: VerifiedAgronomicStaffContext | null = options.verifiedStaffContext ?? null;

  if (data.sourceFileBase64) {
    // Authorize authenticated staff actor BEFORE archiving or invoking the trusted verifier.
    if (!staffContext) {
      if (!options.actorUserId) {
        return {
          ok: false,
          status: 401,
          code: "actor_identity_required",
          error: "Authenticated staff actor identity is required for file-backed verified ingestion.",
        };
      }
      const authStaff = await authorizeAgronomicStaffUploader(client, options.actorUserId);
      if (!authStaff.ok) return authStaff;
      staffContext = authStaff.context;
    }

    const rawBytes = Buffer.from(data.sourceFileBase64, "base64");
    if (rawBytes.length === 0 || rawBytes.length > MAX_AGRONOMIC_DOCUMENT_BYTES) {
      return {
        ok: false,
        status: 400,
        code: "invalid_source_file_size",
        error: `Source file must be between 1 byte and ${MAX_AGRONOMIC_DOCUMENT_BYTES} bytes.`,
      };
    }

    // Validate actual file signature & extractability BEFORE uploading to Storage.
    const preCheck = extractTextFromVerifiedSourceBytes(rawBytes, data.mimeType);
    if (!preCheck.ok) return preCheck;

    computedFileSizeBytes = rawBytes.length;
    originalFileSha256 = createHash("sha256").update(rawBytes).digest("hex");
    storageObjectPath = `${data.standardId}/${originalFileSha256}.${extensionForMime(data.mimeType)}`;

    // 1. Archive exact original bytes into private Storage bucket under authenticated staff JWT.
    const uploadRes = await client.storage
      .from(AGRONOMIC_SOURCES_BUCKET)
      .upload(storageObjectPath, rawBytes, { contentType: data.mimeType, upsert: false });

    if (uploadRes.error) {
      await recordIngestionFailureSafe(client, {
        standardId: data.standardId,
        documentTitle: data.documentTitle,
        sourceAuthority: data.sourceAuthority,
        mimeType: data.mimeType,
        fileSizeBytes: computedFileSizeBytes,
        contentSha256: originalFileSha256,
        ingestionStatus: "failed",
        errorMessage: `Storage upload failed: ${uploadRes.error.message}`,
        storageObjectPath: null,
      });
      return {
        ok: false,
        status: 502,
        code: "storage_archive_failed",
        error: "Unable to archive original source file to private Storage.",
      };
    }

    // 2. Re-download archived bytes and independently verify SHA-256 matches original bytes.
    const downloadRes = await client.storage.from(AGRONOMIC_SOURCES_BUCKET).download(storageObjectPath);
    if (downloadRes.error || !downloadRes.data) {
      await recordIngestionFailureSafe(client, {
        standardId: data.standardId,
        documentTitle: data.documentTitle,
        sourceAuthority: data.sourceAuthority,
        mimeType: data.mimeType,
        fileSizeBytes: computedFileSizeBytes,
        contentSha256: originalFileSha256,
        ingestionStatus: "reconciliation_required",
        errorMessage: "Uploaded source object could not be retrieved for hash verification.",
        storageObjectPath,
      });
      return {
        ok: false,
        status: 502,
        code: "storage_verification_failed",
        error: "Archived source object could not be verified.",
      };
    }

    const archivedBytes = Buffer.from(await downloadRes.data.arrayBuffer());
    const archivedSha256 = createHash("sha256").update(archivedBytes).digest("hex");
    if (archivedSha256 !== originalFileSha256) {
      await recordIngestionFailureSafe(client, {
        standardId: data.standardId,
        documentTitle: data.documentTitle,
        sourceAuthority: data.sourceAuthority,
        mimeType: data.mimeType,
        fileSizeBytes: computedFileSizeBytes,
        contentSha256: originalFileSha256,
        ingestionStatus: "reconciliation_required",
        errorMessage: "Archived Storage object SHA-256 mismatch against uploaded bytes.",
        storageObjectPath,
      });
      return {
        ok: false,
        status: 500,
        code: "storage_hash_mismatch",
        error: "Archived source object hash verification failed.",
      };
    }

    // 3. Extract text EXCLUSIVELY from the verified archived bytes.
    const extracted = extractTextFromVerifiedSourceBytes(archivedBytes, data.mimeType);
    if (!extracted.ok) {
      await recordIngestionFailureSafe(client, {
        standardId: data.standardId,
        documentTitle: data.documentTitle,
        sourceAuthority: data.sourceAuthority,
        mimeType: data.mimeType,
        fileSizeBytes: computedFileSizeBytes,
        contentSha256: originalFileSha256,
        ingestionStatus: "reconciliation_required",
        errorMessage: `Extraction from archived bytes failed: ${extracted.code}`,
        storageObjectPath,
      });
      return extracted;
    }

    textToChunk = extracted.extractedText;
    extractionMethod = extracted.extractionMethod;
    extractedTextSha256 = await sha256Hex(textToChunk);
  } else {
    textToChunk = data.textContent!;
    computedFileSizeBytes = Buffer.byteLength(textToChunk, "utf8");
    extractionMethod = "staff_entered_text";
  }

  const metaCheck = validateAgronomicDocumentMetadata({
    mimeType: data.mimeType,
    fileSizeBytes: computedFileSizeBytes,
    textContent: textToChunk,
  });
  if (!metaCheck.ok) {
    return { ok: false, status: 400, code: "invalid_document_metadata", error: metaCheck.error };
  }

  const chunks = await chunkAgronomicDocument(textToChunk, { maxChunkChars: data.maxChunkChars });
  if (chunks.length === 0) {
    return { ok: false, status: 400, code: "empty_chunks", error: "Document produced zero text chunks." };
  }

  const provider = options.embeddingProvider ?? new UnconfiguredEmbeddingProvider();
  let embeddingsGenerated = 0;
  const payloadChunks: Array<Record<string, unknown>> = [];

  for (const chunk of chunks) {
    // Independently verify chunk content hash matches exact chunk content before persistence.
    const verifiedChunkSha = createHash("sha256").update(chunk.content, "utf8").digest("hex");
    if (verifiedChunkSha !== chunk.contentSha256) {
      return {
        ok: false,
        status: 500,
        code: "chunk_hash_integrity_failed",
        error: "Generated chunk content hash verification failed.",
      };
    }

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
      content_sha256: verifiedChunkSha,
      ...(embedding ? { embedding, embedding_model: embeddingModel, embedding_version: embeddingVersion } : {}),
    });
  }

  // Branch A: File-backed verified ingestion -> narrow `service_role`-only trusted verifier.
  if (data.sourceFileBase64 && staffContext && originalFileSha256 && extractedTextSha256 && storageObjectPath) {
    const verificationTraceId = randomUUID();
    const verifiedRes = await completeVerifiedAgronomicDocumentIngestion(
      staffContext,
      {
        standardId: data.standardId,
        documentTitle: data.documentTitle,
        sourceAuthority: data.sourceAuthority,
        mimeType: data.mimeType as "text/plain" | "text/markdown" | "application/json",
        fileSizeBytes: computedFileSizeBytes,
        originalFileSha256,
        extractedTextSha256,
        storageObjectPath,
        extractionMethod: extractionMethod as "plain_text_file" | "markdown_file" | "json_structured_file",
        extractionVersion: SERVER_EXTRACTION_VERSION,
        verificationTraceId,
        externalUri: data.externalUri ?? null,
        chunks: payloadChunks,
      },
      { serviceClientOverride: options.serviceClientOverride },
    );

    if (!verifiedRes.ok) {
      await recordIngestionFailureSafe(client, {
        standardId: data.standardId,
        documentTitle: data.documentTitle,
        sourceAuthority: data.sourceAuthority,
        mimeType: data.mimeType,
        fileSizeBytes: computedFileSizeBytes,
        contentSha256: originalFileSha256,
        ingestionStatus: "reconciliation_required",
        errorMessage: `Trusted verification persistence failed: ${verifiedRes.code}`,
        storageObjectPath,
      });
      return verifiedRes;
    }

    return {
      ok: true,
      documentId: verifiedRes.documentId,
      standardId: verifiedRes.standardId,
      standardStatus: verifiedRes.standardStatus,
      ingestionStatus: "indexed",
      chunkCount: verifiedRes.chunkCount,
      embeddingsGenerated,
      computedFileSizeBytes,
      originalFileSha256,
      extractedTextSha256,
      storageObjectPath,
      provenanceVerificationStatus: "file_hash_verified",
      extractionMethod,
      extractionVersion: SERVER_EXTRACTION_VERSION,
      verificationTraceId: verifiedRes.verificationTraceId,
    };
  }

  // Branch B: Staff-entered text -> ordinary authenticated staff-assertion RPC (ALWAYS `staff_asserted`).
  const contentSha256 = await sha256Hex(textToChunk);
  const { data: result, error } = await client.rpc("ingest_agronomic_standard_document", {
    p_standard_id: data.standardId,
    p_document_title: data.documentTitle,
    p_source_authority: data.sourceAuthority,
    p_mime_type: data.mimeType,
    p_file_size_bytes: computedFileSizeBytes,
    p_content_sha256: contentSha256,
    p_chunks: payloadChunks as unknown as Json,
    p_external_uri: data.externalUri ?? null,
    p_original_file_sha256: null,
    p_storage_object_path: null,
    p_extraction_method: "staff_entered_text",
    p_provenance_verification_status: "staff_asserted",
    p_extraction_version: SERVER_EXTRACTION_VERSION,
    p_extracted_text_sha256: null,
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
    ingestionStatus: "indexed",
    chunkCount: Number(obj.chunk_count ?? chunks.length),
    embeddingsGenerated,
    computedFileSizeBytes,
    originalFileSha256: null,
    extractedTextSha256: null,
    storageObjectPath: null,
    provenanceVerificationStatus: "staff_asserted",
    extractionMethod: "staff_entered_text",
    extractionVersion: SERVER_EXTRACTION_VERSION,
    verificationTraceId: null,
  };
}

async function recordIngestionFailureSafe(
  client: SupabaseClient<Database>,
  params: {
    standardId: string;
    documentTitle: string;
    sourceAuthority: string;
    mimeType: string;
    fileSizeBytes: number;
    contentSha256: string;
    ingestionStatus: "failed" | "reconciliation_required";
    errorMessage: string;
    storageObjectPath: string | null;
  },
): Promise<void> {
  try {
    await client.rpc("record_agronomic_document_ingestion_failure", {
      p_standard_id: params.standardId,
      p_document_title: params.documentTitle,
      p_source_authority: params.sourceAuthority,
      p_mime_type: params.mimeType,
      p_file_size_bytes: params.fileSizeBytes,
      p_content_sha256: params.contentSha256,
      p_ingestion_status: params.ingestionStatus,
      p_error_message: params.errorMessage,
      p_storage_object_path: params.storageObjectPath,
    });
  } catch {
    // Best-effort durable failure logging; caller still receives fail-closed error response.
  }
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
    extractionVersion: row.extraction_version ?? "1.0",
    provenanceVerificationStatus: (row.provenance_verification_status as DocumentProvenanceStatus) ?? "staff_asserted",
    originalFileSha256: row.original_file_sha256 ?? null,
    storageObjectPath: row.storage_object_path ?? null,
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

export { DOCUMENT_EXTRACTION_METHODS };
