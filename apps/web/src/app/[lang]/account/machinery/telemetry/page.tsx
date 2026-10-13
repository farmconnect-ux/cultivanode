import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ds/page-header";
import { Chip, DataTable, KpiGrid, LineChart, PointMap, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { ago, num, pct, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Telemetry & tracking" };

export default async function Page({ params }: PageProps<"/[lang]/account/machinery/telemetry">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  // Window ends at the latest ping, so a tracker that went quiet still shows its last day of data.
  const { data: lastPing } = await supabase.from("machinery_telemetry").select("recorded_at").in("farm_id", ids).order("recorded_at", { ascending: false }).limit(1).maybeSingle();
  const anchor = lastPing?.recorded_at ? Date.parse(lastPing.recorded_at) : nowMs();
  const [{ data: fleet }, { data: pts }] = await Promise.all([
    supabase.from("farm_machinery_assets").select("id, asset_code, name, category, current_status, engine_hours").in("farm_id", ids),
    supabase
      .from("machinery_telemetry_points")
      .select("*")
      .in("farm_id", ids)
      .gte("recorded_at", new Date(anchor - 24 * 3_600_000).toISOString())
      .order("recorded_at", { ascending: true }),
  ]);
  const points = pts ?? [];
  const byMachine = new Map<string, typeof points>();
  for (const p of points) if (p.machinery_id) byMachine.set(p.machinery_id, [...(byMachine.get(p.machinery_id) ?? []), p]);
  const latest = [...byMachine.entries()].map(([mid, list]) => ({ mid, last: list.at(-1)!, list }));
  const machines = new Map((fleet ?? []).map((m) => [m.id, m]));
  const working = latest.filter((l) => l.last.status === "working");
  const lowFuel = latest.filter((l) => Number(l.last.fuel_pct ?? 100) < 25);
  const hot = latest.filter((l) => Number(l.last.engine_temp_c ?? 0) > 95);
  const focus = latest.sort((a, b) => b.list.length - a.list.length)[0];

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="satellite_alt">Last 24 hours</Chip>}
        title="Telemetry & Tracking"
        description="GPS position, fuel, engine temperature and hours streamed from fitted machines."
      />
      {!latest.length && <StartHere icon="satellite_alt" title="No machine is reporting yet">Fit a CultivaNode tracker to a tractor or truck and its position and engine data appear here.</StartHere>}
      <KpiGrid>
        <MetricCard label="Reporting machines" value={latest.length} icon="sensors" foot={`of ${(fleet ?? []).length} in the fleet`} />
        <MetricCard label="Working now" value={working.length} icon="agriculture" foot="Status from the last ping" />
        <MetricCard label="Low fuel" value={lowFuel.length} icon="local_gas_station" iconTone={lowFuel.length ? "bg-caution-soft text-[#b45309]" : undefined} foot="Below 25%" />
        <MetricCard label="Engine alerts" value={hot.length} icon="thermostat" iconTone={hot.length ? "bg-critical-soft text-critical" : undefined} foot="Above 95 °C" />
      </KpiGrid>
      {focus && (
        <Split
          wide={
            <Section title={`Track — ${machines.get(focus.mid)?.asset_code ?? ""} ${machines.get(focus.mid)?.name ?? ""}`} icon="route" description="Dashed line follows the last 24 h of GPS fixes; the large dot is the earliest.">
              <PointMap track points={focus.list.filter((p) => p.lat != null && p.lng != null).map((p) => ({ lat: Number(p.lat), lng: Number(p.lng), label: machines.get(focus.mid)?.asset_code ?? "" }))} />
            </Section>
          }
          side={
            <Section title="Fuel level" icon="local_gas_station">
              <LineChart unit="%" points={focus.list.map((p) => ({ x: new Date(p.recorded_at ?? "").toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }), y: Number(p.fuel_pct ?? 0) }))} />
            </Section>
          }
        />
      )}
      <Section title="Machines" icon="agriculture">
        <DataTable
          rows={latest}
          rowKey={(l) => l.mid}
          empty="No telemetry yet."
          columns={[
            { label: "Machine", cell: (l) => <span className="font-medium">{machines.get(l.mid)?.asset_code} · {machines.get(l.mid)?.name}</span> },
            { label: "Last ping", cell: (l) => ago(l.last.recorded_at) },
            { label: "Speed", numeric: true, cell: (l) => `${num(l.last.speed_kmh, 1)} km/h` },
            { label: "Fuel", numeric: true, cell: (l) => pct(l.last.fuel_pct) },
            { label: "RPM", numeric: true, cell: (l) => num(l.last.engine_rpm) },
            { label: "Temp", numeric: true, cell: (l) => `${num(l.last.engine_temp_c)} °C` },
            { label: "Hours", numeric: true, cell: (l) => num(l.last.engine_hours, 1) },
            { label: "Status", cell: (l) => <Status value={l.last.status} /> },
          ]}
        />
      </Section>
    </Stack>
  );
}
