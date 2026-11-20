import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildGroundedPrompt, type FarmerContext } from '@cultivanode/shared';
import { authorizeFarmRequest, parseJsonBody } from '@/lib/engines-api-helper';

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

  const auth = await authorizeFarmRequest(req, parsed.data.context.farmId);
  if (!auth.authorized) return auth.response;

  try {
    const context: FarmerContext = {
      farmerId: auth.user.id,
      cropId: parsed.data.context.cropId ?? '',
      zone: parsed.data.context.zone ?? 'rainforest',
      stageName: parsed.data.context.stageName,
      daysAfterPlanting: parsed.data.context.daysAfterPlanting,
    };
    return NextResponse.json(buildGroundedPrompt(parsed.data.query, context, parsed.data.language ?? 'en'));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
