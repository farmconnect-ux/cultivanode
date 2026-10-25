"use server";

import { refresh } from "next/cache";
import { DbConstants } from "@cultivanode/shared";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { can, requireStaff } from "@/lib/admin/staff";

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
  const reason = reasonOf(form);
  const note = field(form, "internal_note", 1000);
  if (!bookingId || !["uphold_farmer", "uphold_provider", "settlement"].includes(decision)) {
    return failed("Invalid decision option chosen.");
  }
  if (reason.length < 5) return failed(needReason);
  const staff = await requireStaff();
  if (!staff || !can(staff, "disputes.decide")) {
    return failed("You do not have the disputes.decide permission.");
  }
  const supabase = await createClient();

  const nextStatus = decision === "uphold_provider" ? "completed" : "cancelled";
  const { error } = await supabase
    .from("bookings")
    .update({
      status: nextStatus,
      closed_reason: `Arbitration: ${reason}`,
    })
    .eq("id", bookingId);

  if (error) return explain(error, "Dispute resolved.");

  await Promise.all([
    supabase.from("admin_actions").insert({
      actor_id: staff.userId,
      permission: "disputes.decide",
      action: "resolve_dispute",
      entity: "bookings",
      entity_id: bookingId,
      reason: `${decision}: ${reason} (Note: ${note})`,
    }),
    supabase.from("audit_log").insert({
      actor_id: staff.userId,
      action: "dispute_resolved",
      entity: "bookings",
      entity_id: bookingId,
      metadata: { decision, reason, note, nextStatus },
    }),
  ]);

  return explain(null, `Dispute resolved successfully as ${decision.replaceAll("_", " ")}.`);
}

export async function adminCancelJob(_prev: AdminResult | null, form: FormData): Promise<AdminResult> {
  const bookingId = id(form, "booking_id");
  const reason = reasonOf(form);
  if (!bookingId) return failed("Invalid booking ID.");
  if (reason.length < 5) return failed(needReason);
  const staff = await requireStaff();
  if (!staff || (!can(staff, "bookings.read") && !can(staff, "disputes.decide"))) {
    return failed("Permission required.");
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      closed_reason: `Staff intervention: ${reason}`,
    })
    .eq("id", bookingId);

  if (error) return explain(error, "Job cancelled.");

  await Promise.all([
    supabase.from("admin_actions").insert({
      actor_id: staff.userId,
      permission: "disputes.decide",
      action: "cancel_job",
      entity: "bookings",
      entity_id: bookingId,
      reason,
    }),
    supabase.from("audit_log").insert({
      actor_id: staff.userId,
      action: "job_cancelled",
      entity: "bookings",
      entity_id: bookingId,
      metadata: { reason },
    }),
  ]);

  return explain(null, "Job cancelled by staff.");
}

