"use server";

import { contactSchema, fieldErrors, fromDatabaseError, waitlistSchema } from "@cultivanode/shared";
import { createAnonClient } from "@/lib/supabase/anon";
import { reportError } from "@/lib/monitoring";

// Error keys map to dictionary strings in `forms` (see i18n/dictionaries/en.ts).
export type FormErrorKey =
  | "errorGeneric"
  | "errorName"
  | "errorContact"
  | "errorPhone"
  | "errorEmail"
  | "errorMessage"
  | "errorSide"
  | "errorBusy"
  | "errorTooLong";

type Field = "name" | "phone" | "email" | "message" | "side" | "state" | "interest";

export type FormState = {
  status: "idle" | "success" | "error";
  error?: FormErrorKey;
  fields?: Partial<Record<Field, FormErrorKey>>;
  // What the person typed, so the form can refill itself after an error (React resets forms after an action).
  values?: Record<string, string>;
};

/** Raw form values as strings (length-capped before validation). */
function read(form: FormData, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = form.get(key);
    out[key] = typeof v === "string" ? v.slice(0, 2500) : "";
  }
  return out;
}

// Bots fill every field, including the hidden "company" field that people never see.
function isBot(form: FormData): boolean {
  const v = form.get("company");
  return typeof v === "string" && v.trim() !== "";
}

function toFormError(code: string): FormErrorKey {
  if (code === "rate_limited") return "errorBusy";
  if (code === "validation") return "errorPhone";
  return "errorGeneric";
}

export async function joinWaitlist(_prev: FormState, form: FormData): Promise<FormState> {
  if (isBot(form)) return { status: "success" };

  const values = read(form, ["side", "name", "phone", "email", "state", "interest", "lang"]);
  const parsed = waitlistSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fields: fieldErrors(parsed.error) as FormState["fields"], values };
  }
  const input = parsed.data;

  const { error } = await createAnonClient().rpc("join_waitlist", {
    p_side: input.side,
    p_full_name: input.name,
    p_phone: input.phone,
    p_email: input.email,
    p_state: input.state,
    p_interest: input.interest,
    p_language: input.lang,
  });
  if (error) {
    const appError = fromDatabaseError(error);
    reportError(appError, { area: "forms", action: "join_waitlist" });
    return { status: "error", error: toFormError(appError.code), values };
  }
  return { status: "success" };
}

export async function sendContactMessage(_prev: FormState, form: FormData): Promise<FormState> {
  if (isBot(form)) return { status: "success" };

  const values = read(form, ["name", "phone", "email", "message", "lang"]);
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fields: fieldErrors(parsed.error) as FormState["fields"], values };
  }
  const input = parsed.data;

  const { error } = await createAnonClient().rpc("send_contact_message", {
    p_full_name: input.name,
    p_message: input.message,
    p_phone: input.phone,
    p_email: input.email,
    p_language: input.lang,
  });
  if (error) {
    const appError = fromDatabaseError(error);
    reportError(appError, { area: "forms", action: "send_contact_message" });
    return { status: "error", error: toFormError(appError.code), values };
  }
  return { status: "success" };
}
