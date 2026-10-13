import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ds/page-header";
import { Bars, Chip, DataTable, KpiGrid, Section, Split, Stack, StartHere } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { naira, num } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Enterprise agribusiness" };

export default async function Page({ params }: PageProps<"/[lang]/account/enterprise">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const [{ data: tx }, { data: groups }, { data: machines }, { data: workers }, { data: cycles }] = await Promise.all([
    supabase.from("farm_financial_transactions").select("farm_id, type, amount_kobo").in("farm_id", ids),
    supabase.from("farm_livestock_groups").select("farm_id, population").in("farm_id", ids),
    supabase.from("farm_machinery_assets").select("farm_id, purchase_value_kobo").in("farm_id", ids),
    supabase.from("farm_workers").select("farm_id, status").in("farm_id", ids),
    supabase.from("crop_cycles").select("farm_id, status, target_area_ha, estimated_budget_kobo").in("farm_id", ids),
  ]);
  const by = <T extends { farm_id: string }>(rows: T[] | null, f: (r: T) => number) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.farm_id, (m.get(r.farm_id) ?? 0) + f(r));
    return m;
  };
  const inc = by(tx, (r) => (r.type === "income" ? Number(r.amount_kobo) : 0));
  const exp = by(tx, (r) => (r.type === "expense" ? Number(r.amount_kobo) : 0));
  const head = by(groups, (r) => r.population);
  const mach = by(machines, () => 1);
  const staff = by(workers, (r) => (r.status === "active" ? 1 : 0));
  const active = by(cycles, (r) => (["completed", "abandoned"].includes(r.status) ? 0 : Number(r.target_area_ha)));
  const total = (m: Map<string, number>) => [...m.values()].reduce((s, v) => s + v, 0);

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="corporate_fare">{scope.farms.length} business units</Chip>}
        title="Enterprise Agribusiness"
        description="Every farm in your group side by side — planted area, herd, fleet, people and profit — to see which units carry the business."
      />
      {!scope.farms.length && <StartHere title="No farms in your workspace" action={<Link className="font-label-md text-primary-container" href={`/${lang}/account/farms/new`}>Add a farm →</Link>} />}
      <KpiGrid>
        <MetricCard label="Group revenue" value={naira(total(inc))} icon="trending_up" foot={`${naira(total(inc) - total(exp))} net`} />
        <MetricCard label="Planted now" value={num(total(active), 1)} unit="ha" icon="potted_plant" foot={`${num(scope.farms.reduce((s, f) => s + Number(f.area_ha ?? 0), 0), 1)} ha registered`} />
        <MetricCard label="People" value={total(staff)} icon="badge" foot="Active workers across farms" />
        <MetricCard label="Assets" value={total(mach)} unit="machines" icon="agriculture" foot={`${num(total(head))} head of livestock`} />
      </KpiGrid>
      <Split
        wide={
          <Section title="Units" icon="corporate_fare">
            <DataTable
              rows={scope.farms}
              rowKey={(f) => f.id}
              columns={[
                { label: "Farm", cell: (f) => <Link className="font-medium text-primary-container hover:underline" href={`/${lang}/account/farms/${f.id}`}>{f.name}</Link> },
                { label: "Location", cell: (f) => [f.lga, f.state].filter(Boolean).join(", ") },
                { label: "Area", numeric: true, cell: (f) => `${num(f.area_ha, 1)} ha` },
                { label: "Planted", numeric: true, cell: (f) => `${num(active.get(f.id), 1)} ha` },
                { label: "Livestock", numeric: true, cell: (f) => num(head.get(f.id)) },
                { label: "Staff", numeric: true, cell: (f) => staff.get(f.id) ?? 0 },
                { label: "Revenue", numeric: true, cell: (f) => naira(inc.get(f.id)) },
                { label: "Net", numeric: true, cell: (f) => { const n = (inc.get(f.id) ?? 0) - (exp.get(f.id) ?? 0); return <span className={n < 0 ? "text-critical" : "text-[#047857]"}>{naira(n)}</span>; } },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Net by unit" icon="bar_chart">
            <Bars items={scope.farms.map((f) => ({ label: f.name, value: Math.max(0, (inc.get(f.id) ?? 0) - (exp.get(f.id) ?? 0)) }))} format={(n) => naira(n)} />
          </Section>
        }
      />
    </Stack>
  );
}
