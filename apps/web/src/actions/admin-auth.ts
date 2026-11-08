"use server";

import { redirect } from "next/navigation";
import { normalizeNgPhone } from "@cultivanode/shared";
import { ADMIN_HOME, ADMIN_SIGN_IN } from "@/lib/admin/paths";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type SignInState =
  | { step: "phone"; error?: string; phone?: string }
  | { step: "code"; phone: string; kind?: "phone" | "email"; error?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Step 1: send a sign-in code to the staff member's email, or text it to their phone (through the SMS
 * provider chosen in Integrations). Email works even while no SMS provider is set up.
 */
export async function sendSignInCode(_prev: SignInState, form: FormData): Promise<SignInState> {
  const raw = String(form.get("phone") ?? "").trim().slice(0, 254);
  const supabase = await createClient();
  if (raw.includes("@")) {
    const email = raw.toLowerCase();
    if (!EMAIL.test(email)) return { step: "phone", phone: raw, error: "Enter a valid email address." };
    // Staff accounts already exist: never create a new account from the staff sign-in page.
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) {
      logger.warn("admin_sign_in_code_failed", { reason: error.code ?? error.name, status: error.status, kind: "email" });
      const busy = error.status === 429;
      return { step: "phone", phone: raw, error: busy ? "Too many codes requested. Wait a minute and try again." : "We could not send a code to that email. Check it is the one on your staff account." };
    }
    return { step: "code", phone: email, kind: "email" };
  }
  const phone = normalizeNgPhone(raw);
  if (!phone || phone === "invalid") {
    return { step: "phone", phone: raw, error: "Enter your staff email, or a Nigerian mobile number such as 0803 123 4567." };
  }
  const { error } = await supabase.auth.signInWithOtp({ phone: `+${phone}`, options: { shouldCreateUser: false } });
  if (error) {
    // The phone number is never logged (the logger redacts it anyway).
    logger.warn("admin_sign_in_code_failed", { reason: error.code ?? error.name, status: error.status, kind: "phone" });
    const busy = error.status === 429;
    return {
      step: "phone",
      phone: raw,
      error: busy ? "Too many codes requested. Wait a minute and try again." : "We could not text a code. Try signing in with your email instead.",
    };
  }
  return { step: "code", phone, kind: "phone" };
}

/** Step 2: check the code; Supabase sets the session cookie. */
export async function verifySignInCode(prev: SignInState, form: FormData): Promise<SignInState> {
  const target = prev.step === "code" ? prev.phone : "";
  const kind = prev.step === "code" ? (prev.kind ?? "phone") : "phone";
  const token = String(form.get("code") ?? "").replace(/\s+/g, "");
  if (!target) return { step: "phone" };
  if (!/^[0-9]{6,10}$/.test(token)) return { step: "code", phone: target, kind, error: "Enter the verification code we sent you." };

  const supabase = await createClient();
  const { error } =
    kind === "email"
      ? await supabase.auth.verifyOtp({ email: target, token, type: "email" })
      : await supabase.auth.verifyOtp({ phone: `+${target}`, token, type: "sms" });
  if (error) {
    return { step: "code", phone: target, kind, error: "That code is wrong or has expired. Check it, or ask for a new one." };
  }
  redirect(ADMIN_HOME);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ADMIN_SIGN_IN);
}
