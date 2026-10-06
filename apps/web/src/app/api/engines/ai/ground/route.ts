import { NextResponse } from 'next/server';
import { buildGroundedPrompt, type FarmerContext, type AppLanguage } from '@cultivanode/shared';
import { authorizeRequest } from '@/lib/engines-api-helper';

interface AIGroundRequestBody {
  query: string;
  context: FarmerContext;
  language?: AppLanguage | 'pcm';
}

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await req.json()) as AIGroundRequestBody;
    const prompt = buildGroundedPrompt(body.query, body.context, body.language ?? 'en');
    return NextResponse.json(prompt);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
