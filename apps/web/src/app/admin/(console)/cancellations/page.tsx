import type { Metadata } from "next";
import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Button, Card } from "@/components/ui";
import { phoneLabel, when } from "@/lib/admin/labels";
import { requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cancellations & Declines | CultivaNode Admin" };

type BookingStats = {
  total: number;
  disputed: number;
  cancelled: number;
  declined: number;
  resolved_disputes: number;
  open_over_48h: number;
};

export default async function AdminCancellationsPage() {
  const staff = await requireStaff();
  if (!staff) return null;

  const supabase = await createClient();

  const [{ data: cancelledJobs }, { data: rawStats }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, listing_title, farm_name, job_state, job_lga, job_date, total_kobo, status, closed_reason, dispute_outcome, farmer_id, provider_id, updated_at, created_at, profiles!bookings_farmer_id_fkey(full_name, phone)",
      )
      .in("status", ["cancelled", "declined"])
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase.rpc("admin_booking_stats"),
  ]);

  const list = cancelledJobs ?? [];
  const stats = (rawStats ?? null) as unknown as BookingStats | null;
  const totalBookings = stats?.total ?? 0;
  const cancelledCount = stats?.cancelled ?? list.filter((j) => j.status === "cancelled").length;
  const declinedCount = stats?.declined ?? list.filter((j) => j.status === "declined").length;
  const cancellationRate = totalBookings > 0 ? `${((cancelledCount / totalBookings) * 100).toFixed(1)}%` : "—";
  const disputeCancelledCount = list.filter((j) => j.dispute_outcome === "uphold_farmer").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-leaf-900">Cancellations &amp; Declines Queue</h1>
          <p className="mt-1 text-muted">Live cancelled and declined bookings with recorded reasons and audit links.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-line text-muted">Showing: {list.length}</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-muted">Cancellation Rate</p>
          <p className="text-2xl font-black text-leaf-800">{cancellationRate}</p>
          <p className="text-xs text-muted">
            {totalBookings > 0
              ? `${cancelledCount} cancelled of ${totalBookings} total bookings`
              : "No bookings recorded yet"}
          </p>
        </Card>
        <Card className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-muted">Cancelled Jobs</p>
          <p className="text-2xl font-black text-leaf-800">{cancelledCount}</p>
          <p className="text-xs text-leaf-700">
            {disputeCancelledCount > 0
              ? `${disputeCancelledCount} closed via farmer-upheld dispute`
              : "Withdrawn by party or staff override"}
          </p>
        </Card>
        <Card className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-muted">Declined Requests</p>
          <p className="text-2xl font-black text-harvest-800">{declinedCount}</p>
          <p className="text-xs text-muted">Declined by provider before work began</p>
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
                <th className="p-3">Status &amp; Reason</th>
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
                        {job.closed_reason && (
                          <div className="mt-1 max-w-xs truncate text-xs text-muted" title={job.closed_reason}>
                            {job.closed_reason}
                          </div>
                        )}
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
