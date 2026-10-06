import { NextResponse } from 'next/server';
import { calculateFertiliserRecommendation, type SoilNutrientProfile } from '@cultivanode/shared';
import { authorizeRequest } from '@/lib/engines-api-helper';

interface FertiliserRequestBody {
  cropId: string;
  targetYieldTonnesPerHa: number;
  farmAreaHectares: number;
  soil: SoilNutrientProfile;
}

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await req.json()) as FertiliserRequestBody;
    const recommendation = calculateFertiliserRecommendation(
      body.cropId,
      body.targetYieldTonnesPerHa,
      body.farmAreaHectares,
      body.soil
    );
    return NextResponse.json(recommendation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
