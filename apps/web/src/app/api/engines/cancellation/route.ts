import { NextResponse } from 'next/server';
import { z } from 'zod';
import { evaluateCancellation, type CancellationRequest } from '@cultivanode/shared';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';

const CancellationSchema = z.object({
  bookingId: z.string().min(1).max(100),
  actor: z.enum(['farmer', 'provider', 'admin']),
  agreedPriceKobo: z.number().int().positive().max(1_000_000_000),
  jobDate: z.string().min(8).max(32),
  requestTimestamp: z.number().finite().nonnegative(),
  jobStartTimestamp: z.number().finite().nonnegative(),
  reason: z.string().min(1).max(500),
  weather: z
    .object({
      isSevere: z.boolean(),
      rainMm: z.number().min(0).optional(),
      conditionText: z.string().max(200).optional(),
    })
    .optional(),
  providerCurrentStrikes: z.number().int().min(0).max(100).optional(),
});

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  const parsed = await parseJsonBody(req, CancellationSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const outcome = evaluateCancellation(parsed.data as CancellationRequest);
    return NextResponse.json(outcome);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
