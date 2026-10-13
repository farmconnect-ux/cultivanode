import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addBudgetLine, createBudget, recordTransaction } from "@/actions/farm-ops";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Bars, Chip, DataTable, KpiGrid, Meter, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { cycleOptions, farmOptions, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, naira, share } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Farm books & accounting" };

const opt = (vals: string[]) => vals.map((v) => ({ value: v, label: label(v) }));
const TX = ["harvest_sale", "livestock_sale", "machinery_service", "seeds", "fertilisers", "chemicals", "labour_wages", "feed", "fuel", "repairs", "other"];

export default async function Page({ params }: PageProps<"/[lang]/account/finance">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const [{ data: txs }, { data: budgets }, { data: earnings }] = await Promise.all([
    supabase.from("farm_financial_transactions").select("*").in("farm_id", ids).order("transaction_date", { ascending: false }).limit(200),
    supabase.from("farm_budgets").select("*, farm_budget_lines(*)").in("farm_id", ids).order("created_at", { ascending: false }),
    supabase.from("bookings").select("total_kobo, status, job_date").eq("provider_id", account.userId).eq("status", "completed"),
  ]);
  const t = txs ?? [];
  const ytd = t.filter((x) => (x.transaction_date ?? "") >= yearStart);
  const income = ytd.filter((x) => x.type === "income").reduce((s, x) => s + Number(x.amount_kobo), 0);
  const expense = ytd.filter((x) => x.type === "expense").reduce((s, x) => s + Number(x.amount_kobo), 0);
  const margin = income ? ((income - expense) / income) * 100 : 0;
  const serviceIncome = (earnings ?? []).reduce((s, b) => s + Number(b.total_kobo), 0);
  const expByCat = Object.entries(ytd.filter((x) => x.type === "expense").reduce<Record<string, number>>((m, x) => ((m[x.category] = (m[x.category] ?? 0) + Number(x.amount_kobo)), m), {}))
    .map(([k, v]) => ({ label: label(k), value: v, tone: "caution" as const }))
    .sort((a, b) => b.value - a.value);
  const farmName = new Map(scope.farms.map((f) => [f.id, f.name]));
  const b = budgets ?? [];
  const hidden = { lang };

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="calendar_month">Year to date {new Date().getFullYear()}</Chip>
            <Chip icon="receipt_long">{t.length} entries</Chip>
          </>
        }
        title="Farm Books & Accounting (₦)"
        description="Income, expenses and budgets by enterprise — the same records lenders see in your verified farm report."
        actions={
          scope.farms.length > 0 && (
            <>
              <Link href={`/${lang}/account/variance`} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3.5 py-2 font-label-md text-label-md text-on-surface shadow-sm ring-1 ring-outline-variant/60 hover:bg-surface-container-low">
                <Icon name="compare_arrows" className="text-base" /> Plan vs actual
              </Link>
              <ActionDialog
                title="New budget"
                trigger="Budget"
                icon="request_quote"
                tone="secondary"
                action={createBudget}
                hidden={hidden}
                fields={[
                  { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
                  { name: "title", label: "Title", required: true, placeholder: "Maize — dry season 2027" },
                  { name: "enterprise_type", label: "Enterprise", type: "select", required: true, options: opt(["crop", "livestock", "whole_farm", "machinery", "processing"]) },
                  { name: "crop_cycle_id", label: "Crop cycle", type: "select", options: cycleOptions(scope) },
                  { name: "fiscal_year", label: "Year", type: "number", defaultValue: new Date().getFullYear() },
                  { name: "season", label: "Season" },
                  { name: "total_budget", label: "Total budget (₦)", type: "number" },
                  { name: "planned_revenue", label: "Planned revenue (₦)", type: "number" },
                ]}
              />
              <ActionDialog
                title="Record income or expense"
                trigger="Record entry"
                action={recordTransaction}
                hidden={hidden}
                fields={[
                  { name: "farm_id", label: "Farm", type: "select", required: true, options: farmOptions(scope) },
                  { name: "type", label: "Type", type: "select", required: true, options: opt(["income", "expense"]) },
                  { name: "category", label: "Category", type: "select", required: true, options: opt(TX) },
                  { name: "amount", label: "Amount (₦)", type: "number", required: true },
                  { name: "transaction_date", label: "Date", type: "date" },
                  { name: "payment_method", label: "Paid by", type: "select", defaultValue: "cash", options: opt(["cash", "bank_transfer", "escrow", "mobile_money"]) },
                  { name: "description", label: "Description", required: true, wide: true },
                  { name: "counterparty", label: "Counterparty" },
                  { name: "receipt_number", label: "Receipt no." },
                  { name: "crop_cycle_id", label: "Crop cycle", type: "select", options: cycleOptions(scope, false) },
                  { name: "budget_id", label: "Budget", type: "select", options: b.map((x) => ({ value: x.id, label: x.title })) },
                ]}
              />
            </>
          )
        }
      />
      {!scope.farms.length && <StartHere title="Register a farm to open your books" />}
      <KpiGrid>
        <MetricCard label="Revenue YTD" value={naira(income)} icon="trending_up" foot={`${ytd.filter((x) => x.type === "income").length} income entries`} />
        <MetricCard label="Expenses YTD" value={naira(expense)} icon="trending_down" foot={`${ytd.filter((x) => x.type === "expense").length} expense entries`} />
        <MetricCard label="Net profit YTD" value={naira(income - expense)} icon="savings" iconTone={income - expense < 0 ? "bg-critical-soft text-critical" : undefined} foot={`${Math.round(margin)}% margin`} />
        <MetricCard label={serviceIncome ? "Service earnings" : "Active budgets"} value={serviceIncome ? naira(serviceIncome) : b.filter((x) => x.status === "active" || x.status === "approved").length} icon={serviceIncome ? "agriculture" : "request_quote"} foot={serviceIncome ? "Completed bookings you provided" : `${b.length} budgets in total`} />
      </KpiGrid>
      <Split
        wide={
          <Section title="Cash book" icon="receipt_long">
            <DataTable
              rows={t.slice(0, 40)}
              rowKey={(x) => x.id}
              empty="No entries yet."
              columns={[
                { label: "Date", cell: (x) => (x.transaction_date ? formatDay(x.transaction_date, lang) : "—") },
                { label: "Description", cell: (x) => <span className="font-medium">{x.description}</span> },
                { label: "Category", cell: (x) => label(x.category) },
                { label: "Farm", cell: (x) => farmName.get(x.farm_id) },
                { label: "Counterparty", cell: (x) => x.counterparty ?? "—" },
                {
                  label: "Amount",
                  numeric: true,
                  cell: (x) => <span className={x.type === "income" ? "text-[#047857]" : "text-on-surface"}>{x.type === "income" ? "+" : "−"}{naira(x.amount_kobo)}</span>,
                },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Where the money went" icon="pie_chart" description="Expenses this year by category">
            <Bars items={expByCat} format={(n) => naira(n)} />
          </Section>
        }
      />
      <Section title="Budgets" icon="request_quote" description="Budgeted against actual, line by line.">
        <div className="flex flex-col gap-space-lg">
          {b.map((bud) => {
            const lines = bud.farm_budget_lines ?? [];
            const planned = lines.reduce((s, l) => s + Number(l.budgeted_amount_kobo), 0) || Number(bud.total_budget_kobo);
            const actual = lines.reduce((s, l) => s + Number(l.actual_amount_kobo), 0);
            return (
              <div key={bud.id} className="rounded-xl border border-outline-variant/40 p-space-md">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-headline-sm text-headline-sm text-on-surface">{bud.title}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      {label(bud.enterprise_type)} · {farmName.get(bud.farm_id)} · planned revenue {naira(bud.planned_revenue_kobo)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Status value={bud.status} />
                    <ActionDialog
                      title="Add budget line"
                      trigger="Line"
                      tone="ghost"
                      action={addBudgetLine}
                      hidden={{ lang, budget_id: bud.id }}
                      fields={[
                        { name: "category", label: "Category", type: "select", required: true, options: opt(["land_prep", "seeds", "fertilisers", "chemicals", "labour_wages", "machinery_hire", "feed", "veterinary", "utilities", "rent", "insurance", "transport", "other"]) },
                        { name: "line_item", label: "Line item", required: true },
                        { name: "cost_type", label: "Cost type", type: "select", defaultValue: "variable", options: opt(["fixed", "variable"]) },
                        { name: "budgeted_amount", label: "Budgeted (₦)", type: "number", required: true },
                        { name: "actual_amount", label: "Actual so far (₦)", type: "number" },
                      ]}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-body-sm">
                    <span>
                      {naira(actual)} spent of {naira(planned)}
                    </span>
                    <span className="text-on-surface-variant">{Math.round(share(actual, planned))}%</span>
                  </div>
                  <Meter value={share(actual, planned)} tone={actual > planned ? "critical" : "positive"} />
                </div>
                <DataTable
                  rows={lines}
                  rowKey={(l) => l.id}
                  empty="No lines yet."
                  columns={[
                    { label: "Line", cell: (l) => l.line_item },
                    { label: "Category", cell: (l) => label(l.category) },
                    { label: "Budgeted", numeric: true, cell: (l) => naira(l.budgeted_amount_kobo) },
                    { label: "Actual", numeric: true, cell: (l) => naira(l.actual_amount_kobo) },
                    { label: "Variance", numeric: true, cell: (l) => <span className={Number(l.actual_amount_kobo) > Number(l.budgeted_amount_kobo) ? "text-critical" : ""}>{naira(Number(l.budgeted_amount_kobo) - Number(l.actual_amount_kobo))}</span> },
                  ]}
                />
              </div>
            );
          })}
          {!b.length && <p className="py-4 text-center text-body-sm text-on-surface-variant">No budgets yet.</p>}
        </div>
      </Section>
    </Stack>
  );
}
