import { NextResponse } from 'next/server';
import { z } from 'zod';
import { arbitrateDispute, type DisputeArbitrationInput } from '@cultivanode/shared';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';

const LatLngSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});

const DisputeArbitrationSchema = z.object({
  disputeId: z.string().min(1).max(100),
  bookingId: z.string().min(1).max(100),
  category: z.enum(['job_not_done', 'poor_quality', 'wrong_area', 'damage', 'no_show']),
  agreedPriceKobo: z.number().int().positive().max(1_000_000_000),
  farmLocation: LatLngSchema,
  farmBoundary: z.array(LatLngSchema).max(500).optional(),
  evidences: z
    .array(
      z.object({
        photoUrl: z.string().min(1).max(1000),
        uploaderId: z.string().min(1).max(100),
        role: z.enum(['farmer', 'provider']),
        capturedAt: z.number().finite().nonnegative(),
        gps: LatLngSchema.optional(),
        note: z.string().max(1000).optional(),
      }),
    )
    .max(50),
  disputeOpenedAt: z.number().finite().nonnegative(),
  jobCompletedAt: z.number().finite().nonnegative().optional(),
});

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  const parsed = await parseJsonBody(req, DisputeArbitrationSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const outcome = arbitrateDispute(parsed.data as DisputeArbitrationInput);
    return NextResponse.json(outcome);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
