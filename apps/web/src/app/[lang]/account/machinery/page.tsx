import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { completeMaintenance, createMachine, logMachineUsage, scheduleMaintenance } from "@/actions/farm-ops";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton, ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Meter, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { farmOptions, loadFarmScope, plotOptions } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, naira, num, share, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Fleet & workshop" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params }: PageProps<"/[lang]/account/machinery">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const [{ data: fleet }, { data: usage }, { data: maint }] = await Promise.all([
    supabase.from("farm_machinery_assets").select("*").in("farm_id", ids).order("asset_code"),
    supabase.from("farm_machinery_usage_logs").select("*").in("farm_id", ids).order("start_time", { ascending: false }).limit(20),
    supabase.from("farm_machinery_maintenance").select("*").in("farm_id", ids).order("service_date", { ascending: false }).limit(20),
  ]);
  const f = fleet ?? [];
  const mName = new Map(f.map((m) => [m.id, `${m.asset_code} · ${m.name}`]));
  const busy = f.filter((m) => ["in_use", "hired_out", "reserved"].includes(m.current_status));
  const down = f.filter((m) => ["under_maintenance", "out_of_service"].includes(m.current_status));
  const dueService = f.filter((m) => m.next_service_hours && Number(m.engine_hours) >= Number(m.next_service_hours) - 50);
  const value = f.reduce((s, m) => s + Number(m.purchase_value_kobo ?? 0), 0);
  const hrs30 = (usage ?? []).filter((u) => nowMs() - Date.parse(u.start_time) < 30 * 86_400_000).reduce((s, u) => s + Number(u.hours_operated), 0);
  const machineOpts = f.map((m) => ({ value: m.id, label: `${m.asset_code} · ${m.name}` }));
  const hidden = { lang };

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="agriculture">{f.length} machines</Chip>
            <Chip icon="build">{down.length} in workshop</Chip>
          </>
        }
        title="Fleet & Workshop"
        description="Your tractors, implements, pumps and trucks — status, engine hours, usage and service history."
        actions={
          <>
            <Link href={`/${lang}/account/machinery/telemetry`} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3.5 py-2 font-label-md text-label-md text-on-surface shadow-sm ring-1 ring-outline-variant/60 hover:bg-surface-container-low">
              <Icon name="satellite_alt" className="text-base" /> Live tracking
            </Link>
            {f.length > 0 && (
              <>
                <ActionDialog
                  title="Log machine use"
                  trigger="Log use"
                  icon="timer"
                  tone="secondary"
                  action={logMachineUsage}
                  hidden={hidden}
                  fields={[
                    { name: "machinery_id", label: "Machine", type: "select", required: true, options: machineOpts },
                    { name: "operation_name", label: "Job", required: true, placeholder: "Harrowing NB-A" },
                    { name: "plot_id", label: "Plot", type: "select", options: plotOptions(scope) },
                    { name: "hours_operated", label: "Hours", type: "number", required: true },
                    { name: "area_covered_ha", label: "Area (ha)", type: "number" },
                    { name: "fuel_litres_consumed", label: "Fuel (L)", type: "number" },
                  ]}
                />
                <ActionDialog
                  title="Workshop job"
                  trigger="Service"
                  icon="build"
                  tone="secondary"
                  action={scheduleMaintenance}
                  hidden={hidden}
                  fields={[
                    { name: "machinery_id", label: "Machine", type: "select", required: true, options: machineOpts },
                    { name: "service_type", label: "Type", type: "select", required: true, options: opt(["routine_service", "repair", "inspection", "tyre", "overhaul"]) },
                    { name: "description", label: "Work", required: true, wide: true },
                    { name: "service_date", label: "Date", type: "date" },
                    { name: "cost", label: "Cost (₦)", type: "number" },
                    { name: "vendor", label: "Workshop / vendor" },
                  ]}
                />
              </>
            )}
            {scope.farms.length > 0 && (
              <ActionDialog
                title="Add a machine"
                trigger="Add machine"
                action={createMachine}
                hidden={hidden}
                fields={[
                  { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
                  { name: "asset_code", label: "Asset code", required: true, placeholder: "TR-02" },
                  { name: "name", label: "Name", required: true, wide: true },
                  { name: "category", label: "Category", type: "select", required: true, options: opt(["tractor", "plough", "harrow", "ridger", "planter", "harvester", "boom_sprayer", "water_pump", "generator", "trailer", "truck", "processor", "drone", "other"]) },
                  { name: "fuel_type", label: "Fuel", type: "select", defaultValue: "diesel", options: opt(["diesel", "petrol", "electric", "manual", "hybrid"]) },
                  { name: "manufacturer", label: "Make" },
                  { name: "model", label: "Model" },
                  { name: "year_of_manufacture", label: "Year", type: "number" },
                  { name: "registration_number", label: "Registration" },
                  { name: "engine_hours", label: "Engine hours", type: "number" },
                  { name: "next_service_hours", label: "Next service at (h)", type: "number" },
                  { name: "hourly_rate", label: "Internal rate (₦/h)", type: "number" },
                  { name: "purchase_value", label: "Value (₦)", type: "number" },
                ]}
              />
            )}
          </>
        }
      />
      {!scope.farms.length && <StartHere title="Register a farm to add machinery" />}
      <KpiGrid>
        <MetricCard label="Fleet utilisation" value={`${Math.round(share(busy.length, f.length))}%`} icon="speed" foot={`${busy.length} of ${f.length} working or reserved`} />
        <MetricCard label="Hours, 30 days" value={num(hrs30, 1)} unit="h" icon="timer" foot="Logged machine hours" />
        <MetricCard label="Service due" value={dueService.length} icon="build" iconTone={dueService.length ? "bg-caution-soft text-[#b45309]" : undefined} foot="Within 50 h of the service interval" />
        <MetricCard label="Fleet value" value={naira(value)} icon="account_balance" foot="At purchase price" />
      </KpiGrid>
      <Section title="Fleet register" icon="agriculture">
        <DataTable
          rows={f}
          rowKey={(m) => m.id}
          empty="No machines yet."
          columns={[
            { label: "Asset", cell: (m) => <span className="font-medium">{m.asset_code}</span> },
            { label: "Machine", cell: (m) => `${m.name}${m.year_of_manufacture ? ` (${m.year_of_manufacture})` : ""}` },
            { label: "Category", cell: (m) => label(m.category) },
            { label: "Engine hours", numeric: true, cell: (m) => num(m.engine_hours) },
            {
              label: "To service",
              cell: (m) =>
                m.next_service_hours ? (
                  <div className="w-28">
                    <Meter value={share(Number(m.engine_hours), Number(m.next_service_hours))} tone={Number(m.engine_hours) >= Number(m.next_service_hours) - 50 ? "caution" : "positive"} />
                    <span className="text-body-sm text-on-surface-variant">{num(Number(m.next_service_hours) - Number(m.engine_hours))} h</span>
                  </div>
                ) : (
                  "—"
                ),
            },
            { label: "Rate", numeric: true, cell: (m) => (m.hourly_internal_rate_kobo ? `${naira(m.hourly_internal_rate_kobo)}/h` : "—") },
            { label: "Status", cell: (m) => <Status value={m.current_status} /> },
          ]}
        />
      </Section>
      <Split
        wide={
          <Section title="Usage log" icon="history">
            <DataTable
              rows={usage ?? []}
              rowKey={(u) => u.id}
              empty="No usage logged."
              columns={[
                { label: "Date", cell: (u) => formatDay(u.start_time.slice(0, 10), lang) },
                { label: "Machine", cell: (u) => mName.get(u.machinery_id) },
                { label: "Job", cell: (u) => u.operation_name },
                { label: "Hours", numeric: true, cell: (u) => num(u.hours_operated, 1) },
                { label: "Area", numeric: true, cell: (u) => (u.area_covered_ha ? `${num(u.area_covered_ha, 1)} ha` : "—") },
                { label: "Fuel", numeric: true, cell: (u) => (u.fuel_litres_consumed ? `${num(u.fuel_litres_consumed)} L` : "—") },
                { label: "Cost", numeric: true, cell: (u) => naira(u.operational_cost_kobo) },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Workshop" icon="build">
            <ul className="flex flex-col divide-y divide-outline-variant/30">
              {(maint ?? []).map((x) => (
                <li key={x.id} className="flex flex-col gap-1 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-label-lg text-label-lg text-on-surface">{mName.get(x.machinery_id)}</p>
                    <Status value={x.status} />
                  </div>
                  <p className="text-body-sm text-on-surface-variant">
                    {label(x.service_type)} · {x.description}
                  </p>
                  <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                    <span>
                      {x.service_date ? formatDay(x.service_date, lang) : ""} · {naira(x.cost_kobo)}
                    </span>
                    {x.status !== "completed" && <ActionButton action={completeMaintenance} hidden={{ lang, id: x.id }} label="Complete" />}
                  </div>
                </li>
              ))}
              {!maint?.length && <li className="py-4 text-center text-body-sm text-on-surface-variant">No service records.</li>}
            </ul>
          </Section>
        }
      />
    </Stack>
  );
}
