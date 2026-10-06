import { NextResponse } from 'next/server';
import { checkChemicalSafetyGuardrails } from '@cultivanode/shared';
import { authorizeRequest } from '@/lib/engines-api-helper';

interface AIGuardrailRequestBody {
  responseText: string;
}

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await req.json()) as AIGuardrailRequestBody;
    const result = checkChemicalSafetyGuardrails(body.responseText);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
