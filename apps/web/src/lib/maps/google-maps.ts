import { createClient } from "@/lib/supabase/server";

export type GoogleMapsConfig = {
  apiKey: string | null;
  mapId?: string;
  defaultZoom: number;
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
      apiKey: envKey, // Browser client uses public or env key
      mapId: modeConfig.map_id || undefined,
      defaultZoom: Number(modeConfig.default_zoom) || 14,
      mode,
      providerConfigured: hasSecretInDb || Boolean(envKey),
    };
  } catch {
    return {
      apiKey: envKey,
      defaultZoom: 14,
      mode: "test",
      providerConfigured: Boolean(envKey),
    };
  }
}
