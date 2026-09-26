import type { Metadata } from "next";
import Link from "next/link";
import { normalizeNgPhone } from "@cultivanode/shared";
import { Alert, Button, Card, Input } from "@/components/ui";
import { phoneLabel, TIER_LABELS, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "users.read")) return <Alert tone="danger">You need the users.read permission.</Alert>;
  const { q: raw } = await searchParams;
  const q = typeof raw === "string" ? raw.trim().slice(0, 80) : "";

  const supabase = await createClient();
  let query = supabase.from("profiles")
    .select("id, full_name, phone, account_type, verification_tier, state, created_at, onboarded_at")
    .order("created_at", { ascending: false }).limit(50);
  if (q) {
    const phone = normalizeNgPhone(q);
    if (phone && phone !== "invalid") query = query.eq("phone", phone);
    else if (/^[0-9]{4,}$/.test(q)) query = query.like("phone", `%${q}%`);
    else query = query.ilike("full_name", `%${q.replace(/[%_,()]/g, " ")}%`);
  }
  const { data: people, error } = await query;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-leaf-800">Users</h1>
      <form className="flex flex-wrap items-end gap-2" role="search">
        <label htmlFor="q" className="sr-only">Search by name or phone</label>
        <Input id="q" name="q" defaultValue={q} placeholder="Name or phone number" className="max-w-md" />
        <Button type="submit">Search</Button>
      </form>
      {error && <Alert tone="danger">Could not load users.</Alert>}
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[40rem] text-left">
          <thead className="border-b border-line bg-cream text-sm">
            <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Type</th><th className="p-3">Verification</th><th className="p-3">State</th><th className="p-3">Joined</th></tr>
          </thead>
          <tbody>
            {(people ?? []).map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="p-3">
                  <Link href={`/admin/users/${p.id}`} className="font-semibold text-leaf-700 underline">{p.full_name ?? "(not set up)"}</Link>
                  {!p.onboarded_at && <span className="ml-2 text-sm text-muted">onboarding not finished</span>}
                </td>
                <td className="p-3 whitespace-nowrap">{phoneLabel(p.phone)}</td>
                <td className="p-3">{p.account_type}</td>
                <td className="p-3">{TIER_LABELS[p.verification_tier]?.split(":")[0]}</td>
                <td className="p-3">{p.state ?? "-"}</td>
                <td className="p-3 whitespace-nowrap">{when(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(people ?? []).length === 0 && <p className="p-4 text-muted">No one found.</p>}
      </Card>
    </div>
  );
}
