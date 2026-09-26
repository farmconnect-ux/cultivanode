"use server";

import { redirect } from "next/navigation";
import { normalizeNgPhone } from "@cultivanode/shared";
import { hasLocale, type Locale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

// Phone sign-in for the public website. Codes are sent by the Supabase Auth Send SMS hook, through the
// SMS provider chosen in the admin console. A new number gets an account; onboarding follows.

export type AuthErrorKey = "errorPhone" | "errorCode" | "errorWrongCode" | "errorBusy" | "errorSend";

export type AuthState =
  | { step: "phone"; error?: AuthErrorKey; raw?: string }
  | { step: "code"; phone: string; sentAt: number; error?: AuthErrorKey };

function locale(form: FormData): Locale {
  const l = String(form.get("lang") ?? "");
  return hasLocale(l) ? l : "en";
}

async function sendCode(phone: string): Promise<AuthErrorKey | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: `+${phone}`, options: { shouldCreateUser: true } });
  if (!error) return null;
  logger.warn("sign_in_code_failed", { reason: error.code ?? error.name, status: error.status });
  return error.status === 429 ? "errorBusy" : "errorSend";
}

/** Step 1 (and "send a new code"): text a 6-digit code. */
export async function requestCode(prev: AuthState, form: FormData): Promise<AuthState> {
  const raw = String(form.get("phone") ?? (prev.step === "code" ? prev.phone : "")).slice(0, 30);
  const phone = normalizeNgPhone(raw);
  if (!phone || phone === "invalid") return { step: "phone", raw, error: "errorPhone" };
  const error = await sendCode(phone);
  if (error) {
    return prev.step === "code" ? { ...prev, error } : { step: "phone", raw, error };
  }
  return { step: "code", phone, sentAt: Date.now() };
}

/** Step 2: check the code. Supabase sets the session cookie; new people continue to onboarding. */
export async function verifyCode(prev: AuthState, form: FormData): Promise<AuthState> {
  if (prev.step !== "code") return { step: "phone" };
  const token = String(form.get("code") ?? "").replace(/\s+/g, "");
  if (!/^[0-9]{6}$/.test(token)) return { ...prev, error: "errorCode" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ phone: `+${prev.phone}`, token, type: "sms" });
  if (error || !data.user) return { ...prev, error: error?.status === 429 ? "errorBusy" : "errorWrongCode" };

  const { data: profile } = await supabase.from("profiles").select("onboarded_at").eq("id", data.user.id).maybeSingle();
  const lang = locale(form);
  redirect(profile?.onboarded_at ? `/${lang}/account` : `/${lang}/onboarding`);
}

export async function signOut(form: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale(form)}`);
}

/** Ends every session of this account (lost phone, shared device). */
export async function signOutEverywhere(form: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect(`/${locale(form)}/sign-in`);
}
