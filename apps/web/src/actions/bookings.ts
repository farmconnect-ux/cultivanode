"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { DbConstants } from "@cultivanode/shared";
import type { ActionState } from "@/actions/account";
import { hasLocale, type Locale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

// Booking actions call the database transition functions as the signed-in person. The database checks who
// may do what, the status, the time window, suspension and the kill switch, and sets the price itself; these
// actions only shape input and turn the database's error code (HINT) into a dictionary key.

const UNITS = DbConstants.public.Enums.pricing_unit;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODES = new Set([
  "not_signed_in", "account_suspended", "farmer_role_needed", "marketplace_closed", "farm_not_found", "listing_unavailable",
  "own_listing", "bad_unit", "bad_quantity", "bad_date", "out_of_range", "too_many_requests", "duplicate_request", "not_found",
  "not_allowed", "wrong_status", "expired", "counterpart_unavailable", "too_late", "reason_needed",
]);

const ok = (extra: Partial<ActionState> = {}): ActionState => ({ ok: true, at: Date.now(), ...extra });
const bad = (error: string): ActionState => ({ ok: false, error, at: Date.now() });
const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

function lang(form: FormData): Locale {
  const l = text(form, "lang", 5);
  return hasLocale(l) ? l : "en";
}

/** The database's stable error code, or the generic message. */
function codeOf(error: { hint?: string | null; code?: string } | null, op: string): string {
  const hint = error?.hint ?? "";
  if (CODES.has(hint)) return hint;
  logger.warn("booking_action_failed", { op, code: error?.code });
  return "errorGeneric";
}

async function signedIn(form: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${lang(form)}/sign-in`);
  return supabase;
}

export async function requestBooking(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await signedIn(form);
  const listing = text(form, "listing", 36);
  const farm = text(form, "farm", 36);
  if (!UUID.test(listing) || !UUID.test(farm)) return bad("listing_unavailable");
  const unit = text(form, "unit", 10);
  if (!(UNITS as readonly string[]).includes(unit)) return bad("bad_unit");
  const date = text(form, "job_date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad("bad_date");
  const quantity = Number(text(form, "quantity", 12).replace(",", "."));
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10000) return bad("bad_quantity");

  const { data, error } = await supabase.rpc("request_booking", {
    p_listing: listing,
    p_farm: farm,
    p_job_date: date,
    p_unit: unit as (typeof UNITS)[number],
    p_quantity: Math.round(quantity * 100) / 100,
    p_note: text(form, "note", 500) || undefined,
  });
  if (error || !data) return bad(codeOf(error, "request"));
  redirect(`/${lang(form)}/account/bookings/${data}`);
}

type Move = "accept" | "decline" | "cancel";

export async function answerBooking(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await signedIn(form);
  const id = text(form, "id", 36);
  const move = text(form, "do", 10) as Move;
  if (!UUID.test(id) || !["accept", "decline", "cancel"].includes(move)) return bad("errorGeneric");
  const reason = text(form, "reason", 500) || undefined;

  const { error } =
    move === "accept" ? await supabase.rpc("accept_booking", { p_booking: id })
    : move === "decline" ? await supabase.rpc("decline_booking", { p_booking: id, p_reason: reason })
    : await supabase.rpc("cancel_booking", { p_booking: id, p_reason: reason });
  refresh();
  if (error) return bad(codeOf(error, move));
  return ok();
}

export async function markInboxRead(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await signedIn(form);
  const { error } = await supabase.rpc("mark_notifications_read", {});
  refresh();
  if (error) return bad(codeOf(error, "inbox"));
  return ok();
}
