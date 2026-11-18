"use server";

import { revalidatePath } from "next/cache";
import type { AdminResult } from "@/actions/admin-console";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ["open", "pending", "in_progress", "resolved", "closed"] as const;
const VALID_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export const ALLOWED_TICKET_TRANSITIONS: Record<string, readonly string[]> = {
  open: ["open", "pending", "in_progress", "resolved", "closed"],
  pending: ["open", "pending", "in_progress", "resolved", "closed"],
  in_progress: ["open", "pending", "in_progress", "resolved", "closed"],
  resolved: ["open", "in_progress", "resolved", "closed"],
  closed: ["open", "in_progress", "closed"],
};

type RpcFn = (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ error: { message?: string } | null }>;

export async function updateSupportTicketAction(
  _: AdminResult | null,
  form: FormData,
): Promise<AdminResult> {
  const staff = await requireStaff();
  if (!staff || !can(staff, "website_inbox.manage")) {
    return { ok: false, message: "You need the website_inbox.manage permission.", at: Date.now() };
  }

  const ticketId = String(form.get("ticket_id") ?? "").trim();
  const status = String(form.get("status") ?? "").trim();
  const priority = String(form.get("priority") ?? "").trim();
  const assignedRaw = String(form.get("assigned_to") ?? "").trim();
  const assignedTo = assignedRaw ? assignedRaw : null;

  if (!UUID.test(ticketId)) return { ok: false, message: "Invalid ticket ID.", at: Date.now() };
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return { ok: false, message: "Invalid status.", at: Date.now() };
  }
  if (!VALID_PRIORITIES.includes(priority as (typeof VALID_PRIORITIES)[number])) {
    return { ok: false, message: "Invalid priority.", at: Date.now() };
  }
  if (assignedTo && !UUID.test(assignedTo)) {
    return { ok: false, message: "Invalid assignee ID.", at: Date.now() };
  }

  const supabase = await createClient();
  const { error } = await (supabase.rpc as unknown as RpcFn)("admin_update_support_ticket", {
    p_ticket_id: ticketId,
    p_status: status,
    p_priority: priority,
    p_assigned_to: assignedTo,
  });

  if (error) {
    return { ok: false, message: error.message || "Could not update ticket.", at: Date.now() };
  }

  revalidatePath("/admin/support");
  return { ok: true, message: "Ticket updated.", at: Date.now() };
}

export async function postSupportMessageAction(
  _: AdminResult | null,
  form: FormData,
): Promise<AdminResult> {
  const staff = await requireStaff();
  if (!staff || !can(staff, "website_inbox.manage")) {
    return { ok: false, message: "You need the website_inbox.manage permission.", at: Date.now() };
  }

  const ticketId = String(form.get("ticket_id") ?? "").trim();
  const body = String(form.get("body") ?? "").trim().slice(0, 4000);
  const isInternal = String(form.get("is_internal") ?? "") === "true";

  if (!UUID.test(ticketId)) return { ok: false, message: "Invalid ticket ID.", at: Date.now() };
  if (!body) return { ok: false, message: "Enter a message before sending.", at: Date.now() };

  const supabase = await createClient();
  const { error } = await (supabase.rpc as unknown as RpcFn)("admin_post_support_message", {
    p_ticket_id: ticketId,
    p_body: body,
    p_is_internal: isInternal,
  });

  if (error) {
    return { ok: false, message: error.message || "Could not post message.", at: Date.now() };
  }

  revalidatePath("/admin/support");
  return { ok: true, message: isInternal ? "Internal note saved." : "Reply sent to requester.", at: Date.now() };
}
