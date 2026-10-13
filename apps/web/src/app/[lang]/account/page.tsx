import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNaira } from "@cultivanode/shared";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { BookingTable, ACTIVE } from "@/components/live/booking-table";
import { MetricCard } from "@/components/live/metric-card";
import { ProviderHome } from "@/components/live/provider-home";
import { AgentHome } from "@/components/live/agent-home";
import { ExecutiveDashboard } from "@/components/screens/executive-dashboard";
import { Badge } from "@/components/shadcn/badge";
import { Alert } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import type { BookingSummary } from "@/lib/account/bookings";
import { requireAccount } from "@/lib/account/session";
import { resolveWorkspace } from "@/lib/account/workspace";
import { createClient } from "@/lib/supabase/server";
import { getFarmOperations } from "@/actions/farm-operations";
import { loadOverviewPanels } from "@/components/live/overview-panels";

/** Yorùbá greeting for the time of day in Lagos (the design greets the farmer in Yorùbá). */
function greeting(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Lagos" }).format(now));
  if (h < 12) return "Ẹ káàrọ̀";
  if (h < 16) return "Ẹ káàsán";
  return "Ẹ kúrọ̀lẹ́";
}

const TIER = ["Unverified", "Phone verified", "ID verified", "Bank verified", "Fully verified"];

