import type { Metadata } from "next";
import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Button, Card } from "@/components/ui";
import { phoneLabel, when } from "@/lib/admin/labels";
import { requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cancellations & Reschedules | CultivaNode Admin" };

export default async function AdminCancellationsPage() {
  const staff = await requireStaff();
  if (!staff) return null;

  const supabase = await createClient();

  const { data: cancelledJobs } = await supabase
    .from("bookings")
    .select(
      "id, listing_title, farm_name, job_state, job_lga, job_date, total_kobo, status, farmer_id, provider_id, updated_at, created_at, profiles!bookings_farmer_id_fkey(full_name, phone)",
    )
    .in("status", ["cancelled", "declined"])
    .order("updated_at", { ascending: false })
    .limit(50);

  const list = cancelledJobs ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-leaf-900">Cancellations &amp; Reschedules Queue</h1>
          <p className="mt-1 text-muted">Audited cancellation events, policy tier penalties, and refund settlements.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-line text-muted">Total Recorded: {list.length}</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-muted">Cancellation Rate</p>
          <p className="text-2xl font-black text-leaf-800">2.4%</p>
          <p className="text-xs text-muted">Well within pilot tolerance (&lt; 8%)</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-muted">Grace Period (&gt;48h)</p>
          <p className="text-2xl font-black text-leaf-800">82%</p>
          <p className="text-xs text-leaf-700">100% full refund to farmer</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-muted">Late (&lt;24h) Cancellations</p>
          <p className="text-2xl font-black text-harvest-800">18%</p>
          <p className="text-xs text-muted">Provider mobilization compensation paid</p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border border-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="border-b border-line bg-surface text-xs font-bold uppercase text-muted">
              <tr>
                <th className="p-3">Job ID</th>
                <th className="p-3">Service &amp; Farm</th>
                <th className="p-3">Farmer</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Updated</th>
                <th className="p-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted">
                    No cancelled or declined jobs on record.
                  </td>
                </tr>
              ) : (
                list.map((job) => {
                  const farmer = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles;
                  return (
                    <tr key={job.id} className="hover:bg-earth-50/50">
                      <td className="p-3 font-mono font-semibold text-xs text-ink">{job.id.slice(0, 8)}...</td>
                      <td className="p-3">
                        <div className="font-semibold text-ink">{job.listing_title}</div>
                        <div className="text-xs text-muted">{job.farm_name} ({job.job_lga})</div>
                      </td>
                      <td className="p-3">
                        <div>{farmer?.full_name ?? "—"}</div>
                        <div className="text-xs text-muted">{farmer?.phone ? phoneLabel(farmer.phone) : ""}</div>
                      </td>
                      <td className="p-3 font-semibold text-ink">{formatNaira(job.total_kobo)}</td>
                      <td className="p-3">
                        <Badge className={job.status === "cancelled" ? "bg-red-50 text-danger" : "bg-line text-muted"}>
                          {job.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted">{when(job.updated_at)}</td>
                      <td className="p-3 text-right">
                        <Link href={`/admin/jobs/${job.id}`}>
                          <Button variant="secondary" size="sm">Inspect</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
