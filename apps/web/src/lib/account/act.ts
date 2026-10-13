// Helpers for the live-module server actions. Every action runs as the signed-in person; row level
// security decides what they may touch, so these helpers only shape input and translate errors.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormResult } from "@/components/live/action-form";
import { hasLocale, type Locale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ok = (message: string): FormResult => ({ ok: true, message, at: Date.now() });
export const fail = (message: string): FormResult => ({ ok: false, message, at: Date.now() });

export function langOf(form: FormData): Locale {
  const l = String(form.get("lang") ?? "");
  return hasLocale(l) ? l : "en";
}

/** The signed-in person and a database client bound to their session. */
export async function actor(form: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${langOf(form)}/sign-in`);
  return { supabase, uid: data.user.id };
}

export function text(form: FormData, key: string, max = 200): string {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

export function optText(form: FormData, key: string, max = 500): string | null {
  return text(form, key, max) || null;
}

export function id(form: FormData, key: string): string | null {
  const v = text(form, key, 36);
  return UUID.test(v) ? v : null;
}

/** A finite number, or null when blank or invalid. */
export function num(form: FormData, key: string): number | null {
  const raw = text(form, key, 40).replace(/,/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Naira typed in a form to kobo for storage. */
export function kobo(form: FormData, key: string): number | null {
  const n = num(form, key);
  return n === null ? null : Math.round(n * 100);
}

/** YYYY-MM-DD or null. */
export function date(form: FormData, key: string): string | null {
  const v = text(form, key, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export function oneOf<T extends string>(form: FormData, key: string, list: readonly T[], fallback?: T): T | null {
  const v = text(form, key, 60);
  return (list as readonly string[]).includes(v) ? (v as T) : (fallback ?? null);
}

export const today = () => new Date().toISOString().slice(0, 10);

/** Turn a database error into a short sentence for the form, logging the code (never the payload). */
export function dbFail(error: { code?: string; message?: string; hint?: string | null } | null, op: string): FormResult {
  const code = error?.code ?? "";
  logger.warn("live_action_failed", { op, code });
  if (code === "42501" || code === "PGRST301") return fail("You don't have permission to change that record.");
  if (code === "23505") return fail("That already exists — use a different code or name.");
  if (code === "23514") return fail("One of the values isn't allowed. Check the numbers and dates.");
  if (code === "23503") return fail("A linked record is missing. Refresh the page and try again.");
  if (code === "23502") return fail("A required field is missing.");
  return fail("Couldn't save that just now. Please try again.");
}

/** Revalidate one or more account pages for every locale. */
export function refreshPages(...paths: string[]) {
  for (const p of paths) revalidatePath(`/[lang]/account${p}`, "page");
}
