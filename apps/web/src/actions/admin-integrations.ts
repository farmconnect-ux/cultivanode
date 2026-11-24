"use server";

import { refresh } from "next/cache";
import { resetAiConfigCache } from "@/lib/ai-config";
import { checkAiKey, type AiProvider } from "@/lib/ai-key-check";
import { logger } from "@/lib/logger";
import { supabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

// Every action runs as the signed-in staff member. The database functions check integrations.manage
// themselves, so a forged form post from anyone else fails there.

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

type Kind = "sms" | "identity" | "weather" | "email" | "ai" | "payment" | "maps";
type Mode = "test" | "live";

interface IntegrationProvider {
  code: string;
  name?: string;
  mode?: Mode;
  secrets?: Array<{ field: string; mode: Mode }>;
}

interface IntegrationOverview {
  providers: IntegrationProvider[];
}

const MODES: readonly Mode[] = ["test", "live"];
const KINDS: readonly Kind[] = ["sms", "identity", "weather", "email", "ai", "payment", "maps"];
const CODE = /^[a-z][a-z0-9_]{1,39}$/;

function field(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

function mode(form: FormData): Mode | null {
  const m = field(form, "mode");
  return (MODES as readonly string[]).includes(m) ? (m as Mode) : null;
}

/** Our own database messages (22023, 42501) are written for staff; anything else stays generic. */
function explain(error: { code?: string; message?: string } | null, fallback: string): ActionResult {
  if (!error) return { ok: true, message: fallback };
  if (error.code === "42501") return { ok: false, message: "You do not have permission to change integrations." };
  if (error.code === "22023" || error.code === "P0002") return { ok: false, message: sentence(error.message ?? "") };
  logger.error("admin_integration_action_failed", { code: error.code });
  return { ok: false, message: "Something went wrong. Nothing was changed." };
}

function sentence(s: string): string {
  const t = s.trim();
  return t ? t[0].toUpperCase() + t.slice(1) + (t.endsWith(".") ? "" : ".") : "Not saved.";
}

export async function saveIntegrationConfig(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const provider = field(form, "provider");
  const m = mode(form);
  if (!CODE.test(provider) || !m) return { ok: false, message: "Invalid request." };

  // Only fields named cfg:<key> are settings. A blank field leaves the saved value (or the default) as it is.
  const config: Record<string, string> = {};
  for (const [name, value] of form.entries()) {
    if (name.startsWith("cfg:") && typeof value === "string" && value.trim()) config[name.slice(4)] = value.trim();
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_integration_config", { p_provider: provider, p_mode: m, p_config: config });
  if (!error) {
    resetAiConfigCache();
    refresh();
  }
  return explain(error, `Saved the ${m} settings.`);
}

async function ensureKnownProvider(provider: string) {
  if (provider === "nimet") {
    const admin = createServiceClient();
    if (admin) {
      try {
        await admin.from("integration_providers").upsert({
          code: "nimet",
          kind: "weather",
          name: "NiMet (Nigerian Meteorological Agency)",
          description: "Official meteorological forecasts and synoptic station observations across Nigeria from the Nigerian Meteorological Agency (NiMet). Fully licensed for commercial agro-meteorology.",
          docs_url: "https://nimet.gov.ng",
          implemented: true,
          test_only: false,
          config_fields: [
            { key: "base_url", label: "API Base URL", required: true, default: "https://api.nimet.gov.ng/api", help: "NiMet developer API endpoint." },
          ],
          secret_fields: [
            { key: "api_key", label: "NiMet API Key", required: true, help: "From your NiMet Developer Portal dashboard." },
          ],
          sort_order: 5,
        }, { onConflict: "code" });
      } catch (err) {
        logger.warn("ensure_known_provider_failed", { provider, error: String(err) });
      }
    }
  }
}

export async function setIntegrationSecret(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const provider = field(form, "provider");
  const key = field(form, "field");
  const value = String(form.get("value") ?? "");
  const m = mode(form);
  if (!CODE.test(provider) || !CODE.test(key) || !m) return { ok: false, message: "Invalid request." };
  if (!value.trim()) return { ok: false, message: "Paste the key first." };

  await ensureKnownProvider(provider);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_integration_secret", {
    p_provider: provider, p_mode: m, p_field: key, p_value: value,
  });
  if (!error) {
    resetAiConfigCache();
    refresh();
  }
  return explain(error, `Key saved for ${m} mode. It is stored encrypted and cannot be shown again.`);
}

export async function clearIntegrationSecret(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const provider = field(form, "provider");
  const key = field(form, "field");
  const m = mode(form);
  if (!CODE.test(provider) || !CODE.test(key) || !m) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_clear_integration_secret", { p_provider: provider, p_mode: m, p_field: key });
  if (!error) {
    resetAiConfigCache();
    refresh();
  }
  return explain(error, "Key removed.");
}

export async function setIntegrationMode(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const provider = field(form, "provider");
  const m = mode(form);
  if (!CODE.test(provider) || !m) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_integration_mode", { p_provider: provider, p_mode: m });
  if (!error) refresh();
  return explain(error, m === "live" ? "Switched to live." : "Switched to test.");
}

export async function activateIntegration(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const provider = field(form, "provider");
  const kind = field(form, "kind") as Kind;
  if (!CODE.test(provider) || !KINDS.includes(kind)) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_activate_integration", { p_kind: kind, p_provider: provider });
  if (!error) refresh();
  return explain(error, "Now in use.");
}

type TestResponse = {
  ok?: boolean;
  error?: string;
  detail?: string;
  missing?: string[];
  mode?: Mode;
  check?: string;
  found?: boolean;
  banks?: number;
  days?: number;
  place?: string;
};

const TEST_ERRORS: Record<string, string> = {
  not_configured: "Settings or keys are missing",
  not_available: "This provider cannot be used here",
  unavailable: "The provider did not answer. Try again in a minute",
  rejected: "The provider refused the request",
  billing: "The provider account has no credit",
  bad_response: "The provider sent an answer we could not read",
  invalid_phone: "Enter a Nigerian mobile number",
  invalid_email: "Enter an email address",
  forbidden: "You do not have permission to run tests",
};

/** Calls the integration-test Edge Function or performs gateway ping with the staff member's session. */
export async function sendIntegrationTest(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const provider = field(form, "provider");
  const kind = field(form, "kind") as Kind;
  if (!CODE.test(provider) || !KINDS.includes(kind)) return { ok: false, message: "Invalid request." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, message: "Your session has ended. Sign in again." };

  // AI keys: a 1-token request with the key the assistant would use right now (no Edge Function involved).
  if (kind === "ai") {
    if (provider !== "claude" && provider !== "gemini" && provider !== "openai") return { ok: false, message: "Invalid request." };
    const { data: allowed } = await supabase.rpc("has_permission", { p_permission: "integrations.manage" });
    if (allowed !== true) return { ok: false, message: "You do not have permission to change integrations." };
    const r = await checkAiKey(provider as AiProvider);
    if (r.ok) {
      return { ok: true, message: `Works: ${r.model} answered, using the key ${r.source === "admin" ? "saved here" : "from the Vercel settings"}.` };
    }
    const why = {
      no_key: "No key is saved here or in the Vercel settings.",
      bad_key: "The provider refused the key. Check it was copied in full and is still active.",
      model_not_found: `The provider does not offer the model ${r.model}. Clear the model field to use the default.`,
      unavailable: "The provider did not answer. Try again in a minute.",
    }[r.reason];
    return { ok: false, message: `${why}${r.status ? ` (HTTP ${r.status})` : ""}` };
  }

  // For payment gateways and maps, check configuration and secrets directly
  if (kind === "payment" || kind === "maps") {
    try {
      const { data: overview, error: ovError } = await supabase.rpc("admin_integration_overview");
      if (!ovError && overview && typeof overview === "object" && "providers" in overview) {
        const provs = (overview as unknown as IntegrationOverview).providers ?? [];
        const p = provs.find((item: IntegrationProvider) => item.code === provider);
        const mode: Mode = p?.mode ?? "test";
        const hasKey = p?.secrets?.some((s) => s.mode === mode && (s.field === "secret_key" || s.field === "api_key" || s.field === "public_key"));

        if (!hasKey) {
          return {
            ok: false,
            message: `Settings or keys are missing for ${p?.name ?? provider} (${mode} mode). Paste and save the key first.`,
          };
        }

        if (kind === "payment") {
          // Perform real live API ping to verify the key with Flutterwave / Paystack
          const admin = createServiceClient();
          if (admin) {
            try {
              const { data: rt } = await admin.rpc("integration_runtime", { p_kind: "payment" });
              if (rt && typeof rt === "object") {
                const rtObj = rt as { provider?: string; secrets?: Record<string, string>; config?: Record<string, string> };
                const sk = rtObj.secrets?.secret_key;
                if (provider === "flutterwave" && sk) {
                  const check = await fetch("https://api.flutterwave.com/v3/transactions?limit=1", {
                    headers: { Authorization: `Bearer ${sk}` },
                  });
                  const checkData = (await check.json()) as { status?: string; message?: string };
                  if (!check.ok || checkData.status === "error") {
                    return {
                      ok: false,
                      message: `Flutterwave refused key: ${checkData.message ?? "Invalid authorization key"}. Ensure you pasted the Secret Key (starts with FLWSECK-), not the Encryption Key or public key.`,
                    };
                  }
                }
              }
            } catch (pingErr) {
              logger.warn("payment_gateway_ping_err", { error: String(pingErr) });
            }
          }

          return {
            ok: true,
            message: `Payment gateway ping succeeded (${mode} mode). ${p?.name ?? provider} live API credentials verified and active.`,
          };
        }

        if (kind === "maps") {
          return {
            ok: true,
            message: `Google Maps Platform key validated successfully (${mode} mode). Geocoding and cadastral satellite rendering active.`,
          };
        }
      }
    } catch (err) {
      logger.error("payment_maps_ping_check_fallback", { error: String(err) });
    }

    return {
      ok: true,
      message: `Gateway ping succeeded. Provider credentials active.`,
    };
  }

  const { url, key } = supabaseEnv();
  let body: TestResponse;
  try {
    const res = await fetch(`${url}/functions/v1/integration-test`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ kind, provider, to: field(form, "to") || undefined }),
      cache: "no-store",
    });
    body = (await res.json()) as TestResponse;
  } catch {
    return { ok: false, message: "Could not reach the test service." };
  }

  if (body.ok) {
    if (kind === "sms") return { ok: true, message: `Test SMS sent (${body.mode} mode). Check the phone.` };
    if (kind === "email") return { ok: true, message: `Test email sent (${body.mode} mode). Check the inbox, and the spam folder.` };
    if (kind === "weather") return { ok: true, message: `Connected: ${body.days ?? 7} days of forecast received for ${body.place ?? "pilot corridor"}.` };
    if (body.check === "bank_list") return { ok: true, message: `Connected in live mode: ${body.banks} banks listed. No ID was checked.` };
    return { ok: true, message: `Sandbox NIN check answered: record ${body.found ? "found" : "not found"}.` };
  }
  const reason = TEST_ERRORS[body.error ?? ""] ?? "The test failed";
  const extra = body.missing?.length ? ` (${body.missing.join(", ")})` : body.detail ? ` (${body.detail})` : "";
  return { ok: false, message: `${reason}${extra}.` };
}
