import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { decideLoan } from "@/actions/ecosystem";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Bars, Chip, DataTable, KpiGrid, Meter, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { label, naira, share } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Lender & agri-credit" };

export default async function Page({ params }: PageProps<"/[lang]/account/lender">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();
  const { data } = await supabase.from("loan_applications").select("*, farms(name, state, lga)").eq("lender_id", account.userId).order("submitted_at", { ascending: false });
  const loans = data ?? [];
  const queue = loans.filter((l) => ["submitted", "under_review"].includes(l.status ?? ""));
  const book = loans.filter((l) => ["disbursed", "repaying", "repaid"].includes(l.status ?? ""));
  const disbursed = book.reduce((s, l) => s + Number(l.disbursed_kobo ?? 0), 0);
  const repaid = book.reduce((s, l) => s + Number(l.repaid_kobo ?? 0), 0);
  const decided = loans.filter((l) => ["approved", "declined", "disbursed", "repaying", "repaid"].includes(l.status ?? ""));
  const approval = decided.length ? (decided.filter((l) => l.status !== "declined").length / decided.length) * 100 : 0;
  const byProduct = Object.entries(book.reduce<Record<string, number>>((m, l) => ((m[l.product] = (m[l.product] ?? 0) + Number(l.disbursed_kobo ?? 0)), m), {})).map(([k, v]) => ({ label: k, value: v }));

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="account_balance">{queue.length} applications to review</Chip>}
        title="Lender & Agri-credit"
        description="Applications addressed to you with each farmer's readiness score, plus the book you've disbursed and how it's repaying."
      />
      {!loans.length && <StartHere icon="account_balance" title="No applications addressed to you yet">Farmers choose a lender when they apply; their requests land here.</StartHere>}
      <KpiGrid>
        <MetricCard label="Review queue" value={queue.length} icon="pending_actions" foot={naira(queue.reduce((s, l) => s + Number(l.amount_kobo), 0))} />
        <MetricCard label="Disbursed" value={naira(disbursed)} icon="payments" foot={`${book.length} loans on book`} />
        <MetricCard label="Repayment" value={`${Math.round(share(repaid, disbursed))}%`} icon="savings" foot={<Meter value={share(repaid, disbursed)} />} />
        <MetricCard label="Approval rate" value={`${Math.round(approval)}%`} icon="rule" foot={`${decided.length} decisions`} />
      </KpiGrid>
      <Section title="Applications" icon="assignment">
        <DataTable
          rows={loans}
          rowKey={(l) => l.id}
          columns={[
            { label: "Ref", cell: (l) => <span className="font-medium">{l.reference}</span> },
            { label: "Farm", cell: (l) => (l.farms ? `${l.farms.name} · ${l.farms.lga ?? ""}` : "—") },
            { label: "Product", cell: (l) => l.product },
            { label: "Purpose", cell: (l) => <span className="line-clamp-2 max-w-xs">{l.purpose}</span> },
            { label: "Amount", numeric: true, cell: (l) => naira(l.amount_kobo) },
            { label: "Tenor", numeric: true, cell: (l) => `${l.tenor_months} mo` },
            { label: "Readiness", cell: (l) => (l.readiness_score != null ? <div className="w-24"><Meter value={l.readiness_score} tone={l.readiness_score >= 70 ? "positive" : l.readiness_score >= 50 ? "caution" : "critical"} /><span className="text-body-sm">{l.readiness_score}/100</span></div> : "—") },
            { label: "Submitted", cell: (l) => (l.submitted_at ? formatDay(l.submitted_at.slice(0, 10), lang) : "—") },
            { label: "Status", cell: (l) => <Status value={l.status} /> },
            {
              label: "",
              cell: (l) =>
                l.status !== "repaid" && l.status !== "declined" ? (
                  <ActionDialog
                    title={`Decide ${l.reference}`}
                    trigger="Decide"
                    tone="ghost"
                    icon="gavel"
                    action={decideLoan}
                    hidden={{ lang, id: l.id }}
                    fields={[
                      { name: "status", label: "Decision", type: "select", required: true, options: ["under_review", "approved", "declined", "disbursed", "repaying", "repaid"].map((v) => ({ value: v, label: label(v) })) },
                      { name: "interest_rate_pct", label: "Interest rate %", type: "number", defaultValue: l.interest_rate_pct ?? "" },
                    ]}
                  />
                ) : null,
            },
          ]}
        />
      </Section>
      <Split
        wide={
          <Section title="Loan book" icon="menu_book">
            <DataTable
              rows={book}
              rowKey={(l) => l.id}
              empty="Nothing disbursed yet."
              columns={[
                { label: "Ref", cell: (l) => l.reference },
                { label: "Disbursed", numeric: true, cell: (l) => naira(l.disbursed_kobo) },
                { label: "Repaid", numeric: true, cell: (l) => naira(l.repaid_kobo) },
                { label: "Outstanding", numeric: true, cell: (l) => naira(Number(l.disbursed_kobo) - Number(l.repaid_kobo)) },
                { label: "Status", cell: (l) => <Status value={l.status} /> },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Book by product" icon="pie_chart">
            <Bars items={byProduct} format={(n) => naira(n)} />
          </Section>
        }
      />
    </Stack>
  );
}
