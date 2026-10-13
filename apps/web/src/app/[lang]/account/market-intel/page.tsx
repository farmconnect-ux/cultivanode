import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ds/page-header";
import { Chip, DataTable, KpiGrid, LineChart, Pill, Section, Split, Stack } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { naira, num } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Food security & market intel" };

export default async function Page({ params, searchParams }: PageProps<"/[lang]/account/market-intel">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireAccount(lang);
  const supabase = await createClient();
  const sp = await searchParams;
  const { data } = await supabase.from("market_prices").select("commodity, market, state, unit, price_kobo, observed_on, source, is_demo").order("observed_on");
  const rows = data ?? [];
  const commodities = [...new Set(rows.map((r) => r.commodity))];
  const pick = typeof sp.c === "string" && commodities.includes(sp.c) ? sp.c : commodities[0];
  const sel = rows.filter((r) => r.commodity === pick);
  const markets = [...new Set(sel.map((r) => r.market))];
  const weeks = [...new Set(sel.map((r) => r.observed_on))].sort();
  const avgByWeek = weeks.map((w) => {
    const xs = sel.filter((r) => r.observed_on === w);
    return { x: w.slice(5), y: xs.reduce((s, r) => s + Number(r.price_kobo), 0) / xs.length / 100 };
  });
  const latestW = weeks.at(-1);
  const prevW = weeks.at(-2);
  const change = (m: string) => {
    const a = sel.find((r) => r.market === m && r.observed_on === latestW);
    const b = sel.find((r) => r.market === m && r.observed_on === prevW);
    return a && b ? ((Number(a.price_kobo) - Number(b.price_kobo)) / Number(b.price_kobo)) * 100 : 0;
  };
  const latest = markets.map((m) => ({ m, row: sel.find((r) => r.market === m && r.observed_on === latestW), d: change(m) })).filter((x) => x.row);
  const unit = sel[0]?.unit ?? "";
  const cheapest = latest.slice().sort((a, b) => Number(a.row!.price_kobo) - Number(b.row!.price_kobo))[0];
  const dearest = latest.slice().sort((a, b) => Number(b.row!.price_kobo) - Number(a.row!.price_kobo))[0];
  const first = avgByWeek[0]?.y ?? 0;
  const last = avgByWeek.at(-1)?.y ?? 0;

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            {commodities.map((c) => (
              <a key={c} href={`?c=${encodeURIComponent(c)}`} className={`rounded-full px-2.5 py-1 font-label-sm text-label-sm ${c === pick ? "bg-primary-container text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
                {c}
              </a>
            ))}
            {rows.some((r) => r.is_demo) && <Chip icon="info">Includes sample price series</Chip>}
          </>
        }
        title="Food Security & Market Intel"
        description="Weekly wholesale prices by market from field agents — where to sell, where to buy, and which way prices are moving."
      />
      <KpiGrid>
        <MetricCard label={`Average · ${pick ?? ""}`} value={naira(last * 100)} unit={`/${unit}`} icon="query_stats" foot={`${markets.length} markets`} />
        <MetricCard label={`${weeks.length}-week trend`} value={`${last >= first ? "+" : ""}${num(first ? ((last - first) / first) * 100 : 0, 1)}%`} icon={last >= first ? "trending_up" : "trending_down"} foot="Average across markets" />
        <MetricCard label="Best place to buy" value={cheapest?.m ?? "—"} icon="shopping_cart" foot={cheapest ? `${naira(cheapest.row!.price_kobo)}/${unit}` : ""} />
        <MetricCard label="Best place to sell" value={dearest?.m ?? "—"} icon="storefront" foot={dearest ? `${naira(dearest.row!.price_kobo)}/${unit}` : ""} />
      </KpiGrid>
      <Split
        wide={
          <Section title={`${pick ?? ""} — average price, ₦/${unit}`} icon="show_chart">
            <LineChart points={avgByWeek} />
          </Section>
        }
        side={
          <Section title="This week by market" icon="storefront">
            <ul className="flex flex-col divide-y divide-outline-variant/30">
              {latest.map((x) => (
                <li key={x.m} className="flex items-center justify-between gap-2 py-2 text-body-sm">
                  <span className="text-on-surface">{x.m}</span>
                  <span className="flex items-center gap-2 tabular-nums">
                    {naira(x.row!.price_kobo)}
                    <Pill tone={x.d > 0.5 ? "caution" : x.d < -0.5 ? "positive" : "neutral"}>{`${x.d > 0 ? "+" : ""}${num(x.d, 1)}%`}</Pill>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        }
      />
      <Section title="Price history" icon="table_view">
        <DataTable
          rows={markets}
          rowKey={(m) => m}
          columns={[
            { label: "Market", cell: (m) => <span className="font-medium">{m}</span> },
            ...weeks.slice(-6).map((w) => ({ label: w.slice(5), numeric: true, cell: (m: string) => { const r = sel.find((x) => x.market === m && x.observed_on === w); return r ? naira(r.price_kobo) : "—"; } })),
          ]}
        />
      </Section>
    </Stack>
  );
}
