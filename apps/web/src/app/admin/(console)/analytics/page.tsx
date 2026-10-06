import type { Metadata } from "next";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Card } from "@/components/ui";
import { requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Operations Analytics | CultivaNode Admin" };

export default async function AdminAnalyticsPage() {
  const staff = await requireStaff();
  if (!staff) return null;

  const supabase = await createClient();

  // 1. Fetch exact real counts from PostgreSQL tables
  const [
    { count: totalUsers },
    { count: totalFarms },
    { count: totalBookings },
    { count: activeBookings },
    { count: completedBookings },
    { count: disputedBookings },
    { data: allJobs },
    { data: ratingsData },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("farms").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }).in("status", ["in_progress", "awaiting_confirmation", "accepted"]),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "disputed"),
    supabase.from("bookings").select("id, farmer_id, provider_id, job_state, listing_kind, total_kobo, status, created_at, responded_at, checked_in_at, work_submitted_at"),
    supabase.from("ratings").select("stars"),
  ]);

  const jobsList = allJobs ?? [];
  const ratings = ratingsData ?? [];

  // Calculate real Gross Transaction Volume (GTV) in kobo from actual confirmed/completed/active jobs
  let grossVolumeKobo = 0;
  const stateCounts: Record<string, number> = {};
  const serviceCounts: Record<string, number> = {};
  const farmerJobCounts: Record<string, number> = {};
  let totalResponseTimeMs = 0;
  let responseTimeCount = 0;
  let totalDurationMs = 0;
  let durationCount = 0;

  jobsList.forEach((j) => {
    // Volume
    if (["accepted", "in_progress", "awaiting_confirmation", "confirmed", "completed"].includes(j.status)) {
      grossVolumeKobo += j.total_kobo || 0;
    }

    // State aggregation
    const state = j.job_state || "Unspecified";
    stateCounts[state] = (stateCounts[state] || 0) + 1;

    // Service aggregation
    const kind = j.listing_kind || "Unspecified";
    serviceCounts[kind] = (serviceCounts[kind] || 0) + 1;

    // Farmer frequency for repeat booking calculation
    if (j.farmer_id) {
      farmerJobCounts[j.farmer_id] = (farmerJobCounts[j.farmer_id] || 0) + 1;
    }

    // Response time (created_at -> responded_at)
    if (j.created_at && j.responded_at) {
      const diff = new Date(j.responded_at).getTime() - new Date(j.created_at).getTime();
      if (diff > 0) {
        totalResponseTimeMs += diff;
        responseTimeCount++;
      }
    }

    // Completion duration (checked_in_at -> work_submitted_at)
    if (j.checked_in_at && j.work_submitted_at) {
      const diff = new Date(j.work_submitted_at).getTime() - new Date(j.checked_in_at).getTime();
      if (diff > 0) {
        totalDurationMs += diff;
        durationCount++;
      }
    }
  });

  const totalJobsCount = jobsList.length;
  const completionRate = totalJobsCount > 0 ? (((completedBookings ?? 0) / totalJobsCount) * 100).toFixed(1) : "0.0";
  const disputeRate = totalJobsCount > 0 ? (((disputedBookings ?? 0) / totalJobsCount) * 100).toFixed(1) : "0.0";

  // Real average provider response time
  const avgResponseMinutes = responseTimeCount > 0
    ? Math.round(totalResponseTimeMs / responseTimeCount / 60000)
    : null;

  // Real average job completion duration
  const avgDurationHours = durationCount > 0
    ? (totalDurationMs / durationCount / 3600000).toFixed(1)
    : null;

  // Real ratings statistics
  const totalStars = ratings.reduce((acc, r) => acc + (r.stars || 0), 0);
  const avgRating = ratings.length > 0 ? (totalStars / ratings.length).toFixed(2) : null;

  // Real repeat booking calculation
  const totalUniqueFarmers = Object.keys(farmerJobCounts).length;
  const repeatFarmers = Object.values(farmerJobCounts).filter((c) => c > 1).length;
  const repeatRate = totalUniqueFarmers > 0 ? Math.round((repeatFarmers / totalUniqueFarmers) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-leaf-900">Operations &amp; Marketplace Analytics</h1>
          <p className="mt-1 text-muted">Aggregated real-time metrics computed directly from PostgreSQL tables and views.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-leaf-100 text-leaf-800">Direct Database Aggregation</Badge>
          <Badge className="bg-node-100 text-node-800">Records Evaluated: {totalJobsCount}</Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col gap-1 border-t-4 border-t-leaf-600">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total Registered Users</p>
          <p className="text-3xl font-black text-leaf-900">{totalUsers ?? 0}</p>
          <p className="text-xs text-muted">From profiles table</p>
        </Card>
        <Card className="flex flex-col gap-1 border-t-4 border-t-node-500">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Active Operations</p>
          <p className="text-3xl font-black text-node-800">{activeBookings ?? 0}</p>
          <p className="text-xs text-muted">In-progress or awaiting confirmation</p>
        </Card>
        <Card className="flex flex-col gap-1 border-t-4 border-t-harvest-500">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Completion Rate</p>
          <p className="text-3xl font-black text-harvest-800">{completionRate}%</p>
          <p className="text-xs text-muted">{completedBookings ?? 0} of {totalJobsCount} jobs completed</p>
        </Card>
        <Card className="flex flex-col gap-1 border-t-4 border-t-danger">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Dispute Rate</p>
          <p className="text-3xl font-black text-danger">{disputeRate}%</p>
          <p className="text-xs text-muted">{disputedBookings ?? 0} disputed bookings recorded</p>
        </Card>
      </div>

      {/* Operational Velocities */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Gross Transaction Volume</p>
          <p className="text-2xl font-black text-leaf-800">{formatNaira(grossVolumeKobo)}</p>
          <p className="text-xs text-muted">Sum of active &amp; completed job amounts</p>
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Avg Provider Response Time</p>
          <p className="text-2xl font-black text-leaf-800">
            {avgResponseMinutes !== null ? `${avgResponseMinutes} mins` : "No responded jobs yet"}
          </p>
          <p className="text-xs text-muted">Calculated from {responseTimeCount} responded requests</p>
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Avg Job Completion Time</p>
          <p className="text-2xl font-black text-leaf-800">
            {avgDurationHours !== null ? `${avgDurationHours} hours` : "No completed proof cycles yet"}
          </p>
          <p className="text-xs text-muted">Calculated from {durationCount} check-in to proof intervals</p>
        </Card>
      </div>

      {/* Database Breakdown Grids */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jobs by State */}
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-leaf-900">Jobs by State (From Database Records)</h2>
          {Object.keys(stateCounts).length === 0 ? (
            <p className="text-sm text-muted">No state-tagged bookings recorded in database yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stateCounts).map(([state, count]) => {
                const pct = totalJobsCount > 0 ? Math.round((count / totalJobsCount) * 100) : 0;
                return (
                  <div key={state} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-ink">{state} State</span>
                      <span className="text-muted">{count} jobs ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-line/60">
                      <div className="h-full bg-leaf-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Jobs by Service Type */}
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-leaf-900">Demand by Service Type (From Database Records)</h2>
          {Object.keys(serviceCounts).length === 0 ? (
            <p className="text-sm text-muted">No service-typed bookings recorded in database yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(serviceCounts).map(([kind, count]) => {
                const pct = totalJobsCount > 0 ? Math.round((count / totalJobsCount) * 100) : 0;
                return (
                  <div key={kind} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-ink">{kind.replace("_", " ").toUpperCase()}</span>
                      <span className="text-muted">{count} jobs ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-line/60">
                      <div className="h-full bg-node-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Real Retention and Ratings from Database */}
      <Card className="flex flex-col gap-4 bg-earth-50/50">
        <h2 className="text-lg font-bold text-leaf-900">User Retention &amp; Verified Ratings Health</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-line bg-surface p-4">
            <p className="text-xs font-semibold text-muted">Farmer Repeat Booking Rate</p>
            <p className="mt-1 text-xl font-extrabold text-leaf-800">{repeatRate}%</p>
            <p className="mt-1 text-xs text-muted">{repeatFarmers} of {totalUniqueFarmers} farmers booked 2+ times</p>
          </div>
          <div className="rounded-md border border-line bg-surface p-4">
            <p className="text-xs font-semibold text-muted">Registered Farms on Platform</p>
            <p className="mt-1 text-xl font-extrabold text-leaf-800">{totalFarms ?? 0}</p>
            <p className="mt-1 text-xs text-muted">Total farm records in database</p>
          </div>
          <div className="rounded-md border border-line bg-surface p-4">
            <p className="text-xs font-semibold text-muted">Average Rating</p>
            <p className="mt-1 text-xl font-extrabold text-leaf-800">
              {avgRating !== null ? `${avgRating} ★` : "No ratings"}
            </p>
            <p className="mt-1 text-xs text-muted">From {ratings.length} verified ratings in database</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
