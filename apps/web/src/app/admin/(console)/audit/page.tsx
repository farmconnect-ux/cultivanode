import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { MetricCard } from "@/components/live/metric-card";
import { SecurityAudit } from "@/components/screens/security-audit";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Alert, Button, Input } from "@/components/ui";
import { when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Security, audit & compliance" };

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "audit.read")) return <Alert tone="danger">You need the audit.read permission.</Alert>;
  const { action: rawAction } = await searchParams;
  const action = typeof rawAction === "string" ? rawAction.trim().slice(0, 60) : "";

  const supabase = await createClient();
  let logQuery = supabase
    .from("audit_log")
    .select("id, actor_id, action, entity, entity_id, metadata, ip, created_at")
    .order("created_at", { ascending: false })
    .limit(150);
  if (action) logQuery = logQuery.ilike("action", `%${action.replace(/[%_]/g, "")}%`);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [{ data: log }, { data: decisions }, { count: log24 }, { count: decisions30 }] = await Promise.all([
    logQuery,
    supabase.from("admin_actions").select("id, actor_id, permission, action, entity, entity_id, reason, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("audit_log").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("admin_actions").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()),
  ]);
  const actorIds = [...new Set([...(log ?? []), ...(decisions ?? [])].map((r) => r.actor_id).filter((x): x is string => Boolean(x)))];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const name = new Map((actors ?? []).map((a) => [a.id, a.full_name ?? "Unnamed"]));
  const actor = (id: string | null) =>
    id ? (
      <Link href={`/admin/users/${id}`} className="font-semibold text-secondary underline-offset-4 hover:underline">{name.get(id) ?? "Someone"}</Link>
    ) : (
      <span className="text-on-surface-variant">System</span>
    );

  return (
    <SecurityAudit
      lang="en"
      slots={{
        kpis: (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Audit events · 24h" value={(log24 ?? 0).toLocaleString("en-NG")} icon="list_alt" foot="Append-only, cannot be edited" />
            <MetricCard label="Staff decisions · 30d" value={decisions30 ?? 0} icon="gavel" iconTone="bg-surface-container-high text-primary" foot="Approvals, suspensions, rulings" />
            <MetricCard label="Distinct actors" value={actorIds.length} icon="admin_panel_settings" iconTone="bg-primary-fixed/60 text-on-primary-fixed-variant" foot="In the records shown" />
            <MetricCard label="Your permissions" value={staff.permissions.length} icon="vpn_key" iconTone="bg-tertiary-fixed/50 text-tertiary-container" foot="Granted to this staff account" />
          </div>
        ),
        ledger: null,
        access: (
          <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
            <div>
              <h2 className="flex items-center gap-2 font-headline-md text-headline-md text-on-surface">
                <Icon name="admin_panel_settings" className="text-secondary" /> Staff decisions
              </h2>
              <p className="text-body-sm text-on-surface-variant">Every privileged action with the permission used and the reason given.</p>
            </div>
            <div className="-mx-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">When</TableHead>
                    <TableHead>Who</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead className="pr-6">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(decisions ?? []).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap pl-6">{when(d.created_at)}</TableCell>
                      <TableCell>{actor(d.actor_id)}</TableCell>
                      <TableCell>{d.action.replaceAll("_", " ")} <span className="text-on-surface-variant">({d.entity})</span></TableCell>
                      <TableCell className="font-mono text-label-sm">{d.permission}</TableCell>
                      <TableCell className="pr-6">{d.reason ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ),
        incidents: null,
        trail: (
          <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="flex items-center gap-2 font-headline-md text-headline-md text-on-surface">
                  <Icon name="list_alt" className="text-secondary" /> Activity log
                </h2>
                <p className="text-body-sm text-on-surface-variant">Append-only. Nobody, including staff and server code, can change or delete these records.</p>
              </div>
              <form className="flex gap-2" role="search">
                <label htmlFor="action" className="sr-only">Filter by action</label>
                <Input id="action" name="action" defaultValue={action} placeholder="Filter by action, e.g. role_approved" className="w-64" />
                <Button type="submit" variant="secondary">Filter</Button>
              </form>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick filters">
              {["", "dispute", "role", "suspend", "job", "verification"].map((f) => (
                <Link
                  key={f}
                  href={f ? `/admin/audit?action=${f}` : "/admin/audit"}
                  className={cn(
                    "rounded-full px-3 py-1 font-label-sm text-label-sm transition-colors",
                    action === f || (!action && !f) ? "bg-primary-container text-white" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high",
                  )}
                >
                  {f ? f.toUpperCase() : "ALL"}
                </Link>
              ))}
            </div>
            <div className="-mx-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">When</TableHead>
                    <TableHead>Who</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Record</TableHead>
                    <TableHead className="pr-6">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(log ?? []).map((l) => (
                    <TableRow key={l.id} className="align-top">
                      <TableCell className="whitespace-nowrap pl-6">{when(l.created_at)}</TableCell>
                      <TableCell>{actor(l.actor_id)}</TableCell>
                      <TableCell className="font-semibold">{l.action}</TableCell>
                      <TableCell>{l.entity}</TableCell>
                      <TableCell className="max-w-md break-all pr-6 font-mono text-label-sm text-on-surface-variant">{JSON.stringify(l.metadata)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ),
      }}
    />
  );
}
