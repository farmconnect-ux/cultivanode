import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { decideClaim, requestPolicyQuote, submitClaim } from "@/actions/ecosystem";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Chip, DataTable, KpiGrid, Section, Stack, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { farmOptions, loadFarmScope } from "@/lib/account/scope";
import { requireAccount } from "@/lib/account/session";
import { label, naira, relDays } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/text";

export const metadata: Metadata = { title: "Insurance & underwriting" };

export default async function Page({ params }: PageProps<"/[lang]/account/insurance">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const uid = account.userId;
  const [{ data: policies }, { data: claims }, { data: underwriting }] = await Promise.all([
    supabase.from("insurance_policies").select("*").eq("holder_id", uid).order("end_date", { ascending: false }),
    supabase.from("insurance_claims").select("*").eq("holder_id", uid).order("created_at", { ascending: false }),
    supabase.from("insurance_claims").select("*, insurance_policies!inner(policy_number, product, insurer_id)").eq("insurance_policies.insurer_id", uid).order("created_at", { ascending: false }),
  ]);
  const p = policies ?? [];
  const active = p.filter((x) => x.status === "active");
  const policyName = new Map(p.map((x) => [x.id, `${x.policy_number} · ${x.product}`]));
  const paid = (claims ?? []).reduce((s, c) => s + Number(c.amount_paid_kobo ?? 0), 0);

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="health_and_safety">{active.length} active policies</Chip>}
        title="Insurance & Underwriting"
        description="Weather-index, multi-peril, livestock and equipment cover — policies, premiums and claims in one place."
        actions={
          <>
            {active.length > 0 && (
              <ActionDialog
                title="Submit a claim"
                trigger="Claim"
                icon="report"
                tone="secondary"
                action={submitClaim}
                hidden={{ lang }}
                fields={[
                  { name: "policy_id", label: "Policy", type: "select", required: true, options: active.map((x) => ({ value: x.id, label: `${x.policy_number} · ${x.product}` })), wide: true },
                  { name: "incident_date", label: "Incident date", type: "date", required: true },
                  { name: "cause", label: "Cause", required: true },
                  { name: "amount_claimed", label: "Amount (₦)", type: "number", required: true },
                  { name: "description", label: "What happened", type: "textarea" },
                ]}
              />
            )}
            <ActionDialog
              title="Get a quote"
              description="An indicative premium is calculated now; the insurer confirms it."
              trigger="Get a quote"
              icon="request_quote"
              action={requestPolicyQuote}
              hidden={{ lang }}
              fields={[
                { name: "cover_type", label: "Cover", type: "select", required: true, options: ["weather_index", "multi_peril", "livestock", "equipment", "area_yield"].map((v) => ({ value: v, label: label(v) })) },
                { name: "insurer_name", label: "Insurer", required: true, placeholder: "Leadway, NAIC, AXA Mansard…" },
                { name: "farm_id", label: "Farm", type: "select", options: farmOptions(scope) },
                { name: "crop_or_asset", label: "Crop or asset" },
                { name: "sum_insured", label: "Sum insured (₦)", type: "number", required: true },
                { name: "start_date", label: "Start", type: "date", required: true },
                { name: "end_date", label: "End", type: "date", required: true },
              ]}
            />
          </>
        }
      />
      <KpiGrid>
        <MetricCard label="Sum insured" value={naira(active.reduce((s, x) => s + Number(x.sum_insured_kobo), 0))} icon="shield" foot="Active policies" />
        <MetricCard label="Premiums" value={naira(active.reduce((s, x) => s + Number(x.premium_kobo), 0))} icon="payments" foot="On active policies" />
        <MetricCard label="Open claims" value={(claims ?? []).filter((c) => ["submitted", "assessing", "approved"].includes(c.status ?? "")).length} icon="report" foot={`${(claims ?? []).length} claims in total`} />
        <MetricCard label="Claims paid" value={naira(paid)} icon="savings" foot="Received to date" />
      </KpiGrid>
      <Section title="Policies" icon="description">
        <DataTable
          rows={p}
          rowKey={(x) => x.id}
          empty="No policies yet — request a quote."
          columns={[
            { label: "Policy", cell: (x) => <span className="font-medium">{x.policy_number}</span> },
            { label: "Insurer", cell: (x) => x.insurer_name },
            { label: "Product", cell: (x) => x.product },
            { label: "Cover", cell: (x) => label(x.cover_type) },
            { label: "Insured", numeric: true, cell: (x) => naira(x.sum_insured_kobo) },
            { label: "Premium", numeric: true, cell: (x) => naira(x.premium_kobo) },
            { label: "Ends", cell: (x) => `${formatDay(x.end_date, lang)} (${relDays(x.end_date)})` },
            { label: "Status", cell: (x) => <Status value={x.status} /> },
          ]}
        />
      </Section>
      <Section title="My claims" icon="report">
        <DataTable
          rows={claims ?? []}
          rowKey={(c) => c.id}
          empty="No claims."
          columns={[
            { label: "Claim", cell: (c) => <span className="font-medium">{c.claim_number}</span> },
            { label: "Policy", cell: (c) => policyName.get(c.policy_id) },
            { label: "Incident", cell: (c) => formatDay(c.incident_date, lang) },
            { label: "Cause", cell: (c) => c.cause },
            { label: "Claimed", numeric: true, cell: (c) => naira(c.amount_claimed_kobo) },
            { label: "Paid", numeric: true, cell: (c) => naira(c.amount_paid_kobo) },
            { label: "Status", cell: (c) => <Status value={c.status} /> },
          ]}
        />
      </Section>
      {(underwriting ?? []).length > 0 && (
        <Section title="Claims to assess (as insurer)" icon="gavel">
          <DataTable
            rows={underwriting ?? []}
            rowKey={(c) => c.id}
            columns={[
              { label: "Claim", cell: (c) => c.claim_number },
              { label: "Policy", cell: (c) => c.insurance_policies?.policy_number },
              { label: "Cause", cell: (c) => c.cause },
              { label: "Claimed", numeric: true, cell: (c) => naira(c.amount_claimed_kobo) },
              { label: "Status", cell: (c) => <Status value={c.status} /> },
              {
                label: "",
                cell: (c) => (
                  <ActionDialog
                    title={`Assess ${c.claim_number}`}
                    trigger="Assess"
                    tone="ghost"
                    icon="gavel"
                    action={decideClaim}
                    hidden={{ lang, id: c.id }}
                    fields={[
                      { name: "status", label: "Decision", type: "select", required: true, options: ["assessing", "approved", "paid", "rejected"].map((v) => ({ value: v, label: label(v) })) },
                      { name: "amount_paid", label: "Amount paid (₦)", type: "number" },
                    ]}
                  />
                ),
              },
            ]}
          />
        </Section>
      )}
    </Stack>
  );
}
