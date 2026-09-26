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
