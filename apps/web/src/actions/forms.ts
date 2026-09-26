"use server";

import { isValidEmail, normalizeNgPhone } from "@tillmate/shared";
import { createAnonClient } from "@/lib/supabase/anon";
import { hasLocale, type Locale } from "@/i18n/config";

// Error keys map to dictionary strings in `forms` (see i18n/dictionaries/en.ts).
export type FormErrorKey =
  | "errorGeneric"
  | "errorName"
  | "errorContact"
  | "errorPhone"
  | "errorEmail"
  | "errorMessage"
  | "errorSide"
  | "errorBusy";

export type FormState = {
  status: "idle" | "success" | "error";
  error?: FormErrorKey;
  fields?: Partial<Record<"name" | "phone" | "email" | "message" | "side", FormErrorKey>>;
  // What the person typed, so the form can refill itself after an error (React resets forms after an action).
  values?: Record<string, string>;
};

function text(form: FormData, key: string, max: number): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function languageOf(form: FormData): Locale {
  const lang = text(form, "lang", 5);
  return hasLocale(lang) ? lang : "en";
}

// Bots fill every field, including the hidden "company" field that people never see.
function isBot(form: FormData): boolean {
  return text(form, "company", 200) !== "";
}

function contactErrors(phoneRaw: string, email: string): FormState["fields"] {
  const fields: FormState["fields"] = {};
  const phone = normalizeNgPhone(phoneRaw);
  if (phone === "invalid") fields.phone = "errorPhone";
  if (email && !isValidEmail(email)) fields.email = "errorEmail";
  if (!phone && !email) fields.phone = "errorContact";
  return fields;
}

function mapDbError(code: string | undefined): FormErrorKey {
  if (code === "54000") return "errorBusy";
  if (code === "22023") return "errorPhone";
  return "errorGeneric";
}

export async function joinWaitlist(_prev: FormState, form: FormData): Promise<FormState> {
  if (isBot(form)) return { status: "success" };

  const side = text(form, "side", 10);
  const name = text(form, "name", 120);
  const phone = text(form, "phone", 30);
  const email = text(form, "email", 200);
  const state = text(form, "state", 60);
  const interest = text(form, "interest", 500);

  const fields = contactErrors(phone, email) ?? {};
  if (side !== "buyer" && side !== "seller") fields.side = "errorSide";
  if (name.length < 2) fields.name = "errorName";
  const values = { side, name, phone, email, state, interest };
  if (Object.keys(fields).length) return { status: "error", fields, values };

  const { error } = await createAnonClient().rpc("join_waitlist", {
    p_side: side as "buyer" | "seller",
    p_full_name: name,
    p_phone: phone || undefined,
    p_email: email || undefined,
    p_state: state || undefined,
    p_interest: interest || undefined,
    p_language: languageOf(form),
  });
  if (error) {
    console.error("join_waitlist failed", error.code, error.message);
    return { status: "error", error: mapDbError(error.code), values };
  }
  return { status: "success" };
}

export async function sendContactMessage(_prev: FormState, form: FormData): Promise<FormState> {
  if (isBot(form)) return { status: "success" };

  const name = text(form, "name", 120);
  const phone = text(form, "phone", 30);
  const email = text(form, "email", 200);
  const message = text(form, "message", 2000);

  const fields = contactErrors(phone, email) ?? {};
  if (name.length < 2) fields.name = "errorName";
  if (message.length < 5) fields.message = "errorMessage";
  const values = { name, phone, email, message };
  if (Object.keys(fields).length) return { status: "error", fields, values };

  const { error } = await createAnonClient().rpc("send_contact_message", {
    p_full_name: name,
    p_message: message,
    p_phone: phone || undefined,
    p_email: email || undefined,
    p_language: languageOf(form),
  });
  if (error) {
    console.error("send_contact_message failed", error.code, error.message);
    return { status: "error", error: mapDbError(error.code), values };
  }
  return { status: "success" };
}
