import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkChemicalSafetyGuardrails } from '@cultivanode/shared';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';

const GuardrailSchema = z.object({
  responseText: z.string().min(1).max(20_000),
});

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  const parsed = await parseJsonBody(req, GuardrailSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = checkChemicalSafetyGuardrails(parsed.data.responseText);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
