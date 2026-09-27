// Weather: pilot locations, Open-Meteo request/response handling and simple farm alerts.
// Pure functions only (no fetch), so the web admin, the future farmer app and tests share them.
//
// Data source: Open-Meteo (https://open-meteo.com), CC BY 4.0 — the UI must credit it.
// The free endpoint is for non-commercial use; production needs an Open-Meteo API plan
// (set OPEN_METEO_API_KEY and the customer endpoint is used) or another provider.

export type WeatherPlace = { state: string; town: string; lat: number; lon: number };

/** South-West pilot states, forecast at the state capital (Lagos at Ikeja). */
export const PILOT_WEATHER_PLACES: readonly WeatherPlace[] = [
  { state: 'Oyo', town: 'Ibadan', lat: 7.3775, lon: 3.947 },
  { state: 'Ogun', town: 'Abeokuta', lat: 7.1475, lon: 3.3619 },
  { state: 'Osun', town: 'Osogbo', lat: 7.7827, lon: 4.5418 },
  { state: 'Ondo', town: 'Akure', lat: 7.2571, lon: 5.2058 },
  { state: 'Ekiti', town: 'Ado-Ekiti', lat: 7.6233, lon: 5.2209 },
  { state: 'Lagos', town: 'Ikeja', lat: 6.6018, lon: 3.3515 },
];

const DAILY = ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'precipitation_probability_max', 'wind_speed_10m_max'];
const CURRENT = ['temperature_2m', 'relative_humidity_2m', 'weather_code', 'wind_speed_10m'];

/** One request for all places (Open-Meteo accepts comma-separated coordinates). */
export function openMeteoUrl(places: readonly WeatherPlace[], apiKey?: string): string {
  const base = apiKey ? 'https://customer-api.open-meteo.com/v1/forecast' : 'https://api.open-meteo.com/v1/forecast';
  const q = new URLSearchParams({
    latitude: places.map((p) => p.lat).join(','),
    longitude: places.map((p) => p.lon).join(','),
    daily: DAILY.join(','),
    current: CURRENT.join(','),
    timezone: 'Africa/Lagos',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  });
  if (apiKey) q.set('apikey', apiKey);
  return `${base}?${q.toString()}`;
}

export type WeatherDay = {
  date: string;
  code: number;
  maxC: number;
  minC: number;
  rainMm: number;
  rainChance: number | null;
  windKmh: number;
};

export type WeatherAlertKind = 'heavy_rain' | 'dry_week' | 'heat' | 'strong_wind';
export type WeatherAlert = { kind: WeatherAlertKind; date?: string; value: number };

export type PlaceForecast = {
  place: WeatherPlace;
  now: { tempC: number; humidity: number; code: number; windKmh: number } | null;
  days: WeatherDay[];
  alerts: WeatherAlert[];
};

// Thresholds for farm alerts. Simple and explainable on purpose; agronomists can tune them later.
export const WEATHER_THRESHOLDS = {
  heavyRainMm: 25, // in one day: flooding, fertiliser wash-off, no spraying
  dryWeekMm: 5, // 7-day total below this: water stress for young crops
  heatC: 36, // daily maximum
  strongWindKmh: 40, // daily maximum: no spraying
} as const;

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);

type Raw = {
  current?: Record<string, unknown>;
  daily?: Record<string, unknown[]>;
};

/** Alerts for one place from its 7-day forecast. */
export function weatherAlerts(days: WeatherDay[]): WeatherAlert[] {
  const t = WEATHER_THRESHOLDS;
  const out: WeatherAlert[] = [];
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

/** Turns the Open-Meteo response (one object, or an array for several places) into forecasts. */
export function parseOpenMeteo(json: unknown, places: readonly WeatherPlace[]): PlaceForecast[] {
  const list = (Array.isArray(json) ? json : [json]) as Raw[];
  if (list.length !== places.length) throw new Error('weather_response_mismatch');
  return list.map((raw, i) => {
    const d = raw.daily ?? {};
    const dates = (d.time ?? []) as unknown[];
    const days: WeatherDay[] = dates
      .map((date, k) => ({
        date: String(date),
        code: num(d.weather_code?.[k]),
        maxC: num(d.temperature_2m_max?.[k]),
        minC: num(d.temperature_2m_min?.[k]),
        rainMm: num(d.precipitation_sum?.[k]),
        rainChance: Number.isFinite(num(d.precipitation_probability_max?.[k])) ? num(d.precipitation_probability_max?.[k]) : null,
        windKmh: num(d.wind_speed_10m_max?.[k]),
      }))
      .filter((day) => Number.isFinite(day.maxC) && Number.isFinite(day.minC))
      .map((day) => ({
        ...day,
        rainMm: Number.isFinite(day.rainMm) ? day.rainMm : 0,
        windKmh: Number.isFinite(day.windKmh) ? day.windKmh : 0,
        code: Number.isFinite(day.code) ? day.code : -1,
      }));
    const c = raw.current;
    const now =
      c && Number.isFinite(num(c.temperature_2m))
        ? {
            tempC: num(c.temperature_2m),
            humidity: num(c.relative_humidity_2m),
            code: num(c.weather_code),
            windKmh: num(c.wind_speed_10m),
          }
        : null;
    return { place: places[i]!, now, days, alerts: weatherAlerts(days) };
  });
}

export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'storm' | 'unknown';

/** Groups WMO weather codes into a few kinds the UI can name and draw. */
export function weatherKind(code: number): WeatherKind {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 95 && code <= 99) return 'storm';
  return 'unknown';
}
