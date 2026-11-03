"use server";

import { refresh } from "next/cache";
import { DbConstants } from "@cultivanode/shared";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

// Staff actions. Each database function checks the staff member's permission itself (has_permission),
// so a forged post from someone without it fails there. Messages here are shown to staff only.

export type AdminResult = { ok: boolean; message: string; at: number };

const E = DbConstants.public.Enums;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const field = (form: FormData, name: string, max = 2000) => String(form.get(name) ?? "").trim().slice(0, max);
const done = (message: string): AdminResult => ({ ok: true, message, at: Date.now() });
const failed = (message: string): AdminResult => ({ ok: false, message, at: Date.now() });

/** Our own database messages (22023, P0001, P0002, 42501) are written for staff; anything else stays generic. */
function explain(error: { code?: string; message?: string } | null, success: string): AdminResult {
  if (!error) {
    refresh();
    return done(success);
  }
  if (error.code === "42501") return failed("You do not have permission to do this.");
  if (["22023", "P0001", "P0002"].includes(error.code ?? "")) return failed(error.message ?? "Not saved.");
  logger.error("admin_console_action_failed", { code: error.code });
  return failed("Something went wrong. Nothing was changed.");
}

function id(form: FormData, name = "id"): string | null {
  const v = field(form, name, 36);
  return UUID.test(v) ? v : null;
}

export async function approveRoleRequest(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const requestId = id(form);
  if (!requestId) return failed("Invalid request.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_role_request", { p_request_id: requestId, p_note: field(form, "note", 1000) });
  return explain(error, "Approved. The role is switched on.");
}

export async function rejectRoleRequest(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const requestId = id(form);
  if (!requestId) return failed("Invalid request.");
  const note = field(form, "note", 1000);
  if (note.length < 5) return failed("Write a reason the applicant will see (at least 5 characters).");
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_role_request", { p_request_id: requestId, p_note: note });
  return explain(error, "Rejected. The applicant sees your reason.");
}

export async function reviewDocument(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const docId = id(form);
  const status = field(form, "status", 10);
  if (!docId || (status !== "accepted" && status !== "rejected")) return failed("Invalid request.");
  const note = field(form, "note", 1000);
  if (status === "rejected" && note.length < 5) return failed("Write a reason the applicant will see (at least 5 characters).");
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_verification_document", { p_document_id: docId, p_status: status, p_note: note });
  return explain(error, status === "accepted" ? "Document accepted." : "Document rejected.");
}

export async function grantAdminRole(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const profile = id(form, "profile_id");
  const role = field(form, "admin_role", 40);
  if (!profile || !(E.admin_role as readonly string[]).includes(role)) return failed("Invalid request.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_admin_role", {
    p_profile: profile, p_role: role as (typeof E.admin_role)[number], p_reason: field(form, "reason", 1000),
  });
  return explain(error, "Staff role granted.");
}

export async function revokeAdminRole(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const profile = id(form, "profile_id");
  const role = field(form, "admin_role", 40);
  if (!profile || !(E.admin_role as readonly string[]).includes(role)) return failed("Invalid request.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_revoke_admin_role", {
    p_profile: profile, p_role: role as (typeof E.admin_role)[number], p_reason: field(form, "reason", 1000),
  });
  return explain(error, "Staff role removed.");
}

export async function setContactHandled(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const messageId = id(form);
  if (!messageId) return failed("Invalid request.");
  const handled = field(form, "handled", 5) === "true";
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_contact_handled", { p_message_id: messageId, p_handled: handled });
  return explain(error, handled ? "Marked as handled." : "Moved back to open.");
}

export async function resolveDataRequest(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const requestId = id(form);
  const status = field(form, "status", 10);
  if (!requestId || (status !== "completed" && status !== "rejected")) return failed("Invalid request.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_data_request", {
    p_request_id: requestId, p_status: status, p_note: field(form, "note", 1000),
  });
  return explain(error, "Request closed.");
}

/* ------------------------------------------------------------------ MVP week 1: account and marketplace controls */

