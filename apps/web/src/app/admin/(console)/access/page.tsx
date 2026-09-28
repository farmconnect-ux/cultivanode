import type { Metadata } from "next";
import Link from "next/link";
import { removeOrgMember, revokeAgentCode } from "@/actions/admin-console";
import { AdminForm } from "@/components/admin/admin-form";
import { Alert, Badge, Button, Card, Field, Input } from "@/components/ui";
import { phoneLabel, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Agents and business staff" };

type AgentCode = {
  id: string;
  agent_id: string;
  agent_name: string | null;
  farmer_phone: string;
  attempts: number;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  state: "open" | "used" | "expired" | "revoked";
};

type Membership = {
  organization_id: string;
  organization: string;
  cac_number: string | null;
  profile_id: string;
  full_name: string | null;
  phone: string | null;
  member_role: string;
  created_at: string;
  added_by_name: string | null;
  suspended: boolean;
};

const TONE: Record<AgentCode["state"], string> = {
  open: "bg-node-50 text-node-700",
  used: "bg-leaf-100 text-leaf-800",
  expired: "",
  revoked: "bg-red-50 text-danger",
};

export default async function AccessPage({ searchParams }: PageProps<"/admin/access">) {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "users.read")) return <Alert tone="danger">You need the users.read permission.</Alert>;
  const canAct = can(staff, "users.suspend");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";

  const supabase = await createClient();
  const [codesRes, membersRes] = await Promise.all([
    supabase.rpc("admin_agent_codes", { p_limit: 100 }),
    supabase.rpc("admin_org_memberships", { p_query: q || undefined, p_limit: 300 }),
  ]);
  const codes = (codesRes.data ?? []) as unknown as AgentCode[];
  const members = (membersRes.data ?? []) as unknown as Membership[];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-extrabold text-leaf-800">Agents and business staff</h1>

      <section className="flex flex-col gap-4" aria-labelledby="codes-h">
        <h2 id="codes-h" className="text-2xl font-bold">Field-agent sign-up codes</h2>
        <p className="text-muted">
          Codes an agent sent to a farmer&apos;s phone to register them. Revoke an open code if an agent&apos;s phone is lost or a farmer did not ask to be registered.
        </p>
        {codesRes.error && <Alert tone="danger">Could not load codes.</Alert>}
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[44rem] text-left">
            <caption className="sr-only">Latest 100 agent codes</caption>
            <thead className="border-b border-line bg-cream text-sm">
              <tr><th className="p-3" scope="col">Agent</th><th className="p-3" scope="col">Farmer phone</th><th className="p-3" scope="col">Sent</th><th className="p-3" scope="col">State</th><th className="p-3" scope="col"><span className="sr-only">Action</span></th></tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-b border-line align-top last:border-0">
                  <td className="p-3"><Link href={`/admin/users/${c.agent_id}`} className="font-semibold text-leaf-700 underline">{c.agent_name ?? "(no name)"}</Link></td>
                  <td className="p-3 whitespace-nowrap tabular-nums">{c.farmer_phone}</td>
                  <td className="p-3 whitespace-nowrap">{when(c.created_at)}{c.attempts > 0 && <span className="block text-sm text-muted">{c.attempts} wrong tries</span>}</td>
                  <td className="p-3"><Badge className={TONE[c.state]}>{c.state}</Badge></td>
                  <td className="p-3">
                    {canAct && c.state === "open" && (
                      <AdminForm action={revokeAgentCode} hidden={{ code_id: c.id }} buttons={[{ label: "Revoke", variant: "secondary" }]}>
                        <label htmlFor={`rv-${c.id}`} className="sr-only">Reason</label>
                        <Input id={`rv-${c.id}`} name="reason" placeholder="Reason" maxLength={500} required />
                      </AdminForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {codes.length === 0 && <p className="p-4 text-muted">No codes sent yet.</p>}
        </Card>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="staff-h">
        <h2 id="staff-h" className="text-2xl font-bold">Business staff</h2>
        <p className="text-muted">Who can act for each business account. Owners cannot be removed here; suspend the account instead.</p>
        <form className="flex flex-wrap items-end gap-2" role="search">
          <label htmlFor="mq" className="sr-only">Search businesses or people</label>
          <Input id="mq" name="q" defaultValue={q} placeholder="Business or person" className="max-w-md" />
          <Button type="submit">Search</Button>
        </form>
        {membersRes.error && <Alert tone="danger">Could not load memberships.</Alert>}
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[48rem] text-left">
            <caption className="sr-only">Business memberships</caption>
            <thead className="border-b border-line bg-cream text-sm">
              <tr><th className="p-3" scope="col">Business</th><th className="p-3" scope="col">Person</th><th className="p-3" scope="col">Role</th><th className="p-3" scope="col">Added</th><th className="p-3" scope="col"><span className="sr-only">Action</span></th></tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={`${m.organization_id}${m.profile_id}`} className="border-b border-line align-top last:border-0">
                  <td className="p-3 font-semibold">{m.organization}{m.cac_number && <span className="block text-sm font-normal text-muted">CAC {m.cac_number}</span>}</td>
                  <td className="p-3">
                    <Link href={`/admin/users/${m.profile_id}`} className="font-semibold text-leaf-700 underline">{m.full_name ?? "(no name)"}</Link>
                    <span className="block text-sm text-muted">{phoneLabel(m.phone)}{m.suspended ? " · suspended" : ""}</span>
                  </td>
                  <td className="p-3">{m.member_role.replaceAll("_", " ")}</td>
                  <td className="p-3 whitespace-nowrap">{when(m.created_at)}{m.added_by_name && <span className="block text-sm text-muted">by {m.added_by_name}</span>}</td>
                  <td className="p-3">
                    {canAct && m.member_role !== "owner" && (
                      <AdminForm action={removeOrgMember} hidden={{ org_id: m.organization_id, profile_id: m.profile_id }}
                                 buttons={[{ label: "Remove", variant: "secondary" }]}>
                        <Field id={`rm-${m.organization_id}-${m.profile_id}`} label="Reason">
                          <Input id={`rm-${m.organization_id}-${m.profile_id}`} name="reason" maxLength={500} required />
                        </Field>
                      </AdminForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && <p className="p-4 text-muted">No business memberships.</p>}
        </Card>
      </section>
    </div>
  );
}
