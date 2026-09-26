// Talks to the project's own database API with the service role (server code only), without SDKs.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to every Edge Function by Supabase.
import type { FetchFn, IntegrationKind, IntegrationMode, Runtime } from './providers/types.ts';

export type ServerEnv = {
  url: string;
  serviceKey: string;
  anonKey?: string;
  appEnv: string; // 'production' refuses test-only providers
};

export class ServerError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function headers(env: ServerEnv, bearer = env.serviceKey): Record<string, string> {
  return {
    apikey: env.serviceKey,
    Authorization: `Bearer ${bearer}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export async function rpc<T>(env: ServerEnv, fn: string, args: Record<string, unknown>, fetchFn: FetchFn = fetch): Promise<T> {
  const res = await fetchFn(`${env.url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new ServerError(`rpc ${fn} failed`, res.status);
  return (await res.json()) as T;
}

export async function select<T>(env: ServerEnv, pathAndQuery: string, fetchFn: FetchFn = fetch): Promise<T> {
  const res = await fetchFn(`${env.url}/rest/v1/${pathAndQuery}`, { headers: headers(env) });
  if (!res.ok) throw new ServerError(`select ${pathAndQuery.split('?')[0]} failed`, res.status);
  return (await res.json()) as T;
}

export async function getRuntime(env: ServerEnv, kind: IntegrationKind, provider?: string, fetchFn: FetchFn = fetch): Promise<Runtime> {
  return rpc<Runtime>(env, 'integration_runtime', provider ? { p_kind: kind, p_provider: provider } : { p_kind: kind }, fetchFn);
}

/** Why a runtime cannot be used right now, or null when it can. */
export function runtimeProblem(rt: Runtime, appEnv: string): 'not_available' | 'not_configured' | null {
  if (!rt.implemented) return 'not_available';
  if (rt.test_only && appEnv === 'production') return 'not_available';
  if (rt.missing.length > 0) return 'not_configured';
  return null;
}

/** Health log for the admin page. Never pass personal data here. Failures to log are ignored. */
export async function logEvent(
  env: ServerEnv,
  e: {
    kind: IntegrationKind;
    provider: string;
    mode: IntegrationMode;
    operation: string;
    success: boolean;
    http_status?: number;
    error_code?: string;
    duration_ms?: number;
  },
  fetchFn: FetchFn = fetch,
): Promise<void> {
  try {
    await fetchFn(`${env.url}/rest/v1/integration_events`, {
      method: 'POST',
      headers: { ...headers(env), Prefer: 'return=minimal' },
      body: JSON.stringify(e),
    });
  } catch {
    /* logging must never break the main flow */
  }
}

/** The signed-in user behind a request's Authorization header, checked by Supabase Auth. */
export async function currentUserId(env: ServerEnv, authorization: string | null, fetchFn: FetchFn = fetch): Promise<string | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const res = await fetchFn(`${env.url}/auth/v1/user`, {
    headers: { apikey: env.anonKey ?? env.serviceKey, Authorization: authorization },
  });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string };
  return typeof user.id === 'string' ? user.id : null;
}

/** Calls a database function as the signed-in user (their permissions apply). */
export async function rpcAsUser<T>(env: ServerEnv, authorization: string, fn: string, args: Record<string, unknown>, fetchFn: FetchFn = fetch): Promise<T> {
  const res = await fetchFn(`${env.url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: env.anonKey ?? env.serviceKey,
      Authorization: authorization,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new ServerError(`rpc ${fn} failed`, res.status);
  return (await res.json()) as T;
}
