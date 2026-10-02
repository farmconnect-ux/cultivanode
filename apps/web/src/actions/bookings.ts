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
const PROOF_KINDS = new Set(["before", "after", "extra"]);
const RATING_TAGS = new Set([
  "on_time", "good_work", "careful", "fair_price", "good_communication",
  "late", "poor_work", "overcharged", "rude", "no_show",
]);
const CODES = new Set([
  "not_signed_in", "account_suspended", "farmer_role_needed", "marketplace_closed", "farm_not_found", "listing_unavailable",
  "own_listing", "bad_unit", "bad_quantity", "bad_date", "out_of_range", "too_many_requests", "duplicate_request", "not_found",
  "not_allowed", "wrong_status", "expired", "counterpart_unavailable", "too_late", "reason_needed",
  "not_job_day", "no_gps", "too_far_from_farm", "bad_kind", "proof_not_found", "too_many_proofs", "bad_photo_time",
  "photo_too_far", "proof_needed", "bad_amount", "bad_rating", "already_rated",
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

/** A booking id from a form, or null. */
function bookingId(form: FormData): string | null {
  const id = text(form, "id", 36);
  return UUID.test(id) ? id : null;
}

/** GPS from the browser: two finite numbers in range, or null (not both ways). */
function coords(form: FormData): { lat: number; lng: number } | null | "mixed" {
  const lat = Number(text(form, "lat", 20));
  const lng = Number(text(form, "lng", 20));
  const hasLat = text(form, "lat", 20) !== "";
  const hasLng = text(form, "lng", 20) !== "";
  if (hasLat !== hasLng) return "mixed";
  if (!hasLat) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return "mixed";
  return { lat, lng };
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
  const id = bookingId(form);
  const move = text(form, "do", 10) as Move;
  if (!id || !["accept", "decline", "cancel"].includes(move)) return bad("errorGeneric");
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

/** The provider arrives: browser GPS, checked against the farm pin in the database. */
export async function checkInBooking(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await signedIn(form);
  const id = bookingId(form);
  if (!id) return bad("errorGeneric");
  const c = coords(form);
  if (!c || c === "mixed") return bad("no_gps");

  const { error } = await supabase.rpc("check_in_booking", { p_booking: id, p_lat: c.lat, p_lng: c.lng });
  refresh();
  if (error) return bad(codeOf(error, "check_in"));
  return ok();
}

/** One proof photo, already uploaded (EXIF-stripped) by the browser into the booking's folder. */
export async function submitProof(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await signedIn(form);
  const id = bookingId(form);
  const path = text(form, "path", 200);
  const kind = text(form, "kind", 10);
  const takenAt = text(form, "taken_at", 40);
  if (!id || !path || !PROOF_KINDS.has(kind) || Number.isNaN(Date.parse(takenAt))) return bad("proof_not_found");
  const c = coords(form);
  if (c === "mixed") return bad("no_gps");
  const hectares = Number(text(form, "hectares", 12).replace(",", "."));

  const { error } = await supabase.rpc("submit_proof", {
    p_booking: id,
    p_path: path,
    p_kind: kind as "before" | "after" | "extra",
    p_taken_at: new Date(takenAt).toISOString(),
    ...(c ? { p_lat: c.lat, p_lng: c.lng } : {}),
    ...(Number.isFinite(hectares) && hectares > 0 ? { p_hectares: Math.round(hectares * 100) / 100 } : {}),
  });
  refresh();
  if (error) return bad(codeOf(error, "submit_proof"));
  return ok({ message: "photoAdded" });
}

/** The job is done: hands over to the farmer's 48-hour window. */
export async function finishWork(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await signedIn(form);
  const id = bookingId(form);
  if (!id) return bad("errorGeneric");
  const hectares = Number(text(form, "hectares", 12).replace(",", "."));

  const { error } = await supabase.rpc("finish_booking_work", {
    p_booking: id,
    ...(Number.isFinite(hectares) && hectares > 0 ? { p_hectares: Math.round(hectares * 100) / 100 } : {}),
  });
  refresh();
  if (error) return bad(codeOf(error, "finish_work"));
  return ok();
}

export async function confirmWork(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await signedIn(form);
  const id = bookingId(form);
  if (!id) return bad("errorGeneric");

  const { error } = await supabase.rpc("confirm_booking", { p_booking: id });
  refresh();
  if (error) return bad(codeOf(error, "confirm"));
  return ok();
}

export async function disputeBooking(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await signedIn(form);
  const id = bookingId(form);
  const reason = text(form, "reason", 500);
  if (!id) return bad("errorGeneric");
  if (reason.length < 5) return bad("reason_needed");

  const { error } = await supabase.rpc("dispute_booking", { p_booking: id, p_reason: reason });
  refresh();
  if (error) return bad(codeOf(error, "dispute"));
  return ok();
}

/** No money moves through CultivaNode in the pilot: each side marks what was paid or received. */
export async function markPaid(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await signedIn(form);
  const id = bookingId(form);
  if (!id) return bad("errorGeneric");
  const naira = Number(text(form, "amount", 14).replace(/[,\s]/g, ""));
  if (!Number.isFinite(naira) || naira <= 0) return bad("bad_amount");

  const { error } = await supabase.rpc("mark_paid", { p_booking: id, p_amount_kobo: Math.round(naira * 100) });
  refresh();
  if (error) return bad(codeOf(error, "mark_paid"));
  return ok();
}

export async function rateBooking(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await signedIn(form);
  const id = bookingId(form);
  const stars = Number(text(form, "stars", 2));
  if (!id) return bad("errorGeneric");
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return bad("bad_rating");
  const tags = form.getAll("tags").map(String).filter((x) => RATING_TAGS.has(x)).slice(0, 5);

  const { error } = await supabase.rpc("rate_booking", {
    p_booking: id,
    p_stars: stars,
    p_tags: tags,
    p_comment: text(form, "comment", 500) || undefined,
  });
  refresh();
  if (error) return bad(codeOf(error, "rate"));
  return ok();
}
