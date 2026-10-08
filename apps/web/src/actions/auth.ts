"use server";

import { redirect } from "next/navigation";
import { isValidEmail, normalizeNgPhone } from "@cultivanode/shared";
import { hasLocale, type Locale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

// Sign-in for the public website with Phone Number (SMS OTP) or Email Address (Email OTP).
// A new phone/email gets an account; onboarding follows.

export type AuthErrorKey = "errorPhone" | "errorEmail" | "errorCode" | "errorWrongCode" | "errorBusy" | "errorSend";
export type AuthMethod = "phone" | "email";

export type AuthState =
  | { step: "phone" | "input"; method?: AuthMethod; error?: AuthErrorKey; raw?: string }
  | { step: "code"; method: AuthMethod; target: string; phone?: string; email?: string; sentAt: number; error?: AuthErrorKey };

function locale(form: FormData): Locale {
  const l = String(form.get("lang") ?? "");
  return hasLocale(l) ? l : "en";
}

async function sendCode(phone: string): Promise<AuthErrorKey | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: `+${phone}`, options: { shouldCreateUser: true } });
  if (!error) return null;
  logger.warn("sign_in_phone_code_failed", { reason: error.code ?? error.name, status: error.status });
  return error.status === 429 ? "errorBusy" : "errorSend";
}

async function sendEmailCode(email: string): Promise<AuthErrorKey | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (!error) return null;
  logger.warn("sign_in_email_code_failed", { reason: error.code ?? error.name, status: error.status });
  return error.status === 429 ? "errorBusy" : "errorSend";
}

/** Step 1 (and "send a new code"): send a 6-digit code via SMS or Email. */
export async function requestCode(prev: AuthState, form: FormData): Promise<AuthState> {
  const method = (form.get("method") as AuthMethod) || (prev.step === "code" ? prev.method : "phone") || "phone";

  if (method === "email") {
    const raw = String(form.get("email") ?? (prev.step === "code" ? (prev.email ?? prev.target) : "")).slice(0, 200).trim().toLowerCase();
    if (!isValidEmail(raw)) return { step: "input", method: "email", raw, error: "errorEmail" };
    const error = await sendEmailCode(raw);
    if (error) {
      return prev.step === "code" ? { ...prev, error } : { step: "input", method: "email", raw, error };
    }
    return { step: "code", method: "email", target: raw, email: raw, sentAt: Date.now() };
  }

  const raw = String(form.get("phone") ?? (prev.step === "code" ? (prev.phone ?? prev.target) : "")).slice(0, 30);
  const phone = normalizeNgPhone(raw);
  if (!phone || phone === "invalid") return { step: "phone", method: "phone", raw, error: "errorPhone" };
  const error = await sendCode(phone);
  if (error) {
    return prev.step === "code" ? { ...prev, error } : { step: "phone", method: "phone", raw, error };
  }
  return { step: "code", method: "phone", target: phone, phone, sentAt: Date.now() };
}

/** Step 2: check the code. Supabase sets the session cookie; new people continue to onboarding. */
export async function verifyCode(prev: AuthState, form: FormData): Promise<AuthState> {
  if (prev.step !== "code") return { step: "input", method: "phone" };
  const token = String(form.get("code") ?? "").replace(/\s+/g, "");
  if (!/^[0-9]{6,10}$/.test(token)) return { ...prev, error: "errorCode" };

  const supabase = await createClient();
  const method = prev.method;
  const target = prev.target;

  const { data, error } =
    method === "email"
      ? await supabase.auth.verifyOtp({ email: target, token, type: "email" })
      : await supabase.auth.verifyOtp({ phone: `+${target}`, token, type: "sms" });

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
