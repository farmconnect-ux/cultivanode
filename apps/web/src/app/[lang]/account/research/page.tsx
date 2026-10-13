import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createResearchTrial, updateTrial } from "@/actions/ecosystem";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, KpiGrid, Section, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { farmOptions, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, relDays } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Research & extension" };

export default async function Page({ params }: PageProps<"/[lang]/account/research">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const [{ data }, { data: standards }] = await Promise.all([
    supabase.from("research_trials").select("*").eq("owner_id", account.userId).order("start_date", { ascending: false }),
    supabase.from("farm_agronomic_standards").select("standard_code, crop_or_livestock_id, source_authority, description").eq("is_active", true),
  ]);
  const t = data ?? [];
  const farmName = new Map(scope.farms.map((f) => [f.id, f.name]));
  const plotName = new Map(scope.plots.map((p) => [p.id, p.name]));

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="biotech">{t.length} trials</Chip>}
        title="Research & Extension"
        description="On-farm trials with their design and treatments, results as they come in, and the agronomic standards extension advice is built on."
        actions={
          <ActionDialog
            title="Register a trial"
            trigger="New trial"
            icon="biotech"
            action={createResearchTrial}
            hidden={{ lang }}
            fields={[
              { name: "title", label: "Title", required: true, wide: true },
              { name: "institution", label: "Institution", required: true },
              { name: "crop", label: "Crop", required: true },
              { name: "design", label: "Design", required: true, placeholder: "RCBD, split plot…" },
              { name: "treatments", label: "Treatments (comma separated)", placeholder: "N0, N60, N120" },
              { name: "replicates", label: "Replicates", type: "number" },
              { name: "farm_id", label: "Host farm", type: "select", options: farmOptions(scope) },
              { name: "start_date", label: "Start", type: "date", required: true },
              { name: "end_date", label: "End", type: "date" },
            ]}
          />
        }
      />
      {!t.length && <StartHere icon="biotech" title="No trials yet">Register an on-farm trial to track treatments and publish findings.</StartHere>}
      <KpiGrid>
        <MetricCard label="Running" value={t.filter((x) => x.status === "running").length} icon="science" foot="Trials in the field" />
        <MetricCard label="Analysing" value={t.filter((x) => x.status === "harvested" || x.status === "analysing").length} icon="analytics" foot="Harvested, results pending" />
        <MetricCard label="Published" value={t.filter((x) => x.status === "published").length} icon="menu_book" foot="With findings" />
        <MetricCard label="Standards in use" value={(standards ?? []).length} icon="verified" foot="GAP and livestock standards" />
      </KpiGrid>
      <Section title="Trials" icon="biotech">
        <div className="grid grid-cols-1 gap-space-md lg:grid-cols-2">
          {t.map((x) => (
            <div key={x.id} className="flex flex-col gap-2 rounded-xl border border-outline-variant/40 p-space-md">
              <div className="flex items-start justify-between gap-2">
                <p className="font-label-lg text-label-lg text-on-surface">{x.title}</p>
                <Status value={x.status} />
              </div>
              <p className="text-body-sm text-on-surface-variant">
                {x.institution} · {x.crop} · {x.design}
                {x.replicates ? ` · ${x.replicates} reps` : ""}
              </p>
              <p className="text-body-sm text-on-surface-variant">
                {x.farm_id ? farmName.get(x.farm_id) : "—"}
                {x.plot_id ? ` / ${plotName.get(x.plot_id)}` : ""} · {formatDay(x.start_date, lang)} → {x.end_date ? `${formatDay(x.end_date, lang)} (${relDays(x.end_date)})` : "open"}
              </p>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(x.treatments) ? (x.treatments as { code?: string }[]) : []).map((tr, i) => (
                  <Chip key={i}>{tr.code ?? "T"}</Chip>
                ))}
              </div>
              {x.findings && <p className="rounded-lg bg-surface-container-low p-3 text-body-sm text-on-surface">{x.findings}</p>}
              <div className="mt-auto flex justify-end">
                <ActionDialog
                  title={`Update ${x.title}`}
                  trigger="Update"
                  tone="ghost"
                  icon="edit_note"
                  action={updateTrial}
                  hidden={{ lang, id: x.id }}
                  fields={[
                    { name: "status", label: "Status", type: "select", required: true, defaultValue: x.status ?? "planned", options: ["planned", "running", "harvested", "analysing", "published"].map((v) => ({ value: v, label: label(v) })) },
                    { name: "findings", label: "Findings", type: "textarea", defaultValue: x.findings ?? "" },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Agronomic standards" icon="menu_book">
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {(standards ?? []).map((s) => (
            <li key={s.standard_code} className="rounded-lg bg-surface-container-low p-3 text-body-sm">
              <p className="font-medium text-on-surface">
                {s.standard_code} · {label(s.crop_or_livestock_id)}
              </p>
              <p className="text-on-surface-variant">{s.description ?? s.source_authority}</p>
            </li>
          ))}
        </ul>
      </Section>
    </Stack>
  );
}
