import { NextResponse } from 'next/server';

import { calculateFertiliserRecommendation, type SoilNutrientProfile } from '@cultivanode/shared';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';
import { FertiliserSchema } from '@/lib/fertiliser-schema';

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  const parsed = await parseJsonBody(req, FertiliserSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const recommendation = calculateFertiliserRecommendation(
      parsed.data.cropId,
      parsed.data.targetYieldTonnesPerHa,
      parsed.data.farmAreaHectares,
      parsed.data.soil as SoilNutrientProfile,
    );
    return NextResponse.json(recommendation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
