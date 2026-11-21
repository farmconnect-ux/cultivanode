import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@cultivanode/shared";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * CultivaNode 3.0 — Batch 03.2H Narrow Trusted Document Provenance Verification Boundary.
 *
 * Security boundary:
 * - This module is the ONLY application file permitted by ESLint
 *   (`cultivanode/no-direct-document-verification-writer`) to invoke the
 *   `service_role`-only `complete_verified_agronomic_document_ingestion` RPC.
 * - Accepts ONLY a Symbol-branded `VerifiedAgronomicStaffContext` produced by
 *   `authorizeAgronomicStaffUploader()` after JWT authentication, active-account
 *   verification, and staff permission verification (`standards.publish` or `crops.manage`).
 * - Never accepts an arbitrary caller-supplied actor ID or provenance status.
 * - Never exposes or returns `createServiceClient()`.
 * - Never logs raw file bytes, credentials, or sensitive document content.
 *
 * Explicit architectural limitation:
 * PostgreSQL cannot directly read Supabase Storage object bytes from external object storage.
 * Cryptographic byte verification (upload -> download -> SHA-256 comparison -> extraction ->
 * chunk hashing) runs inside the Next.js server-side verification pipeline, while PostgreSQL
 * enforces that:
 * 1. Ordinary `authenticated` callers have ZERO privilege to invoke this RPC or assign `file_hash_verified`.
 * 2. The verified actor matches `storage.objects.owner` and holds active staff permission.
 * 3. Every chunk's `content_sha256` matches `extensions.digest(content, 'sha256')`.
 * 4. Verified source metadata and indexed verified chunks are immutable once recorded.
 */

const VERIFIED_STAFF_BRAND: unique symbol = Symbol("VerifiedAgronomicStaffContext");

export interface VerifiedAgronomicStaffContext {
  readonly [VERIFIED_STAFF_BRAND]: true;
  readonly userId: string;
  readonly verifiedAt: string;
}

export function isVerifiedAgronomicStaffContext(value: unknown): value is VerifiedAgronomicStaffContext {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<PropertyKey, unknown>)[VERIFIED_STAFF_BRAND] === true &&
    typeof (value as { userId?: unknown }).userId === "string"
  );
}

/**
 * Verifies via the caller's RLS-scoped JWT client that the authenticated user holds
 * `standards.publish` or `crops.manage` permission before branding a staff context.
 */
export async function authorizeAgronomicStaffUploader(
  userClient: SupabaseClient<Database>,
  userId: string,
): Promise<
  | { ok: true; context: VerifiedAgronomicStaffContext }
  | { ok: false; status: number; code: string; error: string }
> {
  if (!z.string().uuid().safeParse(userId).success) {
    return { ok: false, status: 401, code: "invalid_actor_identity", error: "Valid authenticated staff user ID required." };
  }

  const [publishPerm, cropsPerm] = await Promise.all([
    userClient.rpc("has_permission", { p_permission: "standards.publish" }),
    userClient.rpc("has_permission", { p_permission: "crops.manage" }),
  ]);

  if (publishPerm.error && cropsPerm.error) {
    return {
      ok: false,
      status: 503,
      code: "permission_check_unavailable",
      error: "Unable to verify staff ingestion permissions.",
    };
  }

  if (publishPerm.data !== true && cropsPerm.data !== true) {
    return {
      ok: false,
      status: 403,
      code: "staff_permission_denied",
      error: "Permission denied: standards.publish or crops.manage required.",
    };
  }

  return {
    ok: true,
    context: {
      [VERIFIED_STAFF_BRAND]: true,
      userId,
      verifiedAt: new Date().toISOString(),
    },
  };
}

const SHA256_RE = /^[a-f0-9]{64}$/;

const VerifiedIngestionPayloadSchema = z
  .object({
    standardId: z.string().uuid(),
    documentTitle: z.string().trim().min(1).max(240),
    sourceAuthority: z.string().trim().min(1).max(120),
    mimeType: z.enum(["text/plain", "text/markdown", "application/json"]),
    fileSizeBytes: z.number().int().min(1).max(10_485_760),
    originalFileSha256: z.string().regex(SHA256_RE),
    extractedTextSha256: z.string().regex(SHA256_RE),
    storageObjectPath: z.string().trim().min(1).max(500),
    extractionMethod: z.enum(["plain_text_file", "markdown_file", "json_structured_file"]),
    extractionVersion: z.string().trim().min(1).max(64),
    verificationTraceId: z.string().uuid(),
    externalUri: z.string().url().max(500).nullable().optional(),
    chunks: z.array(z.record(z.string(), z.unknown())).min(1).max(500),
  })
  .strict();

export type VerifiedIngestionPayload = z.infer<typeof VerifiedIngestionPayloadSchema>;

