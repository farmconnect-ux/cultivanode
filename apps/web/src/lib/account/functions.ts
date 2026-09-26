import { supabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type FunctionResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

/**
 * Calls one of our Edge Functions as the signed-in user. The function checks the token with Supabase Auth
 * itself, so the session read here is only used to forward it.
 */
export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<FunctionResult<T>> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: "not_signed_in", status: 401 };
  const { url, key } = supabaseEnv();
  let res: Response;
  try {
    res = await fetch(`${url}/functions/v1/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return { ok: false, error: "provider_unavailable", status: 503 };
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const error = typeof (json as { error?: unknown })?.error === "string" ? (json as { error: string }).error : "generic";
    return { ok: false, error, status: res.status };
  }
  return { ok: true, data: json as T };
}
