// Weather: shared types, pilot locations and farm-alert rules.
// Forecasts are fetched by the `weather` Edge Function from the provider chosen in Admin > Integrations
// (WeatherAPI.com by default); supabase/functions/_shared/providers/weather.ts holds the adapters and a
// copy of these constants (a unit test keeps the two in step).

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

export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'storm' | 'unknown';

export type WeatherDay = {
  date: string;
  kind: WeatherKind;
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
  now: { tempC: number; humidity: number; kind: WeatherKind; windKmh: number } | null;
  days: WeatherDay[];
  alerts: WeatherAlert[];
};

/** What the `weather` Edge Function returns. */
export type WeatherResponse =
  | { ok: true; provider: string; fetchedAt: string; stale: boolean; forecasts: PlaceForecast[] }
  | { ok: false; error: string; provider?: string; missing?: string[]; detail?: string };

// Thresholds for farm alerts. Simple and explainable on purpose; agronomists can tune them later.
export const WEATHER_THRESHOLDS = {
  heavyRainMm: 25, // in one day: flooding, fertiliser wash-off, no spraying
  dryWeekMm: 5, // 7-day total below this: water stress for young crops
  heatC: 36, // daily maximum
  strongWindKmh: 40, // daily maximum: no spraying
} as const;

/** Alerts for one place from its forecast. The dry-week alert needs at least 7 days. */
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
