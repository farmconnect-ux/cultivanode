// Point forecasts for a farm from NiMet and satellite agro-meteorology. Cached for 30 minutes per location.
// Returns null when the service is unreachable; pages fall back to on-farm sensor readings.
import { logger } from "@/lib/logger";

export type DailyForecast = { date: string; tMax: number; tMin: number; rainMm: number; rainProb: number; et0: number; code: number };
export type Forecast = { current: { temp: number; humidity: number; wind: number; code: number } | null; daily: DailyForecast[] };

export async function loadForecast(lat: number, lng: number): Promise<Forecast | null> {
  const q = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lng.toFixed(3),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,weather_code",
    timezone: "Africa/Lagos",
    forecast_days: "10",
  });
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`status_${res.status}`);
    const j = (await res.json()) as {
      current?: { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number };
      daily?: Record<string, (number | string)[]>;
    };
    const d = j.daily ?? {};
    const days = (d.time ?? []) as string[];
    return {
      current: j.current ? { temp: j.current.temperature_2m, humidity: j.current.relative_humidity_2m, wind: j.current.wind_speed_10m, code: j.current.weather_code } : null,
      daily: days.map((date, i) => ({
        date,
        tMax: Number(d.temperature_2m_max?.[i] ?? 0),
        tMin: Number(d.temperature_2m_min?.[i] ?? 0),
        rainMm: Number(d.precipitation_sum?.[i] ?? 0),
        rainProb: Number(d.precipitation_probability_max?.[i] ?? 0),
        et0: Number(d.et0_fao_evapotranspiration?.[i] ?? 0),
        code: Number(d.weather_code?.[i] ?? 0),
      })),
    };
  } catch (error) {
    logger.warn("forecast_failed", { reason: error instanceof Error ? error.message : "unknown" });
    return null;
  }
}

/** WMO weather code to a short phrase and an icon name from the app's icon set. */
export function describe(code: number): { text: string; icon: "sunny" | "partly_cloudy_day" | "cloud" | "water_drop" | "thunderstorm" | "air" } {
  if (code === 0) return { text: "Clear", icon: "sunny" };
  if (code <= 2) return { text: "Partly cloudy", icon: "partly_cloudy_day" };
  if (code === 3 || code === 45 || code === 48) return { text: "Overcast", icon: "cloud" };
  if (code >= 95) return { text: "Thunderstorms", icon: "thunderstorm" };
  if (code >= 51) return { text: "Rain", icon: "water_drop" };
  return { text: "Hazy", icon: "air" };
}
