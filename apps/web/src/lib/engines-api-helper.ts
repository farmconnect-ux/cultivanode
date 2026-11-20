import "server-only";
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@cultivanode/shared';
import { authenticateStatelessRequest, type EngineAuthOptions } from '@cultivanode/shared';
import type { z } from 'zod';
import { supabaseEnv } from '@/lib/supabase/env';

export function getEngineSecret(): string | null {
  const secret = process.env.ENGINE_JWT_SECRET?.trim();
  return secret ? secret : null;
}

export async function authorizeRequest(req: Request, options: EngineAuthOptions = {}) {
  const secret = getEngineSecret();
  if (!secret) return { authorized: false as const, response: NextResponse.json({ error: 'Engine authentication is not configured.' }, { status: 503 }) };
  const auth = await authenticateStatelessRequest(req.headers.get('Authorization'), secret, options);
  if (!auth.authenticated) return { authorized: false as const, response: NextResponse.json({ error: auth.error ?? 'Unauthorized' }, { status: auth.statusCode ?? 401 }) };
  return { authorized: true as const, user: auth.user! };
}

/** Verify a Supabase user JWT, then check farm visibility through that user's RLS-scoped client. */
export async function authorizeFarmRequest(req: Request, farmId: string) {
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { authorized: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  let client: ReturnType<typeof createSupabaseClient<Database>>;
  try {
    const { url, key } = supabaseEnv();
    client = createSupabaseClient<Database>(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  } catch {
    return { authorized: false as const, response: NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 }) };
  }

  let user: Awaited<ReturnType<typeof client.auth.getUser>>['data']['user'];
  try {
    const result = await client.auth.getUser(token);
    if (result.error || !result.data.user) {
      return { authorized: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    user = result.data.user;
  } catch {
    return { authorized: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    const { data: farm, error } = await client.from('farms').select('id').eq('id', farmId).maybeSingle();
    if (error) return { authorized: false as const, response: NextResponse.json({ error: 'Unable to verify farm access.' }, { status: 500 }) };
    if (!farm) return { authorized: false as const, response: NextResponse.json({ error: 'Farm not found or access denied.' }, { status: 404 }) };
  } catch {
    return { authorized: false as const, response: NextResponse.json({ error: 'Unable to verify farm access.' }, { status: 500 }) };
  }

  return { authorized: true as const, user, client };
}

export async function parseJsonBody<T>(req: Request, schema: z.ZodType<T>): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try { raw = await req.json(); } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 }) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return {
    ok: false,
    response: NextResponse.json({ error: parsed.error.issues[0]?.message || 'Validation failed.' }, { status: 400 }),
  };
  return { ok: true, data: parsed.data };
}
