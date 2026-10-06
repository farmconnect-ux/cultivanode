import { NextResponse } from 'next/server';
import { evaluateCancellation, type CancellationRequest } from '@cultivanode/shared';
import { authorizeRequest } from '@/lib/engines-api-helper';

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await req.json()) as CancellationRequest;
    const outcome = evaluateCancellation(body);
    return NextResponse.json(outcome);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
