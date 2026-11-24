import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseJs, type SupabaseClient, type User } from "@supabase/supabase-js";
import {
  askGroundedAiAssistant,
  assembleGroundedEvidencePackage,
  type Database,
  type EvidenceRetrievalOutcome,
  type FarmMemoryItemRecord,
  type FarmerContext,
  type PublishedStandardPassage,
} from "@cultivanode/shared";
import { createClient } from "@/lib/supabase/server";
import { aiConfig } from "@/lib/ai-config";
import { redactProviderError } from "@/lib/provider-error";
import { recordAiAuditEvent } from "@/lib/ai-audit";
import {
  authorizeAiFarmRequest,
  verifyActiveAccount,
  verifyAiIntelligenceConsent,
  type VerifiedAiFarmCallerContext,
} from "@/lib/engines-api-helper";
import { getLiveFarmContextSnapshot } from "@/lib/farm-context/live-farm-context.service";
import { resolveServerVerifiedAgronomicContext } from "@/lib/farm-context/verified-agronomic-context.service";
import { retrieveFarmMemories } from "@/lib/memory/farm-memory.service";
import { retrievePublishedAgronomicStandards } from "@/lib/rag/agronomic-standards-rag.service";
import { logger } from "@/lib/logger";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Explicit AI Assistant Audit Policy (Batch 03.1D Finding 09):
 *
 * 1. Farm-specific execution (`context.farmId` supplied):
 *    - Requires verified JWT, active account, verified farm visibility (RLS), and active
 *      `ai_intelligence` consent via `authorizeAiFarmRequest`.
 *    - Loads RLS-scoped `LiveFarmContextSnapshot`.
 *    - Persists an append-only audit record via `recordAiAuditEvent` for every outcome
 *      (`completed`, `blocked`, `fallback`, or `failed` on provider exception).
 *    - Fails closed (`409` on duplicate traceId conflict, `503` on audit persistence failure).
 *
 * 2. Farm-independent execution (`context.farmId` omitted):
 *    - Current `public.ai_audit_events` schema enforces `farm_id NOT NULL` (`20261120020000`).
 *    - No farm-independent audit table/RPC is currently approved.
 *    - Therefore, after caller authentication, active-account, and consent checks, requests
 *      without `context.farmId` FAIL CLOSED with `422 FARM_CONTEXT_REQUIRED_FOR_AUDIT`.
 *    - Never fabricates a farm ID and never executes an unaudited AI completion.
 */

const AssistantBodySchema = z.object({
  traceId: z.string().uuid("traceId must be a valid UUID.").optional(),
  query: z.string().max(4000).optional(),
  language: z.enum(["en", "yo", "pcm"]).optional(),
  imageBase64: z.string().max(8_000_000).optional(),
  imageMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
  context: z
    .object({
      farmId: z.string().uuid("context.farmId must be a valid UUID.").optional(),
      plotId: z.string().uuid("context.plotId must be a valid UUID.").optional(),
      cropId: z.string().max(80).optional(),
      cycleId: z.string().uuid("context.cycleId must be a valid UUID.").optional(),
      zone: z.string().max(80).optional(),
      stageName: z.string().max(80).optional(),
      daysAfterPlanting: z.number().int().min(0).max(3650).optional(),
    })
    .optional(),
});

function mapAuditProvider(providerUsed: string): "claude" | "gemini" | "openai" | "rule-engine" {
  const lower = providerUsed.toLowerCase();
  if (lower.includes("claude") || lower.includes("anthropic")) return "claude";
  if (lower.includes("gemini") || lower.includes("google")) return "gemini";
  if (lower.includes("openai") || lower.includes("gpt")) return "openai";
  return "rule-engine";
}

async function resolveAuthenticatedUser(
  req: Request,
): Promise<{ user: User; client: SupabaseClient<Database> } | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const { url, key } = supabaseEnv();
      const client = createSupabaseJs<Database>(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data } = await client.auth.getUser(token);
      if (data.user) return { user: data.user, client };
    }
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) return { user: data.user, client: supabase };
  return null;
}

