import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ds/page-header";
import { Chip, DataTable, KpiGrid, PointMap, Section, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, num } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Farm map & cadastre" };

export default async function Page({ params }: PageProps<"/[lang]/account/farms/map">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const { data } = scope.farmIds.length ? await supabase.from("farm_points").select("*").in("id", scope.farmIds) : { data: [] };
  const pts = data ?? [];
  const measured = pts.filter((p) => p.has_boundary).length;
  const totalHa = pts.reduce((s, p) => s + Number(p.area_ha ?? 0), 0);
  const plotsBy = new Map<string, number>();
  for (const p of scope.plots) plotsBy.set(p.farm_id, (plotsBy.get(p.farm_id) ?? 0) + 1);

  return (
    <Stack>
      <PageHeader
        back={{ href: `/${lang}/account/farms`, label: "My farms" }}
        eyebrow={<Chip icon="map">{pts.length} geo-referenced farms</Chip>}
        title="Farm Map & Cadastre"
        description="Where each of your farms sits, its registered area and whether the boundary has been walked and measured."
      />
      {!pts.length && <StartHere title="No farms to map yet" action={<Link className="font-label-md text-primary-container" href={`/${lang}/account/farms/new`}>Add a farm →</Link>} />}
      <KpiGrid>
        <MetricCard label="Farms" value={pts.length} icon="landscape" foot={`${scope.plots.length} plots`} />
        <MetricCard label="Registered area" value={num(totalHa, 1)} unit="ha" icon="straighten" foot="Sum of farm areas" />
        <MetricCard label="Measured boundaries" value={`${measured}/${pts.length}`} icon="polyline" foot="Walked with GPS" />
        <MetricCard label="States" value={new Set(pts.map((p) => p.state)).size} icon="public" foot={[...new Set(pts.map((p) => p.state).filter(Boolean))].join(", ")} />
      </KpiGrid>
      <Section title="Farm locations" icon="map" description="Click a marker to open it on OpenStreetMap.">
        <PointMap height={360} points={pts.filter((p) => p.lat != null && p.lng != null).map((p) => ({ lat: Number(p.lat), lng: Number(p.lng), label: p.name ?? "" }))} />
      </Section>
      <Section title="Cadastre register" icon="table_view">
        <DataTable
          rows={pts}
          rowKey={(p) => p.id ?? ""}
          columns={[
            { label: "Farm", cell: (p) => <Link className="font-medium text-primary-container hover:underline" href={`/${lang}/account/farms/${p.id}`}>{p.name}</Link> },
            { label: "Code", cell: (p) => p.farm_code ?? "—" },
            { label: "LGA / state", cell: (p) => [p.lga, p.state].filter(Boolean).join(", ") },
            { label: "Area", numeric: true, cell: (p) => `${num(p.area_ha, 1)} ha` },
            { label: "Plots", numeric: true, cell: (p) => plotsBy.get(p.id ?? "") ?? 0 },
            { label: "Zone", cell: (p) => label(p.zone) },
            { label: "GPS", cell: (p) => (p.lat != null ? `${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)}` : "—") },
            { label: "Boundary", cell: (p) => <Status value={p.has_boundary ? "verified" : "pending"} /> },
          ]}
        />
      </Section>
    </Stack>
  );
}
