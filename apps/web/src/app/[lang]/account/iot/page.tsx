import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupportTicket } from "@/actions/ecosystem";
import { setDeviceAlertStatus } from "@/actions/farm-ops";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton, ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, LineChart, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { ago, label, num, pct, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "IoT & smart farm" };

const CHANNEL: Record<string, string> = {
  soil_moisture_pct: "Soil moisture",
  air_temperature_c: "Air temperature",
  air_humidity_pct: "Air humidity",
  rainfall_mm: "Rainfall",
  water_level_pct: "Tank level",
};

export default async function Page({ params }: PageProps<"/[lang]/account/iot">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const plotIds = scope.plots.map((p) => p.id).concat("00000000-0000-0000-0000-000000000000");
  // Window ends at the latest reading, so a node that went offline still shows its last 48 hours.
  const { data: lastRead } = await supabase.from("telemetry_readings").select("source_timestamp").in("plot_id", plotIds).order("source_timestamp", { ascending: false }).limit(1).maybeSingle();
  const anchor = lastRead?.source_timestamp ? Date.parse(lastRead.source_timestamp) : nowMs();
  const [{ data: installs }, { data: alerts }, { data: readings }, { data: models }] = await Promise.all([
    supabase.from("device_installations").select("id, device_id, farm_id, plot_id, sensor_depth_cm, is_active, next_calibration_due, devices(serial_number, status, firmware_version, battery_level_pct, signal_rssi, last_seen_at, model_id)").in("farm_id", ids).eq("is_active", true),
    supabase.from("device_alerts").select("*").in("farm_id", ids).order("triggered_at", { ascending: false }).limit(20),
    supabase.from("telemetry_readings").select("device_id, plot_id, channel_code, calibrated_value, unit, source_timestamp").in("plot_id", plotIds).gte("source_timestamp", new Date(anchor - 48 * 3_600_000).toISOString()).order("source_timestamp"),
    supabase.from("device_models").select("id, name"),
  ]);
  const inst = installs ?? [];
  const r = readings ?? [];
  const plotName = new Map(scope.plots.map((p) => [p.id, p.name]));
  const modelName = new Map((models ?? []).map((m) => [m.id, m.name]));
  const series = new Map<string, { x: string; y: number }[]>();
  const latest = new Map<string, (typeof r)[number]>();
  for (const x of r) {
    const k = `${x.device_id}|${x.channel_code}`;
    series.set(k, [...(series.get(k) ?? []), { x: new Date(x.source_timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }), y: Number(x.calibrated_value) }]);
    latest.set(k, x);
  }
  const openAlerts = (alerts ?? []).filter((a) => a.status === "open");
  const online = inst.filter((i) => i.devices?.last_seen_at && nowMs() - Date.parse(i.devices.last_seen_at) < 3_600_000);
  const lowBatt = inst.filter((i) => Number(i.devices?.battery_level_pct ?? 100) < 20);
  const charts = [...series.entries()].slice(0, 4);

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="sensors">{inst.length} installed nodes · {r.length} readings in 48 h</Chip>}
        title="IoT & Smart Farm"
        description="Soil, weather and water sensors on your plots — live readings, device health and the alerts they raise."
        actions={
          <ActionDialog
            title="Request a sensor installation"
            description="A field agent provisions and installs CultivaNode nodes. Tell us where you need one."
            trigger="Request a sensor"
            icon="sensors"
            action={createSupportTicket}
            hidden={{ lang, category: "technical", subject: "IoT sensor installation request" }}
            fields={[
              { name: "body", label: "Which farm and plot, and what you want to measure", type: "textarea", required: true },
              { name: "priority", label: "Priority", type: "select", defaultValue: "normal", options: ["low", "normal", "high"].map((v) => ({ value: v, label: label(v) })) },
            ]}
          />
        }
      />
      {!inst.length && <StartHere icon="sensors" title="No sensors installed yet">Once a node is installed on a plot, its readings and alerts appear here.</StartHere>}
      <KpiGrid>
        <MetricCard label="Nodes online" value={`${online.length}/${inst.length}`} icon="wifi_tethering" foot="Seen in the last hour" />
        <MetricCard label="Open alerts" value={openAlerts.length} icon="notification_important" iconTone={openAlerts.length ? "bg-critical-soft text-critical" : undefined} foot="Need acknowledging" />
        <MetricCard label="Low battery" value={lowBatt.length} icon="battery_alert" iconTone={lowBatt.length ? "bg-caution-soft text-[#b45309]" : undefined} foot="Below 20%" />
        <MetricCard label="Channels reporting" value={series.size} icon="stream" foot="Distinct sensor streams" />
      </KpiGrid>
      {charts.length > 0 && (
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
          {charts.map(([k, pts]) => {
            const l = latest.get(k)!;
            const dev = inst.find((i) => i.device_id === l.device_id);
            return (
              <Section key={k} title={`${CHANNEL[l.channel_code] ?? label(l.channel_code)} — ${num(l.calibrated_value, 1)} ${l.unit}`} icon="show_chart" description={`${dev?.devices?.serial_number ?? ""} · ${l.plot_id ? plotName.get(l.plot_id) : ""} · last 48 h`}>
                <LineChart points={pts} unit={l.unit === "%" ? "%" : ` ${l.unit}`} />
              </Section>
            );
          })}
        </div>
      )}
      <Split
        wide={
          <Section title="Devices" icon="router">
            <DataTable
              rows={inst}
              rowKey={(i) => i.id}
              empty="No devices."
              columns={[
                { label: "Serial", cell: (i) => <span className="font-medium">{i.devices?.serial_number}</span> },
                { label: "Model", cell: (i) => modelName.get(i.devices?.model_id ?? "") ?? "—" },
                { label: "Plot", cell: (i) => plotName.get(i.plot_id) },
                { label: "Battery", numeric: true, cell: (i) => pct(i.devices?.battery_level_pct) },
                { label: "Signal", numeric: true, cell: (i) => (i.devices?.signal_rssi != null ? `${i.devices.signal_rssi} dBm` : "—") },
                { label: "Last seen", cell: (i) => ago(i.devices?.last_seen_at) },
                { label: "Status", cell: (i) => <Status value={i.devices?.status} /> },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Alerts" icon="notification_important">
            <ul className="flex flex-col divide-y divide-outline-variant/30">
              {(alerts ?? []).map((a) => (
                <li key={a.id} className="flex flex-col gap-1 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Status value={a.severity} />
                    <span className="text-body-sm text-on-surface-variant">{ago(a.triggered_at)}</span>
                  </div>
                  <p className="text-body-sm font-medium text-on-surface">{a.observation}</p>
                  <p className="text-body-sm text-on-surface-variant">{a.suggested_action}</p>
                  <div className="flex items-center justify-between">
                    <Status value={a.status} />
                    {a.status === "open" && <ActionButton action={setDeviceAlertStatus} hidden={{ lang, id: a.id, status: "acknowledged" }} label="Acknowledge" />}
                    {a.status === "acknowledged" && <ActionButton action={setDeviceAlertStatus} hidden={{ lang, id: a.id, status: "resolved" }} label="Resolve" />}
                  </div>
                </li>
              ))}
              {!alerts?.length && <li className="py-4 text-center text-body-sm text-on-surface-variant">No alerts.</li>}
            </ul>
          </Section>
        }
      />
    </Stack>
  );
}