const reasonOf = (form: FormData) => field(form, "reason", 500);
const needReason = "Write a reason (at least 5 characters). It goes in the audit log.";

export async function setAccountSuspension(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const profile = id(form, "profile_id");
  const suspend = field(form, "do", 10) === "suspend";
  if (!profile) return failed("Invalid request.");
  if (reasonOf(form).length < 5) return failed(needReason);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_account_suspension", { p_profile: profile, p_suspend: suspend, p_reason: reasonOf(form) });
  return explain(error, suspend
    ? "Suspended. They are signed out, cannot sign in, and their listings are hidden."
    : "Restored. They can sign in again; their listings stay as they were.");
}

export async function setAccountFlag(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const profile = id(form, "profile_id");
  const flag = field(form, "do", 10) === "flag";
  if (!profile) return failed("Invalid request.");
  if (reasonOf(form).length < 5) return failed(needReason);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_account_flag", { p_profile: profile, p_flag: flag, p_reason: reasonOf(form) });
  return explain(error, flag ? "Flagged for review." : "Flag removed.");
}

export async function forceSignOut(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const profile = id(form, "profile_id");
  if (!profile) return failed("Invalid request.");
  if (reasonOf(form).length < 5) return failed(needReason);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_force_sign_out", { p_profile: profile, p_reason: reasonOf(form) });
  return explain(error, `Signed out of ${data ?? 0} session(s). A token already issued works for up to an hour; suspend the account if it is urgent.`);
}

export async function setFeatureFlag(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const key = field(form, "key", 40);
  if (!/^[a-z][a-z0-9_]{2,40}$/.test(key)) return failed("Invalid request.");
  const enabled = field(form, "do", 10) === "on";
  const states = form.getAll("states").map((s) => String(s).slice(0, 40)).filter(Boolean);
  if (reasonOf(form).length < 5) return failed(needReason);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_feature_flag", {
    p_key: key, p_enabled: enabled, p_states: states, p_reason: reasonOf(form),
  });
  return explain(error, enabled
    ? `Switched on${states.length ? ` for ${states.join(", ")}` : " everywhere"}.`
    : key === "marketplace_live" ? "Switched off. Search and publishing stop at once." : "Switched off.");
}

export async function moderateListing(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const listing = id(form, "listing_id");
  const suspend = field(form, "do", 10) === "suspend";
  if (!listing) return failed("Invalid request.");
  if (reasonOf(form).length < 5) return failed(needReason);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_listing_status", { p_listing: listing, p_suspend: suspend, p_reason: reasonOf(form) });
  return explain(error, suspend ? "Listing suspended and hidden from search." : "Listing restored as paused; the owner can publish it again.");
}

export async function revokeAgentCode(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const code = id(form, "code_id");
  if (!code) return failed("Invalid request.");
  if (reasonOf(form).length < 5) return failed(needReason);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_revoke_agent_code", { p_code: code, p_reason: reasonOf(form) });
  return explain(error, "Code revoked. It can no longer be used.");
}

export async function removeOrgMember(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const org = id(form, "org_id");
  const profile = id(form, "profile_id");
  if (!org || !profile) return failed("Invalid request.");
  if (reasonOf(form).length < 5) return failed(needReason);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_remove_org_member", { p_org: org, p_profile: profile, p_reason: reasonOf(form) });
  return explain(error, "Removed from the business.");
}

/* ------------------------------------------------------------------ MVP week 4: dispute and job administration */

export async function adminResolveDispute(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const bookingId = id(form, "booking_id");
  const decision = field(form, "decision", 30);
  const reason = field(form, "reason", 1000);
  const decisionText = field(form, "decision_text", 1000) || reason;
  const settlementNairaRaw = field(form, "settlement_naira", 20).replaceAll(",", "");
  if (!bookingId || !["uphold_farmer", "uphold_provider", "settlement"].includes(decision)) {
    return failed("Choose a valid arbitration decision.");
  }
  if (reason.length < 10) {
    return failed("Write down your reasoning (at least 10 characters).");
  }
  let settlementKobo: number | null = null;
  if (decision === "settlement") {
    const naira = Number(settlementNairaRaw);
    if (!Number.isFinite(naira) || naira <= 0) {
      return failed("Enter the agreed settlement amount in Naira (more than zero).");
    }
    settlementKobo = Math.round(naira * 100);
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_booking_dispute", {
    p_booking: bookingId,
    p_decision: decision,
    p_reason: reason,
    p_decision_text: decisionText,
    p_settlement_kobo: settlementKobo,
  });
  return explain(error, `Dispute resolved as ${decision.replaceAll("_", " ")}. Both parties have been notified.`);
}

