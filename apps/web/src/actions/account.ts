"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  ACRES_PER_HECTARE,
  DbConstants,
  isInNigeria,
  isValidEmail,
  LEGAL_VERSION,
  NIGERIAN_STATES,
  VERIFICATION_UPLOAD_LIMITS,
} from "@cultivanode/shared";
import { hasLocale, type Locale } from "@/i18n/config";
import { callFunction } from "@/lib/account/functions";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

// Account actions run as the signed-in person. Row Level Security and the database functions decide what
// they may change; these actions only shape input and turn database errors into translated messages.
// `error` values are dictionary keys; the forms look them up.

export type ActionState = { ok?: boolean; error?: string; message?: string; at?: number; data?: Record<string, string> };

const E = DbConstants.public.Enums;
const ok = (extra: Partial<ActionState> = {}): ActionState => ({ ok: true, at: Date.now(), ...extra });
const bad = (error: string, extra: Partial<ActionState> = {}): ActionState => ({ ok: false, error, at: Date.now(), ...extra });

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);
const oneOf = <T extends string>(value: string, list: readonly T[]): T | null =>
  (list as readonly string[]).includes(value) ? (value as T) : null;

function lang(form: FormData): Locale {
  const l = text(form, "lang", 5);
  return hasLocale(l) ? l : "en";
}

async function signedIn() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { supabase, uid: data.user.id };
}

/* ------------------------------------------------------------------ profile */

export async function updateProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const email = text(form, "email", 200);
  if (email && !isValidEmail(email)) return bad("errorEmail");
  const stateRaw = text(form, "state", 60);
  const language = oneOf(text(form, "preferred_language", 5), E.app_language) ?? "en";

  const { data: me } = await s.supabase.from("profiles").select("verification_tier").eq("id", s.uid).single();
  const update: { email: string | null; state: string | null; lga: string | null; preferred_language: typeof language; full_name?: string } = {
    email: email ? email.toLowerCase() : null,
    state: (NIGERIAN_STATES as readonly string[]).includes(stateRaw) ? stateRaw : null,
    lga: text(form, "lga", 60) || null,
    preferred_language: language,
  };
  // The name is what identity checks compare against: it is locked once the NIN is verified.
  if ((me?.verification_tier ?? 0) === 0) {
    const name = text(form, "full_name", 120);
    if (name.length < 2) return bad("errorName");
    update.full_name = name;
  }
  const { error } = await s.supabase.from("profiles").update(update).eq("id", s.uid);
  if (error) {
    logger.warn("profile_update_failed", { code: error.code });
    return bad("errorGeneric");
  }
  refresh();
  return ok();
}

/* ------------------------------------------------------------------ roles and documents */

export async function requestRole(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const role = oneOf(text(form, "role", 40), E.app_role);
  if (!role) return bad("errorRoles");
  const providerType = role === "service_provider" ? oneOf(text(form, "provider_type", 40), E.provider_type) : null;
  if (role === "service_provider" && !providerType) return bad("errorProviderType");
  const note = text(form, "details", 500);

  const { error } = await s.supabase.from("role_requests").insert({
    role,
    provider_type: providerType,
    details: note ? { note } : {},
  });
  if (error) {
    if (error.code === "23505") return bad("errorDuplicate");
    if (error.code === "P0001") return bad("errorHeld");
    logger.warn("role_request_failed", { code: error.code });
    return bad("errorGeneric");
  }
  refresh();
  return ok();
}

/** Instant activation of auto-approved farmer roles (crop_farmer or animal_farmer). */
export async function enableFarmerRole(form: FormData): Promise<void> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const requestedRole = text(form, "role", 40);
  const role = (requestedRole === "animal_farmer" ? "animal_farmer" : "crop_farmer") as "crop_farmer" | "animal_farmer";

  // Check if role is already held
  const { data: held } = await s.supabase
    .from("user_roles")
    .select("id")
    .eq("profile_id", s.uid)
    .eq("role", role)
    .maybeSingle();

  if (!held) {
    // Check if there is already a pending request
    const { data: pending } = await s.supabase
      .from("role_requests")
      .select("id")
      .eq("profile_id", s.uid)
      .eq("role", role)
      .eq("status", "pending")
      .maybeSingle();

    if (pending) {
      // Cancel pending request so re-inserting triggers auto-approval
      await s.supabase.rpc("cancel_role_request", { p_request_id: pending.id });
    }

    const { error } = await s.supabase.from("role_requests").insert({
      role,
      provider_type: null,
      details: { source: "farmer_quick_activation" },
    });
    if (error && error.code !== "23505" && error.code !== "P0001") {
      logger.warn("enable_farmer_role_failed", { code: error.code });
    }
  }

  refresh();
}

