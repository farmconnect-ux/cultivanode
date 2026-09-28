import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Badge, Button, Card, Input, Select } from "@/components/ui";
import { phoneLabel, roleLabel, TIER_LABELS, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users" };

type Person = {
  id: string;
  full_name: string | null;
  phone: string | null;
  state: string | null;
  account_type: string;
  verification_tier: number;
  created_at: string;
  onboarded_at: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  flagged_at: string | null;
  flag_reason: string | null;
  roles: { role: string; provider_type: string | null }[];
  organizations: string[];
  is_staff: boolean;
};

const FILTERS = [
  ["", "Everyone"],
  ["suspended", "Suspended"],
  ["flagged", "Flagged"],
  ["tier2", "Verification level 2+"],
  ["staff", "Staff"],
] as const;

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "users.read")) return <Alert tone="danger">You need the users.read permission.</Alert>;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const filterRaw = typeof sp.filter === "string" ? sp.filter : "";
  const filter = FILTERS.some(([v]) => v === filterRaw) ? filterRaw : "";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_search_users", {
    p_query: q || undefined, p_filter: filter || undefined, p_limit: 100,
  });
  const people = (data ?? []) as unknown as Person[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-leaf-800">Users</h1>
      <form className="flex flex-wrap items-end gap-2" role="search">
        <label htmlFor="q" className="sr-only">Search by name, phone or business</label>
        <Input id="q" name="q" defaultValue={q} placeholder="Name, phone (0803…) or business" className="max-w-md" />
        <label htmlFor="filter" className="sr-only">Show</label>
        <Select id="filter" name="filter" defaultValue={filter} className="w-auto">
          {FILTERS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </Select>
        <Button type="submit">Search</Button>
      </form>
      {error && <Alert tone="danger">Could not load users.</Alert>}
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[48rem] text-left">
          <caption className="sr-only">People matching the search, newest first</caption>
          <thead className="border-b border-line bg-cream text-sm">
            <tr>
              <th className="p-3" scope="col">Name</th><th className="p-3" scope="col">Phone</th>
              <th className="p-3" scope="col">Roles and business</th><th className="p-3" scope="col">Verification</th>
              <th className="p-3" scope="col">State</th><th className="p-3" scope="col">Joined</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-b border-line align-top last:border-0">
                <td className="p-3">
                  <Link href={`/admin/users/${p.id}`} className="font-semibold text-leaf-700 underline">{p.full_name ?? "(not set up)"}</Link>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.suspended_at && <Badge className="bg-red-50 text-danger" title={p.suspended_reason ?? ""}>Suspended</Badge>}
                    {p.flagged_at && <Badge title={p.flag_reason ?? ""}>Flagged</Badge>}
                    {p.is_staff && <Badge className="bg-node-50 text-node-700">Staff</Badge>}
                    {!p.onboarded_at && <span className="text-sm text-muted">onboarding not finished</span>}
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap">{phoneLabel(p.phone)}</td>
                <td className="p-3 text-sm">
                  {p.roles.map((r) => roleLabel(r.role, r.provider_type)).join(", ") || "-"}
                  {p.organizations.length > 0 && <div className="text-muted">{p.organizations.join(", ")}</div>}
                </td>
                <td className="p-3">{TIER_LABELS[p.verification_tier]?.split(":")[0]}</td>
                <td className="p-3">{p.state ?? "-"}</td>
                <td className="p-3 whitespace-nowrap">{when(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {people.length === 0 && <p className="p-4 text-muted">No one found.</p>}
      </Card>
    </div>
  );
}
