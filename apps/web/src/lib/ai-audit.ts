import "server-only";
import { z } from "zod";
import { ALLOWED_AUDIT_CONTEXT_SOURCES, type Json } from "@cultivanode/shared";
import {
  isVerifiedAiFarmCallerContext,
  type VerifiedAiFarmCallerContext,
} from "@/lib/engines-api-helper";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * CultivaNode 3.0 — Batch 03.1C Central Trusted AI Audit Client (ADR-005).
 *
 * Security boundary:
 * - This module is the ONLY application file permitted by ESLint
 *   (`cultivanode/no-direct-ai-audit-writer`) to invoke `write_ai_audit_event`.
 * - Accepts ONLY a branded `VerifiedAiFarmCallerContext` produced by
 *   `authorizeAiFarmRequest()`, never an arbitrary client-supplied profile ID.
 * - Invokes `createServiceClient()` ONLY after caller identity, active-account,
 *   farm visibility, AI consent, and strict Zod payload validation all succeed.
 * - Never exposes or returns the service-role client.
 * - Fails closed on any validation, configuration, conflict, or persistence error.
 *
 * Explicit ADR-005 limitation:
 * Because Next.js server modules share `SUPABASE_SECRET_KEY`, isolating
 * `write_ai_audit_event` inside this file is an application-architecture and
 * ESLint/code-review boundary, not an independent PostgreSQL identity boundary.
 */

const VALID_RECORD_ID_RE = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,63}$/;
const VALID_ISO_TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;
const SECRET_OR_DATA_URI_RE =
  /(bearer\s+[a-z0-9._-]+|sk-[a-z0-9_-]{10,}|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+|data:image\/[a-z]+;base64,)/i;

const GuardrailResultSchema = z
  .object({
    status: z.enum(["passed", "blocked", "error", "not_applicable"]).optional(),
    rule_ids: z.array(z.string().min(1).max(64)).max(50).optional(),
    reason_codes: z.array(z.string().min(1).max(64)).max(50).optional(),
    blocked: z.boolean().optional(),
  })
  .strict();

const ContextRefSchema = z
  .object({
    source: z.enum(ALLOWED_AUDIT_CONTEXT_SOURCES),
    record_id: z
      .string()
      .regex(VALID_RECORD_ID_RE, "Invalid context reference record_id format.")
      .refine((v) => !SECRET_OR_DATA_URI_RE.test(v), "Secrets or image payloads are prohibited."),
    observed_at: z
      .string()
      .regex(VALID_ISO_TS_RE, "Invalid context reference observed_at timestamp.")
      .refine((v) => !Number.isNaN(new Date(v).getTime()), "Unparseable observed_at timestamp.")
      .optional(),
  })
  .strict();

export const AiAuditEventInputSchema = z
  .object({
    traceId: z.string().uuid(),
    provider: z.enum(["claude", "gemini", "openai", "rule-engine"]),
    modelId: z
      .string()
      .min(1)
      .max(128)
      .refine((v) => !SECRET_OR_DATA_URI_RE.test(v), "Invalid model identifier."),
    promptVersion: z
      .string()
      .min(1)
      .max(128)
      .refine((v) => !SECRET_OR_DATA_URI_RE.test(v), "Invalid prompt version."),
    executionOutcome: z.enum(["completed", "blocked", "failed", "fallback"]),
    guardrailResult: GuardrailResultSchema.default({}),
    contextRefs: z
      .array(ContextRefSchema)
      .max(100)
      .superRefine((refs, ctx) => {
        const seen = new Set<string>();
        for (let i = 0; i < refs.length; i++) {
          const key = `${refs[i]!.source}|${refs[i]!.record_id}`;
          if (seen.has(key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Duplicate context references are not permitted.",
              path: [i],
            });
          }
          seen.add(key);
        }
      })
      .default([]),
    memoryItemIds: z.array(z.string().uuid()).max(100).default([]),
    promptVersionId: z.string().uuid().nullable().optional(),
  })
  .strict();

export type AiAuditEventInput = z.input<typeof AiAuditEventInputSchema>;

export type AiAuditWriteResult =
  | { ok: true; eventId: string; traceId: string }
  | {
      ok: false;
      code:
        | "unverified_caller"
        | "invalid_payload"
        | "service_unavailable"
        | "trace_conflict"
        | "persistence_failed";
      error: string;
    };

/**
 * Persists an append-only AI execution audit event via the narrow `service_role`-only
 * `public.write_ai_audit_event(...)` RPC wrapper (which delegates to `private.write_ai_audit_event`).
 */
export async function recordAiAuditEvent(
  caller: VerifiedAiFarmCallerContext,
  input: AiAuditEventInput,
): Promise<AiAuditWriteResult> {
  // 1. Enforce branded server-verified caller context (never trust arbitrary profile/farm IDs).
  if (!isVerifiedAiFarmCallerContext(caller)) {
    return {
      ok: false,
      code: "unverified_caller",
      error: "Verified caller context is required for AI audit recording.",
    };
  }

  // 2. Strict Zod validation (strips/rejects raw prompts, images, tokens, secrets, unexpected keys).
  const parsed = AiAuditEventInputSchema.safeParse(input);
  if (!parsed.success) {
    logger.warn("ai_audit_validation_rejected", {
      issueCount: parsed.error.issues.length,
    });
    return {
      ok: false,
      code: "invalid_payload",
      error: "AI audit payload failed validation.",
    };
  }

  const event = parsed.data;

  // 3. Acquire service-role client ONLY after caller auth, consent, and payload checks succeed.
  let admin: ReturnType<typeof createServiceClient>;
  try {
    admin = createServiceClient();
  } catch {
    admin = null;
  }

  if (!admin) {
    logger.error("ai_audit_service_unavailable", { traceId: event.traceId });
    return {
      ok: false,
      code: "service_unavailable",
      error: "AI audit service is temporarily unavailable.",
    };
  }

  // 4. Invoke narrow service_role-only public wrapper RPC.
  try {
    const { data, error } = await admin.rpc("write_ai_audit_event", {
      p_profile_id: caller.user.id,
      p_farm_id: caller.farmId,
      p_trace_id: event.traceId,
      p_provider: event.provider,
      p_model_id: event.modelId,
      p_prompt_version: event.promptVersion,
      p_execution_outcome: event.executionOutcome,
      p_guardrail_result: event.guardrailResult as unknown as Json,
      p_context_refs: event.contextRefs as unknown as Json,
      p_memory_item_ids: event.memoryItemIds,
      p_prompt_version_id: event.promptVersionId ?? null,
    });

    if (error) {
      const isConflict = error.code === "23505";
      logger.error("ai_audit_write_failed", {
        traceId: event.traceId,
        code: error.code ?? "unknown",
      });
      return {
        ok: false,
        code: isConflict ? "trace_conflict" : "persistence_failed",
        error: isConflict
          ? "Audit trace identifier conflict."
          : "Unable to persist AI audit event.",
      };
    }

    if (typeof data !== "string" || !data) {
      logger.error("ai_audit_empty_response", { traceId: event.traceId });
      return {
        ok: false,
        code: "persistence_failed",
        error: "Unable to persist AI audit event.",
      };
    }

    return { ok: true, eventId: data, traceId: event.traceId };
  } catch {
    logger.error("ai_audit_write_exception", { traceId: event.traceId });
    return {
      ok: false,
      code: "persistence_failed",
      error: "Unable to persist AI audit event.",
    };
  }
}
