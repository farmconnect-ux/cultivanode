import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";
import { supabaseEnv } from "./env";

/**
 * Service-role client for trusted server-to-server work only (verified payment webhooks).
 * Bypasses row level security, so never use it with user input you haven't authenticated.
 * Returns null when SUPABASE_SECRET_KEY isn't configured.
 */
export function createServiceClient() {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;
  const { url } = supabaseEnv();
  return createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
