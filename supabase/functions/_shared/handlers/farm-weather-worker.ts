// Batch 05: fetches daily forecasts for the places of farms that have a fertiliser, spray or weeding job in
// the next 3 days, and stores them for the weather_window_conflict monitor. SQL never calls a provider
// (blueprint execution model); this worker does, then writes through record_weather_worker_forecast.
//
// Provider: the one staff made active in Admin > Integrations, when it forecasts by coordinates
// (Open-Meteo, WeatherAPI). NiMet forecasts by town name, so farms fall back to Open-Meteo, which needs no key.
import { fail, json } from '../http.ts';
import { openMeteo, weatherProvider, type Place, type WeatherProvider } from '../providers/weather.ts';
import type { FetchFn } from '../providers/types.ts';
import { getRuntime, logEvent, rpc, runtimeProblem, type ServerEnv } from '../server.ts';

export type FarmWeatherWorkerDeps = { env: ServerEnv; fetchFn?: FetchFn; maxPlaces?: number };

type PlaceKey = { lat: number; lon: number };

function validPlace(p: unknown): p is PlaceKey {
  const r = p as PlaceKey;
  return !!r && Number.isFinite(r.lat) && Number.isFinite(r.lon) && r.lat >= 3 && r.lat <= 15 && r.lon >= 2 && r.lon <= 16;
}

export async function handleFarmWeatherWorker(req: Request, deps: FarmWeatherWorkerDeps): Promise<Response> {
  const fetchFn = deps.fetchFn ?? fetch;
  const env = deps.env;
  if (req.method !== 'POST') return fail('method_not_allowed', 405);

  const secret = req.headers.get('x-worker-secret') ?? '';
  let authorized = false;
  try {
    authorized = secret.length >= 32 && (await rpc<boolean>(env, 'notify_worker_authorized', { p_secret: secret }, fetchFn)) === true;
  } catch {
    return fail('unavailable', 503);
  }
  if (!authorized) return fail('unauthorized', 401);

  // Pick the provider: the active one if it forecasts by coordinates, otherwise Open-Meteo.
  let providerName = 'open_meteo';
  let mode: 'live' | 'test' = 'live';
  let adapter: WeatherProvider = openMeteo(fetchFn);
  try {
    const rt = await getRuntime(env, 'weather', undefined, fetchFn);
    if ((rt.provider === 'open_meteo' || rt.provider === 'weatherapi') && !runtimeProblem(rt, env.appEnv)) {
      const a = weatherProvider(rt, fetchFn);
      if (a.ok) {
        adapter = a.value;
        providerName = rt.provider;
        mode = rt.mode;
      }
    }
  } catch {
    /* keep Open-Meteo */
  }

  let places: unknown;
  try {
    places = await rpc<unknown>(env, 'weather_worker_places', {}, fetchFn);
  } catch {
    return fail('unavailable', 503);
  }
  const list = (Array.isArray(places) ? places : []).filter(validPlace).slice(0, deps.maxPlaces ?? 200);

  let recorded = 0;
  let failed = 0;
  // One place at a time: a small pilot volume, and it keeps provider rate limits out of the picture.
  for (const p of list) {
    const place: Place = { state: '', town: 'farm', lat: p.lat, lon: p.lon };
    const started = Date.now();
    const r = await adapter.forecast(place);
    await logEvent(env, {
      kind: 'weather', provider: providerName, mode, operation: 'farm_forecast', success: r.ok,
      http_status: r.httpStatus, error_code: r.ok ? undefined : r.error, duration_ms: Date.now() - started,
    }, fetchFn);
    if (!r.ok) {
      failed++;
      continue;
    }
    const days = r.value.days.map((d) => ({ date: d.date, rain_mm: d.rainMm, wind_kmh: d.windKmh, max_c: d.maxC }));
    try {
      await rpc<number>(env, 'record_weather_worker_forecast', { p_lat: p.lat, p_lon: p.lon, p_provider: providerName, p_days: days }, fetchFn);
      recorded++;
    } catch {
      failed++;
    }
  }

  return json({ places: list.length, recorded, failed, provider: providerName });
}
