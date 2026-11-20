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

function nimetKind(cond: unknown): WeatherKind {
  const s = String(cond ?? "").toLowerCase();
  if (s.includes("thunder") || s.includes("storm")) return "storm";
  if (s.includes("heavy rain") || s.includes("rain") || s.includes("shower")) return "rain";
  if (s.includes("drizzle")) return "drizzle";
  if (s.includes("fog") || s.includes("mist") || s.includes("haze") || s.includes("dust")) return "fog";
  if (s.includes("partly")) return "partly";
  if (s.includes("cloud") || s.includes("overcast")) return "cloudy";
  if (s.includes("clear") || s.includes("sunny")) return "clear";
  return "unknown";
}

function parseNiMetDirect(json: unknown, place: WeatherPlace): PlaceForecast {
  const raw = (json ?? {}) as Record<string, unknown>;
  const list = (Array.isArray(raw)
    ? raw
    : Array.isArray(raw.forecast)
    ? raw.forecast
    : Array.isArray(raw.data)
    ? raw.data
    : Array.isArray(raw.days)
    ? raw.days
    : []) as Array<Record<string, unknown>>;

  const days: WeatherDay[] = list
    .map((item, index) => {
      const dateStr = String(item.date || item.forecast_date || new Date(Date.now() + index * 86400000).toISOString().slice(0, 10));
      const condVal = typeof item.condition === "object" && item.condition !== null ? (item.condition as { text?: string }).text : item.condition || item.weather_condition || item.weather;
      const maxC = num(item.max_temp ?? item.temp_max ?? item.maxtemp_c);
      const minC = num(item.min_temp ?? item.temp_min ?? item.mintemp_c);
      const rain = num(item.rain_mm ?? item.rainfall ?? item.totalprecip_mm ?? item.precipitation);
      const rainChance = num(item.rain_chance ?? item.precipitation_probability ?? item.daily_chance_of_rain);
      const wind = num(item.wind_speed_kmh ?? item.wind_speed ?? item.wind_kph);

      return {
        date: dateStr,
        kind: nimetKind(condVal),
        maxC: Number.isFinite(maxC) ? maxC : 32,
        minC: Number.isFinite(minC) ? minC : 23,
        rainMm: Number.isFinite(rain) ? round1(rain) : 0,
        rainChance: Number.isFinite(rainChance) ? rainChance : null,
        windKmh: Number.isFinite(wind) ? wind : 10,
      };
    })
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && Number.isFinite(d.maxC) && Number.isFinite(d.minC));

  const current = (raw.current ?? (typeof raw.data === "object" && !Array.isArray(raw.data) ? (raw.data as Record<string, unknown>)?.current : null)) as Record<string, unknown> | null;
  const curTemp = num(current?.temp_c ?? current?.temperature ?? current?.temp);
  const curHum = num(current?.humidity ?? current?.relative_humidity);
  const curWind = num(current?.wind_kph ?? current?.wind_speed ?? current?.wind_speed_kmh);
  const curCond = current?.weather_condition ?? current?.condition ?? (days[0] ? days[0].kind : "clear");

  const now = Number.isFinite(curTemp)
    ? {
        tempC: curTemp,
        humidity: Number.isFinite(curHum) ? curHum : 75,
        kind: nimetKind(curCond),
        windKmh: Number.isFinite(curWind) ? curWind : 10,
      }
    : days.length > 0
    ? {
        tempC: Math.round((days[0]!.maxC + days[0]!.minC) / 2),
        humidity: 75,
        kind: days[0]!.kind,
        windKmh: days[0]!.windKmh,
      }
    : null;

  return { place, now, days, alerts: weatherAlerts(days) };
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
const round1 = (v: number) => Math.round(v * 10) / 10;

/** In-memory cache for live weather (15 minutes). */
let cachedResponse: { expiresAt: number; data: Extract<WeatherResponse, { ok: true }> } | null = null;

/**
 * Direct live weather fetch from NiMet or satellite arrays.
 * Does not require Edge Functions and works across all authenticated and public views.
 */
export async function getLivePilotWeather(): Promise<WeatherResponse> {
  const now = Date.now();
  if (cachedResponse && cachedResponse.expiresAt > now) {
    return cachedResponse.data;
  }

  const nimetKey = process.env.NIMET_API_KEY || process.env.NIMET_KEY;

  if (nimetKey) {
    try {
      const baseUrl = (process.env.NIMET_BASE_URL || "https://api.nimet.gov.ng/api").replace(/\/+$/, "");
      const forecasts: PlaceForecast[] = await Promise.all(
        PILOT_WEATHER_PLACES.map(async (place: WeatherPlace) => {
          const location = encodeURIComponent(place.town.toLowerCase());
          const res = await fetch(`${baseUrl}/forecast/${location}`, {
            headers: { Accept: "application/json", "x-api-key": nimetKey },
            next: { revalidate: 900 },
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw new Error(`nimet_status_${res.status}`);
          const data = await res.json();
          return parseNiMetDirect(data, place);
        })
      );

      const result: Extract<WeatherResponse, { ok: true }> = {
        ok: true,
        provider: "nimet",
        fetchedAt: new Date().toISOString(),
        stale: false,
        forecasts,
      };

      cachedResponse = { expiresAt: now + 15 * 60 * 1000, data: result };
      return result;
    } catch (nimetErr) {
      logger.warn("nimet_direct_fetch_failed", { error: String(nimetErr) });
    }
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
          throw new Error(`Satellite weather responded with status ${res.status}`);
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
      provider: "open-meteo",
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
