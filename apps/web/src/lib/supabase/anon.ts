import { createClient } from "@supabase/supabase-js";
import type { Database } from "@tillmate/shared";
import { supabaseEnv } from "./env";

/**
 * Cookie-free client for public, signed-out calls from Server Actions (website forms).
 * Uses the publishable key, so Row Level Security and function grants still apply.
 */
export function createAnonClient() {
  const { url, key } = supabaseEnv();
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
