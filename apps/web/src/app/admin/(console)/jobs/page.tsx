import type { Metadata } from "next";
import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { phoneLabel, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Jobs Console" };

const STATUSES = [
  "requested",
  "accepted",
  "in_progress",
  "awaiting_confirmation",
  "confirmed",
  "disputed",
  "completed",
  "cancelled",
  "declined",
] as const;

const STATUS_BADGES: Record<string, string> = {
  requested: "bg-harvest-100 text-harvest-800",
  accepted: "bg-leaf-100 text-leaf-800",
  in_progress: "bg-node-100 text-node-800",
  awaiting_confirmation: "bg-harvest-200 text-harvest-900",
  confirmed: "bg-leaf-200 text-leaf-900",
  disputed: "bg-red-100 text-danger",
  completed: "bg-leaf-300 text-leaf-900",
  cancelled: "bg-line text-muted",
  declined: "bg-line text-muted",
};

export default async function AdminJobsPage({
  searchParams,
}: PageProps<"/admin/jobs">) {
  const staff = await requireStaff();
  if (!staff) return null;

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const statusRaw = typeof sp.status === "string" ? sp.status : "";
  type BookingStatus = (typeof STATUSES)[number];
  const status: BookingStatus | undefined = (STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as BookingStatus)
    : undefined;

  const supabase = await createClient();

  let query = supabase
    .from("bookings")
    .select(
      "id, listing_title, listing_kind, equipment_type, provider_type, farm_name, job_state, job_lga, job_date, unit, quantity, total_kobo, status, farmer_id, provider_id, disputed_at, dispute_category, created_at, profiles!bookings_farmer_id_fkey(full_name, phone)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);
  if (q) query = query.or(`listing_title.ilike.%${q}%,farm_name.ilike.%${q}%,job_lga.ilike.%${q}%`);

  const { data: jobs, error } = await query;
  const list = (jobs ?? []) as unknown as Array<{
    id: string;
    listing_title: string;
    listing_kind: string;
    equipment_type: string | null;
    provider_type: string | null;
    farm_name: string;
    job_state: string | null;
    job_lga: string | null;
    job_date: string;
    unit: string;
    quantity: number;
    total_kobo: number;
    status: string;
    farmer_id: string;
    provider_id: string;
    created_at: string;
    profiles: { full_name: string | null; phone: string | null } | null;
  }>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-leaf-800">Jobs Console</h1>
          <p className="mt-1 text-sm text-muted">
            Dense operational view of all platform bookings, executions, and disputes.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/disputes"
            className="rounded-md border border-danger/30 bg-red-50 px-3 py-1.5 text-xs font-bold text-danger hover:bg-red-100"
          >
            ⚠️ Open Disputes Workstation
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-white p-4">
        <div className="flex-1 min-w-[14rem]">
          <label htmlFor="job-q" className="block text-xs font-bold uppercase tracking-wider text-muted">
            Search Jobs
          </label>
          <Input
            id="job-q"
            name="q"
            defaultValue={q}
            placeholder="Search by title, farm, or LGA..."
            className="mt-1"
          />
        </div>

        <div className="w-48">
          <label htmlFor="job-st" className="block text-xs font-bold uppercase tracking-wider text-muted">
            Status
          </label>
          <Select id="job-st" name="status" defaultValue={status} className="mt-1">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" className="font-bold">
          Filter
        </Button>
      </form>

      {/* Dense Operational Table */}
      <Card className="overflow-x-auto p-0 shadow-xs">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-line bg-cream text-xs font-bold uppercase tracking-wider text-muted">
            <tr>
              <th className="p-3">Job ID</th>
              <th className="p-3">Service / Title</th>
              <th className="p-3">Farmer</th>
              <th className="p-3">Farm & Location</th>
              <th className="p-3">Date</th>
              <th className="p-3">Total (₦)</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted">
                  No jobs found matching the filters.
                </td>
              </tr>
            ) : (
              list.map((j) => (
                <tr key={j.id} className="hover:bg-leaf-50/40 transition-colors">
                  <td className="p-3 font-mono text-xs font-bold">
                    <Link href={`/admin/jobs/${j.id}`} className="text-leaf-700 underline">
                      CN-{j.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-leaf-900">{j.listing_title}</span>
                    <span className="block text-xs text-muted capitalize">{j.listing_kind}</span>
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/users/${j.farmer_id}`} className="font-semibold text-leaf-800 underline">
                      {j.profiles?.full_name ?? "Farmer"}
                    </Link>
                    <span className="block text-xs text-muted">{phoneLabel(j.profiles?.phone)}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-ink">{j.farm_name}</span>
                    <span className="block text-xs text-muted">{[j.job_lga, j.job_state].filter(Boolean).join(", ")}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="font-medium">{j.job_date}</span>
                    <span className="block text-xs text-muted">{when(j.created_at)}</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-leaf-900 tabular-nums">
                    {formatNaira(j.total_kobo)}
                  </td>
                  <td className="p-3">
                    <Badge className={STATUS_BADGES[j.status] ?? "bg-line text-ink"}>
                      {j.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/jobs/${j.id}`}
                      className="inline-flex items-center rounded-md border border-line bg-white px-2.5 py-1 text-xs font-bold text-leaf-700 hover:border-leaf-600 hover:bg-leaf-50"
                    >
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
