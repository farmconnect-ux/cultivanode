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

/* ------------------------------------------------------------------ farms */

export async function addFarm(_prev: ActionState, form: FormData): Promise<ActionState> {
  const s = await signedIn();
  if (!s) redirect(`/${lang(form)}/sign-in`);
  const name = text(form, "name", 120);
  if (name.length < 2) return bad("errorName");
  const lat = Number(text(form, "latitude", 20));
  const lng = Number(text(form, "longitude", 20));
  if (!isInNigeria(lat, lng)) return bad("errorLocation");
  const sizeRaw = text(form, "size", 12);
  let areaHa: number | null = null;
  if (sizeRaw) {
    const size = Number(sizeRaw.replace(",", "."));
    if (!Number.isFinite(size) || size <= 0 || size > 100000) return bad("errorSize");
    areaHa = form.get("unit") === "acres" ? size / ACRES_PER_HECTARE : size;
    areaHa = Math.round(areaHa * 10000) / 10000;
  }
  const stateRaw = text(form, "state", 60);
  const forProfile = text(form, "for_profile", 36);

  const row = {
    name,
    location: `SRID=4326;POINT(${lng.toFixed(6)} ${lat.toFixed(6)})`,
    area_ha: areaHa,
    state: (NIGERIAN_STATES as readonly string[]).includes(stateRaw) ? stateRaw : null,
    lga: text(form, "lga", 60) || null,
    // A field agent records a farm for a farmer they registered; RLS checks that link.
    ...(forProfile && forProfile !== s.uid ? { owner_id: forProfile, onboarded_by: s.uid } : {}),
  };
  const { data: newFarm, error } = await s.supabase.from("farms").insert(row).select("id").single();
  if (error) {
    logger.warn("farm_insert_failed", { code: error.code });
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
