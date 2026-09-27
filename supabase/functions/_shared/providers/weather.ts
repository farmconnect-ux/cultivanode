// Weather adapters. Both return the same shape, so the admin dashboard (and later the farmer app) never
// names a provider. Keep PILOT_PLACES, THRESHOLDS and weatherAlerts in step with
// packages/shared/src/weather.ts (a unit test compares them).
import { type FetchFn, type Result, type Runtime, TIMEOUT_MS } from './types.ts';

export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'storm' | 'unknown';
export type Place = { state: string; town: string; lat: number; lon: number };
export type Day = { date: string; kind: WeatherKind; maxC: number; minC: number; rainMm: number; rainChance: number | null; windKmh: number };
export type Now = { tempC: number; humidity: number; kind: WeatherKind; windKmh: number };
export type AlertKind = 'heavy_rain' | 'dry_week' | 'heat' | 'strong_wind';
export type Alert = { kind: AlertKind; date?: string; value: number };
export type Forecast = { place: Place; now: Now | null; days: Day[]; alerts: Alert[] };

export const PILOT_PLACES: readonly Place[] = [
  { state: 'Oyo', town: 'Ibadan', lat: 7.3775, lon: 3.947 },
  { state: 'Ogun', town: 'Abeokuta', lat: 7.1475, lon: 3.3619 },
  { state: 'Osun', town: 'Osogbo', lat: 7.7827, lon: 4.5418 },
  { state: 'Ondo', town: 'Akure', lat: 7.2571, lon: 5.2058 },
  { state: 'Ekiti', town: 'Ado-Ekiti', lat: 7.6233, lon: 5.2209 },
  { state: 'Lagos', town: 'Ikeja', lat: 6.6018, lon: 3.3515 },
];

export const THRESHOLDS = { heavyRainMm: 25, dryWeekMm: 5, heatC: 36, strongWindKmh: 40 } as const;

export function weatherAlerts(days: Day[]): Alert[] {
  const t = THRESHOLDS;
  const out: Alert[] = [];
  const heavy = days.find((d) => d.rainMm >= t.heavyRainMm);
  if (heavy) out.push({ kind: 'heavy_rain', date: heavy.date, value: heavy.rainMm });
  const total = days.reduce((s, d) => s + d.rainMm, 0);
  if (days.length >= 7 && total < t.dryWeekMm) out.push({ kind: 'dry_week', value: Math.round(total * 10) / 10 });
  const hot = days.find((d) => d.maxC >= t.heatC);
  if (hot) out.push({ kind: 'heat', date: hot.date, value: hot.maxC });
  const windy = days.find((d) => d.windKmh >= t.strongWindKmh);
  if (windy) out.push({ kind: 'strong_wind', date: windy.date, value: windy.windKmh });
  return out;
}

/** WMO weather codes (Open-Meteo). */
export function wmoKind(code: number): WeatherKind {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 95 && code <= 99) return 'storm';
  return 'unknown';
}

/** WeatherAPI.com condition codes (https://www.weatherapi.com/docs/weather_conditions.json). */
export function weatherapiKind(code: number): WeatherKind {
  if (code === 1000) return 'clear';
  if (code === 1003) return 'partly';
  if (code === 1006 || code === 1009) return 'cloudy';
  if (code === 1030 || code === 1135 || code === 1147) return 'fog';
  if ([1072, 1150, 1153, 1168, 1171].includes(code)) return 'drizzle';
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return 'storm';
  if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(code)) return 'rain';
  return 'unknown';
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);
const round1 = (v: number) => Math.round(v * 10) / 10;

