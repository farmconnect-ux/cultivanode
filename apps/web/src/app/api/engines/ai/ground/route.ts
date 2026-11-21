import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildGroundedPrompt, type FarmerContext } from '@cultivanode/shared';
import { recordAiAuditEvent } from '@/lib/ai-audit';
import { authorizeAiFarmRequest, parseJsonBody } from '@/lib/engines-api-helper';
import { getLiveFarmContextSnapshot } from '@/lib/farm-context/live-farm-context.service';

const GroundSchema = z.object({
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

  try {
    const traceId = randomUUID();
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

    const prompt = buildGroundedPrompt(parsed.data.query, context, parsed.data.language ?? 'en');

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
      return NextResponse.json({ error: 'Unable to record AI audit trace.' }, { status: 503 });
    }

    return NextResponse.json({
      ...prompt,
      traceId,
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
