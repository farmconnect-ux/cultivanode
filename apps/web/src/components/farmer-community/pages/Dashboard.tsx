"use client";

import Link from "next/link";
import { MapPin, ClipboardList, Tractor } from "lucide-react";
import type { FarmerLive } from "../live";
import { hectares, OPEN_JOB } from "../live";

const statusLabel: Record<string, string> = {
  requested: "Waiting for an answer",
  accepted: "Agreed",
  in_progress: "On the job",
  awaiting_confirmation: "Waiting for your confirmation",
  confirmed: "Confirmed",
  disputed: "In dispute",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
  expired: "Closed",
};

export function Dashboard({ live }: { live: FarmerLive }) {
  const { lang, farms, bookings } = live;
  const open = bookings.filter((b) => OPEN_JOB.has(b.status));
  const area = hectares(farms);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your farm</h1>
        <p className="mt-1 text-sm text-gray-600">
          These numbers are from this account. Nothing here is a sample farm.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl bg-leaf-800 p-4 text-white">
          <MapPin className="h-5 w-5" />
          <p className="mt-3 text-sm text-white/80">Farms on this account</p>
          <p className="text-3xl font-bold">{farms.length}</p>
          <p className="text-sm text-white/80">{area > 0 ? `${area.toFixed(1)} hectares recorded` : "Add a size when you know it"}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4">
          <ClipboardList className="h-5 w-5 text-leaf-800" />
          <p className="mt-3 text-sm text-gray-500">Open jobs</p>
          <p className="text-3xl font-bold text-gray-900">{open.length}</p>
          <p className="text-sm text-gray-500">Requests, agreed work, and jobs still to confirm</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4">
          <Tractor className="h-5 w-5 text-leaf-800" />
          <p className="mt-3 text-sm text-gray-500">Next step</p>
          <p className="mt-1 font-semibold text-gray-900">{farms.length === 0 ? "Add your farm" : "Hire nearby"}</p>
          <Link
            href={farms.length === 0 ? `/${lang}/account/farms` : `/${lang}/account/find`}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-leaf-800 underline"
          >
            {farms.length === 0 ? "Add a farm" : "Search machinery and labour"}
          </Link>
        </article>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Jobs</h2>
          <Link href={`/${lang}/account/bookings`} className="text-sm font-semibold text-leaf-800 underline">
            All bookings
          </Link>
        </div>
        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">
            No jobs yet. When a provider accepts, the job, proof and confirmation stay on the booking page.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {bookings.slice(0, 5).map((job) => (
              <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-sm text-gray-500">
                    {job.farm_name} · {job.job_date} · {statusLabel[job.status] ?? job.status}
                  </p>
                </div>
                <Link href={`/${lang}/account/bookings/${job.id}`} className="text-sm font-semibold text-leaf-800 underline">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-bold">Farms</h2>
        {farms.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">You have not added a farm yet. Search and hire start from the farm pin.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {farms.map((farm) => (
              <li key={farm.id}>
                <Link href={`/${lang}/account/farms/${farm.id}`} className="block rounded-lg border border-gray-100 p-3 hover:border-leaf-700">
                  <p className="font-semibold">{farm.name}</p>
                  <p className="text-sm text-gray-500">
                    {[farm.lga, farm.state].filter(Boolean).join(", ") || "Location not set"}
                    {farm.area_ha ? ` · ${Number(farm.area_ha).toFixed(1)} ha` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
