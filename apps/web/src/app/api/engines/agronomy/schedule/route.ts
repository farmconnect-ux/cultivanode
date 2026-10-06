import { NextResponse } from 'next/server';
import { generatePlantingSchedule, type GenerateScheduleParams } from '@cultivanode/shared';
import { authorizeRequest } from '@/lib/engines-api-helper';

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await req.json()) as GenerateScheduleParams;
    const schedule = generatePlantingSchedule(body);
    return NextResponse.json(schedule);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
