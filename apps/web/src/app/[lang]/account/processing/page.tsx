import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { advanceBatch, createProcessingBatch } from "@/actions/ecosystem";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Bars, Chip, DataTable, KpiGrid, Section, Split, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { farmOptions, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { ago, label, mass, num } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Agro-processing" };

const STAGES = ["received", "cleaning", "drying", "milling", "packaging", "quality_check", "dispatched"];

export default async function Page({ params }: PageProps<"/[lang]/account/processing">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const { data } = await supabase.from("processing_batches").select("*").eq("owner_id", account.userId).order("started_at", { ascending: false });
  const b = data ?? [];
  const open = b.filter((x) => x.stage !== "dispatched");
  const done = b.filter((x) => x.output_kg != null);
  const input = done.reduce((s, x) => s + Number(x.input_kg), 0);
  const output = done.reduce((s, x) => s + Number(x.output_kg ?? 0), 0);
  const byStage = STAGES.map((st) => ({ label: label(st), value: b.filter((x) => x.stage === st).length }));

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="factory">{open.length} batches on the floor</Chip>}
        title="Agro-processing"
        description="Batches from intake to dispatch — conversion yield, moisture and quality grade, traced back to the source farm."
        actions={
          <ActionDialog
            title="Receive a batch"
            trigger="New batch"
            action={createProcessingBatch}
            hidden={{ lang }}
            fields={[
              { name: "facility_name", label: "Facility", required: true },
              { name: "batch_code", label: "Batch code", placeholder: "Generated if blank" },
              { name: "input_commodity", label: "Input", required: true, placeholder: "Cassava roots" },
              { name: "input_kg", label: "Input weight (kg)", type: "number", required: true },
              { name: "output_product", label: "Output product", required: true, placeholder: "White garri" },
              { name: "source_farm_id", label: "Source farm", type: "select", options: farmOptions(scope) },
              { name: "moisture_pct", label: "Moisture %", type: "number" },
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        }
      />
      <KpiGrid>
        <MetricCard label="Throughput" value={mass(b.reduce((s, x) => s + Number(x.input_kg), 0))} icon="conveyor_belt" foot={`${b.length} batches`} />
        <MetricCard label="Conversion yield" value={input ? `${num((output / input) * 100, 1)}%` : "—"} icon="percent" foot={`${mass(output)} out of ${mass(input)}`} />
        <MetricCard label="On the floor" value={open.length} icon="factory" foot="Not yet dispatched" />
        <MetricCard label="Grade A batches" value={b.filter((x) => x.quality_grade === "A").length} icon="workspace_premium" foot="Passed quality check" />
      </KpiGrid>
      <Split
        wide={
          <Section title="Batches" icon="view_timeline">
            <DataTable
              rows={b}
              rowKey={(x) => x.id}
              empty="No batches yet."
              columns={[
                { label: "Batch", cell: (x) => <span className="font-medium">{x.batch_code}</span> },
                { label: "Facility", cell: (x) => x.facility_name },
                { label: "In → out", cell: (x) => `${x.input_commodity} → ${x.output_product}` },
                { label: "Input", numeric: true, cell: (x) => mass(x.input_kg) },
                { label: "Output", numeric: true, cell: (x) => (x.output_kg != null ? mass(x.output_kg) : "—") },
                { label: "Started", cell: (x) => ago(x.started_at) },
                { label: "Stage", cell: (x) => <Status value={x.stage} /> },
                {
                  label: "",
                  cell: (x) =>
                    x.stage !== "dispatched" ? (
                      <ActionDialog
                        title={`Advance ${x.batch_code}`}
                        trigger="Advance"
                        tone="ghost"
                        icon="arrow_forward"
                        action={advanceBatch}
                        hidden={{ lang, id: x.id }}
                        fields={[
                          { name: "stage", label: "Next stage", type: "select", required: true, defaultValue: STAGES[Math.min(STAGES.length - 1, STAGES.indexOf(x.stage ?? "received") + 1)], options: STAGES.map((s) => ({ value: s, label: label(s) })) },
                          { name: "output_kg", label: "Output weight (kg)", type: "number" },
                          { name: "quality_grade", label: "Quality grade", placeholder: "A" },
                        ]}
                      />
                    ) : null,
                },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Batches by stage" icon="stacked_bar_chart">
            <Bars items={byStage} />
          </Section>
        }
      />
    </Stack>
  );
}
