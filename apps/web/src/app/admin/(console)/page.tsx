import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { can, requireStaff } from "@/lib/admin/staff";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminHome() {
  const staff = await requireStaff();
  if (!staff) return null; // the layout shows the "no staff access" message

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">Welcome{staff.name ? `, ${staff.name}` : ""}</h1>
        <p className="mt-1 text-muted">The approval queue, users and audit views arrive next in M1.</p>
      </div>
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
