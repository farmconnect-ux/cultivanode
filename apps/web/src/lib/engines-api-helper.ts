import "server-only";
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database } from '@cultivanode/shared';
import { authenticateStatelessRequest, type EngineAuthOptions } from '@cultivanode/shared';
import type { z } from 'zod';
import { supabaseEnv } from '@/lib/supabase/env';

/**
 * Module-private brand symbol proving that a VerifiedAiFarmCallerContext was produced
 * by the server-side authentication, active-account, farm-RLS, and consent gate —
 * never fabricated from untrusted request payloads.
 */
const VERIFIED_AI_CALLER_BRAND = Symbol('cultivanode.verified_ai_farm_caller');

export interface VerifiedFarmCallerContext {
  readonly user: User;
  readonly farmId: string;
  readonly client: SupabaseClient<Database>;
  readonly verifiedAt: string;
}

export interface VerifiedAiFarmCallerContext extends VerifiedFarmCallerContext {
  readonly [VERIFIED_AI_CALLER_BRAND]: true;
  readonly accountActive: true;
  readonly aiConsentGranted: true;
}

export function isVerifiedAiFarmCallerContext(value: unknown): value is VerifiedAiFarmCallerContext {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<symbol, unknown>)[VERIFIED_AI_CALLER_BRAND] === true &&
    (value as VerifiedAiFarmCallerContext).accountActive === true &&
    (value as VerifiedAiFarmCallerContext).aiConsentGranted === true &&
    typeof (value as VerifiedAiFarmCallerContext).user?.id === 'string' &&
    typeof (value as VerifiedAiFarmCallerContext).farmId === 'string'
  );
}

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

export interface AuthorizeFarmOptions {
  /** Verify the caller's profile is active (not suspended, deleting, or deleted) under caller JWT RLS. */
  requireActiveAccount?: boolean;
  /** Verify current `ai_intelligence` consent is granted in `public.current_consents` under caller JWT RLS. */
  requireAiConsent?: boolean;
}

/**
 * Verify a Supabase user JWT, optionally enforce active-account and `ai_intelligence` consent,
 * and check farm visibility through that user's RLS-scoped Supabase client.
 * Never uses service-role credentials, `getSession()`, or `user_metadata`.
 */
export async function authorizeFarmRequest(
  req: Request,
  farmId: string,
  options: AuthorizeFarmOptions = {},
) {
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return { authorized: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  let client: SupabaseClient<Database>;
  try {
    const { url, key } = supabaseEnv();
    client = createSupabaseClient<Database>(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  } catch {
    return { authorized: false as const, response: NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 }) };
  }

  let user: User;
  try {
    const result = await client.auth.getUser(token);
    if (result.error || !result.data.user) {
      return { authorized: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    user = result.data.user;
  } catch {
    return { authorized: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (options.requireActiveAccount) {
    const activeCheck = await verifyActiveAccount(client, user.id);
    if (!activeCheck.ok) return { authorized: false as const, response: activeCheck.response };
  }

  try {
    const { data: farm, error } = await client.from('farms').select('id').eq('id', farmId).maybeSingle();
    if (error) return { authorized: false as const, response: NextResponse.json({ error: 'Unable to verify farm access.' }, { status: 500 }) };
    if (!farm) return { authorized: false as const, response: NextResponse.json({ error: 'Farm not found or access denied.' }, { status: 404 }) };
  } catch {
    return { authorized: false as const, response: NextResponse.json({ error: 'Unable to verify farm access.' }, { status: 500 }) };
  }

  if (options.requireAiConsent) {
    const consentCheck = await verifyAiIntelligenceConsent(client, user.id);
    if (!consentCheck.ok) return { authorized: false as const, response: consentCheck.response };
  }

  const verifiedAt = new Date().toISOString();
  return {
    authorized: true as const,
    user,
    farmId,
    client,
    verifiedAt,
  };
}

/**
 * Full Batch 03.1C gate for farm-scoped AI intelligence routes:
 * Bearer JWT -> active account -> farm RLS visibility -> active `ai_intelligence` consent.
 * Returns a branded `VerifiedAiFarmCallerContext` required by `recordAiAuditEvent`.
 */
export async function authorizeAiFarmRequest(
  req: Request,
  farmId: string,
): Promise<
  | { authorized: true; caller: VerifiedAiFarmCallerContext }
  | { authorized: false; response: NextResponse }
> {
  const result = await authorizeFarmRequest(req, farmId, {
    requireActiveAccount: true,
    requireAiConsent: true,
  });
  if (!result.authorized) return result;

  const caller: VerifiedAiFarmCallerContext = {
    [VERIFIED_AI_CALLER_BRAND]: true,
    user: result.user,
    farmId: result.farmId,
    client: result.client,
    verifiedAt: result.verifiedAt,
    accountActive: true,
    aiConsentGranted: true,
  };
  return { authorized: true, caller };
}

/**
 * Verifies the caller's profile is active (exists, not suspended, not deleting, not deleted)
 * strictly under the caller's RLS-scoped Supabase client.
 */
export async function verifyActiveAccount(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  try {
    const { data: profile, error } = await client
      .from('profiles')
      .select('id, suspended_at, deleted_at, deletion_status')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      return { ok: false, response: NextResponse.json({ error: 'Unable to verify account status.' }, { status: 503 }) };
    }
    if (!profile || profile.suspended_at !== null || profile.deleted_at !== null || profile.deletion_status !== null) {
      return { ok: false, response: NextResponse.json({ error: 'Active account required.' }, { status: 403 }) };
    }
    return { ok: true };
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Unable to verify account status.' }, { status: 503 }) };
  }
}

/**
 * Verifies current `ai_intelligence` consent via `public.current_consents` (security_invoker view
 * over append-only `public.consents`). Missing, withdrawn (`granted = false`), ambiguous, or
 * failed consent lookups fail closed.
 */
export async function verifyAiIntelligenceConsent(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  try {
    const { data, error } = await client
      .from('current_consents')
      .select('granted')
      .eq('profile_id', userId)
      .eq('consent_type', 'ai_intelligence')
      .maybeSingle();
    if (error) {
      return { ok: false, response: NextResponse.json({ error: 'Unable to verify AI consent.' }, { status: 503 }) };
    }
    if (!data || data.granted !== true) {
      return { ok: false, response: NextResponse.json({ error: 'AI intelligence consent is required.' }, { status: 403 }) };
    }
    return { ok: true };
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Unable to verify AI consent.' }, { status: 503 }) };
  }
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
