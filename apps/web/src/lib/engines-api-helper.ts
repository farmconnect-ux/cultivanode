import { NextResponse } from 'next/server';
import { authenticateStatelessRequest, type EngineAuthOptions } from '@cultivanode/shared';
import type { z } from 'zod';

export function getEngineSecret(): string | null {
  const secret = process.env.ENGINE_JWT_SECRET?.trim();
  return secret ? secret : null;
}

export async function authorizeRequest(req: Request, options: EngineAuthOptions = {}) {
  const secret = getEngineSecret();
  if (!secret) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: 'Engine authentication is not configured.' },
        { status: 503 },
      ),
    };
  }

  const authHeader = req.headers.get('Authorization');
  const auth = await authenticateStatelessRequest(authHeader, secret, options);
  if (!auth.authenticated) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: auth.error ?? 'Unauthorized' },
        { status: auth.statusCode ?? 401 },
      ),
    };
  }

  return { authorized: true as const, user: auth.user! };
}

export async function parseJsonBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed.' },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