export default async function AccountHome({ params, searchParams }: PageProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { welcome, ws } = await searchParams;
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const a = t.acct;
  const supabase = await createClient();

  const activeWorkspace = resolveWorkspace(account, typeof ws === "string" ? ws : null);
  const welcomeAlert = welcome ? <div className="mb-6"><Alert>{a.welcomeNew}</Alert></div> : null;

  if (activeWorkspace === "provider") {
    const [{ data: bookingsRes }, { count: listingsCount }] = await Promise.all([
      supabase.rpc("my_bookings", { p_limit: 50 }),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", account.userId),
    ]);
    const all = (bookingsRes ?? []) as unknown as BookingSummary[];
    return (
      <>
        {welcomeAlert}
        <ProviderHome lang={lang} t={t} account={account} bookings={all.filter((b) => b.my_side === "provider")} listingsCount={listingsCount ?? 0} />
      </>
    );
  }

  if (activeWorkspace === "agent") {
    const { data: farmers } = await supabase
      .from("profiles")
      .select("id, full_name, phone, state, lga, created_at")
      .eq("onboarded_by", account.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (
      <>
        {welcomeAlert}
        <AgentHome lang={lang} account={account} farmers={farmers ?? []} />
      </>
    );
  }

  // Farmer workspace
  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const [{ data: farms }, { data: bookingsRes }] = await Promise.all([
    supabase.from("farms").select("id, name, state, lga, area_ha").or(scope.join(",")).order("created_at"),
    supabase.rpc("my_bookings", { p_limit: 50 }),
  ]);
  const farmList = farms ?? [];
  const farmIds = farmList.map((f) => f.id);
  const [operations, panels] = await Promise.all([getFarmOperations(farmIds), loadOverviewPanels(lang, farmList)]);
  const bookings = ((bookingsRes ?? []) as unknown as BookingSummary[]).filter((b) => b.my_side === "farmer");
  const active = bookings.filter((b) => ACTIVE.includes(b.status));
  const upcoming = [...active].sort((x, y) => x.job_date.localeCompare(y.job_date));
  const spend = bookings
    .filter((b) => ["accepted", "in_progress", "awaiting_confirmation", "confirmed", "completed"].includes(b.status))
    .reduce((s, b) => s + b.total_kobo, 0);
  const totalHa = farmList.reduce((s, f) => s + (Number(f.area_ha) || 0), 0);
  const places = [...new Set(farmList.map((f) => [f.lga, f.state].filter(Boolean).join(", ")).filter(Boolean))];
  const firstName = (account.profile.full_name ?? "").trim().split(/\s+/)[0] || "farmer";
  const tier = account.profile.verification_tier ?? 0;
  const ha = (n: number) => n.toLocaleString("en-NG", { maximumFractionDigits: 1 });

  const btn =
    "inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-all shadow-sm";

  return (
    <>
      {welcomeAlert}
      <LiveStrip>
        <span className="text-on-surface-variant">
          Farms, operations, weather, alerts and bookings on this page come from your live records.
        </span>
      </LiveStrip>
      <ExecutiveDashboard
        lang={lang}
        operations={operations}
        slots={{
          eyebrow: (
            <div className="mb-space-xs flex flex-wrap items-center gap-space-xs">
              <Badge tone="mint" dot pulse>South-West pilot</Badge>
              <Badge tone={tier >= 2 ? "positive" : "caution"}>
                <Icon name={tier >= 2 ? "verified" : "pending"} /> {TIER[tier] ?? "Verified"}
              </Badge>
            </div>
          ),
          greeting: (
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile tracking-tight text-primary sm:text-headline-xl">
              {greeting()}, {firstName}
            </h1>
          ),
          heroMeta: (
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              {farmList.length === 0
                ? "Register your first farm to unlock crop plans, machinery booking and verified records."
                : `${farmList.length} ${farmList.length === 1 ? "farm" : "farms"} · ${ha(totalHa)} ha under management${places.length ? ` · ${places.slice(0, 2).join(" • ")}` : ""}`}
            </p>
          ),
          heroActions: (
            <div className="flex flex-wrap items-center gap-space-sm">
              <Link href={`/${lang}/account/farms/new`} className={`${btn} bg-surface-container text-on-surface hover:bg-surface-container-high`}>
                <Icon name="add_location_alt" className="text-base text-secondary" /> Register farm
              </Link>
              <Link href={`/${lang}/account/find`} className={`${btn} bg-tertiary-container text-on-tertiary hover:opacity-95`}>
                <Icon name="precision_manufacturing" className="text-base" /> Book machinery
              </Link>
              <Link href={`/${lang}/account/crops`} className={`${btn} bg-primary text-on-primary hover:bg-primary-container`}>
                <Icon name="edit_calendar" className="text-base" /> Plan a crop cycle
              </Link>
            </div>
          ),
          kpis: (
            <section className="mb-space-xl grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Land under management"
                value={ha(totalHa)}
                unit="Ha"
                icon="crop_free"
                href={`/${lang}/account/farms`}
                foot={`${farmList.length} registered ${farmList.length === 1 ? "farm" : "farms"}`}
              />
              <MetricCard
                label="Active operations"
                value={active.length}
                unit={active.length === 1 ? "job" : "jobs"}
                icon="pending_actions"
                iconTone="bg-tertiary-fixed/50 text-tertiary-container"
                href={`/${lang}/account/bookings`}
                foot={`${bookings.filter((b) => b.status === "in_progress").length} in progress · ${bookings.filter((b) => b.status === "requested").length} awaiting reply`}
              />
              <MetricCard
                label="Services booked"
                value={formatNaira(spend).replace(/\.00$/, "")}
                icon="account_balance_wallet"
                iconTone="bg-surface-container-high text-primary"
                href={`/${lang}/account/finance`}
                foot="Paid directly to providers · 0% pilot commission"
              />
              <MetricCard
                label="Verification"
                value={`Tier ${tier}`}
                icon="verified_user"
                iconTone="bg-primary-fixed/60 text-on-primary-fixed-variant"
                href={`/${lang}/account/verification`}
                foot={tier >= 2 ? "Eligible for credit-readiness records" : "Verify your ID to unlock credit & insurance"}
              />
            </section>
          ),
          statusBar: null,
          ...(panels.weather ? { weather: panels.weather } : {}),
          ...(panels.attention ? { attention: panels.attention } : {}),
          ...(panels.crops ? { crops: panels.crops, livestock: panels.livestock, machinery: panels.machinery, stock: panels.stock } : {}),
        }}
      />
    </>
  );
}
