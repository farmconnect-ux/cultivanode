import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { commitInvestment, createOffering } from "@/actions/ecosystem";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Meter, Section, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { label, naira, num, relDays, share } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Investor hub" };

export default async function Page({ params }: PageProps<"/[lang]/account/investor">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();
  const uid = account.userId;
  const [{ data: offerings }, { data: commitments }] = await Promise.all([
    supabase.from("investment_offerings").select("*").order("closes_on"),
    supabase.from("investment_commitments").select("*, investment_offerings(title, expected_return_pct, tenor_months, structure, status)").eq("investor_id", uid).order("created_at", { ascending: false }),
  ]);
  const o = offerings ?? [];
  const c = commitments ?? [];
  const invested = c.filter((x) => x.status !== "cancelled").reduce((s, x) => s + Number(x.amount_kobo), 0);
  const expected = c.filter((x) => x.status !== "cancelled").reduce((s, x) => s + Number(x.amount_kobo) * (Number(x.investment_offerings?.expected_return_pct ?? 0) / 100) * (Number(x.investment_offerings?.tenor_months ?? 12) / 12), 0);
  const mine = o.filter((x) => x.sponsor_id === uid);

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="monitoring">{o.filter((x) => x.status === "open").length} open offerings</Chip>}
        title="Investor Hub"
        description="Crop finance, equipment leases and off-take-backed notes from verified agribusinesses — with your commitments and expected returns."
        actions={
          <ActionDialog
            title="Raise capital"
            description="Publish an offering backed by your farm records."
            trigger="New offering"
            tone="secondary"
            action={createOffering}
            hidden={{ lang }}
            fields={[
              { name: "title", label: "Title", required: true, wide: true },
              { name: "commodity", label: "Commodity / sector" },
              { name: "structure", label: "Structure", type: "select", required: true, options: ["crop_finance", "equipment_lease", "processing_equity", "warehouse_receipt", "offtake_backed"].map((v) => ({ value: v, label: label(v) })) },
              { name: "target_raise", label: "Target (₦)", type: "number", required: true },
              { name: "min_ticket", label: "Minimum ticket (₦)", type: "number", required: true },
              { name: "expected_return_pct", label: "Expected return % p.a.", type: "number", required: true },
              { name: "tenor_months", label: "Tenor (months)", type: "number", required: true },
              { name: "risk_rating", label: "Risk", type: "select", defaultValue: "medium", options: ["low", "medium", "high"].map((v) => ({ value: v, label: label(v) })) },
              { name: "closes_on", label: "Closes", type: "date", required: true },
            ]}
          />
        }
      />
      <KpiGrid>
        <MetricCard label="Invested" value={naira(invested)} icon="savings" foot={`${c.length} commitments`} />
        <MetricCard label="Expected return" value={naira(expected)} icon="trending_up" foot="Over each tenor, before fees" />
        <MetricCard label="Returned" value={naira(c.reduce((s, x) => s + Number(x.returned_kobo ?? 0), 0))} icon="payments" foot="Paid back to you" />
        <MetricCard label="My raises" value={mine.length} icon="campaign" foot={naira(mine.reduce((s, x) => s + Number(x.raised_kobo ?? 0), 0)) + " raised"} />
      </KpiGrid>
      <Section title="Offerings" icon="monitoring">
        <DataTable
          rows={o}
          rowKey={(x) => x.id}
          columns={[
            { label: "Offering", cell: (x) => <span className="font-medium">{x.title}</span> },
            { label: "Structure", cell: (x) => label(x.structure) },
            { label: "Return", numeric: true, cell: (x) => `${num(x.expected_return_pct, 1)}%` },
            { label: "Tenor", numeric: true, cell: (x) => `${x.tenor_months} mo` },
            { label: "Risk", cell: (x) => <Status value={x.risk_rating} /> },
            {
              label: "Raised",
              cell: (x) => (
                <div className="w-36">
                  <Meter value={share(Number(x.raised_kobo ?? 0), Number(x.target_raise_kobo))} />
                  <span className="text-body-sm text-on-surface-variant">
                    {naira(x.raised_kobo)} / {naira(x.target_raise_kobo)}
                  </span>
                </div>
              ),
            },
            { label: "Closes", cell: (x) => relDays(x.closes_on) },
            { label: "Status", cell: (x) => <Status value={x.status} /> },
            {
              label: "",
              cell: (x) =>
                x.status === "open" && x.sponsor_id !== uid ? (
                  <ActionDialog
                    title={`Invest — ${x.title}`}
                    description={`Minimum ticket ${naira(x.min_ticket_kobo)} · ${num(x.expected_return_pct, 1)}% expected over ${x.tenor_months} months`}
                    trigger="Invest"
                    tone="ghost"
                    icon="savings"
                    action={commitInvestment}
                    hidden={{ lang, offering_id: x.id }}
                    fields={[{ name: "amount", label: "Amount (₦)", type: "number", required: true, min: Number(x.min_ticket_kobo) / 100 }]}
                  />
                ) : null,
            },
          ]}
        />
      </Section>
      <Section title="My commitments" icon="account_balance_wallet">
        <DataTable
          rows={c}
          rowKey={(x) => x.id}
          empty="No commitments yet."
          columns={[
            { label: "Offering", cell: (x) => x.investment_offerings?.title },
            { label: "Amount", numeric: true, cell: (x) => naira(x.amount_kobo) },
            { label: "Returned", numeric: true, cell: (x) => naira(x.returned_kobo) },
            { label: "Status", cell: (x) => <Status value={x.status} /> },
          ]}
        />
      </Section>
    </Stack>
  );
}
