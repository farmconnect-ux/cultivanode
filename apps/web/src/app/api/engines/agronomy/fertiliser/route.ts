import { NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateFertiliserRecommendation, type SoilNutrientProfile } from '@cultivanode/shared';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';

const FertiliserSchema = z.object({
  cropId: z.string().min(1).max(80),
  targetYieldTonnesPerHa: z.number().positive().max(100),
  farmAreaHectares: z.number().positive().max(100_000),
  soil: z.object({
    ph: z.number().min(0).max(14).optional(),
    nitrogenPpm: z.number().min(0).optional(),
    phosphorusPpm: z.number().min(0).optional(),
    potassiumPpm: z.number().min(0).optional(),
    organicMatterPct: z.number().min(0).max(100).optional(),
  }),
});

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
