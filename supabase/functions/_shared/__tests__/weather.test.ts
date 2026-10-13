import { describe, expect, it } from 'vitest';
import { CACHE_MS, handleWeather } from '../handlers/weather.ts';
import { parseNiMet, parseOpenMeteo, parseWeatherApi, PILOT_PLACES, weatherapiKind, wmoKind, nimetKind } from '../providers/weather.ts';
import type { Runtime } from '../providers/types.ts';
import type { ServerEnv } from '../server.ts';

const env: ServerEnv = { url: 'https://proj.supabase.co', serviceKey: 'service', anonKey: 'anon', appEnv: 'production' };
const NOW = Date.parse('2026-09-27T10:00:00Z');

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const weatherApiBody = (rain = 3) => ({
  current: { temp_c: 28.2, humidity: 79, wind_kph: 11.2, condition: { code: 1003 } },
  forecast: {
    forecastday: [
      { date: '2026-09-27', day: { maxtemp_c: 30.1, mintemp_c: 22.4, totalprecip_mm: rain, daily_chance_of_rain: 86, maxwind_kph: 14, condition: { code: 1189 } } },
      { date: '2026-09-28', day: { maxtemp_c: 31, mintemp_c: 23, totalprecip_mm: 0, daily_chance_of_rain: 10, maxwind_kph: 12, condition: { code: 1000 } } },
      { date: 'bad', day: { maxtemp_c: 1, mintemp_c: 1 } },
    ],
  },
});

const runtime = (over: Partial<Runtime> = {}): Runtime => ({
  provider: 'weatherapi', kind: 'weather', mode: 'live', implemented: true, test_only: false, missing: [],
  config: { days: '7' }, secrets: { api_key: 'WA-key' }, ...over,
});

type Opts = { allowed?: boolean; rt?: Runtime; cache?: { payload: unknown; fetched_at: string } | null; providerStatus?: number };

function backend(o: Opts = {}) {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  const fn = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined });
    if (url.endsWith('/auth/v1/user')) return jsonRes({ id: 'staff-1' });
    if (url.endsWith('/rpc/has_permission')) return jsonRes(o.allowed ?? true);
    if (url.endsWith('/rpc/integration_runtime')) return jsonRes(o.rt ?? runtime());
    if (url.includes('/rest/v1/weather_cache?')) return jsonRes(o.cache ? [o.cache] : []);
    if (url.endsWith('/rest/v1/weather_cache')) return new Response(null, { status: 201 });
    if (url.endsWith('/rest/v1/integration_events')) return new Response(null, { status: 201 });
    if (url.startsWith('https://api.weatherapi.com/')) {
      return o.providerStatus ? jsonRes({ error: { message: 'API key is invalid.' } }, o.providerStatus) : jsonRes(weatherApiBody());
    }
    return jsonRes({ unexpected: url }, 500);
  }) as typeof fetch;
  return { fn, calls };
}

const req = () => new Request('https://proj.supabase.co/functions/v1/weather', {
  method: 'POST', headers: { Authorization: 'Bearer staff-token' },
});

describe('weather providers', () => {
  it('maps WeatherAPI and WMO codes to the same kinds', () => {
    expect([1000, 1003, 1009, 1135, 1153, 1189, 1243, 1276, 9999].map(weatherapiKind)).toEqual([
      'clear', 'partly', 'cloudy', 'fog', 'drizzle', 'rain', 'rain', 'storm', 'unknown',
    ]);
    expect([0, 2, 3, 45, 53, 63, 95].map(wmoKind)).toEqual(['clear', 'partly', 'cloudy', 'fog', 'drizzle', 'rain', 'storm']);
    expect(['Thunderstorm', 'Heavy Rain', 'Dust Haze', 'Partly Cloudy', 'Sunny'].map(nimetKind)).toEqual([
      'storm', 'rain', 'fog', 'partly', 'clear',
    ]);
  });

  it('parses a WeatherAPI forecast and drops broken days', () => {
    const f = parseWeatherApi(weatherApiBody(31.24), PILOT_PLACES[0]!);
    expect(f.now).toEqual({ tempC: 28.2, humidity: 79, kind: 'partly', windKmh: 11.2 });
    expect(f.days).toHaveLength(2);
    expect(f.days[0]).toEqual({ date: '2026-09-27', kind: 'rain', maxC: 30.1, minC: 22.4, rainMm: 31.2, rainChance: 86, windKmh: 14 });
    expect(f.alerts).toEqual([{ kind: 'heavy_rain', date: '2026-09-27', value: 31.2 }]);
  });

  it('parses a NiMet forecast into the same shape', () => {
    const f = parseNiMet({
      current: { temp_c: 29.5, humidity: 76, wind_kph: 12, condition: 'Partly Cloudy' },
      forecast: [
        { date: '2026-09-27', max_temp: 32, min_temp: 23, rain_mm: 5.5, daily_chance_of_rain: 60, wind_speed_kmh: 14, condition: 'Moderate Rain' },
        { date: '2026-09-28', max_temp: 33, min_temp: 24, rain_mm: 0, daily_chance_of_rain: 15, wind_speed_kmh: 11, condition: 'Sunny' },
      ],
    }, PILOT_PLACES[0]!);
    expect(f.now?.tempC).toBe(29.5);
    expect(f.now?.kind).toBe('partly');
    expect(f.days).toHaveLength(2);
    expect(f.days[0]).toMatchObject({ date: '2026-09-27', kind: 'rain', maxC: 32, minC: 23, rainMm: 5.5 });
  });

  it('parses an Open-Meteo forecast into the same shape', () => {
    const f = parseOpenMeteo({
      current: { temperature_2m: 27, relative_humidity_2m: 80, weather_code: 3, wind_speed_10m: 9 },
      daily: { time: ['2026-09-27'], weather_code: [61], temperature_2m_max: [29], temperature_2m_min: [22],
        precipitation_sum: [4], precipitation_probability_max: [70], wind_speed_10m_max: [15] },
    }, PILOT_PLACES[1]!);
    expect(f.now?.kind).toBe('cloudy');
    expect(f.days[0]).toMatchObject({ kind: 'rain', rainMm: 4, rainChance: 70 });
  });
});

