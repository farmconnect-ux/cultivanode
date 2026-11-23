import { describe, expect, it } from 'vitest';
import { handleFarmWeatherWorker } from '../handlers/farm-weather-worker.ts';
import type { Runtime } from '../providers/types.ts';
import type { ServerEnv } from '../server.ts';

const env: ServerEnv = { url: 'https://proj.supabase.co', serviceKey: 'service', anonKey: 'anon', appEnv: 'production' };
const SECRET = 'w'.repeat(40);

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const openMeteoBody = {
  current: { temperature_2m: 27, relative_humidity_2m: 80, weather_code: 3, wind_speed_10m: 9 },
  daily: {
    time: ['2026-11-24', '2026-11-25'], weather_code: [63, 0], temperature_2m_max: [29, 31], temperature_2m_min: [22, 23],
    precipitation_sum: [32.5, 0], precipitation_probability_max: [90, 5], wind_speed_10m_max: [18, 44],
  },
};

type Opts = { authorized?: boolean; rt?: Partial<Runtime> | 'error'; places?: unknown; providerStatus?: number };

function backend(o: Opts = {}) {
  const calls: { url: string; body?: unknown }[] = [];
  const fn = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, body });
    if (url.endsWith('/rpc/notify_worker_authorized')) return jsonRes(o.authorized ?? (body as { p_secret: string }).p_secret === SECRET);
    if (url.endsWith('/rpc/integration_runtime')) {
      if (o.rt === 'error') return jsonRes({ message: 'no provider' }, 400);
      return jsonRes({ provider: 'nimet', kind: 'weather', mode: 'live', implemented: true, test_only: false, missing: [],
        config: {}, secrets: { api_key: 'k' }, ...o.rt });
    }
    if (url.endsWith('/rpc/weather_worker_places')) return jsonRes(o.places ?? [{ lat: 7.4, lon: 3.9 }]);
    if (url.endsWith('/rpc/record_weather_worker_forecast')) return jsonRes(2);
    if (url.endsWith('/rest/v1/integration_events')) return new Response(null, { status: 201 });
    if (url.startsWith('https://api.open-meteo.com/')) {
      return o.providerStatus ? jsonRes({ error: true }, o.providerStatus) : jsonRes(openMeteoBody);
    }
    return jsonRes({ unexpected: url }, 500);
  }) as typeof fetch;
  return { fn, calls };
}

const req = (secret: string | null = SECRET, method = 'POST') => new Request('https://proj.supabase.co/functions/v1/farm-weather-worker', {
  method, headers: secret ? { 'x-worker-secret': secret } : {},
});

describe('farm weather worker', () => {
  it('refuses callers without the worker secret', async () => {
    const b = backend();
    expect((await handleFarmWeatherWorker(req(null), { env, fetchFn: b.fn })).status).toBe(401);
    expect((await handleFarmWeatherWorker(req('x'.repeat(40)), { env, fetchFn: b.fn })).status).toBe(401);
    expect((await handleFarmWeatherWorker(req(SECRET, 'GET'), { env, fetchFn: b.fn })).status).toBe(405);
    expect(b.calls.some((c) => c.url.includes('weather_worker_places'))).toBe(false);
  });

  it('falls back to Open-Meteo when the active provider forecasts by town, and records each place', async () => {
    const b = backend({ places: [{ lat: 7.4, lon: 3.9 }, { lat: 8.1, lon: 4.2 }] });
    const res = await handleFarmWeatherWorker(req(), { env, fetchFn: b.fn });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ places: 2, recorded: 2, failed: 0, provider: 'open_meteo' });
    const writes = b.calls.filter((c) => c.url.endsWith('/rpc/record_weather_worker_forecast'));
    expect(writes).toHaveLength(2);
    expect(writes[0]!.body).toEqual({
      p_lat: 7.4, p_lon: 3.9, p_provider: 'open_meteo',
      p_days: [
        { date: '2026-11-24', rain_mm: 32.5, wind_kmh: 18, max_c: 29 },
        { date: '2026-11-25', rain_mm: 0, wind_kmh: 44, max_c: 31 },
      ],
    });
    const logs = b.calls.filter((c) => c.url.endsWith('/rest/v1/integration_events'));
    expect(logs).toHaveLength(2);
    expect(logs[0]!.body).toMatchObject({ kind: 'weather', operation: 'farm_forecast', success: true });
  });

  it('uses Open-Meteo when no weather provider is configured', async () => {
    const b = backend({ rt: 'error' });
    const res = await handleFarmWeatherWorker(req(), { env, fetchFn: b.fn });
    expect(await res.json()).toMatchObject({ recorded: 1, provider: 'open_meteo' });
  });

  it('drops places outside Nigeria and caps the list', async () => {
    const b = backend({ places: [{ lat: 51.5, lon: -0.1 }, { lat: 'x', lon: 3 }, { lat: 7.4, lon: 3.9 }, { lat: 9, lon: 7 }] });
    const res = await handleFarmWeatherWorker(req(), { env, fetchFn: b.fn, maxPlaces: 1 });
    expect(await res.json()).toEqual({ places: 1, recorded: 1, failed: 0, provider: 'open_meteo' });
  });

  it('counts a provider failure without writing a forecast', async () => {
    const b = backend({ providerStatus: 503 });
    const res = await handleFarmWeatherWorker(req(), { env, fetchFn: b.fn });
    expect(await res.json()).toEqual({ places: 1, recorded: 0, failed: 1, provider: 'open_meteo' });
    expect(b.calls.some((c) => c.url.endsWith('/rpc/record_weather_worker_forecast'))).toBe(false);
    const log = b.calls.find((c) => c.url.endsWith('/rest/v1/integration_events'));
    expect(log?.body).toMatchObject({ success: false });
  });
});
