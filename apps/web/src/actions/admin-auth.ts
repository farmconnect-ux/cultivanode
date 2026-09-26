"use server";

import { redirect } from "next/navigation";
import { normalizeNgPhone } from "@tillmate/shared";
import { ADMIN_HOME, ADMIN_SIGN_IN } from "@/lib/admin/paths";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type SignInState =
  | { step: "phone"; error?: string; phone?: string }
  | { step: "code"; phone: string; error?: string };

/** Step 1: text a sign-in code to the number (through the SMS provider chosen in Integrations). */
export async function sendSignInCode(_prev: SignInState, form: FormData): Promise<SignInState> {
  const raw = String(form.get("phone") ?? "");
  const phone = normalizeNgPhone(raw);
  if (!phone || phone === "invalid") {
    return { step: "phone", phone: raw, error: "Enter a Nigerian mobile number, for example 0803 123 4567." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: `+${phone}` });
  if (error) {
    // The phone number is never logged (the logger redacts it anyway).
    logger.warn("admin_sign_in_code_failed", { reason: error.code ?? error.name, status: error.status });
    const busy = error.status === 429;
    return {
      step: "phone",
      phone: raw,
      error: busy ? "Too many codes requested. Wait a minute and try again." : "We could not send a code. Try again shortly.",
    };
  }
  return { step: "code", phone };
}

/** Step 2: check the code; Supabase sets the session cookie. */
export async function verifySignInCode(prev: SignInState, form: FormData): Promise<SignInState> {
  const phone = prev.step === "code" ? prev.phone : "";
  const token = String(form.get("code") ?? "").replace(/\s+/g, "");
  if (!phone) return { step: "phone" };
  if (!/^[0-9]{6}$/.test(token)) return { step: "code", phone, error: "Enter the 6-digit code from the SMS." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ phone: `+${phone}`, token, type: "sms" });
  if (error) {
    return { step: "code", phone, error: "That code is wrong or has expired. Check it, or ask for a new one." };
  }
  redirect(ADMIN_HOME);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ADMIN_SIGN_IN);
}
