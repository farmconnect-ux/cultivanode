import type { Metadata } from "next";
import Link from "next/link";
import { BarList, LineArea, StackedColumns, type Series } from "@/components/admin/charts";
import { WeatherPanel } from "@/components/admin/weather-panel";
import { Card } from "@/components/ui";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";
import { loadPilotWeather } from "@/lib/weather";
import type { WeatherResponse } from "@cultivanode/shared";

export const metadata: Metadata = { title: "Overview" };

type Counts = Partial<Record<
  "pending_role_requests" | "pending_documents" | "open_contact_messages" | "waitlist_signups" | "open_data_requests" | "users" | "users_last_7_days"
  | "oldest_pending_role_request_hours" | "median_approval_hours_30d" | "suspended_accounts" | "flagged_accounts"
  | "active_listings" | "suspended_listings",
  number | null
>> & { marketplace_live?: { enabled: boolean; states: string[] | null } | null };

type Analytics = {
  days: number;
  totals: { people: number; onboarded: number; new_in_period: number; new_previous_period: number; onboarded_in_period: number };
  signups_by_day: { day: string; web: number; mobile: number; field_agent: number; not_finished: number }[];
  by_channel: Partial<Record<"web" | "mobile" | "field_agent" | "not_finished", number>>;
  roles: { role: string; active: number; pending: number }[];
  states: { state: string; people: number }[];
  tiers: Record<string, number>;
  approvals: {
    pending: number;
    approved_in_period: number;
    rejected_in_period: number;
    auto_approved_in_period: number;
    avg_hours_to_decision: number | null;
    oldest_pending_hours: number | null;
  };
  documents_pending: number;
  page_views: { total: number; previous_total: number; by_day: { day: string; views: number }[]; top_pages: { path: string; views: number }[] };
};

// Categorical palette checked with the dataviz validator (lightness, chroma, colour-blind separation).
// Gold is below 3:1 contrast on white, so every chart also has a legend, printed values and a table view.
const CHANNELS: Series[] = [
  { key: "web", label: "Website", color: "#2F7F47" },
  { key: "mobile", label: "Mobile app", color: "#1E9BB0" },
  { key: "field_agent", label: "Field agent", color: "#C98A14" },
  { key: "not_finished", label: "Set-up not finished", color: "#B4533A" },
];

const ROLE_NAMES: Record<string, string> = {
  crop_farmer: "Crop farmers",
  animal_farmer: "Livestock/fish farmers",
  machinery_owner: "Machinery owners",
  service_provider: "Service providers",
  input_supplier: "Input suppliers",
  buyer_offtaker: "Buyers / off-takers",
  logistics_provider: "Logistics providers",
  field_agent: "Field agents",
  institutional_partner: "Institutional partners",
  investor: "Investors",
};

const TIER_NAMES = ["Level 0 · registered", "Level 1 · NIN verified", "Level 2 · payment-ready", "Level 3 · trusted"];
const PERIODS = [7, 30, 90] as const;

function change(now: number, before: number): string {
  if (before === 0) return now > 0 ? "new this period" : "no change";
  const pct = Math.round(((now - before) / before) * 100);
  return `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)}% vs the previous period`;
}

