"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { DbConstants, isInNigeria, nairaToKobo } from "@cultivanode/shared";
import type { ActionState } from "@/actions/account";
import { hasLocale, type Locale } from "@/i18n/config";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

// Listing actions run as the signed-in provider. Row Level Security decides who may create, publish, pause
// or delete (approved role, tier 2, active account, marketplace switched on); these actions shape the input.

const E = DbConstants.public.Enums;
const UNITS = E.pricing_unit;
const ok = (extra: Partial<ActionState> = {}): ActionState => ({ ok: true, at: Date.now(), ...extra });
const bad = (error: string): ActionState => ({ ok: false, error, at: Date.now() });
const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function lang(form: FormData): Locale {
  const l = text(form, "lang", 5);
  return hasLocale(l) ? l : "en";
}

async function signedIn(form: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${lang(form)}/sign-in`);
  return { supabase, uid: data.user.id };
}

type Rates = Partial<Record<(typeof UNITS)[number], number>>;

/** Parses the listing form. Returns an error key or the clean values. */
function parseListingForm(form: FormData) {
  const kind = text(form, "kind", 20);
  if (kind !== "equipment" && kind !== "service") return { error: "errorType" } as const;
  const equipmentType = text(form, "equipment_type", 40);
  const providerType = text(form, "provider_type", 40);
  if (kind === "equipment" && !(E.equipment_type as readonly string[]).includes(equipmentType)) return { error: "errorType" } as const;
  if (kind === "service" && !(E.provider_type as readonly string[]).includes(providerType)) return { error: "errorType" } as const;

  const title = text(form, "title", 200);
  if (title.length < 3 || title.length > 120) return { error: "errorTitle" } as const;
  const description = text(form, "description", 2000) || null;

  const rates: Rates = {};
  for (const unit of UNITS) {
    const raw = text(form, `rate_${unit}`, 20);
    if (!raw) continue;
    const kobo = nairaToKobo(raw);
    if (kobo === null || kobo <= 0 || kobo > 100_000_000_000) return { error: "errorPrice" } as const;
    rates[unit] = kobo;
  }
  if (Object.keys(rates).length === 0) return { error: "errorPrice" } as const;

  const radius = Number(text(form, "service_radius_km", 6));
  if (!Number.isFinite(radius) || radius < 1 || radius > 200) return { error: "errorRadius" } as const;
  const lat = Number(text(form, "latitude", 20));
  const lng = Number(text(form, "longitude", 20));
  if (!isInNigeria(lat, lng)) return { error: "errorLocation" } as const;

  return {
    value: {
      kind: kind as "equipment" | "service",
      equipment_type: kind === "equipment" ? (equipmentType as (typeof E.equipment_type)[number]) : null,
      provider_type: kind === "service" ? (providerType as (typeof E.provider_type)[number]) : null,
      title,
      description,
      operator_included: form.get("operator_included") === "on",
      service_radius_km: Math.round(radius * 10) / 10,
      location: `SRID=4326;POINT(${lng.toFixed(6)} ${lat.toFixed(6)})`,
      status: (form.get("publish") === "on" ? "active" : "draft") as "active" | "draft",
    },
    rates,
  } as const;
}

export async function saveListing(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const parsed = parseListingForm(form);
  if ("error" in parsed) return bad(parsed.error!);
  const { value, rates } = parsed;
  const id = text(form, "id", 36);

  let listingId = id;
  if (id) {
    if (!UUID.test(id)) return bad("errorGeneric");
    // kind, equipment_type/provider_type pairing is fixed at creation; only the matching type can change.
    const { status, equipment_type, title, description, operator_included, service_radius_km, location } = value;
    const update = { equipment_type, title, description, operator_included, service_radius_km, location };
    const wasDraft = text(form, "current_status", 12) === "draft";
    const { error, data } = await s.supabase.from("listings")
      .update({ ...update, status: status === "active" ? "active" : wasDraft ? "draft" : "paused" })
      .eq("id", id).eq("owner_id", s.uid).select("id");
    if (error || !data?.length) {
      logger.warn("listing_update_failed", { code: error?.code });
      return bad(error?.code === "42501" || !data?.length ? "errorNotAllowed" : "errorGeneric");
    }
  } else {
    // Insert as a draft first so the prices can be added, then publish if asked.
    const { data, error } = await s.supabase.from("listings")
      .insert({ ...value, status: "draft" }).select("id").single();
    if (error || !data) {
      logger.warn("listing_insert_failed", { code: error?.code });
      return bad(error?.code === "42501" ? "errorNotAllowed" : "errorGeneric");
    }
    listingId = data.id;
  }

  // Prices: replace the set. A listing without prices never shows in search, so a failure here is safe.
  const rows = Object.entries(rates).map(([unit, rate_kobo]) => ({ listing_id: listingId, unit: unit as (typeof UNITS)[number], rate_kobo: rate_kobo! }));
  const { error: dropError } = await s.supabase.from("listing_rates").delete().eq("listing_id", listingId);
  const { error: rateError } = dropError ? { error: dropError } : await s.supabase.from("listing_rates").insert(rows);
  if (rateError) {
    logger.warn("listing_rates_failed", { code: rateError.code });
    refresh();
    return bad("errorGeneric");
  }

  if (!id && value.status === "active") {
    const { error, data } = await s.supabase.from("listings").update({ status: "active" }).eq("id", listingId).select("id");
    refresh();
    if (error || !data?.length) return bad("errorNotAllowed");
  }
  refresh();
  return ok({ message: "saved" });
}

export async function setListingStatus(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const id = text(form, "id", 36);
  const to = text(form, "to", 10);
  if (!UUID.test(id) || (to !== "active" && to !== "paused")) return bad("errorGeneric");
  const { error, data } = await s.supabase.from("listings").update({ status: to }).eq("id", id).eq("owner_id", s.uid).select("id");
  refresh();
  if (error || !data?.length) return bad("errorNotAllowed");
  return ok();
}

export async function deleteListing(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn(form);
  const id = text(form, "id", 36);
  if (!UUID.test(id)) return bad("errorGeneric");
  const { error } = await s.supabase.from("listings").delete().eq("id", id).eq("owner_id", s.uid);
  refresh();
  if (error) return bad("errorGeneric");
  return ok();
}
