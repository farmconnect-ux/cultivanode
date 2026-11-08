import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnonClient } from "@/lib/supabase/anon";

/**
 * Admin feature switches (public.feature_flags), changed in Admin → Feature switches.
 * A switch that is missing, or that cannot be read, counts as off, so an unfinished module never
 * appears because of a network error.
 */
export type FlagKey =
  | "marketplace_live"
  | "escrow_payments"
  | "hiring_escrow"
  | "ecosystem_hubs"
  | "module_livestock"
  | "module_farm_map"
  | "module_fleet"
  | "module_harvest"
  | "module_telemetry"
  | "module_iot"
  | "module_irrigation"
  | "module_contracts"
  | "module_credit_reports"
  | "module_risk"
  | "module_logistics"
  | "module_pow_log"
  | "marketplace_disputes"
  | "ai_photo_diagnosis"
  /** Sign in with a phone number (needs a working SMS provider in Integrations). Off: email only. */
  | "phone_sign_in";

export type Flags = Partial<Record<FlagKey, boolean>>;

/** All switches, read once per request. */
export const getFlags = cache(async (): Promise<Flags> => {
  try {
    // feature_flags is newer than the generated types: read it through an untyped client.
    const db = createAnonClient() as unknown as SupabaseClient;
    const { data, error } = await db.from("feature_flags").select("key, enabled");
    if (error) throw error;
    const out: Flags = {};
    for (const row of (data ?? []) as { key: string; enabled: boolean }[]) out[row.key as FlagKey] = row.enabled === true;
    return out;
  } catch {
    return {};
  }
});

export async function isOn(key: FlagKey): Promise<boolean> {
  return (await getFlags())[key] === true;
}