function hours(h: number | null): string {
  if (h === null) return "–";
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} days`;
}

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const staff = await requireStaff();
  if (!staff) return null; // the layout shows the "no staff access" message

  const sp = await searchParams;
  const requested = Number(Array.isArray(sp.days) ? sp.days[0] : sp.days);
  const days = (PERIODS as readonly number[]).includes(requested) ? requested : 30;
  const showAnalytics = can(staff, "analytics.read");

  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);
  const [
    { data },
    analyticsRes,
    weather,
    { count: disputedCount },
    { count: activeJobsCount },
    { count: jobsTodayCount },
    { count: completedJobsCount },
    { count: farmersCount },
    { count: providersCount },
    { count: equipmentCount },
    { count: agentsCount },
  ] = await Promise.all([
    supabase.rpc("admin_dashboard"),
    showAnalytics ? supabase.rpc("admin_analytics", { p_days: days }) : Promise.resolve({ data: null }),
    showAnalytics ? loadPilotWeather() : Promise.resolve<WeatherResponse>({ ok: false, error: "forbidden" }),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "disputed"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).in("status", ["accepted", "in_progress", "awaiting_confirmation"]),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("job_date", todayIso),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("user_roles").select("profile_id", { count: "exact", head: true }).in("role", ["crop_farmer", "animal_farmer"]),
    supabase.from("user_roles").select("profile_id", { count: "exact", head: true }).in("role", ["machinery_owner", "service_provider"]),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("user_roles").select("profile_id", { count: "exact", head: true }).eq("role", "field_agent"),
  ]);
  const c = (data ?? {}) as Counts;
  const a = (analyticsRes.data ?? null) as Analytics | null;

  return (
    <div className="flex flex-col gap-10">
      {/* Operations Control Centre Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary">CultivaNode Operations Control</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Real-time marketplace monitoring, arbitration, and governance.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-secondary/30 bg-surface-container-low px-3.5 py-1 text-xs font-bold text-primary">
          <span className="size-2 rounded-full bg-primary-container animate-pulse" aria-hidden="true" />
          <span>Lagos Node · All Systems Operational</span>
        </div>
      </div>

      {/* ATTENTION REQUIRED Alert Bar */}
      {((disputedCount ?? 0) > 0 || (c.suspended_accounts ?? 0) > 0 || (c.flagged_accounts ?? 0) > 0) && (
        <div className="rounded-xl border-2 border-caution bg-caution-soft/60 p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">⚠️</span>
            <h2 className="text-sm font-extrabold tracking-wider text-[#78350f] uppercase">
              Attention Required
            </h2>
          </div>
          <ul className="mt-2.5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#78350f]">
            {(disputedCount ?? 0) > 0 && (
              <li>
                <Link href="/admin/disputes" className="underline hover:text-critical">
                  ● {disputedCount} dispute(s) awaiting arbitration
                </Link>
              </li>
            )}
            {(c.pending_role_requests ?? 0) > 0 && (
              <li>
                <Link href="/admin/approvals" className="underline">
                  ● {c.pending_role_requests} role request(s) waiting
                </Link>
              </li>
            )}
            {(c.flagged_accounts ?? 0) > 0 && (
              <li>
                <Link href="/admin/users?filter=flagged" className="underline">
                  ● {c.flagged_accounts} account(s) flagged for review
                </Link>
              </li>
            )}
            {(c.suspended_accounts ?? 0) > 0 && (
              <li>
                <Link href="/admin/users?filter=suspended" className="underline">
                  ● {c.suspended_accounts} account(s) suspended
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* PENDING ACTIONS (Section 15) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Pending Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/admin/approvals"
            className="flex flex-col justify-between gap-1 rounded-xl border border-border bg-white p-5 hover:border-primary-container shadow-xs"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Verification Queue</span>
            <span className="text-4xl font-extrabold text-primary">{c.pending_documents ?? 0}</span>
            <span className="text-xs text-on-surface-variant">Identity & CAC documents</span>
          </Link>

          <Link
            href="/admin/disputes"
            className="flex flex-col justify-between gap-1 rounded-xl border-2 border-critical/30 bg-red-50/30 p-5 hover:border-critical shadow-xs"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-critical">Disputes Awaiting Decision</span>
            <span className="text-4xl font-extrabold text-critical">{disputedCount ?? 0}</span>
            <span className="text-xs text-on-surface-variant">Evidence-based arbitration</span>
          </Link>

          <Link
            href="/admin/approvals"
            className="flex flex-col justify-between gap-1 rounded-xl border border-border bg-white p-5 hover:border-primary-container shadow-xs"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Role Approvals</span>
            <span className="text-4xl font-extrabold text-primary">{c.pending_role_requests ?? 0}</span>
            <span className="text-xs text-on-surface-variant">Provider & Agent applications</span>
          </Link>
        </div>
      </section>

      {/* LIVE OPERATIONS (Section 15) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Live Field Operations</h2>
          <Link href="/admin/jobs" className="text-xs font-bold text-primary-container hover:underline">
            Open Jobs Console →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Active In-Field</span>
            <span className="mt-1 block text-3xl font-extrabold text-node-800">{activeJobsCount ?? 0}</span>
            <span className="text-xs text-on-surface-variant">Jobs in progress</span>
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Jobs Today</span>
            <span className="mt-1 block text-3xl font-extrabold text-primary">{jobsTodayCount ?? 0}</span>
            <span className="text-xs text-on-surface-variant">Scheduled today</span>
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Completed Total</span>
            <span className="mt-1 block text-3xl font-extrabold text-primary-container">{completedJobsCount ?? 0}</span>
            <span className="text-xs text-on-surface-variant">Executed & confirmed</span>
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Disputed / Failed</span>
            <span className="mt-1 block text-3xl font-extrabold text-critical">{disputedCount ?? 0}</span>
            <span className="text-xs text-on-surface-variant">Requiring staff review</span>
          </div>
        </div>
      </section>

      {/* MARKETPLACE COUNTERS (Section 15) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Marketplace Liquidity</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Registered Farmers</span>
            <span className="mt-1 block text-2xl font-extrabold text-primary">{farmersCount ?? 0}</span>
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Providers</span>
            <span className="mt-1 block text-2xl font-extrabold text-primary">{providersCount ?? 0}</span>
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Active Equipment</span>
            <span className="mt-1 block text-2xl font-extrabold text-primary">{equipmentCount ?? 0}</span>
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Field Agents</span>
            <span className="mt-1 block text-2xl font-extrabold text-primary">{agentsCount ?? 0}</span>
          </div>
        </div>
      </section>

      {a && (
        <section aria-labelledby="analytics-h" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="analytics-h" className="text-2xl font-bold">Analytics</h2>
              <p className="text-sm text-on-surface-variant">Staff accounts are not counted. Days are Lagos time.</p>
            </div>
            <nav aria-label="Period" className="flex gap-1 rounded-lg border border-border bg-white p-1">
              {PERIODS.map((p) => (
                <Link
                  key={p}
                  href={`/admin?days=${p}`}
                  aria-current={p === days ? "page" : undefined}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold ${p === days ? "bg-primary-container text-white" : "hover:bg-surface-container-low"}`}
                >
                  {p} days
                </Link>
              ))}
            </nav>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="People signed up" value={a.totals.people} note={`${a.totals.onboarded} finished set-up`} />
            <Stat label={`New in ${days} days`} value={a.totals.new_in_period} note={change(a.totals.new_in_period, a.totals.new_previous_period)} />
            <Stat
              label="Finished set-up"
              value={a.totals.new_in_period ? `${Math.round((a.totals.onboarded_in_period / a.totals.new_in_period) * 100)}%` : "–"}
              note={`of people who signed up in ${days} days`}
            />
            <Stat label="Website page views" value={a.page_views.total} note={change(a.page_views.total, a.page_views.previous_total)} />
          </ul>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">Sign-ups per day, by channel</h3>
              <StackedColumns
                title={`Sign-ups per day for the last ${days} days, by channel`}
                days={a.signups_by_day.map((d) => d.day)}
                series={CHANNELS}
                rows={a.signups_by_day.map(({ web, mobile, field_agent, not_finished }) => ({ web, mobile, field_agent, not_finished }))}
              />
            </Card>
            <Card className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">Website page views per day</h3>
              <LineArea
                title={`Website page views per day for the last ${days} days`}
                days={a.page_views.by_day.map((d) => d.day)}
                values={a.page_views.by_day.map((d) => d.views)}
                label="Page views"
              />
              {a.page_views.top_pages.length > 0 && (
                <>
                  <h4 className="mt-2 font-semibold">Most visited pages</h4>
                  <BarList items={a.page_views.top_pages.map((p) => ({ label: p.path, value: p.views }))} extra="Most visited pages" />
                </>
              )}
              <p className="text-xs text-on-surface-variant">Counted without cookies or personal data; visitors with Do Not Track are not counted.</p>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">Users by role</h3>
              <BarList
                items={a.roles
                  .filter((r) => r.active > 0 || r.pending > 0)
                  .map((r) => ({ label: ROLE_NAMES[r.role] ?? r.role, value: r.active, note: r.pending ? `+${r.pending} waiting` : undefined }))}
                extra="Users by role"
              />
              {a.roles.every((r) => r.active === 0 && r.pending === 0) && <p className="text-on-surface-variant">No roles yet.</p>}
            </Card>
            <Card className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">Users by state</h3>
              <BarList items={a.states.slice(0, 12).map((s) => ({ label: s.state, value: s.people }))} extra="Users by state" />
              {a.states.length === 0 && <p className="text-on-surface-variant">No finished sign-ups yet.</p>}
              {a.states.length > 12 && <p className="text-xs text-on-surface-variant">Top 12 of {a.states.length} states.</p>}
            </Card>
            <Card className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">Verification and approvals</h3>
              <BarList items={TIER_NAMES.map((name, i) => ({ label: name, value: a.tiers[String(i)] ?? 0 }))} extra="People by verification level" />
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-on-surface-variant">Role requests waiting</dt>
                <dd className="text-right font-semibold tabular-nums">{a.approvals.pending}</dd>
                <dt className="text-on-surface-variant">Documents waiting</dt>
                <dd className="text-right font-semibold tabular-nums">{a.documents_pending}</dd>
                <dt className="text-on-surface-variant">Approved ({days} days)</dt>
                <dd className="text-right font-semibold tabular-nums">
                  {a.approvals.approved_in_period}
                  <span className="font-normal text-on-surface-variant"> ({a.approvals.auto_approved_in_period} automatic)</span>
                </dd>
                <dt className="text-on-surface-variant">Rejected ({days} days)</dt>
                <dd className="text-right font-semibold tabular-nums">{a.approvals.rejected_in_period}</dd>
                <dt className="text-on-surface-variant">Average time to decide</dt>
                <dd className="text-right font-semibold tabular-nums">{hours(a.approvals.avg_hours_to_decision)}</dd>
                <dt className="text-on-surface-variant">Oldest waiting request</dt>
                <dd className="text-right font-semibold tabular-nums">{hours(a.approvals.oldest_pending_hours)}</dd>
              </dl>
            </Card>
          </div>
        </section>
      )}

      {showAnalytics && <section aria-labelledby="weather-h" className="flex flex-col gap-3">
        <h2 id="weather-h" className="text-2xl font-bold">Weather in the pilot states</h2>
        {weather.ok ? (
          <WeatherPanel forecasts={weather.forecasts} fetchedAt={weather.fetchedAt} provider={weather.provider} stale={weather.stale} />
        ) : (
          <p className="text-on-surface-variant">
            {weather.error === "not_configured"
              ? "Weather is not set up yet. "
              : weather.error === "not_available"
                ? "The chosen weather provider cannot be used here (a free, non-commercial service is switched off in production). "
                : weather.error === "rejected" || weather.error === "billing"
                  ? `The weather provider refused the request${weather.detail ? ` (${weather.detail})` : ""}. `
                  : "The weather service could not be reached. It will try again in a few minutes. "}
            {can(staff, "integrations.manage") && weather.error !== "unavailable" && (
              <Link href="/admin/integrations" className="font-semibold text-primary-container hover:underline">
                Open Integrations › Weather to add or check the API key.
              </Link>
            )}
          </p>
        )}
      </section>}

      {can(staff, "site_content.manage") && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Home-page pictures</h2>
          <p className="text-on-surface-variant">Upload, reorder and publish the pictures in the carousel at the top of the home page.</p>
          <Link href="/admin/content" className="font-semibold text-primary-container hover:underline">
            Manage pictures
          </Link>
        </Card>
      )}
      {can(staff, "integrations.manage") && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Integrations</h2>
          <p className="text-on-surface-variant">Choose the SMS and identity-check providers, add their keys and switch between test and live.</p>
          <Link href="/admin/integrations" className="font-semibold text-primary-container hover:underline">
            Open integrations
          </Link>
        </Card>
      )}
      <details className="rounded-lg border border-border bg-white p-5">
        <summary className="cursor-pointer text-lg font-bold">Your permissions</summary>
        <ul className="mt-3 flex flex-wrap gap-2">
          {staff.permissions.map((p) => (
            <li key={p} className="rounded-full border border-border bg-surface-container-low px-3 py-1 text-sm font-semibold">
              {p}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <li className="rounded-lg border border-border bg-white p-5">
      <span className="block text-sm font-semibold text-on-surface-variant">{label}</span>
      <span className="mt-1 block text-4xl font-extrabold tabular-nums text-primary">
        {typeof value === "number" ? value.toLocaleString("en-NG") : value}
      </span>
      <span className="mt-1 block text-sm text-on-surface-variant">{note}</span>
    </li>
  );
}
