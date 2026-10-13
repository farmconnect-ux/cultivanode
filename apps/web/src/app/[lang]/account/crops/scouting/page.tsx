import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { logObservation, resolveObservation } from "@/actions/farm-ops";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton, ActionDialog } from "@/components/live/action-form";
import { Bars, Chip, KpiGrid, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cycleLabel, cycleOptions, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { ago, label, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Field scouting" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));

export default async function Page({ params }: PageProps<"/[lang]/account/crops/scouting">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const cycleIds = scope.cycles.map((c) => c.id);
  const { data } = cycleIds.length
    ? await supabase.from("crop_observations").select("*").in("crop_cycle_id", cycleIds).order("observed_at", { ascending: false }).limit(100)
    : { data: [] };
  const obs = data ?? [];
  const cycles = new Map(scope.cycles.map((c) => [c.id, c]));
  const open = obs.filter((o) => !o.resolved);
  const high = open.filter((o) => o.severity === "high" || o.severity === "critical");
  const last30 = obs.filter((o) => nowMs() - Date.parse(o.observed_at) < 30 * 86_400_000);
  const byCat = Object.entries(
    obs.reduce<Record<string, number>>((m, o) => ((m[o.category] = (m[o.category] ?? 0) + 1), m), {}),
  ).map(([k, v]) => ({ label: label(k), value: v, tone: k === "disease" || k === "pest" ? ("caution" as const) : ("positive" as const) }));

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="pest_control">Iroyin Aaye · field reports</Chip>}
        title="Field Scouting"
        description="Pest, disease, nutrient and water observations from your crop walks, with the action taken."
        actions={
          scope.cycles.length > 0 && (
            <ActionDialog
              title="Log a scouting observation"
              trigger="Log field scout"
              icon="add_a_photo"
              action={logObservation}
              hidden={{ lang }}
              fields={[
                { name: "crop_cycle_id", label: "Crop & plot", type: "select", required: true, options: cycleOptions(scope), wide: true },
                { name: "category", label: "Category", type: "select", required: true, options: opt(["pest", "disease", "nutrient_deficiency", "weed_infestation", "water_stress", "general"]) },
                { name: "severity", label: "Severity", type: "select", required: true, defaultValue: "medium", options: opt(["low", "medium", "high", "critical"]) },
                { name: "title", label: "Title", required: true, wide: true, placeholder: "Fall armyworm in west rows" },
                { name: "description", label: "Symptoms and extent", type: "textarea", required: true },
                { name: "recommended_action", label: "Recommended action", type: "textarea" },
              ]}
            />
          )
        }
      />
      {!scope.cycles.length && (
        <StartHere title="Start a crop cycle to scout it" action={<Link className="font-label-md text-primary-container" href={`/${lang}/account/crops`}>Crop management →</Link>} />
      )}
      <KpiGrid>
        <MetricCard label="Open issues" value={open.length} icon="report" foot="Not yet resolved" />
        <MetricCard label="High severity" value={high.length} icon="warning" iconTone={high.length ? "bg-critical-soft text-critical" : undefined} foot="High or critical, open" />
        <MetricCard label="Reports, 30 days" value={last30.length} icon="history" foot="Scouting entries logged" />
        <MetricCard label="Resolution rate" value={obs.length ? `${Math.round(((obs.length - open.length) / obs.length) * 100)}%` : "—"} icon="task_alt" foot="Of all observations" />
      </KpiGrid>
      <Split
        wide={
          <Section title="Scouting feed" icon="list_alt">
            <ul className="flex flex-col divide-y divide-outline-variant/30">
              {obs.map((o) => {
                const c = cycles.get(o.crop_cycle_id);
                return (
                  <li key={o.id} className="flex flex-col gap-1.5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-label-lg text-label-lg text-on-surface">{o.title}</p>
                      <div className="flex items-center gap-2">
                        <Status value={o.severity} />
                        {o.resolved ? <Status value="resolved" /> : <ActionButton action={resolveObservation} hidden={{ lang, id: o.id }} label="Resolve" />}
                      </div>
                    </div>
                    <p className="text-body-sm text-on-surface-variant">
                      {label(o.category)} · {c ? cycleLabel(c) : "—"} · {ago(o.observed_at)}
                    </p>
                    <p className="text-body-sm text-on-surface">{o.description}</p>
                    {o.recommended_action && <p className="rounded-lg bg-surface-container-low px-3 py-2 text-body-sm text-on-surface">Action: {o.recommended_action}</p>}
                  </li>
                );
              })}
              {!obs.length && <li className="py-8 text-center text-body-sm text-on-surface-variant">No scouting logged yet.</li>}
            </ul>
          </Section>
        }
        side={
          <Section title="Issues by category" icon="donut_large">
            <Bars items={byCat} />
          </Section>
        }
      />
    </Stack>
  );
}