describe('weather function', () => {
  it('is for staff with analytics.read only', async () => {
    const b = backend({ allowed: false });
    const res = await handleWeather(req(), { env, fetchFn: b.fn, now: () => NOW });
    expect(res.status).toBe(403);
  });

  it('asks for the key when it is missing, without calling the provider', async () => {
    const b = backend({ rt: runtime({ missing: ['key:api_key'], secrets: {} }) });
    const res = await handleWeather(req(), { env, fetchFn: b.fn, now: () => NOW });
    expect(await res.json()).toEqual({ ok: false, error: 'not_configured', provider: 'weatherapi', missing: ['key:api_key'] });
    expect(b.calls.some((c) => c.url.startsWith('https://api.weatherapi.com/'))).toBe(false);
  });

  it('refuses the non-commercial provider in production', async () => {
    const b = backend({ rt: runtime({ provider: 'open_meteo', test_only: true, secrets: {} }) });
    const res = await handleWeather(req(), { env, fetchFn: b.fn, now: () => NOW });
    expect((await res.json()).error).toBe('not_available');
  });

  it('serves a fresh cache without calling the provider', async () => {
    const cache = { payload: { forecasts: [{ place: PILOT_PLACES[0] }] }, fetched_at: new Date(NOW - CACHE_MS + 60_000).toISOString() };
    const b = backend({ cache });
    const body = await (await handleWeather(req(), { env, fetchFn: b.fn, now: () => NOW })).json();
    expect(body).toMatchObject({ ok: true, stale: false, fetchedAt: cache.fetched_at });
    expect(b.calls.some((c) => c.url.startsWith('https://api.weatherapi.com/'))).toBe(false);
  });

  it('fetches every pilot state, caches the result and never logs the key', async () => {
    const b = backend({ cache: { payload: { forecasts: [] }, fetched_at: new Date(NOW - CACHE_MS - 1).toISOString() } });
    const body = await (await handleWeather(req(), { env, fetchFn: b.fn, now: () => NOW })).json();
    expect(body.ok).toBe(true);
    expect(body.forecasts).toHaveLength(6);
    const provider = b.calls.filter((c) => c.url.startsWith('https://api.weatherapi.com/'));
    expect(provider).toHaveLength(6);
    expect(new URL(provider[0]!.url).searchParams.get('q')).toBe('7.3775,3.947');
    const write = b.calls.find((c) => c.method === 'POST' && c.url.endsWith('/rest/v1/weather_cache'));
    expect(write?.body).toMatchObject({ provider: 'weatherapi', fetched_at: new Date(NOW).toISOString() });
    const event = b.calls.find((c) => c.url.endsWith('/integration_events'));
    expect(JSON.stringify(event?.body)).not.toContain('WA-key');
    expect(event?.body).toMatchObject({ kind: 'weather', operation: 'forecast', success: true });
  });

  it('falls back to the last forecast when the provider refuses the key', async () => {
    const old = { payload: { forecasts: [{ place: PILOT_PLACES[0] }] }, fetched_at: new Date(NOW - 3 * CACHE_MS).toISOString() };
    const b = backend({ cache: old, providerStatus: 401 });
    const body = await (await handleWeather(req(), { env, fetchFn: b.fn, now: () => NOW })).json();
    expect(body).toMatchObject({ ok: true, stale: true });
    const none = backend({ providerStatus: 401 });
    const body2 = await (await handleWeather(req(), { env, fetchFn: none.fn, now: () => NOW })).json();
    expect(body2).toMatchObject({ ok: false, error: 'rejected', detail: 'API key is invalid.' });
  });
});
