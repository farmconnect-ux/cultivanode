import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Alert, Badge, Card, LinkButton } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { BookingSummary } from "@/lib/account/bookings";
import type { Account } from "@/lib/account/session";
import { formatDay } from "@/lib/text";

type Farm = {
  id: string;
  name: string;
  state: string | null;
  lga: string | null;
  area_ha: number | null;
};

export function FarmerDashboard({
  lang,
  account,
  t,
  farms,
  bookings,
}: {
  lang: Locale;
  account: Account;
  t: Dictionary;
  farms: Farm[];
  bookings: BookingSummary[];
}) {
  const firstName = account.profile.full_name?.split(" ")[0] ?? "Farmer";
  const tier = account.profile.verification_tier;

  // Operational partitioning of jobs
  const activeJobs = bookings.filter((b) =>
    ["requested", "accepted", "in_progress", "awaiting_confirmation", "disputed"].includes(b.status),
  );

  // Determine the single most urgent "Next Action"
  const awaitingConfirmation = activeJobs.find((b) => b.status === "awaiting_confirmation");
  const inProgressJob = activeJobs.find((b) => b.status === "in_progress");
  const confirmedJob = activeJobs.find((b) => b.status === "accepted");
  const requestedJob = activeJobs.find((b) => b.status === "requested");

  const nextActionJob = awaitingConfirmation || inProgressJob || confirmedJob || requestedJob;

  return (
    <div className="flex flex-col gap-6">
      {/* Verification Notice if Tier < 1 */}
      {tier < 1 && (
        <Alert tone="warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              <strong>Identity Verification Needed:</strong> Add your NIN to unlock tractor & equipment booking.
            </span>
            <Link
              href={`/${lang}/account/verification?ws=farmer`}
              className="font-bold underline"
            >
              Verify Now →
            </Link>
          </div>
        </Alert>
      )}

      {/* Greeting & Headline */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-leaf-800 sm:text-4xl">
          Good morning, {firstName}
        </h1>
        <p className="mt-1 text-base text-muted">Your farm operations at a glance</p>
      </div>

      {/* Primary Operational Counters */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col justify-between gap-2 p-5 border-l-4 border-l-leaf-600">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Active Farms</span>
            <span className="mt-1 block text-3xl font-extrabold text-leaf-800">{farms.length}</span>
          </div>
          <Link
            href={`/${lang}/account/farms?ws=farmer`}
            className="text-xs font-bold text-leaf-700 hover:underline"
          >
            + Add farm
          </Link>
        </Card>

        <Card className="flex flex-col justify-between gap-2 p-5 border-l-4 border-l-node-600">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Active Jobs</span>
            <span className="mt-1 block text-3xl font-extrabold text-node-800">{activeJobs.length}</span>
          </div>
          <Link
            href={`/${lang}/account/bookings?ws=farmer`}
            className="text-xs font-bold text-node-700 hover:underline"
          >
            View jobs →
          </Link>
        </Card>
      </div>

      {/* NEXT ACTION Card - Most prominent operational block */}
      <Card className="flex flex-col gap-4 border-2 border-leaf-700 bg-leaf-50/60 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-700 px-3 py-0.5 text-xs font-extrabold tracking-wider text-white uppercase">
            ⚡ NEXT ACTION
          </span>
          {nextActionJob && (
            <Badge className="bg-leaf-200 text-leaf-900 font-bold">
              {t.bookingStatus[nextActionJob.status] ?? nextActionJob.status}
            </Badge>
          )}
        </div>

        {nextActionJob ? (
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-leaf-900">
                {nextActionJob.status === "awaiting_confirmation"
                  ? "Proof submitted — Ready for your sign-off"
                  : nextActionJob.status === "in_progress"
                    ? "Job currently in progress on your field"
                    : nextActionJob.status === "accepted"
                      ? "Booking confirmed — Operator scheduled"
                      : "Booking requested — Waiting for provider response"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-leaf-800">
                {nextActionJob.title} · {nextActionJob.farm_name}
              </p>
              <p className="text-sm text-muted">
                Scheduled: {formatDay(nextActionJob.job_date, lang)} · Provider: {nextActionJob.other_name || "Verified Provider"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <LinkButton
                href={`/${lang}/account/bookings/${nextActionJob.id}?ws=farmer`}
                className="bg-leaf-700 text-white font-bold"
              >
                {nextActionJob.status === "awaiting_confirmation" ? "Review Photos & Confirm" : "View Job Details"}
              </LinkButton>
              <LinkButton
                href={`/${lang}/account/bookings/${nextActionJob.id}?ws=farmer#contact`}
                variant="secondary"
                className="font-semibold"
              >
                Contact Provider
              </LinkButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-bold text-leaf-900">No urgent pending actions</h2>
              <p className="text-sm text-muted">Your farms are up to date. Ready for land preparation, spraying, or harvesting?</p>
            </div>
            <LinkButton
              href={`/${lang}/account/bookings/new?ws=farmer`}
              className="self-start bg-leaf-700 text-white font-bold"
            >
              Request a Service Now →
            </LinkButton>
          </div>
        )}
      </Card>

      {/* Quick Action Buttons */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href={`/${lang}/account/bookings/new?ws=farmer`}
            className="flex min-h-14 flex-col items-center justify-center rounded-lg border border-line bg-white p-3 text-center font-bold text-leaf-800 shadow-xs hover:border-leaf-600 hover:bg-leaf-50"
          >
            <span className="text-xl" aria-hidden="true">🚜</span>
            <span className="mt-1 text-xs">Request Service</span>
          </Link>
          <Link
            href={`/${lang}/account/farms?ws=farmer`}
            className="flex min-h-14 flex-col items-center justify-center rounded-lg border border-line bg-white p-3 text-center font-bold text-leaf-800 shadow-xs hover:border-leaf-600 hover:bg-leaf-50"
          >
            <span className="text-xl" aria-hidden="true">🌱</span>
            <span className="mt-1 text-xs">My Farms</span>
          </Link>
          <Link
            href={`/${lang}/account/bookings?ws=farmer`}
            className="flex min-h-14 flex-col items-center justify-center rounded-lg border border-line bg-white p-3 text-center font-bold text-leaf-800 shadow-xs hover:border-leaf-600 hover:bg-leaf-50"
          >
            <span className="text-xl" aria-hidden="true">📋</span>
            <span className="mt-1 text-xs">All Jobs</span>
          </Link>
          <Link
            href={`/${lang}/account/find?ws=farmer`}
            className="flex min-h-14 flex-col items-center justify-center rounded-lg border border-line bg-white p-3 text-center font-bold text-leaf-800 shadow-xs hover:border-leaf-600 hover:bg-leaf-50"
          >
            <span className="text-xl" aria-hidden="true">🔍</span>
            <span className="mt-1 text-xs">Find Machinery</span>
          </Link>
        </div>
      </div>

      {/* Active Farms Overview */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-leaf-900">Your Farms</h2>
          <Link
            href={`/${lang}/account/farms?ws=farmer`}
            className="text-sm font-semibold text-leaf-700 hover:underline"
          >
            Manage Farms →
          </Link>
        </div>

        {farms.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="text-3xl" aria-hidden="true">🏡</span>
            <div>
              <p className="font-bold">No farms registered yet</p>
              <p className="text-sm text-muted">Add your farm boundary or location to book verified machinery.</p>
            </div>
            <LinkButton href={`/${lang}/account/farms?ws=farmer`} className="bg-leaf-700 text-white font-bold">
              + Add Your First Farm
            </LinkButton>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {farms.map((f) => (
              <Card key={f.id} className="flex flex-col justify-between gap-3 p-5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-leaf-800">{f.name}</h3>
                    <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-[11px] font-bold text-leaf-800">
                      ● Active
                    </span>
                  </div>
                  <p className="text-sm text-muted">
                    {[f.lga, f.state].filter(Boolean).join(", ") || "Location set"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-leaf-900">
                    {f.area_ha ? `${f.area_ha} hectares` : "Area unmapped"}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <span className="text-xs text-muted">Boundary verified</span>
                  <Link
                    href={`/${lang}/account/farms/${f.id}`}
                    className="text-xs font-bold text-leaf-700 hover:underline"
                  >
                    Open Farm (Operations) →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
