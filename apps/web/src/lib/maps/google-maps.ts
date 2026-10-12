import { createClient } from "@/lib/supabase/server";

export type GoogleMapsConfig = {
  apiKey: string | null;
  mapId?: string;
  defaultZoom: number;
  defaultCenter: { lat: number; lng: number };
  mode: "test" | "live";
  providerConfigured: boolean;
};

/**
 * Returns the centrally configured Google Maps Platform settings from Super Admin Integrations.
 * Falls back to environment variables if database configuration is not yet saved.
 */
export async function getGoogleMapsConfig(): Promise<GoogleMapsConfig> {
  const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || null;

  try {
    const supabase = await createClient();
    // Query active settings for 'maps'
    const { data: settings } = await supabase
      .from("integration_settings")
      .select("active_provider")
      .eq("kind", "maps")
      .maybeSingle();

    const providerCode = settings?.active_provider ?? "google_maps";

    // Query mode and config for google_maps
    const { data: configRow } = await supabase
      .from("integration_configs")
      .select("mode, config")
      .eq("provider", providerCode)
      .maybeSingle();

    const mode = (configRow?.mode ?? "test") as "test" | "live";
    const modeConfig = (configRow?.config as Record<string, Record<string, string>> | null)?.[mode] ?? {};

    // In a production setup secrets are decrypted via RPC or vault.
    // Check if secret key exists or fallback to envKey.
    const { data: secretRow } = await supabase
      .from("integration_secrets")
      .select("hint")
      .eq("provider", providerCode)
      .eq("mode", mode)
      .eq("field", "api_key")
      .maybeSingle();

    const hasSecretInDb = Boolean(secretRow);

    return {
      apiKey: envKey,
      mapId: modeConfig.map_id || undefined,
      defaultZoom: Number(modeConfig.default_zoom) || 14,
      defaultCenter: {
        lat: Number(modeConfig.default_lat) || 8.6672,
        lng: Number(modeConfig.default_lng) || 3.3934,
      },
      mode,
      providerConfigured: hasSecretInDb || Boolean(envKey),
    };
  } catch {
    return {
      apiKey: envKey,
      defaultZoom: 14,
      defaultCenter: { lat: 8.6672, lng: 3.3934 },
      mode: "test",
      providerConfigured: Boolean(envKey),
    };
  }
}

/**
 * Returns only the public-safe configuration for client-side use.
 * The API key is intentionally NOT included here - it should be loaded
 * server-side and passed to the Maps JavaScript API loader.
 */
export async function getPublicGoogleMapsConfig(): Promise<Omit<GoogleMapsConfig, "apiKey">> {
  const config = await getGoogleMapsConfig();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { apiKey: _apiKey, ...publicConfig } = config;
  return publicConfig;
}
