import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import { MetricCard } from "@/components/live/metric-card";
import { FarmRegistry } from "@/components/screens/farm-registry";
import { Badge } from "@/components/shadcn/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";

export const metadata: Metadata = { title: "My farms & fields" };

const ZONE: Record<string, string> = {
  rainforest: "Rainforest zone",
  derived_savanna: "Derived savanna",
  other: "Other zone",
};

export default async function FarmsPage({ params }: PageProps<"/[lang]/account/farms">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name, state, lga, area_ha, area_is_measured, zone, created_at")
    .or(scope.join(","))
    .order("created_at");
  const list = farms ?? [];
  const { data: plots } = list.length
    ? await supabase.from("plots").select("id, farm_id, area_ha").in("farm_id", list.map((f) => f.id))
    : { data: [] as { id: string; farm_id: string; area_ha: number | null }[] };

  const plotsBy = new Map<string, { n: number; ha: number }>();
  for (const p of plots ?? []) {
    const cur = plotsBy.get(p.farm_id) ?? { n: 0, ha: 0 };
    plotsBy.set(p.farm_id, { n: cur.n + 1, ha: cur.ha + (Number(p.area_ha) || 0) });
  }
  const totalHa = list.reduce((s, f) => s + (Number(f.area_ha) || 0), 0);
  const plotHa = (plots ?? []).reduce((s, p) => s + (Number(p.area_ha) || 0), 0);
  const measured = list.filter((f) => f.area_is_measured).length;
  const zones = [...new Set(list.map((f) => ZONE[f.zone as string] ?? f.zone).filter(Boolean))];
  const ha = (n: number) => n.toLocaleString("en-NG", { maximumFractionDigits: 1 });
  const chip = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-sm text-label-sm";
  const btn = "flex items-center gap-space-xs rounded-lg px-3.5 py-2 font-label-md text-label-md shadow-sm transition-colors";

  return (
    <>
      <LiveStrip>
        <span className="text-on-surface-variant">Farms and plots are your live registry. The map overlay, soil and tenure panels show sample data.</span>
      </LiveStrip>
      <FarmRegistry
        lang={lang}
        slots={{
          pills: (
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className={`${chip} bg-secondary-container text-on-secondary-container`}>
                <Icon name="verified" className="text-sm" /> {measured}/{list.length} boundaries measured
              </span>
              {zones.slice(0, 2).map((z) => (
                <span key={z} className={`${chip} bg-surface-container text-on-surface-variant`}>{z}</span>
              ))}
              <span className={`${chip} bg-surface-container-high text-primary`}>Total registered area: {ha(totalHa)} ha</span>
            </div>
          ),
          actions: (
            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
              <Link href={`/${lang}/account/farms/map`} className={`${btn} bg-surface-container-lowest text-on-surface hover:bg-surface-container-low`}>
                <Icon name="map" className="text-base" /> Map view
              </Link>
              <Link href={`/${lang}/account/farms/new`} className={`${btn} bg-primary-container text-on-primary hover:bg-primary`}>
                <Icon name="add_location_alt" className="text-base" /> Register a farm
              </Link>
            </div>
          ),
          kpis: (
            <div className="mb-space-lg grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total farm holding" value={ha(totalHa)} unit="Ha" icon="grid_view" foot={`${list.length} ${list.length === 1 ? "farm" : "farms"} registered`} />
              <MetricCard label="Mapped plots" value={(plots ?? []).length} icon="polyline" iconTone="bg-secondary-container/40 text-secondary" foot={`${ha(plotHa)} ha demarcated`} />
              <MetricCard label="Unplotted area" value={ha(Math.max(totalHa - plotHa, 0))} unit="Ha" icon="nature" iconTone="bg-surface-container text-on-surface-variant" foot="Split it into plots to plan crops per field" />
              <MetricCard label="Agro-ecological zones" value={zones.length || "—"} icon="terrain" iconTone="bg-surface-container-high text-primary" foot={zones.join(" · ") || "Set when a farm is located"} />
            </div>
          ),
          inventory: (
            <div className="flex flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm xl:col-span-8">
              <div className="flex items-center justify-between bg-surface-container-low p-space-md">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Farm & plot inventory</h3>
                  <p className="text-body-sm text-on-surface-variant">{list.length} farms · {(plots ?? []).length} plots</p>
                </div>
                <Link href={`/${lang}/account/farms/new`} className="inline-flex items-center gap-1 rounded-lg bg-primary-container px-3 py-1.5 font-label-md text-label-md text-white hover:bg-primary">
                  <Icon name="add" className="text-base" /> Add farm
                </Link>
              </div>
              {list.length === 0 ? (
                <div className="p-space-md">
                  <EmptyState icon="add_location_alt" title="No farms registered yet" description="Add a farm with its location and size, then split it into plots." action={
                    <Link href={`/${lang}/account/farms/new`} className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 font-label-md text-label-md text-white hover:bg-primary">
                      Register your first farm
                    </Link>
                  } />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5">Farm</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Area</TableHead>
                      <TableHead className="text-right">Plots</TableHead>
                      <TableHead>Boundary</TableHead>
                      <TableHead className="pr-5 text-right">Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((f) => {
                      const p = plotsBy.get(f.id);
                      return (
                        <TableRow key={f.id}>
                          <TableCell className="pl-5">
                            <p className="font-semibold">{f.name}</p>
                            <p className="text-label-sm font-normal text-on-surface-variant">Added {formatDate(f.created_at, lang)}</p>
                          </TableCell>
                          <TableCell>
                            <p>{[f.lga, f.state].filter(Boolean).join(", ") || "—"}</p>
                            <p className="text-label-sm font-normal text-on-surface-variant">{ZONE[f.zone as string] ?? ""}</p>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{f.area_ha ? `${ha(Number(f.area_ha))} ha` : "—"}</TableCell>
                          <TableCell className="text-right">{p?.n ?? 0}</TableCell>
                          <TableCell>
                            <Badge tone={f.area_is_measured ? "positive" : "caution"} dot>
                              {f.area_is_measured ? "Measured" : "Estimated"}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-5 text-right">
                            <Link href={`/${lang}/account/farms/${f.id}`} className="inline-flex items-center gap-1 rounded-lg bg-surface-container-low px-3 py-1.5 font-label-sm text-label-sm text-primary-container hover:bg-surface-container-high">
                              Manage <Icon name="chevron_right" className="text-sm" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          ),
        }}
      />
    </>
  );
}
