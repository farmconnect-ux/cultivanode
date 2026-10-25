// Live forecast from the website's public weather endpoint (same provider the admin chooses in
// Integrations). When it can't be reached, Home simply leaves the weather card out: no made-up numbers.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlaceForecast, WeatherKind, WeatherResponse } from '@cultivanode/shared';
import { WEATHER_THRESHOLDS } from '@cultivanode/shared';
import { SITE_URL } from './site';

export type FarmWeather = {
  town: string;
  tempC: number | null;
  kind: WeatherKind;
  todayRainMm: number;
  todayRainChance: number | null;
  weekRainMm: number;
  /** Spraying or top-dressing today is a bad idea (rain or strong wind). */
  holdSpraying: boolean;
  /** No useful rain this week: young crops may need water. */
  dryWeek: boolean;
  fetchedAt: string;
};

const KEY = 'cn.weather';
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

function pick(forecasts: PlaceForecast[], state: string | null): PlaceForecast | null {
  return forecasts.find((f) => f.place.state === state) ?? null;
}

function summarise(f: PlaceForecast, fetchedAt: string): FarmWeather {
  const d0 = f.days[0];
  const week = f.days.slice(0, 7).reduce((s, d) => s + d.rainMm, 0);
  const rainy = (d0?.rainMm ?? 0) >= 5 || (d0?.rainChance ?? 0) >= 60;
  const windy = (d0?.windKmh ?? 0) >= WEATHER_THRESHOLDS.strongWindKmh;
  return {
    town: f.place.town,
    tempC: f.now ? Math.round(f.now.tempC) : d0 ? Math.round(d0.maxC) : null,
    kind: f.now?.kind ?? d0?.kind ?? 'unknown',
    todayRainMm: d0?.rainMm ?? 0,
    todayRainChance: d0?.rainChance ?? null,
    weekRainMm: Math.round(week),
    holdSpraying: rainy || windy,
    dryWeek: f.days.length >= 7 && week < WEATHER_THRESHOLDS.dryWeekMm,
    fetchedAt,
  };
}

/** Weather for the farm's state, or null when the state isn't covered yet or nothing could be loaded. */
export async function loadFarmWeather(state: string | null): Promise<FarmWeather | null> {
  try {
    const res = await fetch(`${SITE_URL}/api/weather`, { headers: { Accept: 'application/json' } });
    const json = (await res.json()) as WeatherResponse;
    if (!json.ok) throw new Error(json.error);
    await AsyncStorage.setItem(KEY, JSON.stringify(json)).catch(() => undefined);
    const f = pick(json.forecasts, state);
    return f ? summarise(f, json.fetchedAt) : null;
  } catch {
    const saved = await AsyncStorage.getItem(KEY).catch(() => null);
    if (!saved) return null;
    const json = JSON.parse(saved) as Extract<WeatherResponse, { ok: true }>;
    if (Date.now() - Date.parse(json.fetchedAt) > MAX_AGE_MS) return null;
    const f = pick(json.forecasts, state);
    return f ? summarise(f, json.fetchedAt) : null;
  }
}
