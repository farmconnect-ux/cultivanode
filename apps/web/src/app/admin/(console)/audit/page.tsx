import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Button, Card, Input } from "@/components/ui";
import { when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Audit" };

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "audit.read")) return <Alert tone="danger">You need the audit.read permission.</Alert>;
  const { action: rawAction } = await searchParams;
  const action = typeof rawAction === "string" ? rawAction.trim().slice(0, 60) : "";

  const supabase = await createClient();
  let logQuery = supabase.from("audit_log").select("id, actor_id, action, entity, entity_id, metadata, ip, created_at")
    .order("created_at", { ascending: false }).limit(150);
  if (action) logQuery = logQuery.ilike("action", `%${action.replace(/[%_]/g, "")}%`);
  const [{ data: log }, { data: decisions }] = await Promise.all([
    logQuery,
    supabase.from("admin_actions").select("id, actor_id, permission, action, entity, entity_id, reason, created_at")
      .order("created_at", { ascending: false }).limit(50),
  ]);
  const actorIds = [...new Set([...(log ?? []), ...(decisions ?? [])].map((r) => r.actor_id).filter((x): x is string => Boolean(x)))];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const name = new Map((actors ?? []).map((a) => [a.id, a.full_name ?? "Unnamed"]));
  const actor = (id: string | null) => (id ? (
    <Link href={`/admin/users/${id}`} className="text-leaf-700 underline">{name.get(id) ?? "Someone"}</Link>
  ) : "System");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">Audit</h1>
        <p className="mt-1 text-muted">Append-only. Nobody, including staff and server code, can change or delete these records.</p>
      </div>
      <section className="flex flex-col gap-3" aria-labelledby="dec-h">
        <h2 id="dec-h" className="text-2xl font-bold">Staff decisions</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line bg-cream"><tr><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">Action</th><th className="p-3">Permission</th><th className="p-3">Reason</th></tr></thead>
            <tbody>
              {(decisions ?? []).map((d) => (
                <tr key={d.id} className="border-b border-line last:border-0">
                  <td className="p-3 whitespace-nowrap">{when(d.created_at)}</td>
                  <td className="p-3">{actor(d.actor_id)}</td>
                  <td className="p-3">{d.action.replaceAll("_", " ")} ({d.entity})</td>
                  <td className="p-3">{d.permission}</td>
                  <td className="p-3">{d.reason ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="log-h">
        <h2 id="log-h" className="text-2xl font-bold">Activity log</h2>
        <form className="flex flex-wrap gap-2" role="search">
          <label htmlFor="action" className="sr-only">Filter by action</label>
          <Input id="action" name="action" defaultValue={action} placeholder="Filter by action, e.g. role_approved" className="max-w-sm" />
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line bg-cream"><tr><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">Action</th><th className="p-3">Record</th><th className="p-3">Details</th></tr></thead>
            <tbody>
              {(log ?? []).map((l) => (
                <tr key={l.id} className="border-b border-line align-top last:border-0">
                  <td className="p-3 whitespace-nowrap">{when(l.created_at)}</td>
                  <td className="p-3">{actor(l.actor_id)}</td>
                  <td className="p-3">{l.action}</td>
                  <td className="p-3">{l.entity}</td>
                  <td className="max-w-md p-3 font-mono text-xs break-all text-muted">{JSON.stringify(l.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
