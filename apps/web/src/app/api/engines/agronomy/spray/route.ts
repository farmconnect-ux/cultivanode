import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSprayPlan } from '@cultivanode/shared';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';

const SpraySchema = z.object({
  chemicalId: z.string().min(1).max(80),
  areaHectares: z.number().positive().max(100_000),
  applicationDate: z.string().min(8).max(32),
  plannedHarvestDate: z.string().min(8).max(32),
  knapsackTankLiters: z.number().positive().max(2000).optional(),
});

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  const parsed = await parseJsonBody(req, SpraySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const plan = generateSprayPlan(
      parsed.data.chemicalId,
      parsed.data.areaHectares,
      parsed.data.applicationDate,
      parsed.data.plannedHarvestDate,
      parsed.data.knapsackTankLiters ?? 16,
    );
    return NextResponse.json(plan);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
