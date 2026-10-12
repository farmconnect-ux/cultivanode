import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DbConstants, formatNaira } from "@cultivanode/shared";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { MetricCard } from "@/components/live/metric-card";
import { ServiceMarketplace } from "@/components/screens/service-marketplace";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill } from "@/lib/text";

export const metadata: Metadata = { title: "Service & machinery marketplace" };

const E = DbConstants.public.Enums;
const RADII = [10, 20, 30, 50, 100] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Result = {
  listing_id: string;
  kind: "equipment" | "service";
  equipment_type: string | null;
  provider_type: string | null;
  title: string;
  description: string | null;
  rates: Record<string, number>;
  operator_included: boolean;
  distance_km: number;
  provider: { name: string; state: string | null; tier: number; rating: { avg: number | null; count: number } | null };
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const selectCls =
  "h-11 w-full appearance-none rounded-lg border-0 bg-surface-container-lowest pl-10 pr-8 font-body-sm text-body-sm text-on-surface shadow-sm outline-none focus:ring-2 focus:ring-secondary-fixed-dim";

export default async function FindPage({ params, searchParams }: PageProps<"/[lang]/account/find">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const f = t.acct.find;
  const q = await searchParams;
  const supabase = await createClient();

  if (!account.isFarmer) {
    return (
      <>
        <PageHeader title={f.title} description={f.intro} />
        <EmptyState icon="agriculture" title={f.needsFarmerRole} action={
          <Link href={`/${lang}/account/settings`} className="rounded-lg bg-primary-container px-4 py-2.5 font-label-md text-label-md text-white hover:bg-primary">Add the farmer role</Link>
        } />
      </>
    );
  }

  const scope = [`owner_id.eq.${account.userId}`, ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : [])];
  const [{ data: farms }, { data: open }] = await Promise.all([
    supabase.from("farms").select("id, name").or(scope.join(",")).order("created_at"),
    supabase.rpc("marketplace_open"),
  ]);

  const farmId = UUID.test(one(q.farm)) ? one(q.farm) : farms?.[0]?.id ?? "";
  const typeRaw = one(q.type);
  const kindRaw = one(q.kind);
  const kind = kindRaw === "equipment" || kindRaw === "service" ? kindRaw
    : (E.equipment_type as readonly string[]).includes(typeRaw) ? "equipment"
    : (E.provider_type as readonly string[]).includes(typeRaw) ? "service" : "";
  const equipmentType = kind === "equipment" && (E.equipment_type as readonly string[]).includes(typeRaw) ? typeRaw : "";
  const providerType = kind === "service" && (E.provider_type as readonly string[]).includes(typeRaw) ? typeRaw : "";
  const radius = RADII.includes(Number(one(q.radius)) as (typeof RADII)[number]) ? Number(one(q.radius)) : 30;

  let results: Result[] = [];
  if (open === true && farmId) {
    const { data } = await supabase.rpc("nearby_listings_for_farm", {
      p_farm: farmId,
      p_radius_km: radius,
      ...(kind ? { p_kind: kind } : {}),
      ...(equipmentType ? { p_equipment_type: equipmentType as (typeof E.equipment_type)[number] } : {}),
      ...(providerType ? { p_provider_type: providerType as (typeof E.provider_type)[number] } : {}),
    });
    results = (data ?? []) as unknown as Result[];
  }
  const searched = Boolean(one(q.farm));
  const verified = results.filter((r) => r.provider.tier >= 2).length;
  const nearest = results.length ? Math.min(...results.map((r) => Number(r.distance_km))) : null;
  const km = (n: number) => n.toLocaleString(lang === "yo" ? "yo-NG" : "en-NG", { maximumFractionDigits: 1 });

  const blocked = (farms ?? []).length === 0 ? "farm" : open !== true ? "closed" : null;

  return (
    <ServiceMarketplace
      lang={lang}
      slots={{
        search: blocked ? (
          <div className="mt-space-lg rounded-lg bg-primary-container/40 p-space-md text-body-sm text-on-primary">
            {blocked === "farm" ? (
              <>
                {f.needsFarm}{" "}
                <Link href={`/${lang}/account/farms/new`} className="font-semibold text-secondary-fixed-dim underline">Register a farm</Link>
              </>
            ) : (
              f.marketplaceClosed
            )}
          </div>
        ) : (
          <form method="get" className="mt-space-lg grid grid-cols-1 gap-space-sm rounded-lg bg-primary-container/40 p-space-sm md:grid-cols-12">
            <label className="relative md:col-span-3">
              <span className="sr-only">{f.farm}</span>
              <Icon name="landscape" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant" />
              <select name="farm" defaultValue={farmId} className={selectCls}>
                {(farms ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
            <label className="relative md:col-span-3">
              <span className="sr-only">{f.type}</span>
              <Icon name="tune" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant" />
              <select name="type" defaultValue={equipmentType || providerType} className={selectCls}>
                <option value="">{f.anyType}</option>
                <optgroup label={f.equipment}>
                  {Object.entries(t.equipmentTypes).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </optgroup>
                <optgroup label={f.service}>
                  {Object.entries(t.providerTypes).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </optgroup>
              </select>
            </label>
            <label className="relative md:col-span-2">
              <span className="sr-only">{f.what}</span>
              <Icon name="category" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant" />
              <select name="kind" defaultValue={kind} className={selectCls}>
                <option value="">{f.anything}</option>
                <option value="equipment">{f.equipment}</option>
                <option value="service">{f.service}</option>
              </select>
            </label>
            <label className="relative md:col-span-2">
              <span className="sr-only">{f.radius}</span>
              <Icon name="near_me" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant" />
              <select name="radius" defaultValue={String(radius)} className={selectCls}>
                {RADII.map((r) => <option key={r} value={r}>{r} km</option>)}
              </select>
            </label>
            <Button type="submit" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-secondary-container font-label-lg text-label-lg text-on-primary-fixed transition-colors hover:bg-secondary-fixed-dim md:col-span-2">
              <Icon name="search" className="text-lg" /> {f.search}
            </Button>
          </form>
        ),
        kpis: (
          <div className="mb-space-lg grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Listings in range" value={searched ? results.length : "—"} icon="precision_manufacturing" foot={searched ? `Within ${radius} km of your farm` : "Search to see what is near you"} />
            <MetricCard label="Verified providers" value={searched ? verified : "—"} icon="verified" iconTone="bg-primary-fixed/60 text-on-primary-fixed-variant" foot="ID-checked (tier 2+)" />
            <MetricCard label="Nearest option" value={nearest !== null ? km(nearest) : "—"} unit={nearest !== null ? "km" : undefined} icon="near_me" iconTone="bg-surface-container-high text-primary" foot="Straight-line distance" />
            <MetricCard label="Pilot commission" value="₦0" icon="handshake" iconTone="bg-tertiary-fixed/50 text-tertiary-container" foot={f.payDirect} />
          </div>
        ),
        tracker: null,
        listings: (
          <div className="space-y-space-md">
            <div className="flex flex-col justify-between gap-space-sm sm:flex-row sm:items-center">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Verified machinery &amp; services near you</h2>
                <p className="text-body-sm text-on-surface-variant">
                  {searched ? fill(f.results, { count: String(results.length) }) : f.intro}
                </p>
              </div>
            </div>
            {!searched || blocked ? (
              <EmptyState icon="travel_explore" title="Search to see providers near your farm" description="Choose a farm, the kind of work and how far you can wait for a machine to travel." />
            ) : results.length === 0 ? (
              <EmptyState icon="search_off" title={f.none} description="Try a wider radius or a different type of equipment." />
            ) : (
              <ul className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
                {results.map((r) => (
                  <li key={r.listing_id} className="card-interactive flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
                    <div className="flex items-center justify-between bg-surface-container-low px-space-md py-2">
                      <Badge tone={r.kind === "equipment" ? "brand" : "mint"}>
                        <Icon name={r.kind === "equipment" ? "agriculture" : "engineering"} />
                        {r.kind === "equipment"
                          ? t.equipmentTypes[r.equipment_type as keyof typeof t.equipmentTypes]
                          : t.providerTypes[r.provider_type as keyof typeof t.providerTypes]}
                      </Badge>
                      <span className="font-label-sm text-label-sm text-on-surface-variant tnum">
                        {fill(f.away, { km: km(Number(r.distance_km)) })}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-space-sm p-space-md">
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">{r.title}</h3>
                        <p className="text-body-sm text-on-surface-variant">
                          {fill(f.byProvider, { name: r.provider.name })}{r.provider.state ? `, ${r.provider.state}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.provider.tier >= 2 && <Badge tone="positive"><Icon name="verified" /> {f.verified}</Badge>}
                        {r.provider.rating && r.provider.rating.count > 0 && (
                          <Badge tone="caution"><Icon name="star" filled /> {Number(r.provider.rating.avg).toFixed(1)} ({r.provider.rating.count})</Badge>
                        )}
                        {r.kind === "equipment" && r.operator_included && <Badge tone="atmos">{f.operator}</Badge>}
                      </div>
                      {r.description && <p className="line-clamp-3 text-body-sm text-on-surface-variant">{r.description}</p>}
                      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-surface-container pt-space-sm font-semibold tnum text-on-surface">
                        {Object.entries(r.rates).map(([u, k]) => (
                          <span key={u}>{formatNaira(k)} <span className="text-label-sm font-normal text-on-surface-variant">{t.units[u as keyof typeof t.units]}</span></span>
                        ))}
                      </div>
                      <Link
                        href={`/${lang}/account/bookings/new?listing=${r.listing_id}&farm=${farmId}`}
                        className="mt-space-xs inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-container py-2.5 font-label-md text-label-md text-white transition-colors hover:bg-primary"
                      >
                        {f.request} <Icon name="arrow_forward" className="text-base" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ),
      }}
    />
  );
}
