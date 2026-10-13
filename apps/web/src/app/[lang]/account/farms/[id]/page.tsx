import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createCropCycle, createPlot } from "@/actions/farm-ops";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, Facts, KpiGrid, PointMap, Section, Split, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cap } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, naira, num } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Farm profile" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params }: PageProps<"/[lang]/account/farms/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);
  const supabase = await createClient();
  const { data: farm } = await supabase.from("farms").select("*").eq("id", id).maybeSingle();
  if (!farm) notFound();
  const [{ data: pt }, { data: plots }, { data: cycles }, { data: tx }, { data: groups }, { data: machines }] = await Promise.all([
    supabase.from("farm_points").select("lat, lng").eq("id", id).maybeSingle(),
    supabase.from("plots").select("*").eq("farm_id", id).order("name"),
    supabase.from("crop_cycles").select("id, plot_id, crop_id, variety_id, status, current_stage, health_status, expected_harvest_date").eq("farm_id", id).order("planting_date", { ascending: false }),
    supabase.from("farm_financial_transactions").select("type, amount_kobo").eq("farm_id", id),
    supabase.from("farm_livestock_groups").select("id, population").eq("farm_id", id),
    supabase.from("farm_machinery_assets").select("id").eq("farm_id", id),
  ]);
  const p = plots ?? [];
  const { data: soilRows } = p.length ? await supabase.from("soil_records").select("*").in("plot_id", p.map((x) => x.id)).order("tested_on", { ascending: false }) : { data: [] };
  const plotName = new Map(p.map((x) => [x.id, x.name]));
  const active = (cycles ?? []).filter((c) => !["completed", "abandoned"].includes(c.status));
  const plotHa = p.reduce((s, x) => s + Number(x.area_ha ?? 0), 0);
  const income = (tx ?? []).filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount_kobo), 0);
  const expense = (tx ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount_kobo), 0);
  const hidden = { lang, farm_id: id };

  return (
    <Stack>
      <PageHeader
        back={{ href: `/${lang}/account/farms`, label: "My farms" }}
        eyebrow={
          <>
            {farm.farm_code && <Chip icon="tag">{farm.farm_code}</Chip>}
            <Status value={farm.status} />
            {farm.ownership_type && <Chip>{label(farm.ownership_type)}</Chip>}
          </>
        }
        title={farm.name}
        description={`${[farm.lga, farm.state].filter(Boolean).join(", ")}${farm.address_hint ? ` · ${farm.address_hint}` : ""}`}
        actions={
          <>
            <ActionDialog
              title="Add a plot"
              trigger="Add plot"
              icon="add_location_alt"
              tone="secondary"
              action={createPlot}
              hidden={hidden}
              fields={[
                { name: "name", label: "Plot name", required: true },
                { name: "plot_code", label: "Code" },
                { name: "area_ha", label: "Area (ha)", type: "number" },
                { name: "current_crop", label: "Current crop" },
                { name: "soil_texture", label: "Soil texture", type: "select", options: opt(["sandy", "loamy_sand", "sandy_loam", "loam", "silt_loam", "clay_loam", "clay"]) },
                { name: "irrigation_type", label: "Water", type: "select", options: opt(["rainfed", "drip", "sprinkler", "furrow", "manual"]) },
                { name: "notes", label: "Notes", type: "textarea" },
              ]}
            />
            {p.length > 0 && (
              <ActionDialog
                title="Start a crop cycle"
                trigger="New crop cycle"
                action={createCropCycle}
                hidden={hidden}
                fields={[
                  { name: "plot_id", label: "Plot", type: "select", options: p.map((x) => ({ value: x.id, label: x.name })) },
                  { name: "crop_id", label: "Crop", required: true, placeholder: "maize" },
                  { name: "variety_id", label: "Variety" },
                  { name: "target_area_ha", label: "Area (ha)", type: "number", required: true },
                  { name: "planting_date", label: "Planting", type: "date", required: true },
                  { name: "expected_harvest_date", label: "Harvest", type: "date", required: true },
                  { name: "target_yield_kg", label: "Target yield (kg)", type: "number" },
                  { name: "estimated_budget", label: "Budget (₦)", type: "number" },
                ]}
              />
            )}
          </>
        }
      />
      <KpiGrid>
        <MetricCard label="Farm area" value={num(farm.area_ha, 1)} unit="ha" icon="landscape" foot={`${num(plotHa, 1)} ha mapped into ${p.length} plots`} />
        <MetricCard label="Active crop cycles" value={active.length} icon="potted_plant" href={`/${lang}/account/crops`} foot={`${(cycles ?? []).length} cycles recorded`} />
        <MetricCard label="Livestock & machines" value={(groups ?? []).reduce((s, g) => s + g.population, 0)} unit="head" icon="pets" foot={`${(machines ?? []).length} machines on this farm`} />
        <MetricCard label="Net on the books" value={naira(income - expense)} icon="account_balance_wallet" href={`/${lang}/account/finance`} foot={`${naira(income)} in · ${naira(expense)} out`} />
      </KpiGrid>
      <Split
        wide={
          <>
            <Section title="Plots" icon="grid_on">
              <DataTable
                rows={p}
                rowKey={(x) => x.id}
                empty="No plots yet."
                columns={[
                  { label: "Plot", cell: (x) => <span className="font-medium">{x.name}{x.plot_code ? ` (${x.plot_code})` : ""}</span> },
                  { label: "Area", numeric: true, cell: (x) => (x.area_ha ? `${num(x.area_ha, 1)} ha` : "—") },
                  { label: "Soil", cell: (x) => label(x.soil_texture) },
                  { label: "pH", numeric: true, cell: (x) => x.soil_ph ?? "—" },
                  { label: "Water", cell: (x) => label(x.irrigation_type) },
                  { label: "Current crop", cell: (x) => (x.current_crop ? cap(x.current_crop) : "Fallow") },
                ]}
              />
            </Section>
            <Section title="Crop cycles" icon="potted_plant">
              <DataTable
                rows={cycles ?? []}
                rowKey={(c) => c.id}
                empty="No crop cycles yet."
                columns={[
                  { label: "Crop", cell: (c) => <Link className="font-medium text-primary-container hover:underline" href={`/${lang}/account/crops/${c.id}`}>{cap(c.crop_id)} {c.variety_id}</Link> },
                  { label: "Plot", cell: (c) => (c.plot_id ? plotName.get(c.plot_id) : "—") },
                  { label: "Stage", cell: (c) => c.current_stage ?? "—" },
                  { label: "Harvest", cell: (c) => formatDay(c.expected_harvest_date, lang) },
                  { label: "Health", cell: (c) => <Status value={c.health_status} /> },
                  { label: "Status", cell: (c) => <Status value={c.status} /> },
                ]}
              />
            </Section>
            <Section title="Soil tests" icon="science">
              <DataTable
                rows={soilRows ?? []}
                rowKey={(s) => s.id}
                empty="No soil tests recorded."
                columns={[
                  { label: "Plot", cell: (s) => plotName.get(s.plot_id) },
                  { label: "Tested", cell: (s) => (s.tested_on ? formatDay(s.tested_on, lang) : "—") },
                  { label: "pH", numeric: true, cell: (s) => s.ph ?? "—" },
                  { label: "OM %", numeric: true, cell: (s) => s.organic_matter_pct ?? "—" },
                  { label: "N %", numeric: true, cell: (s) => s.nitrogen_pct ?? "—" },
                  { label: "P ppm", numeric: true, cell: (s) => s.phosphorus_ppm ?? "—" },
                  { label: "Recommendation", cell: (s) => s.recommendations ?? "—" },
                ]}
              />
            </Section>
          </>
        }
        side={
          <>
            <Section title="Location" icon="location_on">
              {pt?.lat != null && pt.lng != null ? <PointMap height={200} points={[{ lat: Number(pt.lat), lng: Number(pt.lng), label: farm.name }]} /> : <p className="text-body-sm text-on-surface-variant">No GPS point.</p>}
            </Section>
            <Section title="Site profile" icon="info">
              <Facts
                className="sm:grid-cols-1"
                items={[
                  ["Zone", label(farm.zone)],
                  ["Slope", label(farm.slope_type)],
                  ["Access", label(farm.accessibility_level)],
                  ["Water sources", (farm.water_sources ?? []).map(label).join(", ") || "—"],
                  ["Irrigation", (farm.irrigation_systems ?? []).map(label).join(", ") || "—"],
                  ["Boundary", farm.area_is_measured ? "Measured" : "Estimated"],
                  ["Registered", formatDay(farm.created_at.slice(0, 10), lang)],
                ]}
              />
            </Section>
          </>
        }
      />
    </Stack>
  );
}
