// Weather for the pilot states, from the provider chosen in Admin > Integrations.
// Staff with analytics.read only (admin dashboard). Results are cached for 30 minutes in weather_cache,
// so the provider is called at most once per place per half hour whoever opens the dashboard.
import { fail, json, preflight } from '../http.ts';
import { PILOT_PLACES, weatherProvider, type Forecast } from '../providers/weather.ts';
import type { FetchFn } from '../providers/types.ts';
import { currentUserId, getRuntime, logEvent, rpcAsUser, runtimeProblem, type ServerEnv } from '../server.ts';

export type WeatherDeps = { env: ServerEnv; fetchFn?: FetchFn; now?: () => number };

export const CACHE_MS = 30 * 60 * 1000;

type Cached = { payload: { forecasts: Forecast[] }; fetched_at: string };

function serviceHeaders(env: ServerEnv): Record<string, string> {
  return { apikey: env.serviceKey, Authorization: `Bearer ${env.serviceKey}`, 'Content-Type': 'application/json', Accept: 'application/json' };
}

async function readCache(env: ServerEnv, provider: string, fetchFn: FetchFn): Promise<Cached | null> {
  try {
    const res = await fetchFn(
      `${env.url}/rest/v1/weather_cache?provider=eq.${encodeURIComponent(provider)}&select=payload,fetched_at`,
      { headers: serviceHeaders(env) },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Cached[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function writeCache(env: ServerEnv, provider: string, forecasts: Forecast[], at: string, fetchFn: FetchFn) {
  try {
    await fetchFn(`${env.url}/rest/v1/weather_cache`, {
      method: 'POST',
      headers: { ...serviceHeaders(env), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ provider, payload: { forecasts }, fetched_at: at }),
    });
  } catch {
    /* a failed cache write only means the next visit fetches again */
  }
}

export async function handleWeather(req: Request, deps: WeatherDeps): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST' && req.method !== 'GET') return fail('method_not_allowed', 405);
  const { env } = deps;
  const fetchFn = deps.fetchFn ?? fetch;
  const now = deps.now ?? Date.now;
  const auth = req.headers.get('Authorization');

  const userId = await currentUserId(env, auth, fetchFn);
  if (!userId || !auth) return fail('not_signed_in', 401);
  const allowed = await rpcAsUser<boolean>(env, auth, 'has_permission', { p_permission: 'analytics.read' }, fetchFn)
    .catch(() => false);
  if (allowed !== true) return fail('forbidden', 403);

  let rt;
  try {
    rt = await getRuntime(env, 'weather', undefined, fetchFn);
  } catch {
    return json({ ok: false, error: 'not_configured' });
  }
  const problem = runtimeProblem(rt, env.appEnv);
  if (problem) return json({ ok: false, error: problem, provider: rt.provider, missing: rt.missing });

  const cached = await readCache(env, rt.provider, fetchFn);
  if (cached && now() - Date.parse(cached.fetched_at) < CACHE_MS) {
    return json({ ok: true, provider: rt.provider, fetchedAt: cached.fetched_at, stale: false, forecasts: cached.payload.forecasts });
  }

  const adapter = weatherProvider(rt, fetchFn);
  if (!adapter.ok) return json({ ok: false, error: adapter.error, provider: rt.provider });

  const started = now();
  const results = await Promise.all(PILOT_PLACES.map((p) => adapter.value.forecast(p)));
  const forecasts = results.flatMap((r) => (r.ok ? [r.value] : []));
  const firstError = results.find((r) => !r.ok);
  await logEvent(env, {
    kind: 'weather', provider: rt.provider, mode: rt.mode, operation: 'forecast', success: forecasts.length === PILOT_PLACES.length,
    http_status: firstError?.httpStatus, error_code: firstError && !firstError.ok ? firstError.error : undefined,
    duration_ms: now() - started,
  }, fetchFn);

  if (forecasts.length === 0) {
    // Provider down or key refused: show the last good forecast if there is one.
    if (cached) {
      return json({ ok: true, provider: rt.provider, fetchedAt: cached.fetched_at, stale: true, forecasts: cached.payload.forecasts });
    }
    const e = firstError && !firstError.ok ? firstError : null;
    return json({ ok: false, error: e?.error ?? 'unavailable', detail: e?.detail, provider: rt.provider });
  }

  const at = new Date(now()).toISOString();
  await writeCache(env, rt.provider, forecasts, at, fetchFn);
  return json({ ok: true, provider: rt.provider, fetchedAt: at, stale: false, forecasts });
}
