import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { recordVariance } from "@/actions/farm-ops";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Pill, Section, Stack, StartHere } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cycleLabel, cycleOptions, farmOptions, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, num } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Standard · plan · actual" };

function delta(actual: number, ref: number) {
  return ref ? ((actual - ref) / Math.abs(ref)) * 100 : 0;
}

export default async function Page({ params }: PageProps<"/[lang]/account/variance">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const [{ data: rows }, { data: standards }] = await Promise.all([
    supabase.from("farm_plan_actual_variances").select("*").in("farm_id", ids).order("recorded_at", { ascending: false }),
    supabase.from("farm_agronomic_standards").select("id, standard_code, crop_or_livestock_id, source_authority, agro_zone").eq("is_active", true),
  ]);
  const v = rows ?? [];
  const cycles = new Map(scope.cycles.map((c) => [c.id, c]));
  const std = new Map((standards ?? []).map((s) => [s.id, s]));
  const off = v.filter((r) => Math.abs(delta(Number(r.actual_value), Number(r.plan_value))) > 10);
  const overrides = v.filter((r) => r.is_farmer_override);

  return (
    <Stack>
      <PageHeader
        back={{ href: `/${lang}/account/finance`, label: "Farm books" }}
        eyebrow={<Chip icon="verified">{(standards ?? []).length} agronomic standards</Chip>}
        title="Standard · Plan · Actual"
        description="How each crop and flock performed against the published standard and your own plan, with the reason when you deviated."
        actions={
          scope.farms.length > 0 && (
            <ActionDialog
              title="Record a variance"
              trigger="Record variance"
              icon="compare_arrows"
              action={recordVariance}
              hidden={{ lang }}
              fields={[
                { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
                { name: "crop_cycle_id", label: "Crop cycle", type: "select", options: cycleOptions(scope, false) },
                { name: "entity_type", label: "Area", type: "select", defaultValue: "crop", options: ["crop", "livestock", "machinery", "labour", "inventory"].map((x) => ({ value: x, label: label(x) })) },
                { name: "metric_name", label: "Metric", required: true, placeholder: "Seed rate" },
                { name: "unit", label: "Unit", required: true, placeholder: "kg/ha" },
                { name: "standard_value", label: "Standard", type: "number", required: true },
                { name: "plan_value", label: "Plan", type: "number", required: true },
                { name: "actual_value", label: "Actual", type: "number", required: true },
                { name: "farmer_deviation_reason", label: "Why it differed", type: "textarea" },
              ]}
            />
          )
        }
      />
      {!scope.farms.length && <StartHere title="Register a farm to compare plan and actual" />}
      <KpiGrid>
        <MetricCard label="Metrics tracked" value={v.length} icon="analytics" foot="Standard, plan and actual recorded" />
        <MetricCard label="More than 10% off plan" value={off.length} icon="warning" iconTone={off.length ? "bg-caution-soft text-[#b45309]" : undefined} foot="Either direction" />
        <MetricCard label="Farmer overrides" value={overrides.length} icon="edit_note" foot="Deviations with a reason" />
        <MetricCard label="On plan" value={v.length ? `${Math.round(((v.length - off.length) / v.length) * 100)}%` : "—"} icon="task_alt" foot="Within ±10% of plan" />
      </KpiGrid>
      <Section title="Variance register" icon="compare_arrows">
        <DataTable
          rows={v}
          rowKey={(r) => r.id}
          empty="No variances recorded yet."
          columns={[
            { label: "Metric", cell: (r) => <span className="font-medium">{r.metric_name}</span> },
            { label: "For", cell: (r) => (r.crop_cycle_id && cycles.get(r.crop_cycle_id) ? cycleLabel(cycles.get(r.crop_cycle_id)!) : label(r.entity_type)) },
            { label: "Standard", numeric: true, cell: (r) => `${num(r.standard_value, 2)} ${r.unit}` },
            { label: "Plan", numeric: true, cell: (r) => num(r.plan_value, 2) },
            { label: "Actual", numeric: true, cell: (r) => num(r.actual_value, 2) },
            {
              label: "vs plan",
              numeric: true,
              cell: (r) => {
                const d = delta(Number(r.actual_value), Number(r.plan_value));
                return <Pill tone={Math.abs(d) <= 10 ? "positive" : "caution"}>{`${d > 0 ? "+" : ""}${num(d, 1)}%`}</Pill>;
              },
            },
            { label: "vs standard", numeric: true, cell: (r) => `${num(delta(Number(r.actual_value), Number(r.standard_value)), 1)}%` },
            { label: "Source", cell: (r) => (r.standard_id ? std.get(r.standard_id)?.standard_code ?? "—" : "—") },
            { label: "Reason", cell: (r) => r.farmer_deviation_reason ?? "—" },
          ]}
        />
      </Section>
      <Section title="Published standards" icon="menu_book">
        <DataTable
          rows={standards ?? []}
          rowKey={(s) => s.id}
          columns={[
            { label: "Code", cell: (s) => <span className="font-medium">{s.standard_code}</span> },
            { label: "Crop / livestock", cell: (s) => label(s.crop_or_livestock_id) },
            { label: "Zone", cell: (s) => label(s.agro_zone) },
            { label: "Authority", cell: (s) => s.source_authority },
          ]}
        />
      </Section>
    </Stack>
  );
}
