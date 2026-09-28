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
  const [{ data }, analyticsRes, weather] = await Promise.all([
    supabase.rpc("admin_dashboard"),
    showAnalytics ? supabase.rpc("admin_analytics", { p_days: days }) : Promise.resolve({ data: null }),
    showAnalytics ? loadPilotWeather() : Promise.resolve<WeatherResponse>({ ok: false, error: "forbidden" }),
  ]);
  const c = (data ?? {}) as Counts;
  const a = (analyticsRes.data ?? null) as Analytics | null;

  const tiles = [
    { label: "Role requests waiting", value: c.pending_role_requests, href: "/admin/approvals" },
    { label: "Documents waiting", value: c.pending_documents, href: "/admin/approvals" },
    { label: "Open contact messages", value: c.open_contact_messages, href: "/admin/inbox" },
    { label: "Deletion requests open", value: c.open_data_requests, href: "/admin/privacy" },
    { label: "Marketplace waitlist", value: c.waitlist_signups, href: "/admin/inbox" },
    { label: "Flagged accounts", value: c.flagged_accounts, href: "/admin/users?filter=flagged" },
    { label: "Suspended accounts", value: c.suspended_accounts, href: "/admin/users?filter=suspended" },
    { label: "Live listings", value: c.active_listings, href: "/admin/marketplace?status=active" },
    { label: "Suspended listings", value: c.suspended_listings, href: "/admin/marketplace?status=suspended" },
    // Shown here only for staff who cannot see the analytics section below.
    ...(a ? [] : [
      { label: "People signed up", value: c.users, href: "/admin/users" },
      { label: "New this week", value: c.users_last_7_days, href: "/admin/users" },
    ]),
  ].filter((t) => typeof t.value === "number");

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">Welcome{staff.name ? `, ${staff.name}` : ""}</h1>
        <p className="mt-1 text-muted">What needs attention today.</p>
      </div>

      {(c.median_approval_hours_30d !== undefined || c.marketplace_live) && (
        <p className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-line bg-white px-5 py-3">
          {c.median_approval_hours_30d !== undefined && (
            <span>
              <span className="text-muted">Approval time, median over 30 days: </span>
              <strong>{hours(c.median_approval_hours_30d ?? null)}</strong>
              {c.oldest_pending_role_request_hours != null && (
                <span className="text-muted"> · oldest waiting {hours(c.oldest_pending_role_request_hours)}</span>
              )}
            </span>
          )}
          {c.marketplace_live && (
            <span>
              <span className="text-muted">Marketplace: </span>
              <Link href="/admin/marketplace" className={`font-bold underline ${c.marketplace_live.enabled ? "text-leaf-700" : "text-danger"}`}>
                {c.marketplace_live.enabled ? `open (${c.marketplace_live.states?.join(", ") ?? "all states"})` : "closed"}
              </Link>
            </span>
          )}
        </p>
      )}

      {tiles.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {tiles.map((t) => (
            <li key={t.label}>
              <Link href={t.href} className="block h-full rounded-lg border border-line bg-white p-5 hover:border-leaf-600">
                <span className="block text-4xl font-extrabold text-leaf-800">{t.value}</span>
                <span className="mt-1 block font-semibold">{t.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {a && (
        <section aria-labelledby="analytics-h" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="analytics-h" className="text-2xl font-bold">Analytics</h2>
              <p className="text-sm text-muted">Staff accounts are not counted. Days are Lagos time.</p>
            </div>
            <nav aria-label="Period" className="flex gap-1 rounded-lg border border-line bg-white p-1">
              {PERIODS.map((p) => (
                <Link
                  key={p}
                  href={`/admin?days=${p}`}
                  aria-current={p === days ? "page" : undefined}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold ${p === days ? "bg-leaf-600 text-white" : "hover:bg-leaf-50"}`}
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
              <p className="text-xs text-muted">Counted without cookies or personal data; visitors with Do Not Track are not counted.</p>
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
              {a.roles.every((r) => r.active === 0 && r.pending === 0) && <p className="text-muted">No roles yet.</p>}
            </Card>
            <Card className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">Users by state</h3>
              <BarList items={a.states.slice(0, 12).map((s) => ({ label: s.state, value: s.people }))} extra="Users by state" />
              {a.states.length === 0 && <p className="text-muted">No finished sign-ups yet.</p>}
              {a.states.length > 12 && <p className="text-xs text-muted">Top 12 of {a.states.length} states.</p>}
            </Card>
            <Card className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">Verification and approvals</h3>
              <BarList items={TIER_NAMES.map((name, i) => ({ label: name, value: a.tiers[String(i)] ?? 0 }))} extra="People by verification level" />
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted">Role requests waiting</dt>
                <dd className="text-right font-semibold tabular-nums">{a.approvals.pending}</dd>
                <dt className="text-muted">Documents waiting</dt>
                <dd className="text-right font-semibold tabular-nums">{a.documents_pending}</dd>
                <dt className="text-muted">Approved ({days} days)</dt>
                <dd className="text-right font-semibold tabular-nums">
                  {a.approvals.approved_in_period}
                  <span className="font-normal text-muted"> ({a.approvals.auto_approved_in_period} automatic)</span>
                </dd>
                <dt className="text-muted">Rejected ({days} days)</dt>
                <dd className="text-right font-semibold tabular-nums">{a.approvals.rejected_in_period}</dd>
                <dt className="text-muted">Average time to decide</dt>
                <dd className="text-right font-semibold tabular-nums">{hours(a.approvals.avg_hours_to_decision)}</dd>
                <dt className="text-muted">Oldest waiting request</dt>
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
          <p className="text-muted">
            {weather.error === "not_configured"
              ? "Weather is not set up yet. "
              : weather.error === "not_available"
                ? "The chosen weather provider cannot be used here (a free, non-commercial service is switched off in production). "
                : weather.error === "rejected" || weather.error === "billing"
                  ? `The weather provider refused the request${weather.detail ? ` (${weather.detail})` : ""}. `
                  : "The weather service could not be reached. It will try again in a few minutes. "}
            {can(staff, "integrations.manage") && weather.error !== "unavailable" && (
              <Link href="/admin/integrations" className="font-semibold text-leaf-700 hover:underline">
                Open Integrations › Weather to add or check the API key.
              </Link>
            )}
          </p>
        )}
      </section>}

      {can(staff, "site_content.manage") && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Home-page pictures</h2>
          <p className="text-muted">Upload, reorder and publish the pictures in the carousel at the top of the home page.</p>
          <Link href="/admin/content" className="font-semibold text-leaf-700 hover:underline">
            Manage pictures
          </Link>
        </Card>
      )}
      {can(staff, "integrations.manage") && (
        <Card className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Integrations</h2>
          <p className="text-muted">Choose the SMS and identity-check providers, add their keys and switch between test and live.</p>
          <Link href="/admin/integrations" className="font-semibold text-leaf-700 hover:underline">
            Open integrations
          </Link>
        </Card>
      )}
      <details className="rounded-lg border border-line bg-white p-5">
        <summary className="cursor-pointer text-lg font-bold">Your permissions</summary>
        <ul className="mt-3 flex flex-wrap gap-2">
          {staff.permissions.map((p) => (
            <li key={p} className="rounded-full border border-line bg-cream px-3 py-1 text-sm font-semibold">
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
    <li className="rounded-lg border border-line bg-white p-5">
      <span className="block text-sm font-semibold text-muted">{label}</span>
      <span className="mt-1 block text-4xl font-extrabold tabular-nums text-leaf-800">
        {typeof value === "number" ? value.toLocaleString("en-NG") : value}
      </span>
      <span className="mt-1 block text-sm text-muted">{note}</span>
    </li>
  );
}
