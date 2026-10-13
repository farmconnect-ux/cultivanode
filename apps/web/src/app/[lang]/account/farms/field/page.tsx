import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPlot } from "@/actions/farm-ops";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Section, Stack, StartHere } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cap, farmOptions, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, num } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Field profiles" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params }: PageProps<"/[lang]/account/farms/field">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const plotIds = scope.plots.map((p) => p.id);
  const [{ data: plots }, { data: soil }] = plotIds.length
    ? await Promise.all([
        supabase.from("plots").select("*").in("id", plotIds).order("name"),
        supabase.from("soil_records").select("*").in("plot_id", plotIds).order("tested_on", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];
  const latestSoil = new Map<string, NonNullable<typeof soil>[number]>();
  for (const s of soil ?? []) if (!latestSoil.has(s.plot_id)) latestSoil.set(s.plot_id, s);
  const farmName = new Map(scope.farms.map((f) => [f.id, f.name]));
  const p = plots ?? [];
  const acid = p.filter((x) => Number(latestSoil.get(x.id)?.ph ?? x.soil_ph ?? 7) < 6);
  const tested = p.filter((x) => latestSoil.has(x.id));

  return (
    <Stack>
      <PageHeader
        back={{ href: `/${lang}/account/farms`, label: "My farms" }}
        eyebrow={<Chip icon="science">{(soil ?? []).length} soil tests</Chip>}
        title="Field Profiles"
        description="Soil, slope, drainage and water for every plot, with the latest lab results and what to do about them."
        actions={
          scope.farms.length > 0 && (
            <ActionDialog
              title="Add a plot"
              trigger="Add plot"
              icon="add_location_alt"
              action={createPlot}
              hidden={{ lang }}
              fields={[
                { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
                { name: "name", label: "Plot name", required: true },
                { name: "plot_code", label: "Code" },
                { name: "area_ha", label: "Area (ha)", type: "number" },
                { name: "soil_texture", label: "Soil texture", type: "select", options: opt(["sandy", "loamy_sand", "sandy_loam", "loam", "silt_loam", "clay_loam", "clay"]) },
                { name: "irrigation_type", label: "Water", type: "select", options: opt(["rainfed", "drip", "sprinkler", "furrow", "manual"]) },
              ]}
            />
          )
        }
      />
      {!p.length && <StartHere title="No plots yet" action={<Link className="font-label-md text-primary-container" href={`/${lang}/account/farms`}>My farms →</Link>} />}
      <KpiGrid>
        <MetricCard label="Plots" value={p.length} icon="grid_on" foot={`${num(p.reduce((s, x) => s + Number(x.area_ha ?? 0), 0), 1)} ha`} />
        <MetricCard label="Soil-tested" value={`${tested.length}/${p.length}`} icon="science" foot="At least one lab result" />
        <MetricCard label="Acidic plots" value={acid.length} icon="water_ph" iconTone={acid.length ? "bg-caution-soft text-[#b45309]" : undefined} foot="pH below 6.0 — consider liming" />
        <MetricCard label="Irrigated" value={p.filter((x) => x.irrigation_type && x.irrigation_type !== "rainfed").length} icon="water_drop" foot="Drip, sprinkler, furrow or manual" />
      </KpiGrid>
      <Section title="Plot profiles" icon="grid_on">
        <DataTable
          rows={p}
          rowKey={(x) => x.id}
          columns={[
            { label: "Plot", cell: (x) => <span className="font-medium">{x.name}{x.plot_code ? ` (${x.plot_code})` : ""}</span> },
            { label: "Farm", cell: (x) => farmName.get(x.farm_id) },
            { label: "Area", numeric: true, cell: (x) => (x.area_ha ? `${num(x.area_ha, 1)} ha` : "—") },
            { label: "Texture", cell: (x) => label(x.soil_texture) },
            { label: "Drainage", cell: (x) => label(x.drainage) },
            { label: "Slope", numeric: true, cell: (x) => (x.slope_pct != null ? `${x.slope_pct}%` : "—") },
            { label: "pH", numeric: true, cell: (x) => latestSoil.get(x.id)?.ph ?? x.soil_ph ?? "—" },
            { label: "OM %", numeric: true, cell: (x) => latestSoil.get(x.id)?.organic_matter_pct ?? x.organic_matter_pct ?? "—" },
            { label: "Crop", cell: (x) => (x.current_crop ? cap(x.current_crop) : "Fallow") },
          ]}
        />
      </Section>
      <Section title="Lab results & recommendations" icon="science">
        <DataTable
          rows={soil ?? []}
          rowKey={(s) => s.id}
          empty="No soil tests yet."
          columns={[
            { label: "Plot", cell: (s) => p.find((x) => x.id === s.plot_id)?.name },
            { label: "Tested", cell: (s) => (s.tested_on ? formatDay(s.tested_on, lang) : "—") },
            { label: "Lab", cell: (s) => s.lab_name ?? "—" },
            { label: "pH", numeric: true, cell: (s) => s.ph ?? "—" },
            { label: "N %", numeric: true, cell: (s) => s.nitrogen_pct ?? "—" },
            { label: "P ppm", numeric: true, cell: (s) => s.phosphorus_ppm ?? "—" },
            { label: "K cmol/kg", numeric: true, cell: (s) => s.potassium_cmol_kg ?? "—" },
            { label: "Recommendation", cell: (s) => s.recommendations ?? "—" },
          ]}
        />
      </Section>
    </Stack>
  );
}
