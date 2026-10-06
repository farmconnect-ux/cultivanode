import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Badge, Card, LinkButton } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { BookingSummary } from "@/lib/account/bookings";
import type { Account } from "@/lib/account/session";
import { fill, formatDateTime, formatDay } from "@/lib/text";

export function ProviderDashboard({
  lang,
  account,
  t,
  bookings,
  listingsCount = 0,
}: {
  lang: Locale;
  account: Account;
  t: Dictionary;
  bookings: BookingSummary[];
  listingsCount?: number;
}) {
  const firstName = account.profile.full_name?.split(" ")[0] ?? "Provider";

  // Filter jobs by operational stage for provider
  const incomingRequests = bookings.filter((b) => b.status === "requested");
  const activeJobs = bookings.filter((b) => ["accepted", "in_progress"].includes(b.status));
  const completedJobs = bookings.filter((b) => ["confirmed", "completed"].includes(b.status));
  const awaitingReview = bookings.filter((b) => b.status === "awaiting_confirmation");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-leaf-800 sm:text-4xl">
          Good morning, {firstName}
        </h1>
        <p className="mt-1 text-base text-muted">Your equipment & service business at a glance</p>
      </div>

      {/* 4 Key Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="flex flex-col justify-between gap-1 p-5 border-l-4 border-l-harvest-500">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">New Requests</span>
          <span className="text-3xl font-extrabold text-harvest-700">{incomingRequests.length}</span>
          <span className="text-xs text-muted">Awaiting response</span>
        </Card>

        <Card className="flex flex-col justify-between gap-1 p-5 border-l-4 border-l-node-600">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Active Jobs</span>
          <span className="text-3xl font-extrabold text-node-800">{activeJobs.length}</span>
          <span className="text-xs text-muted">Accepted / In field</span>
        </Card>

        <Card className="flex flex-col justify-between gap-1 p-5 border-l-4 border-l-leaf-600">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Completed</span>
          <span className="text-3xl font-extrabold text-leaf-800">{completedJobs.length}</span>
          <span className="text-xs text-muted">Settled jobs</span>
        </Card>

        <Card className="flex flex-col justify-between gap-1 p-5 border-l-4 border-l-harvest-400">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Rating</span>
          <span className="text-3xl font-extrabold text-harvest-600">4.9 ★</span>
          <span className="text-xs text-muted">Verified feedback</span>
        </Card>
      </div>

      {/* NEW REQUESTS FEED (Opportunities that need response) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-leaf-900">
            Incoming Requests ({incomingRequests.length})
          </h2>
          {incomingRequests.length > 0 && (
            <span className="text-xs font-bold text-harvest-700">Action needed within 24h</span>
          )}
        </div>

        {incomingRequests.length === 0 ? (
          <Card className="p-6 text-center text-muted">
            <p className="font-semibold">No new booking requests waiting.</p>
            <p className="text-xs">Incoming farmer requests will appear here for you to accept or decline.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {incomingRequests.map((req) => (
              <li key={req.id}>
                <Card className="flex flex-col gap-3 border-2 border-harvest-200 bg-harvest-50/30 p-5 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-leaf-900">{req.title}</h3>
                      <p className="text-sm font-semibold text-leaf-800">
                        {req.farm_name} · {[req.job_lga, req.job_state].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <Badge className="bg-harvest-100 text-harvest-800 font-bold">New Request</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div>
                      <span className="block text-xs text-muted">Job Date</span>
                      <strong className="text-ink">{formatDay(req.job_date, lang)}</strong>
                    </div>
                    <div>
                      <span className="block text-xs text-muted">Quantity</span>
                      <strong className="text-ink">{req.quantity} {t.units[req.unit]}</strong>
                    </div>
                    <div>
                      <span className="block text-xs text-muted">Travel Distance</span>
                      <strong className="text-ink">{req.distance_km} km</strong>
                    </div>
                    <div>
                      <span className="block text-xs text-muted">Est. Earnings</span>
                      <strong className="text-leaf-800 tabular-nums">{formatNaira(req.total_kobo)}</strong>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-harvest-700">
                    {fill(t.acct.bookings.answerBy, { time: formatDateTime(req.expires_at, lang) })}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1 border-t border-line">
                    <LinkButton
                      href={`/${lang}/account/bookings/${req.id}?ws=provider`}
                      className="bg-leaf-700 text-white font-bold"
                    >
                      View Request & Respond →
                    </LinkButton>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ACTIVE & IN-FIELD JOBS */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold text-leaf-900">Active Field Work ({activeJobs.length})</h2>

        {activeJobs.length === 0 ? (
          <Card className="p-6 text-center text-muted">
            <p>No jobs currently in progress.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {activeJobs.map((job) => (
              <li key={job.id}>
                <Card className="flex flex-col gap-3 border-l-4 border-l-node-600 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-leaf-900">{job.title}</h3>
                      <p className="text-sm text-muted">
                        Farmer: {job.other_name || "Verified Farmer"} · {job.farm_name}
                      </p>
                    </div>
                    <Badge className="bg-node-100 text-node-800 font-bold">
                      {job.status === "in_progress" ? "In Progress" : "Confirmed"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-leaf-800">
                      Date: {formatDay(job.job_date, lang)}
                    </span>
                    <LinkButton
                      href={`/${lang}/account/bookings/${job.id}?ws=provider`}
                      className="bg-leaf-700 text-white font-bold text-xs"
                    >
                      {job.status === "in_progress" ? "Upload Proof & Complete" : "GPS Check-In & Execute"} →
                    </LinkButton>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* EQUIPMENT & LISTINGS STATUS */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-leaf-900">Equipment & Services</h2>
          <Link
            href={`/${lang}/account/listings?ws=provider`}
            className="text-sm font-bold text-leaf-700 hover:underline"
          >
            Manage Equipment →
          </Link>
        </div>

        <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          <div>
            <p className="font-bold text-leaf-800">{listingsCount} Listed Item(s) in Fleet</p>
            <p className="text-sm text-muted">Configure tractors, implements, rates per hectare, and service radius.</p>
          </div>
          <LinkButton
            href={`/${lang}/account/listings?ws=provider`}
            variant="secondary"
            className="font-bold text-xs shrink-0"
          >
            + Add Equipment
          </LinkButton>
        </Card>
      </section>
    </div>
  );
}