export type CompleteVerifiedIngestionResult =
  | {
      ok: true;
      documentId: string;
      standardId: string;
      standardStatus: string;
      ingestionStatus: "indexed";
      chunkCount: number;
      provenanceVerificationStatus: "file_hash_verified";
      verificationTraceId: string;
      fileHashVerifiedBy: string;
      fileHashVerifiedAt: string;
    }
  | { ok: false; status: number; code: string; error: string };

export interface TrustedVerifierOptions {
  /** Test-only injection of the narrow service-role client. Production uses `createServiceClient()`. */
  serviceClientOverride?: SupabaseClient<Database>;
}

/**
 * Invokes the `service_role`-only `complete_verified_agronomic_document_ingestion` RPC
 * after all server-side Storage archival, SHA-256 verification, text extraction, and
 * chunk-hash checks have succeeded.
 */
export async function completeVerifiedAgronomicDocumentIngestion(
  staffContext: VerifiedAgronomicStaffContext,
  payload: VerifiedIngestionPayload,
  options: TrustedVerifierOptions = {},
): Promise<CompleteVerifiedIngestionResult> {
  if (!isVerifiedAgronomicStaffContext(staffContext)) {
    return {
      ok: false,
      status: 403,
      code: "unverified_staff_context",
      error: "Verified staff context is required to record file_hash_verified provenance.",
    };
  }

  const parsed = VerifiedIngestionPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "invalid_verified_ingestion_payload",
      error: parsed.error.issues[0]?.message ?? "Invalid verified ingestion payload.",
    };
  }

  const data = parsed.data;
  const expectedPrefix = `${data.standardId}/${data.originalFileSha256}.`;
  if (!data.storageObjectPath.startsWith(expectedPrefix)) {
    return {
      ok: false,
      status: 400,
      code: "storage_path_binding_mismatch",
      error: "Storage object path is not bound to the verified standardId and originalFileSha256.",
    };
  }

  let serviceClient: SupabaseClient<Database>;
  try {
    serviceClient = options.serviceClientOverride ?? createServiceClient();
  } catch {
    logger.error("agronomic_verified_ingestion_service_client_unavailable", {
      standardId: data.standardId,
      verificationTraceId: data.verificationTraceId,
    });
    return {
      ok: false,
      status: 503,
      code: "verification_service_unavailable",
      error: "Trusted document verification service is not configured.",
    };
  }

  const { data: rpcData, error } = await serviceClient.rpc(
    "complete_verified_agronomic_document_ingestion",
    {
      p_actor_id: staffContext.userId,
      p_standard_id: data.standardId,
      p_document_title: data.documentTitle,
      p_source_authority: data.sourceAuthority,
      p_mime_type: data.mimeType,
      p_file_size_bytes: data.fileSizeBytes,
      p_original_file_sha256: data.originalFileSha256,
      p_extracted_text_sha256: data.extractedTextSha256,
      p_storage_object_path: data.storageObjectPath,
      p_extraction_method: data.extractionMethod,
      p_extraction_version: data.extractionVersion,
      p_verification_trace_id: data.verificationTraceId,
      p_chunks: data.chunks as unknown as Json,
      p_external_uri: data.externalUri ?? null,
    },
  );

  if (error || !rpcData || typeof rpcData !== "object" || Array.isArray(rpcData)) {
    logger.error("agronomic_verified_ingestion_rpc_failed", {
      standardId: data.standardId,
      verificationTraceId: data.verificationTraceId,
      code: error?.code ?? "unknown",
    });
    const status =
      error?.code === "42501" ? 403 : error?.code === "P0002" ? 404 : error?.code === "23505" ? 409 : error?.code === "22023" ? 400 : 500;
    return {
      ok: false,
      status,
      code: error?.code ?? "verified_ingestion_failed",
      error: error?.message ?? "Failed to persist verified agronomic standard document.",
    };
  }

  const result = rpcData as Record<string, unknown>;
  logger.info("agronomic_document_file_hash_verified", {
    documentId: String(result.document_id ?? ""),
    standardId: data.standardId,
    verificationTraceId: data.verificationTraceId,
    chunkCount: Number(result.chunk_count ?? data.chunks.length),
    extractionMethod: data.extractionMethod,
  });

  return {
    ok: true,
    documentId: String(result.document_id ?? ""),
    standardId: String(result.standard_id ?? data.standardId),
    standardStatus: String(result.standard_status ?? "draft"),
    ingestionStatus: "indexed",
    chunkCount: Number(result.chunk_count ?? data.chunks.length),
    provenanceVerificationStatus: "file_hash_verified",
    verificationTraceId: String(result.verification_trace_id ?? data.verificationTraceId),
    fileHashVerifiedBy: String(result.file_hash_verified_by ?? staffContext.userId),
    fileHashVerifiedAt: String(result.file_hash_verified_at ?? new Date().toISOString()),
  };
}