export async function cancelRoleRequest(form: FormData): Promise<void> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const id = text(form, "request_id", 36);
  await s.supabase.rpc("cancel_role_request", { p_request_id: id });
  refresh();
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function uploadDocument(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const requestId = text(form, "request_id", 36);
  const docType = oneOf(text(form, "document_type", 40), E.verification_document_type);
  const file = form.get("file");
  if (!docType) return bad("errorGeneric");
  if (!(file instanceof File) || file.size === 0) return bad("errorFile");
  if (!(VERIFICATION_UPLOAD_LIMITS.mimeTypes as readonly string[]).includes(file.type)) return bad("errorFile");
  if (file.size > VERIFICATION_UPLOAD_LIMITS.maxBytes) return bad("errorFileSize");

  // Stored in the person's own private folder; staff open it through short-lived signed links.
  const path = `${s.uid}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const bucket = s.supabase.storage.from("verification-documents");
  const up = await bucket.upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) {
    logger.warn("document_upload_failed", { reason: up.error.name });
    return bad("errorGeneric");
  }
  const { error } = await s.supabase.from("verification_documents").insert({
    role_request_id: /^[0-9a-f-]{36}$/.test(requestId) ? requestId : null,
    document_type: docType,
    storage_path: path,
    mime_type: file.type,
    size_bytes: file.size,
  });
  if (error) {
    logger.warn("document_record_failed", { code: error.code });
    await bucket.remove([path]);
    return bad("errorGeneric");
  }
  refresh();
  return ok();
}

/* ------------------------------------------------------------------ consents */

export async function setConsent(form: FormData): Promise<void> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const type = oneOf(text(form, "consent_type", 40), E.consent_type);
  const granted = form.get("granted") === "true";
  // Terms and privacy can only be withdrawn by closing the account.
  if (!type || ((type === "terms_of_use" || type === "privacy_policy") && !granted)) return;
  const { error } = await s.supabase.from("consents").insert({
    consent_type: type,
    granted,
    document_version: LEGAL_VERSION,
    channel: "web",
  });
  if (error) logger.warn("consent_failed", { code: error.code });
  refresh();
}

/* ------------------------------------------------------------------ identity checks */

type CheckResult = { status: "verified" | "failed"; failure_reason: string | null; tier: number | null };

export async function checkIdentity(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const kind = oneOf(text(form, "kind", 20), ["nin", "bvn", "bank_account"] as const);
  if (!kind) return bad("generic");
  const number = text(form, "number", 20).replace(/\s+/g, "");
  const bankCode = text(form, "bank_code", 10);
  const digits = kind === "bank_account" ? 10 : 11;
  if (!new RegExp(`^[0-9]{${digits}}$`).test(number)) return bad("invalid_number");
  if (kind === "bank_account" && !/^[0-9A-Za-z]{2,10}$/.test(bankCode)) return bad("invalid_number");

  const res = await callFunction<CheckResult>("verify-identity", {
    action: kind,
    number,
    ...(kind === "bank_account" ? { bank_code: bankCode } : {}),
  });
  refresh();
  if (!res.ok) return bad(res.error);
  if (res.data.status === "verified") return ok({ message: "verified" });
  return bad(res.data.failure_reason ?? "not_found", { data: { kind: "result" } });
}

const STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  Oyo: { lat: 7.3775, lng: 3.8967 },
  Ogun: { lat: 7.1604, lng: 3.3484 },
  Osun: { lat: 7.5629, lng: 4.5200 },
  Ondo: { lat: 7.2571, lng: 5.2058 },
  Ekiti: { lat: 7.6210, lng: 5.2215 },
  Lagos: { lat: 6.5244, lng: 3.3792 },
  Abia: { lat: 5.4527, lng: 7.5248 },
  Adamawa: { lat: 9.3265, lng: 12.3984 },
  "Akwa Ibom": { lat: 5.0377, lng: 7.9128 },
  Anambra: { lat: 6.2209, lng: 7.0719 },
  Bauchi: { lat: 10.3158, lng: 9.8442 },
  Bayelsa: { lat: 4.7719, lng: 6.0699 },
  Benue: { lat: 7.7304, lng: 8.5211 },
  Borno: { lat: 11.8333, lng: 13.1500 },
  "Cross River": { lat: 5.9631, lng: 8.3300 },
  Delta: { lat: 5.5325, lng: 5.8987 },
  Ebonyi: { lat: 6.2649, lng: 8.0137 },
  Edo: { lat: 6.3350, lng: 5.6037 },
  Enugu: { lat: 6.4584, lng: 7.5464 },
  "FCT (Abuja)": { lat: 9.0765, lng: 7.3986 },
  Gombe: { lat: 10.2897, lng: 11.1673 },
  Imo: { lat: 5.4836, lng: 7.0333 },
  Jigawa: { lat: 12.2280, lng: 9.5616 },
  Kaduna: { lat: 10.5105, lng: 7.4165 },
  Kano: { lat: 12.0022, lng: 8.5920 },
  Katsina: { lat: 12.9908, lng: 7.6018 },
  Kebbi: { lat: 12.4504, lng: 4.1999 },
  Kogi: { lat: 7.7969, lng: 6.7408 },
  Kwara: { lat: 8.4966, lng: 4.5421 },
  Nasarawa: { lat: 8.4932, lng: 8.5153 },
  Niger: { lat: 9.6139, lng: 6.5569 },
  Plateau: { lat: 9.8965, lng: 8.8583 },
  Rivers: { lat: 4.8156, lng: 7.0498 },
  Sokoto: { lat: 13.0609, lng: 5.2340 },
  Taraba: { lat: 8.8937, lng: 11.3596 },
  Yobe: { lat: 12.0000, lng: 11.5000 },
  Zamfara: { lat: 12.1628, lng: 6.6614 },
};

/* ------------------------------------------------------------------ farms */

export async function addFarm(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const name = text(form, "name", 120);
  if (name.length < 2) return bad("errorName");
  let lat = Number(text(form, "latitude", 20));
  let lng = Number(text(form, "longitude", 20));
  const stateRaw = text(form, "state", 60);

  // If coordinates are missing or outside Nigeria, fallback to state centroid if provided
  if (!isInNigeria(lat, lng)) {
    const fallback = STATE_CENTROIDS[stateRaw];
    if (fallback) {
      lat = fallback.lat;
      lng = fallback.lng;
    } else {
      return bad("errorLocation");
    }
  }

  const sizeRaw = text(form, "size", 12);
  let areaHa: number | null = null;
  if (sizeRaw) {
    const size = Number(sizeRaw.replace(",", "."));
    if (!Number.isFinite(size) || size <= 0 || size > 100000) return bad("errorSize");
    areaHa = form.get("unit") === "acres" ? size / ACRES_PER_HECTARE : size;
    areaHa = Math.round(areaHa * 10000) / 10000;
  }
  const forProfile = text(form, "for_profile", 36);

  const row = {
    name,
    location: `SRID=4326;POINT(${lng.toFixed(6)} ${lat.toFixed(6)})`,
    area_ha: areaHa,
    state: (NIGERIAN_STATES as readonly string[]).includes(stateRaw) ? stateRaw : null,
    lga: text(form, "lga", 60) || null,
    owner_id: forProfile && forProfile !== s.uid ? forProfile : s.uid,
    ...(forProfile && forProfile !== s.uid ? { onboarded_by: s.uid } : {}),
  };

  let { data: newFarm, error } = await s.supabase.from("farms").insert(row).select("id").single();

  // If RLS blocked due to missing farmer role, auto-activate crop_farmer and retry
  if (error && error.code === "42501") {
    try {
      await s.supabase.from("role_requests").insert({
        role: "crop_farmer",
        provider_type: null,
        details: { source: "farm_registration_auto_activate" },
      });
      const retry = await s.supabase.from("farms").insert(row).select("id").single();
      newFarm = retry.data;
      error = retry.error;
    } catch {
      // Continue to error handler below
    }
  }

  if (error) {
    logger.warn("farm_insert_failed", { code: error.code, message: error.message });
    return bad(error.code === "42501" ? "needsFarmerRole" : "errorGeneric");
  }

  refresh();
  if (newFarm?.id) {
    redirect(`/${lang(form)}/account/farms`);
  }
  return ok();
}

/* ------------------------------------------------------------------ business staff */

export async function updateBusiness(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const org = text(form, "organization_id", 36);
  const name = text(form, "name", 160);
  if (name.length < 2) return bad("errorName");
  const { error } = await s.supabase
    .from("organizations")
    .update({ name, cac_number: text(form, "cac_number", 40) || null })
    .eq("id", org);
  if (error) return bad("errorGeneric");
  refresh();
  return ok();
}

export async function addStaff(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const role = oneOf(text(form, "member_role", 20), E.org_member_role);
  if (!role || role === "owner") return bad("errorGeneric");
  const { error } = await s.supabase.rpc("add_org_member", {
    p_org: text(form, "organization_id", 36),
    p_phone: text(form, "phone", 30),
    p_role: role,
  });
  if (error) {
    if (error.code === "P0002") return bad("errorNoAccount");
    if (error.code === "P0001") return bad("errorAlready");
    if (error.code === "22023") return bad("errorPhone");
    return bad("errorGeneric");
  }
  refresh();
  return ok();
}

export async function removeStaff(form: FormData): Promise<void> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  await s.supabase
    .from("org_members")
    .delete()
    .eq("organization_id", text(form, "organization_id", 36))
    .eq("profile_id", text(form, "profile_id", 36))
    .neq("member_role", "owner");
  refresh();
}

export async function changeStaffRole(form: FormData): Promise<void> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const role = oneOf(text(form, "member_role", 20), E.org_member_role);
  if (!role || role === "owner") return;
  await s.supabase
    .from("org_members")
    .update({ member_role: role })
    .eq("organization_id", text(form, "organization_id", 36))
    .eq("profile_id", text(form, "profile_id", 36));
  refresh();
}

/* ------------------------------------------------------------------ privacy */

export async function requestDeletion(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const { error } = await s.supabase.rpc("request_account_deletion", { p_reason: text(form, "reason", 1000) || undefined });
  if (error && error.code !== "P0001") return bad("errorGeneric");
  refresh();
  return ok();
}

export async function cancelDataRequest(form: FormData): Promise<void> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  await s.supabase.rpc("cancel_data_request", { p_request_id: text(form, "request_id", 36) });
  refresh();
}

/* ------------------------------------------------------------------ field agents */

export async function agentSendCode(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const phone = text(form, "phone", 30);
  const res = await callFunction<{ sent: boolean }>("agent-onboard", { action: "start", phone });
  if (!res.ok) return bad(res.error, { data: { phone } });
  return ok({ data: { phone, step: "code" } });
}

export async function agentRegister(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const phone = text(form, "phone", 30);
  const roles = form.getAll("roles").map(String);
  const res = await callFunction<{ profile_id: string }>("agent-onboard", {
    action: "confirm",
    phone,
    code: text(form, "code", 10),
    full_name: text(form, "full_name", 120),
    state: text(form, "state", 60),
    lga: text(form, "lga", 60),
    language: text(form, "language", 5),
    roles,
    consents: {
      terms_of_use: form.get("consent_terms") === "on",
      privacy_policy: form.get("consent_terms") === "on",
      data_processing: form.get("consent_data") === "on",
      marketing_messages: form.get("consent_marketing") === "on",
    },
    document_version: LEGAL_VERSION,
  });
  if (!res.ok) return bad(res.error, { data: { phone, step: "code" } });
  refresh();
  return ok({ data: { step: "done" } });
}
