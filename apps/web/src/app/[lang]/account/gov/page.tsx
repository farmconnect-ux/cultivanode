import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ds/page-header";
import { Bars, Chip, DataTable, KpiGrid, Section, Split, Stack } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { naira, num, nowMs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Government intelligence" };

export default async function Page({ params }: PageProps<"/[lang]/account/gov">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);
  const supabase = await createClient();
  const [{ data: stats }, { data: prices }] = await Promise.all([
    supabase.rpc("regional_agri_stats"),
    supabase.from("market_prices").select("commodity, state, unit, price_kobo, observed_on").gte("observed_on", new Date(nowMs() - 21 * 86_400_000).toISOString().slice(0, 10)),
  ]);
  const s = (stats ?? []).sort((a, b) => Number(b.hectares) - Number(a.hectares));
  const tot = (k: "farmers" | "farms" | "hectares" | "active_cycles" | "bookings_90d") => s.reduce((sum, r) => sum + Number(r[k] ?? 0), 0);
  const avg = new Map<string, { sum: number; n: number; unit: string }>();
  for (const p of prices ?? []) {
    const k = p.commodity;
    const cur = avg.get(k) ?? { sum: 0, n: 0, unit: p.unit };
    avg.set(k, { sum: cur.sum + Number(p.price_kobo), n: cur.n + 1, unit: p.unit });
  }

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="account_balance">Aggregated, anonymised platform data</Chip>}
        title="Government Intelligence"
        description="Registered farmers, cultivated area, active crop cycles and mechanisation demand by state — aggregated so no individual farm is identifiable."
      />
      <KpiGrid>
        <MetricCard label="Registered farmers" value={num(tot("farmers"))} icon="groups" foot={`${s.length} states`} />
        <MetricCard label="Farms" value={num(tot("farms"))} icon="landscape" foot={`${num(tot("hectares"), 1)} ha registered`} />
        <MetricCard label="Active crop cycles" value={num(tot("active_cycles"))} icon="potted_plant" foot="Currently in the ground" />
        <MetricCard label="Mechanisation jobs, 90 days" value={num(tot("bookings_90d"))} icon="agriculture" foot="Tractor, sprayer and service bookings" />
      </KpiGrid>
      <Split
        wide={
          <Section title="By state" icon="public">
            <DataTable
              rows={s}
              rowKey={(r) => r.state}
              empty="No data yet."
              columns={[
                { label: "State", cell: (r) => <span className="font-medium">{r.state}</span> },
                { label: "Farmers", numeric: true, cell: (r) => num(r.farmers) },
                { label: "Farms", numeric: true, cell: (r) => num(r.farms) },
                { label: "Hectares", numeric: true, cell: (r) => num(r.hectares, 1) },
                { label: "Active cycles", numeric: true, cell: (r) => num(r.active_cycles) },
                { label: "Bookings (90 d)", numeric: true, cell: (r) => num(r.bookings_90d) },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Registered area by state" icon="bar_chart">
            <Bars items={s.map((r) => ({ label: r.state, value: Number(r.hectares) }))} format={(n) => `${num(n, 1)} ha`} />
          </Section>
        }
      />
      <Section title="Food price watch — 3-week average" icon="query_stats">
        <DataTable
          rows={[...avg.entries()]}
          rowKey={([k]) => k}
          columns={[
            { label: "Commodity", cell: ([k]) => <span className="font-medium">{k}</span> },
            { label: "Average price", numeric: true, cell: ([, v]) => `${naira(v.sum / v.n)}/${v.unit}` },
            { label: "Observations", numeric: true, cell: ([, v]) => v.n },
          ]}
        />
      </Section>
    </Stack>
  );
}
