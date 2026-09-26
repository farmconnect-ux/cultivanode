import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Overview" };

type Counts = Partial<Record<
  "pending_role_requests" | "pending_documents" | "open_contact_messages" | "waitlist_signups" | "open_data_requests" | "users" | "users_last_7_days",
  number | null
>>;

export default async function AdminHome() {
  const staff = await requireStaff();
  if (!staff) return null; // the layout shows the "no staff access" message

  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_dashboard");
  const c = (data ?? {}) as Counts;

  const tiles = [
    { label: "Role requests waiting", value: c.pending_role_requests, href: "/admin/approvals" },
    { label: "Documents waiting", value: c.pending_documents, href: "/admin/approvals" },
    { label: "Open contact messages", value: c.open_contact_messages, href: "/admin/inbox" },
    { label: "Deletion requests open", value: c.open_data_requests, href: "/admin/privacy" },
    { label: "People signed up", value: c.users, href: "/admin/users" },
    { label: "New this week", value: c.users_last_7_days, href: "/admin/users" },
    { label: "Marketplace waitlist", value: c.waitlist_signups, href: "/admin/inbox" },
  ].filter((t) => typeof t.value === "number");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">Welcome{staff.name ? `, ${staff.name}` : ""}</h1>
        <p className="mt-1 text-muted">What needs attention today.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="block rounded-lg border border-line bg-white p-5 hover:border-leaf-600">
              <span className="block text-4xl font-extrabold text-leaf-800">{t.value}</span>
              <span className="mt-1 block font-semibold">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      {can(staff, "integrations.manage") && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Integrations</h2>
          <p className="text-muted">Choose the SMS and identity-check providers, add their keys and switch between test and live.</p>
          <Link href="/admin/integrations" className="font-semibold text-leaf-700 hover:underline">
            Open integrations
          </Link>
        </Card>
      )}
      <Card>
        <h2 className="text-xl font-bold">Your permissions</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {staff.permissions.map((p) => (
            <li key={p} className="rounded-full border border-line bg-cream px-3 py-1 text-sm font-semibold">
              {p}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
