import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createIrrigationZone, runIrrigation } from "@/actions/farm-ops";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton, ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Meter, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { farmOptions, loadFarmScope, plotOptions } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { ago, label, num, pct, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Smart irrigation" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params }: PageProps<"/[lang]/account/irrigation">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const [{ data: zones }, { data: events }] = await Promise.all([
    supabase.from("irrigation_zones").select("*").in("farm_id", ids).order("name"),
    supabase.from("irrigation_events").select("*").in("farm_id", ids).order("started_at", { ascending: false }).limit(30),
  ]);
  const z = zones ?? [];
  const zName = new Map(z.map((x) => [x.id, x.name]));
  const farmName = new Map(scope.farms.map((f) => [f.id, f.name]));
  const week = (events ?? []).filter((e) => nowMs() - Date.parse(e.started_at) < 7 * 86_400_000 && e.status !== "planned");
  const litres = week.reduce((s, e) => s + Number(e.volume_litres ?? 0), 0);
  const kwh = week.reduce((s, e) => s + Number(e.energy_kwh ?? 0), 0);
  const dry = z.filter((x) => x.current_moisture_pct != null && x.target_moisture_pct != null && Number(x.current_moisture_pct) < Number(x.target_moisture_pct) - 3);
  const faults = z.filter((x) => x.status === "fault");

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="water_drop">{z.length} zones</Chip>}
        title="Smart Irrigation"
        description="Irrigation zones, soil moisture against target, and every run with the water and energy it used."
        actions={
          scope.farms.length > 0 && (
            <ActionDialog
              title="Add an irrigation zone"
              trigger="New zone"
              action={createIrrigationZone}
              hidden={{ lang }}
              fields={[
                { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
                { name: "plot_id", label: "Plot", type: "select", options: plotOptions(scope) },
                { name: "name", label: "Zone name", required: true },
                { name: "method", label: "Method", type: "select", required: true, options: opt(["drip", "sprinkler", "furrow", "centre_pivot", "manual"]) },
                { name: "water_source", label: "Source", type: "select", options: opt(["borehole", "river", "dam", "rainwater_tank", "municipal"]) },
                { name: "area_ha", label: "Area (ha)", type: "number" },
                { name: "flow_rate_lpm", label: "Flow (L/min)", type: "number" },
                { name: "target_moisture_pct", label: "Target moisture %", type: "number" },
              ]}
            />
          )
        }
      />
      {!scope.farms.length && <StartHere title="Register a farm to set up irrigation" />}
      <KpiGrid>
        <MetricCard label="Water used, 7 days" value={num(litres / 1000, 1)} unit="m³" icon="water" foot={`${week.length} runs`} />
        <MetricCard label="Energy, 7 days" value={num(kwh, 1)} unit="kWh" icon="bolt" foot="Pump energy recorded" />
        <MetricCard label="Below target moisture" value={dry.length} icon="water_loss" iconTone={dry.length ? "bg-caution-soft text-[#b45309]" : undefined} foot="More than 3 points under target" />
        <MetricCard label="Faults" value={faults.length} icon="report_problem" iconTone={faults.length ? "bg-critical-soft text-critical" : undefined} foot={faults.map((f) => f.name).join(", ") || "All zones OK"} />
      </KpiGrid>
      <Split
        wide={
          <Section title="Zones" icon="water_drop">
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              {z.map((x) => {
                const cur = Number(x.current_moisture_pct ?? 0);
                const tgt = Number(x.target_moisture_pct ?? 0);
                return (
                  <div key={x.id} className="flex flex-col gap-3 rounded-xl border border-outline-variant/40 p-space-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-label-lg text-label-lg text-on-surface">{x.name}</p>
                        <p className="text-body-sm text-on-surface-variant">
                          {label(x.method)} · {label(x.water_source)} · {farmName.get(x.farm_id)}
                        </p>
                      </div>
                      <Status value={x.status} />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-body-sm">
                        <span>Soil moisture {pct(cur, 1)}</span>
                        <span className="text-on-surface-variant">target {pct(tgt)}</span>
                      </div>
                      <Meter value={tgt ? (cur / tgt) * 100 : 0} tone={cur < tgt - 3 ? "caution" : "positive"} />
                    </div>
                    <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                      <span>{x.flow_rate_lpm ? `${num(x.flow_rate_lpm)} L/min` : ""}{x.area_ha ? ` · ${num(x.area_ha, 1)} ha` : ""}</span>
                      {x.status !== "fault" && x.status !== "irrigating" && <ActionButton action={runIrrigation} hidden={{ lang, zone_id: x.id, minutes: "60" }} label="Run 60 min" icon="play_arrow" tone="secondary" />}
                    </div>
                  </div>
                );
              })}
              {!z.length && <p className="py-6 text-center text-body-sm text-on-surface-variant md:col-span-2">No irrigation zones yet.</p>}
            </div>
          </Section>
        }
        side={
          <Section title="Recent runs" icon="history">
            <ul className="flex flex-col divide-y divide-outline-variant/30">
              {(events ?? []).slice(0, 12).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 py-2 text-body-sm">
                  <span>
                    <span className="font-medium text-on-surface">{zName.get(e.zone_id)}</span>
                    <span className="text-on-surface-variant"> · {ago(e.started_at)} · {e.volume_litres ? `${num(Number(e.volume_litres) / 1000, 1)} m³` : "—"}</span>
                  </span>
                  <Status value={e.status} />
                </li>
              ))}
              {!events?.length && <li className="py-4 text-center text-body-sm text-on-surface-variant">No runs yet.</li>}
            </ul>
          </Section>
        }
      />
      <Section title="Run log" icon="table_view">
        <DataTable
          rows={events ?? []}
          rowKey={(e) => e.id}
          columns={[
            { label: "Zone", cell: (e) => zName.get(e.zone_id) },
            { label: "Started", cell: (e) => new Date(e.started_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }) },
            { label: "Trigger", cell: (e) => label(e.trigger) },
            { label: "Volume", numeric: true, cell: (e) => (e.volume_litres ? `${num(e.volume_litres)} L` : "—") },
            { label: "Energy", numeric: true, cell: (e) => (e.energy_kwh ? `${num(e.energy_kwh, 1)} kWh` : "—") },
            { label: "Status", cell: (e) => <Status value={e.status} /> },
            { label: "Notes", cell: (e) => e.notes ?? "—" },
          ]}
        />
      </Section>
    </Stack>
  );
}