export async function POST(req: Request) {
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const parsed = AssistantBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request payload." },
        { status: 400 },
      );
    }

    const body = parsed.data;
    if (!body.query?.trim() && !body.imageBase64) {
      return NextResponse.json(
        { error: "Please provide a question or attach a photo." },
        { status: 400 },
      );
    }

    const farmId = body.context?.farmId;
    let verifiedFarmCaller: VerifiedAiFarmCallerContext;

    if (farmId) {
      // Farm-scoped AI intelligence requires Bearer JWT -> active account -> farm RLS -> AI consent.
      const farmAuth = await authorizeAiFarmRequest(req, farmId);
      if (!farmAuth.authorized) return farmAuth.response;
      verifiedFarmCaller = farmAuth.caller;
    } else {
      // Authenticate first so unauthenticated callers receive 401 before policy checks.
      const session = await resolveAuthenticatedUser(req);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
      }

      const activeCheck = await verifyActiveAccount(session.client, session.user.id);
      if (!activeCheck.ok) return activeCheck.response;

      const consentCheck = await verifyAiIntelligenceConsent(session.client, session.user.id);
      if (!consentCheck.ok) return consentCheck.response;

      // Fail closed: farm-independent AI execution cannot currently be audited in `public.ai_audit_events`.
      return NextResponse.json(
        {
          error:
            "A verified farmId (context.farmId) is required for audited AI assistant execution. Farm-independent AI audit storage is not yet approved.",
          code: "FARM_CONTEXT_REQUIRED_FOR_AUDIT",
          auditPolicy: "fail_closed_farm_audit_required",
        },
        { status: 422 },
      );
    }

    const traceId = body.traceId ?? randomUUID();
    const snapshot = await getLiveFarmContextSnapshot(verifiedFarmCaller);

    // Revision 5 (Remediation C): Authoritative zone, plot ownership, and active crop-cycle growth stage
    // come exclusively from the shared server-side RLS resolver. Client-supplied zone and stageName
    // are treated strictly as assertions and NEVER override verified server records.
    const verifiedCtxRes = await resolveServerVerifiedAgronomicContext({
      caller: verifiedFarmCaller,
      snapshot,
      assertions: {
        plotId: body.context?.plotId,
        cropId: body.context?.cropId,
        cycleId: body.context?.cycleId,
        zone: body.context?.zone,
        stageName: body.context?.stageName,
      },
    });
    if (verifiedCtxRes.conflict) {
      return NextResponse.json(
        {
          error: verifiedCtxRes.error,
          code: verifiedCtxRes.code,
          traceId,
        },
        { status: verifiedCtxRes.httpStatus },
      );
    }

    const resolvedCropId = verifiedCtxRes.verifiedCropId ?? body.context?.cropId;
    const resolvedZone = verifiedCtxRes.verifiedZone;
    const resolvedStageName = verifiedCtxRes.verifiedGrowthStage;
    const resolvedPlotId = verifiedCtxRes.verifiedPlotId;

    // Batch 03.2: Retrieve RLS-scoped persistent memories & published-only agronomic standards
    // with EXPLICIT retrieval outcomes (Finding 4: never silently equate failure with empty results).
    let retrievedMemories: FarmMemoryItemRecord[] = [];
    let publishedStandards: PublishedStandardPassage[] = [];
    let persistentMemoryOutcome: EvidenceRetrievalOutcome = { status: "skipped", count: 0 };
    let publishedStandardsOutcome: EvidenceRetrievalOutcome = { status: "skipped", count: 0 };

    if (typeof verifiedFarmCaller.client?.rpc === "function") {
      const [memRes, ragRes] = await Promise.all([
        retrieveFarmMemories(verifiedFarmCaller.client, {
          farmId: verifiedFarmCaller.farmId,
          includeProfile: true,
          includeProvisional: true,
          queryText: body.query?.trim() || undefined,
          limit: 15,
        }),
        retrievePublishedAgronomicStandards(verifiedFarmCaller.client, {
          cropOrLivestockId: resolvedCropId || undefined,
          agroZone: resolvedZone,
          queryText: body.query?.trim() || undefined,
          limit: 5,
        }),
      ]);
      if (memRes.ok) {
        retrievedMemories = [
          ...memRes.result.confirmedFarmMemories,
          ...memRes.result.provisionalFarmMemories,
          ...memRes.result.profileMemories,
        ];
        persistentMemoryOutcome = {
          status: retrievedMemories.length > 0 ? "ok_with_results" : "ok_empty",
          count: retrievedMemories.length,
        };
      } else {
        persistentMemoryOutcome = {
          status: "failed",
          count: 0,
          errorCode: memRes.code,
          errorMessage: memRes.error,
        };
      }
      if (ragRes.ok) {
        publishedStandards = ragRes.passages;
        publishedStandardsOutcome = {
          status: publishedStandards.length > 0 ? "ok_with_results" : "ok_empty",
          count: publishedStandards.length,
        };
      } else {
        publishedStandardsOutcome = {
          status: "failed",
          count: 0,
          errorCode: ragRes.code,
          errorMessage: ragRes.error,
        };
      }
    }

    const evidencePackage =
      snapshot.domains && snapshot.auditContextRefs
        ? assembleGroundedEvidencePackage({
            liveFarmContext: snapshot,
            memories: retrievedMemories,
            publishedStandards,
            retrievalOutcomes: {
              persistentMemory: persistentMemoryOutcome,
              publishedStandards: publishedStandardsOutcome,
            },
          })
        : null;
    const auditContextRefs = evidencePackage?.auditContextRefs ?? snapshot.auditContextRefs;
    const memoryItemIds = evidencePackage?.memoryItemIds ?? [];

    const c = await aiConfig();
    let result: Awaited<ReturnType<typeof askGroundedAiAssistant>>;

    try {
      result = await askGroundedAiAssistant({
        query: body.query?.trim() || "Please examine this crop photo and advise what to do.",
        // Always bind farmerId, farmId, plotId, zone, and stageName to verified server records;
        // NEVER pass client-supplied zone or stageName as authoritative context.
        context: {
          cropId: resolvedCropId ?? "",
          zone: resolvedZone,
          stageName: resolvedStageName,
          daysAfterPlanting: body.context?.daysAfterPlanting,
          farmerId: verifiedFarmCaller.user.id,
          farmId: verifiedFarmCaller.farmId,
          plotId: resolvedPlotId,
          cycleId: verifiedCtxRes.verifiedContext?.cropCycleId,
          requestId: traceId,
        } as FarmerContext,
        verifiedFarmContext: verifiedCtxRes.verifiedContext,
        // LFC-AC-04: several active cycles match and none was chosen; ask instead of guessing.
        subjectAmbiguity: verifiedCtxRes.subjectAmbiguity ?? null,
        // Finding 1: Pass the assembled, sanitised GroundedEvidencePackage directly into the AI model pipeline.
        groundedEvidence: evidencePackage,
        language: body.language ?? "en",
        imageBase64: body.imageBase64,
        imageMimeType: body.imageMimeType,
        anthropicApiKey: c.anthropicApiKey,
        claudeModels: c.claudeModels,
        geminiApiKey: c.geminiApiKey,
        openaiApiKey: c.openaiApiKey,
        primaryModel: c.primaryModel,
        fallbackModel: c.fallbackModel,
        timeoutMs: c.timeoutMs,
      });
    } catch (providerErr) {
      const errMsg = providerErr instanceof Error ? providerErr.message : "AI provider execution failed.";
      logger.error("ai_assistant_provider_failed", { traceId, message: errMsg });

      const failedAudit = await recordAiAuditEvent(verifiedFarmCaller, {
        traceId,
        provider: mapAuditProvider(c.primaryModel || "rule-engine"),
        modelId: (c.primaryModel || "rule-engine").slice(0, 128),
        promptVersion: "assistant-v1",
        executionOutcome: "failed",
        guardrailResult: {
          status: "error",
          rule_ids: [],
          reason_codes: ["provider_execution_failed"],
          blocked: false,
        },
        contextRefs: auditContextRefs,
        memoryItemIds,
      });

      if (!failedAudit.ok) {
        const status = failedAudit.code === "trace_conflict" ? 409 : 503;
        return NextResponse.json(
          { error: failedAudit.error, code: failedAudit.code, traceId },
          { status },
        );
      }

      return NextResponse.json(
        {
          error: "AI provider failed to complete the request.",
          code: "AI_PROVIDER_FAILED",
          traceId,
          auditStatus: "persisted_failed_outcome",
        },
        { status: 502 },
      );
    }

    const executionOutcome = !result.passedSafetyGuardrail
      ? "blocked"
      : result.providerErrors.length > 0
        ? "fallback"
        : "completed";

    const audit = await recordAiAuditEvent(verifiedFarmCaller, {
      traceId,
      provider: mapAuditProvider(result.providerUsed),
      modelId: (result.modelUsed || "rule-engine").slice(0, 128),
      promptVersion: "assistant-v1",
      executionOutcome,
      guardrailResult: {
        status: result.passedSafetyGuardrail ? "passed" : "blocked",
        rule_ids: result.numericGuardrailBlocked
          ? ["nafdac_chemical_guardrail", "fertiliser_numeric_guardrail"]
          : ["nafdac_chemical_guardrail"],
        reason_codes: result.passedSafetyGuardrail
          ? []
          : [
              ...((result.bannedChemicalsDetected?.length ?? 0) > 0 || !result.numericGuardrailBlocked
                ? (["prohibited_chemical"] as const)
                : []),
              ...(result.numericGuardrailBlocked ? (["unsupported_numerical_prescription"] as const) : []),
            ],
        blocked: !result.passedSafetyGuardrail,
      },
      contextRefs: auditContextRefs,
      memoryItemIds,
    });

    if (!audit.ok) {
      const status = audit.code === "trace_conflict" ? 409 : 503;
      return NextResponse.json(
        {
          error:
            audit.code === "trace_conflict"
              ? "Duplicate AI audit trace identifier."
              : "Unable to record AI audit trace.",
          code: audit.code,
          traceId,
        },
        { status },
      );
    }

    if (result.providerErrors.length > 0) {
      logger.warn("ai_assistant_fallback", {
        provider: result.providerUsed,
        errors: result.providerErrors.length,
        // Why each provider failed (status code and the provider's short message), with anything
        // that looks like a key masked, so a fallback can be diagnosed from the logs.
        reasons: result.providerErrors.map(redactProviderError).join(" | ").slice(0, 900),
      });
    } else {
      logger.info("ai_assistant_ok", { provider: result.providerUsed, model: result.modelUsed });
    }

    return NextResponse.json({
      ...result,
      traceId,
      auditStatus: "persisted",
      ...(evidencePackage
        ? {
            groundedEvidence: {
              degradedGrounding: evidencePackage.degradedGrounding,
              retrievalOutcomes: evidencePackage.retrievalOutcomes,
            },
          }
        : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process AI request.";
    logger.error("ai_assistant_error", { message });
    return NextResponse.json({ error: "Failed to process AI request." }, { status: 500 });
  }
}

