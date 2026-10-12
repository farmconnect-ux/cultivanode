import {
  PILOT_WEATHER_PLACES,
  weatherAlerts,
  type PlaceForecast,
  type WeatherDay,
  type WeatherKind,
  type WeatherPlace,
  type WeatherResponse,
} from "@cultivanode/shared";
import { logger } from "@/lib/logger";
import { supabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function wmoKind(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 95 && code <= 99) return "storm";
  return "unknown";
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
const round1 = (v: number) => Math.round(v * 10) / 10;

/** In-memory cache for live weather (15 minutes). */
let cachedResponse: { expiresAt: number; data: Extract<WeatherResponse, { ok: true }> } | null = null;

/**
 * Direct live weather fetch from Open-Meteo or WeatherAPI.
 * Does not require Edge Functions and works across all authenticated and public views.
 */
export async function getLivePilotWeather(): Promise<WeatherResponse> {
  const now = Date.now();
  if (cachedResponse && cachedResponse.expiresAt > now) {
    return cachedResponse.data;
  }

  try {
    const forecasts: PlaceForecast[] = await Promise.all(
      PILOT_WEATHER_PLACES.map(async (place: WeatherPlace) => {
        const q = new URLSearchParams({
          latitude: String(place.lat),
          longitude: String(place.lon),
          daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
          current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
          timezone: "Africa/Lagos",
          forecast_days: "7",
        });

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, {
          next: { revalidate: 900 },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          throw new Error(`Open-Meteo responded with status ${res.status}`);
        }

        const data = await res.json();
        const d = data.daily ?? {};
        const days: WeatherDay[] = ((d.time ?? []) as unknown[])
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

        const c = data.current;
        const nowObj = c && Number.isFinite(num(c.temperature_2m))
          ? {
              tempC: num(c.temperature_2m),
              humidity: num(c.relative_humidity_2m),
              kind: wmoKind(num(c.weather_code)),
              windKmh: num(c.wind_speed_10m),
            }
          : null;

        return {
          place,
          now: nowObj,
          days,
          alerts: weatherAlerts(days),
        };
      })
    );

    const result: Extract<WeatherResponse, { ok: true }> = {
      ok: true,
      provider: "open_meteo",
      fetchedAt: new Date().toISOString(),
      stale: false,
      forecasts,
    };

    cachedResponse = { expiresAt: now + 15 * 60 * 1000, data: result };
    return result;
  } catch (err) {
    logger.warn("live_weather_fetch_failed", { reason: err instanceof Error ? err.message : "unknown" });
    if (cachedResponse) {
      return { ...cachedResponse.data, stale: true };
    }
    return { ok: false, error: "unavailable" };
  }
}

/**
 * Pilot-state forecasts. Calls the Edge Function if available, otherwise delegates
 * immediately to getLivePilotWeather() to ensure real, non-mock weather everywhere.
 */
export async function loadPilotWeather(): Promise<WeatherResponse> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    const { url, key } = supabaseEnv();
    try {
      const res = await fetch(`${url}/functions/v1/weather`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, apikey: key },
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const json = (await res.json()) as WeatherResponse;
        if (json.ok) return json;
      }
    } catch {
      // Fallback to direct live weather below
    }
  }

  // Universal direct live weather from active provider
  return getLivePilotWeather();
}
