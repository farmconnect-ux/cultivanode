import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { applyForLoan } from "@/actions/ecosystem";
import { Icon } from "@/components/ds/icon";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Meter, Section, Split, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { farmOptions, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { naira } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Verified records & credit" };

export default async function Page({ params }: PageProps<"/[lang]/account/reports">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const ids = scope.farmIds.length ? scope.farmIds : ["00000000-0000-0000-0000-000000000000"];
  const [{ data: tx }, { data: loans }, { data: harvests }, { data: bookings }, { data: soil }] = await Promise.all([
    supabase.from("farm_financial_transactions").select("type, amount_kobo, transaction_date, payment_method").in("farm_id", ids),
    supabase.from("loan_applications").select("*").eq("applicant_id", account.userId).order("created_at", { ascending: false }),
    supabase.from("crop_harvests").select("quantity_kg").in("crop_cycle_id", scope.cycles.map((c) => c.id).concat("00000000-0000-0000-0000-000000000000")),
    supabase.from("bookings").select("id, status").or(`farmer_id.eq.${account.userId},provider_id.eq.${account.userId}`).eq("status", "completed"),
    supabase.from("soil_records").select("id").in("plot_id", scope.plots.map((p) => p.id).concat("00000000-0000-0000-0000-000000000000")),
  ]);
  const t = tx ?? [];
  const months = new Set(t.map((x) => (x.transaction_date ?? "").slice(0, 7)).filter(Boolean)).size;
  const income = t.filter((x) => x.type === "income").reduce((s, x) => s + Number(x.amount_kobo), 0);
  const expense = t.filter((x) => x.type === "expense").reduce((s, x) => s + Number(x.amount_kobo), 0);
  const traceable = t.filter((x) => x.payment_method !== "cash").length;
  const tier = account.profile.verification_tier;
  const checks: [string, boolean, string][] = [
    ["Identity verified (tier 2+)", tier >= 2, `/account/verification`],
    ["Farm registered with GPS", scope.farms.length > 0, `/account/farms`],
    ["Six months of farm books", months >= 6, `/account/finance`],
    ["Most money flows traceable (not cash)", t.length > 0 && traceable / t.length >= 0.5, `/account/finance`],
    ["Harvest records", (harvests ?? []).length > 0, `/account/harvest`],
    ["Soil test on file", (soil ?? []).length > 0, `/account/farms/field`],
    ["Completed jobs on CultivaNode", (bookings ?? []).length > 0, `/account/bookings`],
  ];
  const readiness = Math.round((checks.filter((c) => c[1]).length / checks.length) * 100);
  const outstanding = (loans ?? []).filter((l) => ["disbursed", "repaying"].includes(l.status ?? "")).reduce((s, l) => s + Number(l.disbursed_kobo ?? 0) - Number(l.repaid_kobo ?? 0), 0);

  return (
    <Stack>
      <PageHeader
        eyebrow={
          <>
            <Chip icon="verified_user">Verification tier {tier}</Chip>
            <Chip icon="calendar_month">{months} months of records</Chip>
          </>
        }
        title="Verified Records & Credit"
        description="Your farm's track record, built from the books, harvests and jobs on CultivaNode — and the loans it supports."
        actions={
          <ActionDialog
            title="Apply for finance"
            description="Lenders see your verified records with your application."
            trigger="Apply for a loan"
            icon="account_balance"
            action={applyForLoan}
            hidden={{ lang }}
            fields={[
              { name: "product", label: "Product", type: "select", required: true, options: ["Input finance (season)", "Equipment lease", "Working capital", "Warehouse receipt"].map((v) => ({ value: v, label: v })) },
              { name: "lender_name", label: "Preferred lender", placeholder: "Any" },
              { name: "farm_id", label: "Farm", type: "select", options: farmOptions(scope) },
              { name: "amount", label: "Amount (₦)", type: "number", required: true },
              { name: "tenor_months", label: "Tenor (months)", type: "number", required: true, defaultValue: 6 },
              { name: "purpose", label: "Purpose", type: "textarea", required: true },
            ]}
          />
        }
      />
      <KpiGrid>
        <MetricCard label="Credit readiness" value={readiness} unit="/100" icon="credit_score" foot={<Meter value={readiness} tone={readiness >= 70 ? "positive" : readiness >= 40 ? "caution" : "critical"} />} />
        <MetricCard label="Recorded revenue" value={naira(income)} icon="trending_up" foot={`${t.filter((x) => x.type === "income").length} income entries`} />
        <MetricCard label="Net margin" value={income ? `${Math.round(((income - expense) / income) * 100)}%` : "—"} icon="savings" foot={`${naira(income - expense)} net`} />
        <MetricCard label="Loan balance" value={naira(outstanding)} icon="account_balance" foot={`${(loans ?? []).length} applications`} />
      </KpiGrid>
      <Split
        wide={
          <Section title="Loan applications" icon="account_balance">
            <DataTable
              rows={loans ?? []}
              rowKey={(l) => l.id}
              empty="No applications yet."
              columns={[
                { label: "Ref", cell: (l) => <span className="font-medium">{l.reference}</span> },
                { label: "Lender", cell: (l) => l.lender_name },
                { label: "Product", cell: (l) => l.product },
                { label: "Amount", numeric: true, cell: (l) => naira(l.amount_kobo) },
                { label: "Tenor", numeric: true, cell: (l) => `${l.tenor_months} mo` },
                { label: "Rate", numeric: true, cell: (l) => (l.interest_rate_pct != null ? `${l.interest_rate_pct}%` : "—") },
                { label: "Repaid", numeric: true, cell: (l) => (Number(l.disbursed_kobo) ? `${Math.round((Number(l.repaid_kobo) / Number(l.disbursed_kobo)) * 100)}%` : "—") },
                { label: "Submitted", cell: (l) => (l.submitted_at ? formatDay(l.submitted_at.slice(0, 10), lang) : "—") },
                { label: "Status", cell: (l) => <Status value={l.status} /> },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Readiness checklist" icon="checklist">
            <ul className="flex flex-col gap-2">
              {checks.map(([text, done, href]) => (
                <li key={text}>
                  <Link href={`/${lang}${href}`} className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-body-sm hover:bg-surface-container-low">
                    <Icon name={done ? "check_circle" : "radio_button_unchecked"} className={done ? "text-secondary" : "text-on-surface-variant"} filled={done} />
                    <span className={done ? "text-on-surface" : "text-on-surface-variant"}>{text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        }
      />
    </Stack>
  );
}
