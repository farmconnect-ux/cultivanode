import type { WeatherResponse } from "@cultivanode/shared";
import { logger } from "@/lib/logger";
import { supabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Pilot-state forecasts from the `weather` Edge Function, which uses the provider chosen in
 * Admin > Integrations and caches results for 30 minutes. Runs as the signed-in staff member
 * (the function checks analytics.read); API keys never reach the website.
 */
export async function loadPilotWeather(): Promise<WeatherResponse> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: "not_signed_in" };
  const { url, key } = supabaseEnv();
  try {
    const res = await fetch(`${url}/functions/v1/weather`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    return (await res.json()) as WeatherResponse;
  } catch (error) {
    logger.warn("weather_load_failed", { reason: error instanceof Error ? error.name : "unknown" });
    return { ok: false, error: "unavailable" };
  }
}
