import type { Metadata } from "next";
import {
  SupportConsole,
  type StaffOption,
  type SupportMessageItem,
  type SupportTicketItem,
} from "@/components/admin/support-console";
import { PageHeader } from "@/components/ds/page-header";
import { MetricCard } from "@/components/live/metric-card";
import { Alert } from "@/components/ui";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Support & SLA Desk" };

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string }>;
}) {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "website_inbox.manage")) {
    return (
      <Alert tone="danger">
        You need the <code>website_inbox.manage</code> permission to access the Support Desk.
      </Alert>
    );
  }

  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const statusFilter = (sp.status ?? "").trim();
  const priorityFilter = (sp.priority ?? "").trim();

  const supabase = await createClient();
  const [ticketsRes, staffRolesRes] = await Promise.all([
    supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("admin_roles").select("profile_id"),
  ]);

  if (ticketsRes.error) {
    return <Alert tone="danger">Could not load support tickets: {ticketsRes.error.message}</Alert>;
  }

  const rawTickets = ticketsRes.data ?? [];
  const ticketIds = rawTickets.map((t) => t.id);

  const messagesRes = ticketIds.length
    ? await supabase
        .from("support_ticket_messages")
        .select("*")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (messagesRes.error) {
    return <Alert tone="danger">Could not load ticket messages: {messagesRes.error.message}</Alert>;
  }

  const profileIds = new Set<string>();
  for (const t of rawTickets) {
    profileIds.add(t.requester_id);
    if (t.assigned_to) profileIds.add(t.assigned_to);
  }
  for (const m of messagesRes.data ?? []) profileIds.add(m.author_id);
  for (const r of staffRolesRes.data ?? []) profileIds.add(r.profile_id);

  const profilesRes = profileIds.size
    ? await supabase.from("profiles").select("id, full_name, phone").in("id", [...profileIds])
    : { data: [] };

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, { name: p.full_name || "CultivaNode User", phone: p.phone }]),
  );

  const staffOptions: StaffOption[] = [...new Set((staffRolesRes.data ?? []).map((r) => r.profile_id))].map((id) => ({
    id,
    name: profileMap.get(id)?.name ?? id.slice(0, 8),
  }));

  const messagesByTicket = new Map<string, SupportMessageItem[]>();
  for (const m of messagesRes.data ?? []) {
    const list = messagesByTicket.get(m.ticket_id) ?? [];
    list.push({
      id: m.id,
      ticket_id: m.ticket_id,
      author_id: m.author_id,
      author_name: profileMap.get(m.author_id)?.name ?? "User",
      body: m.body,
      is_internal: m.is_internal,
      created_at: m.created_at,
    });
    messagesByTicket.set(m.ticket_id, list);
  }

  const tickets: SupportTicketItem[] = rawTickets
    .map((t) => {
      const req = profileMap.get(t.requester_id);
      return {
        id: t.id,
        ticket_number: t.ticket_number,
        requester_id: t.requester_id,
        requester_name: req?.name ?? "User",
        requester_phone: req?.phone ?? null,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        channel: t.channel,
        assigned_to: t.assigned_to,
        sla_due_at: t.sla_due_at,
        resolved_at: t.resolved_at,
        created_at: t.created_at,
        updated_at: t.updated_at,
        messages: messagesByTicket.get(t.id) ?? [],
      };
    })
    .filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (q && !`${t.ticket_number} ${t.subject} ${t.requester_name}`.toLowerCase().includes(q)) return false;
      return true;
    });

  const openCount = rawTickets.filter((t) => t.status === "open" || t.status === "pending" || t.status === "in_progress").length;
  const urgentCount = rawTickets.filter((t) => (t.priority === "urgent" || t.priority === "high") && t.status !== "resolved" && t.status !== "closed").length;
  const resolvedCount = rawTickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support & SLA Desk"
        description="Triage user support tickets, assign staff, post public replies, and record internal notes."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard icon="support_agent" label="Active Cases" value={String(openCount)} />
        <MetricCard icon="warning" label="High / Urgent Open" value={String(urgentCount)} />
        <MetricCard icon="verified" label="Resolved / Closed" value={String(resolvedCount)} />
      </div>

      <form method="get" className="grid grid-cols-1 gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 sm:grid-cols-4">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search ticket #, subject, user…"
          className="rounded-lg border border-outline-variant/50 px-3 py-1.5 text-body-sm sm:col-span-2"
        />
        <select name="status" defaultValue={statusFilter} className="rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <div className="flex gap-2">
          <select name="priority" defaultValue={priorityFilter} className="w-full rounded-lg border border-outline-variant/50 px-2 py-1.5 text-body-sm">
            <option value="">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-label-md font-medium text-on-primary">
            Filter
          </button>
        </div>
      </form>

      <SupportConsole tickets={tickets} staffOptions={staffOptions} />
    </div>
  );
}
