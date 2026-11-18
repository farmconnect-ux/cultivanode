import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildGroundedPrompt, type FarmerContext } from '@cultivanode/shared';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';

const GroundSchema = z.object({
  query: z.string().min(1).max(4000),
  context: z.object({
    farmerId: z.string().min(1).max(80),
    cropId: z.string().max(80).optional(),
    zone: z.enum(['rainforest', 'derived_savanna']).optional(),
    stageName: z.string().max(80).optional(),
    daysAfterPlanting: z.number().int().min(0).max(3650).optional(),
  }),
  language: z.enum(['en', 'yo', 'pcm']).optional(),
});

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  const parsed = await parseJsonBody(req, GroundSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const prompt = buildGroundedPrompt(
      parsed.data.query,
      parsed.data.context as FarmerContext,
      parsed.data.language ?? 'en',
    );
    return NextResponse.json(prompt);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