async function getJson(url: string, fetchFn: FetchFn): Promise<Result<unknown>> {
  let res: Response;
  try {
    res = await fetchFn(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    return { ok: false, error: 'unavailable' };
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* keep null */
  }
  if (res.ok) return { ok: true, value: body, httpStatus: res.status };
  // WeatherAPI: 401 = bad key, 403 = key disabled or over quota
  const error = res.status >= 500 ? 'unavailable' : res.status === 403 ? 'billing' : 'rejected';
  const detail = String((body as { error?: { message?: unknown } } | null)?.error?.message ?? '').slice(0, 80) || undefined;
  return { ok: false, error, detail, httpStatus: res.status };
}

type WeatherApiResponse = {
  current?: { temp_c?: number; humidity?: number; wind_kph?: number; condition?: { code?: number } };
  forecast?: {
    forecastday?: {
      date?: string;
      day?: {
        maxtemp_c?: number; mintemp_c?: number; totalprecip_mm?: number; daily_chance_of_rain?: number;
        maxwind_kph?: number; condition?: { code?: number };
      };
    }[];
  };
};

export function parseWeatherApi(json: unknown, place: Place): Forecast {
  const r = (json ?? {}) as WeatherApiResponse;
  const days: Day[] = (r.forecast?.forecastday ?? [])
    .map((f) => ({
      date: String(f.date ?? ''),
      kind: weatherapiKind(num(f.day?.condition?.code)),
      maxC: num(f.day?.maxtemp_c),
      minC: num(f.day?.mintemp_c),
      rainMm: Number.isFinite(num(f.day?.totalprecip_mm)) ? round1(num(f.day?.totalprecip_mm)) : 0,
      rainChance: Number.isFinite(num(f.day?.daily_chance_of_rain)) ? num(f.day?.daily_chance_of_rain) : null,
      windKmh: Number.isFinite(num(f.day?.maxwind_kph)) ? num(f.day?.maxwind_kph) : 0,
    }))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && Number.isFinite(d.maxC) && Number.isFinite(d.minC));
  const c = r.current;
  const now = c && Number.isFinite(num(c.temp_c))
    ? { tempC: num(c.temp_c), humidity: num(c.humidity), kind: weatherapiKind(num(c.condition?.code)), windKmh: num(c.wind_kph) }
    : null;
  return { place, now, days, alerts: weatherAlerts(days) };
}

type OpenMeteoResponse = { current?: Record<string, unknown>; daily?: Record<string, unknown[]> };

export function parseOpenMeteo(json: unknown, place: Place): Forecast {
  const r = (json ?? {}) as OpenMeteoResponse;
  const d = r.daily ?? {};
  const days: Day[] = ((d.time ?? []) as unknown[])
    .map((date, k) => ({
      date: String(date),
      kind: wmoKind(num(d.weather_code?.[k])),
      maxC: num(d.temperature_2m_max?.[k]),
      minC: num(d.temperature_2m_min?.[k]),
      rainMm: Number.isFinite(num(d.precipitation_sum?.[k])) ? round1(num(d.precipitation_sum?.[k])) : 0,
      rainChance: Number.isFinite(num(d.precipitation_probability_max?.[k])) ? num(d.precipitation_probability_max?.[k]) : null,
      windKmh: Number.isFinite(num(d.wind_speed_10m_max?.[k])) ? num(d.wind_speed_10m_max?.[k]) : 0,
    }))
    .filter((day) => Number.isFinite(day.maxC) && Number.isFinite(day.minC));
  const c = r.current;
  const now = c && Number.isFinite(num(c.temperature_2m))
    ? { tempC: num(c.temperature_2m), humidity: num(c.relative_humidity_2m), kind: wmoKind(num(c.weather_code)), windKmh: num(c.wind_speed_10m) }
    : null;
  return { place, now, days, alerts: weatherAlerts(days) };
}

export interface WeatherProvider {
  forecast(place: Place): Promise<Result<Forecast>>;
}

export function weatherapi(rt: Runtime, fetchFn: FetchFn = fetch): WeatherProvider {
  return {
    async forecast(place) {
      const key = rt.secrets.api_key;
      if (!key) return { ok: false, error: 'not_configured' };
      const days = ['3', '7', '10', '14'].includes(rt.config.days ?? '') ? rt.config.days! : '7';
      const q = new URLSearchParams({ key, q: `${place.lat},${place.lon}`, days, aqi: 'no', alerts: 'no' });
      const r = await getJson(`https://api.weatherapi.com/v1/forecast.json?${q}`, fetchFn);
      if (!r.ok) return r;
      const f = parseWeatherApi(r.value, place);
      return f.days.length ? { ok: true, value: f, httpStatus: r.httpStatus } : { ok: false, error: 'bad_response' };
    },
  };
}

export function openMeteo(fetchFn: FetchFn = fetch): WeatherProvider {
  return {
    async forecast(place) {
      const q = new URLSearchParams({
        latitude: String(place.lat),
        longitude: String(place.lon),
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        timezone: 'Africa/Lagos',
        forecast_days: '7',
      });
      const r = await getJson(`https://api.open-meteo.com/v1/forecast?${q}`, fetchFn);
      if (!r.ok) return r;
      const f = parseOpenMeteo(r.value, place);
      return f.days.length ? { ok: true, value: f, httpStatus: r.httpStatus } : { ok: false, error: 'bad_response' };
    },
  };
}

export function weatherProvider(rt: Runtime, fetchFn: FetchFn = fetch): Result<WeatherProvider> {
  switch (rt.provider) {
    case 'weatherapi':
      return { ok: true, value: weatherapi(rt, fetchFn) };
    case 'open_meteo':
      return { ok: true, value: openMeteo(fetchFn) };
    default:
      return { ok: false, error: 'not_available', detail: `no weather adapter for ${rt.provider}` };
  }
}
