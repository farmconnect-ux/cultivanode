"use server";

import { revalidatePath } from "next/cache";
import type { AdminActionState } from "@/components/admin/admin-form";
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

export async function updateSupportTicketAction(
  _: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const staff = await requireStaff();
  if (!staff || !can(staff, "website_inbox.manage")) {
    return { ok: false, error: "You need the website_inbox.manage permission." };
  }

  const ticketId = String(form.get("ticket_id") ?? "").trim();
  const status = String(form.get("status") ?? "").trim();
  const priority = String(form.get("priority") ?? "").trim();
  const assignedRaw = String(form.get("assigned_to") ?? "").trim();
  const assignedTo = assignedRaw ? assignedRaw : null;

  if (!UUID.test(ticketId)) return { ok: false, error: "Invalid ticket ID." };
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return { ok: false, error: "Invalid status." };
  }
  if (!VALID_PRIORITIES.includes(priority as (typeof VALID_PRIORITIES)[number])) {
    return { ok: false, error: "Invalid priority." };
  }
  if (assignedTo && !UUID.test(assignedTo)) {
    return { ok: false, error: "Invalid assignee ID." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("support_tickets")
    .select("id, status")
    .eq("id", ticketId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return { ok: false, error: fetchErr?.message || "Ticket not found." };
  }

  const allowed = ALLOWED_TICKET_TRANSITIONS[existing.status] ?? VALID_STATUSES;
  if (!allowed.includes(status)) {
    return { ok: false, error: `Cannot move ticket from ${existing.status} to ${status}.` };
  }

  const resolvedAt = status === "resolved" || status === "closed" ? new Date().toISOString() : null;
  const { error: updErr } = await supabase
    .from("support_tickets")
    .update({
      status,
      priority,
      assigned_to: assignedTo,
      resolved_at: resolvedAt,
    })
    .eq("id", ticketId);

  if (updErr) {
    return { ok: false, error: updErr.message || "Could not update ticket." };
  }

  await supabase.from("admin_actions").insert({
    actor_id: staff.userId,
    permission: "website_inbox.manage",
    action: `support_ticket_${status}`,
    entity: "support_tickets",
    entity_id: ticketId,
    reason: `status=${status}, priority=${priority}`,
  });

  revalidatePath("/admin/support");
  return { ok: true, message: "Ticket updated." };
}

export async function postSupportMessageAction(
  _: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const staff = await requireStaff();
  if (!staff || !can(staff, "website_inbox.manage")) {
    return { ok: false, error: "You need the website_inbox.manage permission." };
  }

  const ticketId = String(form.get("ticket_id") ?? "").trim();
  const body = String(form.get("body") ?? "").trim().slice(0, 4000);
  const isInternal = String(form.get("is_internal") ?? "") === "true";

  if (!UUID.test(ticketId)) return { ok: false, error: "Invalid ticket ID." };
  if (!body) return { ok: false, error: "Enter a message before sending." };

  const supabase = await createClient();
  const { error } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticketId,
    author_id: staff.userId,
    body,
    is_internal: isInternal,
  });

  if (error) {
    return { ok: false, error: error.message || "Could not post message." };
  }

  revalidatePath("/admin/support");
  return { ok: true, message: isInternal ? "Internal note saved." : "Reply sent to requester." };
}
