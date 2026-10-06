import { NextResponse } from 'next/server';
import { generateSprayPlan } from '@cultivanode/shared';
import { authorizeRequest } from '@/lib/engines-api-helper';

interface SprayRequestBody {
  chemicalId: string;
  areaHectares: number;
  applicationDate: string;
  plannedHarvestDate: string;
  knapsackTankLiters?: number;
}

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await req.json()) as SprayRequestBody;
    const plan = generateSprayPlan(
      body.chemicalId,
      body.areaHectares,
      body.applicationDate,
      body.plannedHarvestDate,
      body.knapsackTankLiters ?? 16
    );
    return NextResponse.json(plan);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
