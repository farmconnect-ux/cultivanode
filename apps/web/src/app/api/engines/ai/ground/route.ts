import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildGroundedPrompt, type FarmerContext } from '@cultivanode/shared';
import { recordAiAuditEvent } from '@/lib/ai-audit';
import { authorizeAiFarmRequest, parseJsonBody } from '@/lib/engines-api-helper';
import { getLiveFarmContextSnapshot } from '@/lib/farm-context/live-farm-context.service';

const GroundSchema = z.object({
  traceId: z.string().uuid('traceId must be a valid UUID.').optional(),
  query: z.string().min(1).max(4000),
  context: z.object({
    farmId: z.string().uuid(),
    cropId: z.string().max(80).optional(),
    zone: z.enum(['rainforest', 'derived_savanna']).optional(),
    stageName: z.string().max(80).optional(),
    daysAfterPlanting: z.number().int().min(0).max(3650).optional(),
  }),
  language: z.enum(['en', 'yo', 'pcm']).optional(),
});

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, GroundSchema);
  if (!parsed.ok) return parsed.response;

  const auth = await authorizeAiFarmRequest(req, parsed.data.context.farmId);
  if (!auth.authorized) return auth.response;

  const traceId = parsed.data.traceId ?? randomUUID();

  try {
    const snapshot = await getLiveFarmContextSnapshot(auth.caller);
    const activeCycle = snapshot.domains.crop_identity_variety_and_stage.data?.activeCycles[0];
    const resolvedZone =
      parsed.data.context.zone ??
      (snapshot.farmZone === 'derived_savanna' ? 'derived_savanna' : 'rainforest');

    const context: FarmerContext = {
      farmerId: auth.caller.user.id,
      cropId: parsed.data.context.cropId ?? activeCycle?.cropId ?? '',
      zone: resolvedZone,
      stageName: parsed.data.context.stageName ?? activeCycle?.currentStage,
      daysAfterPlanting: parsed.data.context.daysAfterPlanting,
    };

    let prompt: ReturnType<typeof buildGroundedPrompt>;
    try {
      prompt = buildGroundedPrompt(parsed.data.query, context, parsed.data.language ?? 'en');
    } catch {
      const failedAudit = await recordAiAuditEvent(auth.caller, {
        traceId,
        provider: 'rule-engine',
        modelId: 'grounding-deterministic',
        promptVersion: 'grounding-v1',
        executionOutcome: 'failed',
        guardrailResult: {
          status: 'error',
          rule_ids: [],
          reason_codes: ['grounding_execution_failed'],
          blocked: false,
        },
        contextRefs: snapshot.auditContextRefs,
        memoryItemIds: [],
      });
      if (!failedAudit.ok) {
        return NextResponse.json(
          { error: failedAudit.error, code: failedAudit.code, traceId },
          { status: failedAudit.code === 'trace_conflict' ? 409 : 503 },
        );
      }
      return NextResponse.json(
        { error: 'Failed to build grounded prompt.', traceId, auditStatus: 'persisted_failed_outcome' },
        { status: 500 },
      );
    }

    const audit = await recordAiAuditEvent(auth.caller, {
      traceId,
      provider: 'rule-engine',
      modelId: 'grounding-deterministic',
      promptVersion: 'grounding-v1',
      executionOutcome: 'completed',
      guardrailResult: {
        status: 'not_applicable',
        rule_ids: [],
        reason_codes: [],
        blocked: false,
      },
      contextRefs: snapshot.auditContextRefs,
      memoryItemIds: [],
    });

    if (!audit.ok) {
      return NextResponse.json(
        {
          error: audit.code === 'trace_conflict' ? 'Duplicate AI audit trace identifier.' : 'Unable to record AI audit trace.',
          code: audit.code,
          traceId,
        },
        { status: audit.code === 'trace_conflict' ? 409 : 503 },
      );
    }

    return NextResponse.json({
      ...prompt,
      traceId,
      auditStatus: 'persisted',
      farmContext: {
        farmId: snapshot.farmId,
        retrievedAt: snapshot.retrievedAt,
        conflictCount: snapshot.conflicts.length,
        missingFieldCount: snapshot.missingInformation.length,
        validationIssueCount: snapshot.validationIssues.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
