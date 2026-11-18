import type { Metadata } from "next";
import Link from "next/link";
import {
  SupportConsole,
  type StaffOption,
  type SupportTicketItem,
} from "@/components/admin/support-console";
import { PageHeader } from "@/components/ds/page-header";
import { MetricCard } from "@/components/live/metric-card";
import { Alert } from "@/components/ui";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Support & SLA Desk" };

const PAGE_SIZE = 25;

type SupportSummaryRpc = {
  total_count: number;
  active_count: number;
  urgent_open_count: number;
  resolved_count: number;
  sla_overdue_count: number;
};

type SupportPageRpc = {
  total_count: number;
  limit: number;
  offset: number;
  items: SupportTicketItem[];
};

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; page?: string }>;
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
  const q = (sp.q ?? "").trim();
  const statusFilter = (sp.status ?? "").trim();
  const priorityFilter = (sp.priority ?? "").trim();
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const rpc = supabase.rpc as unknown as <T>(
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: T | null; error: { message: string } | null }>;

  const [summaryRes, pageRes, staffRolesRes] = await Promise.all([
    rpc<SupportSummaryRpc>("admin_support_summary"),
    rpc<SupportPageRpc>("admin_support_tickets_page", {
      p_q: q || null,
      p_status: statusFilter || null,
      p_priority: priorityFilter || null,
      p_limit: PAGE_SIZE,
      p_offset: offset,
    }),
    supabase.from("admin_roles").select("profile_id"),
  ]);

  if (summaryRes.error) {
    return <Alert tone="danger">Could not load support summary: {summaryRes.error.message}</Alert>;
  }
  if (pageRes.error) {
    return <Alert tone="danger">Could not load support tickets: {pageRes.error.message}</Alert>;
  }

  const summary = summaryRes.data ?? {
    total_count: 0,
    active_count: 0,
    urgent_open_count: 0,
    resolved_count: 0,
    sla_overdue_count: 0,
  };
  const tickets = pageRes.data?.items ?? [];
  const filteredTotal = Number(pageRes.data?.total_count ?? 0);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  const staffIds = [...new Set((staffRolesRes.data ?? []).map((r) => r.profile_id))];
  const staffProfilesRes = staffIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", staffIds)
    : { data: [] };
  const staffNameMap = new Map((staffProfilesRes.data ?? []).map((p) => [p.id, p.full_name || p.id.slice(0, 8)]));
  const staffOptions: StaffOption[] = staffIds.map((id) => ({
    id,
    name: staffNameMap.get(id) ?? id.slice(0, 8),
  }));

  const buildPageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    params.set("page", String(nextPage));
    return `/admin/support?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support & SLA Desk"
        description="Triage user support tickets, assign staff, post public replies, and record internal notes."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon="support_agent" label="Active Cases" value={String(summary.active_count)} />
        <MetricCard icon="warning" label="High / Urgent Open" value={String(summary.urgent_open_count)} />
        <MetricCard icon="schedule" label="SLA Overdue" value={String(summary.sla_overdue_count)} />
        <MetricCard icon="verified" label="Resolved / Closed" value={String(summary.resolved_count)} />
      </div>

      <form method="get" className="grid grid-cols-1 gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 sm:grid-cols-4">
        <input
          name="q"
          defaultValue={q}
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

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-body-sm">
        <span className="text-on-surface-variant">
          Showing {tickets.length} of {filteredTotal} matching tickets (Page {page} of {totalPages})
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link href={buildPageHref(page - 1)} className="rounded-lg border border-outline-variant/50 px-3 py-1 text-label-sm font-medium">
              Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link href={buildPageHref(page + 1)} className="rounded-lg border border-outline-variant/50 px-3 py-1 text-label-sm font-medium">
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
