import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dismissCropAlert } from "@/actions/farm-ops";
import { PageHeader } from "@/components/ds/page-header";
import { ActionButton } from "@/components/live/action-form";
import { Bars, Chip, DataTable, KpiGrid, Meter, Section, Split, Stack, Status, type Tone } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cap, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { ago, label, naira } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Farm health & risk" };

const SEV: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export default async function Page({ params }: PageProps<"/[lang]/account/risk">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const cycleIds = scope.cycles.map((c) => c.id).concat("00000000-0000-0000-0000-000000000000");
  const [{ data: cycles }, { data: alerts }, { data: obs }, { data: groups }, { data: policies }, { data: devAlerts }] = await Promise.all([
    supabase.from("crop_cycles").select("id, crop_id, variety_id, health_score, health_status, status, target_area_ha, estimated_budget_kobo").in("farm_id", ids).not("status", "in", "(completed,abandoned)"),
    supabase.from("crop_alerts").select("*").in("farm_id", ids).eq("is_dismissed", false).order("created_at", { ascending: false }),
    supabase.from("crop_observations").select("id, severity, category, resolved").in("crop_cycle_id", cycleIds).eq("resolved", false),
    supabase.from("farm_livestock_groups").select("group_name, health_status, population").in("farm_id", ids),
    supabase.from("insurance_policies").select("cover_type, sum_insured_kobo, status, end_date, product").eq("holder_id", account.userId),
    supabase.from("device_alerts").select("severity").in("farm_id", ids).eq("status", "open"),
  ]);
  const c = cycles ?? [];
  const exposure = c.reduce((s, x) => s + Number(x.estimated_budget_kobo), 0);
  const covered = (policies ?? []).filter((p) => p.status === "active").reduce((s, p) => s + Number(p.sum_insured_kobo), 0);
  const cropHealth = c.length ? c.reduce((s, x) => s + Number(x.health_score ?? 0), 0) / c.length : 1;
  const obsPenalty = (obs ?? []).reduce((s, o) => s + (SEV[o.severity ?? "low"] ?? 1), 0);
  const livestockSick = (groups ?? []).filter((g) => g.health_status !== "healthy").length;
  const score = Math.max(0, Math.min(100, Math.round(cropHealth * 70 + 30 - obsPenalty * 2 - livestockSick * 4 - (devAlerts ?? []).filter((d) => d.severity === "critical").length * 3)));
  const scoreTone: Tone = score >= 75 ? "positive" : score >= 55 ? "caution" : "critical";
  const byCat = Object.entries((alerts ?? []).reduce<Record<string, number>>((m, a) => ((m[a.category] = (m[a.category] ?? 0) + (SEV[a.severity ?? "low"] ?? 1)), m), {})).map(([k, v]) => ({ label: label(k), value: v, tone: "caution" as const }));

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="shield_with_heart">Composite of crop, livestock, sensor and cover signals</Chip>}
        title="Farm Health & Risk"
        description="One view of what could hurt this season — crop health, pests and disease, weather, livestock and how much of it is insured."
      />
      <KpiGrid>
        <MetricCard label="Farm risk score" value={score} unit="/100" icon="shield_with_heart" iconTone={scoreTone === "critical" ? "bg-critical-soft text-critical" : scoreTone === "caution" ? "bg-caution-soft text-[#b45309]" : undefined} foot={<Meter value={score} tone={scoreTone} />} />
        <MetricCard label="Open alerts" value={(alerts ?? []).length} icon="notification_important" foot={`${(alerts ?? []).filter((a) => a.severity === "high" || a.severity === "critical").length} high or critical`} />
        <MetricCard label="Unresolved scouting" value={(obs ?? []).length} icon="pest_control" href={`/${lang}/account/crops/scouting`} foot="Pest, disease and stress reports" />
        <MetricCard label="Insured share" value={exposure ? `${Math.min(100, Math.round((covered / exposure) * 100))}%` : "—"} icon="health_and_safety" href={`/${lang}/account/insurance`} foot={`${naira(covered)} cover vs ${naira(exposure)} at risk`} />
      </KpiGrid>
      <Split
        wide={
          <>
            <Section title="Active alerts" icon="notification_important">
              <ul className="flex flex-col divide-y divide-outline-variant/30">
                {(alerts ?? []).map((a) => (
                  <li key={a.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Status value={a.severity} />
                        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">{label(a.category)}</span>
                      </div>
                      <p className="mt-1 font-label-lg text-label-lg text-on-surface">{a.title}</p>
                      <p className="text-body-sm text-on-surface-variant">{a.message}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-body-sm text-on-surface-variant">
                      {ago(a.created_at)}
                      {a.action_url && <Link href={`/${lang}${a.action_url}`} className="text-primary-container hover:underline">Open</Link>}
                      <ActionButton action={dismissCropAlert} hidden={{ lang, id: a.id }} label="Dismiss" icon="close" />
                    </div>
                  </li>
                ))}
                {!alerts?.length && <li className="py-6 text-center text-body-sm text-on-surface-variant">No active alerts.</li>}
              </ul>
            </Section>
            <Section title="Crop health" icon="potted_plant">
              <DataTable
                rows={c}
                rowKey={(x) => x.id}
                empty="No active crops."
                columns={[
                  { label: "Crop", cell: (x) => <Link className="font-medium text-primary-container hover:underline" href={`/${lang}/account/crops/${x.id}`}>{cap(x.crop_id)} {x.variety_id}</Link> },
                  { label: "Health score", cell: (x) => <div className="w-32"><Meter value={Number(x.health_score ?? 0) * 100} tone={x.health_status === "healthy" ? "positive" : x.health_status === "watch" ? "caution" : "critical"} /></div> },
                  { label: "Status", cell: (x) => <Status value={x.health_status} /> },
                  { label: "Budget at risk", numeric: true, cell: (x) => naira(x.estimated_budget_kobo) },
                ]}
              />
            </Section>
          </>
        }
        side={
          <>
            <Section title="Alert load by type" icon="bar_chart">
              <Bars items={byCat} />
            </Section>
            <Section title="Insurance cover" icon="health_and_safety">
              <ul className="flex flex-col gap-2">
                {(policies ?? []).map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-body-sm">
                    <span className="text-on-surface">{p.product}</span>
                    <Status value={p.status} />
                  </li>
                ))}
                {!policies?.length && <li className="text-body-sm text-on-surface-variant">No policies. <Link className="text-primary-container" href={`/${lang}/account/insurance`}>Get a quote →</Link></li>}
              </ul>
            </Section>
            <Section title="Livestock" icon="pets">
              <ul className="flex flex-col gap-2">
                {(groups ?? []).map((g) => (
                  <li key={g.group_name} className="flex items-center justify-between text-body-sm">
                    <span>{g.group_name}</span>
                    <Status value={g.health_status} />
                  </li>
                ))}
                {!groups?.length && <li className="text-body-sm text-on-surface-variant">No livestock.</li>}
              </ul>
            </Section>
          </>
        }
      />
    </Stack>
  );
}
