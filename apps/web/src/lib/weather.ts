import { openMeteoUrl, parseOpenMeteo, PILOT_WEATHER_PLACES, type PlaceForecast } from "@cultivanode/shared";
import { logger } from "@/lib/logger";

/**
 * 7-day forecasts for the pilot states from Open-Meteo, cached for 30 minutes by Next.
 * OPEN_METEO_API_KEY (server-only) switches to the paid endpoint, which commercial use requires.
 * Returns null when the service cannot be reached, so the dashboard still loads.
 */
export async function loadPilotWeather(): Promise<{ forecasts: PlaceForecast[]; fetchedAt: string } | null> {
  try {
    const res = await fetch(openMeteoUrl(PILOT_WEATHER_PLACES, process.env.OPEN_METEO_API_KEY || undefined), {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`status_${res.status}`);
    return { forecasts: parseOpenMeteo(await res.json(), PILOT_WEATHER_PLACES), fetchedAt: new Date().toISOString() };
  } catch (error) {
    logger.warn("weather_load_failed", { reason: error instanceof Error ? error.message : "unknown" });
    return null;
  }
}
