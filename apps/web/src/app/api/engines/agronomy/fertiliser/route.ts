import { NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateFertiliserRecommendation, type SoilNutrientProfile } from '@cultivanode/shared';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';

export const SoilSchema = z.object({
  pH: z.number().finite().min(0).max(14).optional(),
  ph: z.number().finite().min(0).max(14).optional(),
  nitrogenPpm: z.number().finite().min(0).optional(),
  phosphorusPpm: z.number().finite().min(0),
  potassiumPpm: z.number().finite().min(0),
  organicMatterPercent: z.number().finite().min(0).max(100).optional(),
  organicMatterPct: z.number().finite().min(0).max(100).optional(),
}).refine((soil) => soil.pH !== undefined || soil.ph !== undefined, {
  message: 'Soil pH is required.',
}).refine((soil) => soil.organicMatterPercent !== undefined || soil.organicMatterPct !== undefined, {
  message: 'Soil organic matter is required.',
}).transform((soil) => ({
  pH: soil.pH ?? soil.ph!,
  phosphorusPpm: soil.phosphorusPpm,
  potassiumPpm: soil.potassiumPpm,
  organicMatterPercent: soil.organicMatterPercent ?? soil.organicMatterPct!,
}));

export const FertiliserSchema = z.object({
  cropId: z.string().min(1).max(80),
  targetYieldTonnesPerHa: z.number().finite().positive().max(100),
  farmAreaHectares: z.number().finite().positive().max(100_000),
  soil: SoilSchema,
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