export async function adminReopenDispute(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const bookingId = id(form, "booking_id");
  const reason = field(form, "reason", 1000);
  if (!bookingId) return failed("Invalid booking ID.");
  if (reason.length < 10) {
    return failed("Write down why the dispute is reopened (at least 10 characters).");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("reopen_booking_dispute", {
    p_booking: bookingId,
    p_reason: reason,
  });
  return explain(error, "Dispute reopened. Both parties have been notified and can upload additional evidence.");
}

export async function adminRequestDisputeEvidence(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const bookingId = id(form, "booking_id");
  const note = field(form, "note", 500);
  const to = field(form, "to", 20) || "both";
  const hoursRaw = Number(field(form, "hours", 10) || "24");
  if (!bookingId) return failed("Invalid booking ID.");
  if (!["farmer", "provider", "both"].includes(to)) return failed("Choose who should answer.");
  if (note.length < 10) return failed("Say what evidence you need (at least 10 characters).");
  if (!Number.isInteger(hoursRaw) || hoursRaw < 1 || hoursRaw > 168) {
    return failed("Give 1 to 168 hours to answer.");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_dispute_evidence", {
    p_booking: bookingId,
    p_note: note,
    p_hours: hoursRaw,
    p_to: to,
  });
  return explain(error, `Evidence request sent (${to}).`);
}

export async function adminCancelJob(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const bookingId = id(form, "booking_id");
  const reason = field(form, "reason", 500);
  if (!bookingId) return failed("Invalid booking ID.");
  if (reason.length < 10) {
    return failed("Write down why staff cancelled this booking (at least 10 characters).");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_cancel_booking", {
    p_booking: bookingId,
    p_reason: reason,
  });
  return explain(error, "Job cancelled by staff. Both parties have been notified.");
}

export async function adminCreateStandardDraft(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const code = field(form, "standard_code", 80);
  const cropId = field(form, "crop_id", 80);
  const agroZone = field(form, "agro_zone", 80) || "rainforest";
  const version = field(form, "version", 20) || "1.0";
  const title = field(form, "title", 200);
  const description = field(form, "description", 1000);
  const maxN = field(form, "max_nitrogen_kg_ha", 20);
  const source = field(form, "source_authority", 200) || "IITA_NIHORT_GAP";
  const supersedesId = id(form, "supersedes_id");

  const opsRaw = field(form, "mandated_operations", 2000);
  const chemsRaw = field(form, "restricted_chemicals", 2000);
  const paramsRaw = field(form, "parameters_json", 2000);

  if (!code || !cropId || !title) {
    return failed("Standard code, crop identifier, and title are required.");
  }

  const mandatedOps = opsRaw ? opsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const restrictedChems = chemsRaw ? chemsRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : [];
  
  let parameters = {};
  if (paramsRaw) {
    try {
      parameters = JSON.parse(paramsRaw);
    } catch {
      return failed("Parameters must be a valid JSON object.");
    }
  }

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;

  const { error } = await rpc("agronomy_create_standard_draft", {
    p_code: code,
    p_crop_id: cropId,
    p_agro_zone: agroZone,
    p_version: version,
    p_title: title,
    p_description: description || null,
    p_parameters: parameters,
    p_mandated_operations: mandatedOps,
    p_restricted_chemicals: restrictedChems,
    p_max_nitrogen_kg_ha: maxN ? Number(maxN) : null,
    p_source_authority: source,
    p_supersedes_id: supersedesId || null,
  });

  return explain(error, `Draft standard "${title}" created successfully.`);
}

export async function adminSubmitStandardForReview(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const standardId = id(form, "standard_id");
  const notes = field(form, "notes", 1000);
  if (!standardId) return failed("Invalid standard ID.");

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;

  const { error } = await rpc("agronomy_submit_standard_for_review", {
    p_standard_id: standardId,
    p_notes: notes || null,
  });

  return explain(error, "Standard submitted for peer review.");
}

export async function adminPublishStandard(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const standardId = id(form, "standard_id");
  const approverTitle = field(form, "approver_title", 200);
  const partnerRef = field(form, "partner_reference", 200);
  const notes = field(form, "notes", 1000);
  if (!standardId) return failed("Invalid standard ID.");

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;

  const { error } = await rpc("agronomy_publish_standard", {
    p_standard_id: standardId,
    p_approver_title: approverTitle || null,
    p_partner_reference: partnerRef || null,
    p_notes: notes || null,
  });

  return explain(error, "Standard published! It is now active and accessible to farmers.");
}

export async function adminResolveMarketplaceDispute(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const disputeId = id(form, "dispute_id");
  const decision = field(form, "decision", 40);
  const reason = field(form, "reason", 1000);
  const decisionText = field(form, "decision_text", 1000);
  const instructions = field(form, "settlement_instructions", 1000);
  const amountStr = field(form, "settlement_naira", 20);

  if (!disputeId) return failed("Invalid dispute ID.");
  if (!["uphold_buyer", "uphold_seller", "settlement"].includes(decision)) {
    return failed("Choose an arbitration decision.");
  }
  if (reason.length < 10) {
    return failed("Write down your arbitration reasoning (at least 10 characters).");
  }

  let settlementKobo: number | null = null;
  if (decision === "settlement") {
    const naira = Number(amountStr);
    if (!Number.isFinite(naira) || naira <= 0) {
      return failed("Enter a positive settlement amount in Naira.");
    }
    settlementKobo = Math.round(naira * 100);
    if (instructions.length < 10) {
      return failed("Write explicit restitution/payment instructions (at least 10 characters).");
    }
  }

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;

  const { error } = await rpc("resolve_marketplace_dispute", {
    p_dispute_id: disputeId,
    p_decision: decision,
    p_reason: reason,
    p_decision_text: decisionText || null,
    p_settlement_kobo: settlementKobo,
    p_settlement_instructions: instructions || null,
  });

  return explain(error, `Marketplace dispute resolved as ${decision.replaceAll("_", " ")}. Both parties notified.`);
}

export async function adminReopenMarketplaceDispute(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const disputeId = id(form, "dispute_id");
  const reason = field(form, "reason", 1000);
  if (!disputeId) return failed("Invalid dispute ID.");
  if (reason.length < 10) {
    return failed("Write down why the dispute is reopened (at least 10 characters).");
  }

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;

  const { error } = await rpc("reopen_marketplace_dispute", {
    p_dispute_id: disputeId,
    p_reason: reason,
  });

  return explain(error, "Marketplace dispute reopened for review. Both parties notified.");
}

export async function adminRequestMarketplaceDisputeEvidence(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const disputeId = id(form, "dispute_id");
  const note = field(form, "note", 500);
  const to = field(form, "to", 20) || "both";
  const hoursRaw = Number(field(form, "hours", 10) || "24");

  if (!disputeId) return failed("Invalid dispute ID.");
  if (!["buyer", "seller", "both"].includes(to)) return failed("Choose who should provide evidence.");
  if (note.length < 10) return failed("Say what evidence is needed (at least 10 characters).");
  if (!Number.isInteger(hoursRaw) || hoursRaw < 1 || hoursRaw > 168) {
    return failed("Give 1 to 168 hours to answer.");
  }

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;

  const { error } = await rpc("request_marketplace_dispute_evidence", {
    p_dispute_id: disputeId,
    p_note: note,
    p_hours: hoursRaw,
    p_to: to,
  });

  return explain(error, `Evidence request sent to ${to}.`);
}
