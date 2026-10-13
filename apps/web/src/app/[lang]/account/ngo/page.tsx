import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { addBeneficiary, createImpactProgramme } from "@/actions/ecosystem";
import { PageHeader } from "@/components/ds/page-header";
import { ActionDialog } from "@/components/live/action-form";
import { Bars, Chip, DataTable, KpiGrid, Meter, Section, Split, Stack, StartHere, Status } from "@/components/live/kit";
import { MetricCard } from "@/components/live/metric-card";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { label, naira, num, pct, share } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "NGO & development" };

export default async function Page({ params }: PageProps<"/[lang]/account/ngo">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();
  const { data } = await supabase.from("impact_programmes").select("*, programme_beneficiaries(*)").eq("owner_id", account.userId).order("start_date", { ascending: false });
  const p = data ?? [];
  const ben = p.flatMap((x) => (x.programme_beneficiaries ?? []).map((b) => ({ ...b, programme: x.name })));
  const women = ben.filter((b) => b.gender === "female").length;
  const withYield = ben.filter((b) => b.yield_before_kg_ha && b.yield_after_kg_ha);
  const uplift = withYield.length ? withYield.reduce((s, b) => s + (Number(b.yield_after_kg_ha) - Number(b.yield_before_kg_ha)) / Number(b.yield_before_kg_ha), 0) / withYield.length * 100 : 0;
  const byState = Object.entries(ben.reduce<Record<string, number>>((m, b) => ((m[b.state ?? "—"] = (m[b.state ?? "—"] ?? 0) + 1), m), {})).map(([k, v]) => ({ label: k, value: v }));
  const progOpts = p.map((x) => ({ value: x.id, label: x.name }));

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="diversity_3">{p.length} programmes</Chip>}
        title="NGO & Development Programmes"
        description="Programmes you run, the farmers they reach, what support each received and the yield change it produced."
        actions={
          <>
            {p.length > 0 && (
              <ActionDialog
                title="Enrol a beneficiary"
                trigger="Enrol farmer"
                icon="person_add"
                tone="secondary"
                action={addBeneficiary}
                hidden={{ lang }}
                fields={[
                  { name: "programme_id", label: "Programme", type: "select", required: true, options: progOpts, wide: true },
                  { name: "farmer_name", label: "Farmer / group", required: true },
                  { name: "gender", label: "Gender", type: "select", options: ["female", "male", "other"].map((v) => ({ value: v, label: label(v) })) },
                  { name: "state", label: "State" },
                  { name: "lga", label: "LGA" },
                  { name: "support_type", label: "Support given", required: true },
                  { name: "value", label: "Value (₦)", type: "number" },
                  { name: "yield_before_kg_ha", label: "Baseline yield (kg/ha)", type: "number" },
                ]}
              />
            )}
            <ActionDialog
              title="New programme"
              trigger="New programme"
              action={createImpactProgramme}
              hidden={{ lang }}
              fields={[
                { name: "name", label: "Name", required: true, wide: true },
                { name: "organisation", label: "Organisation", required: true },
                { name: "focus", label: "Focus", required: true },
                { name: "states", label: "States (comma separated)" },
                { name: "budget", label: "Budget (₦)", type: "number" },
                { name: "target_farmers", label: "Target farmers", type: "number" },
                { name: "start_date", label: "Start", type: "date", required: true },
                { name: "end_date", label: "End", type: "date" },
              ]}
            />
          </>
        }
      />
      {!p.length && <StartHere icon="diversity_3" title="No programmes yet">Create a programme to start enrolling farmers and tracking outcomes.</StartHere>}
      <KpiGrid>
        <MetricCard label="Farmers reached" value={ben.length} icon="groups" foot={`Target ${num(p.reduce((s, x) => s + Number(x.target_farmers ?? 0), 0))}`} />
        <MetricCard label="Women" value={pct(share(women, ben.length))} icon="female" foot={`${women} of ${ben.length}`} />
        <MetricCard label="Yield uplift" value={`${uplift >= 0 ? "+" : ""}${num(uplift, 1)}%`} icon="trending_up" foot={`${withYield.length} farmers with before/after yields`} />
        <MetricCard label="Budget spent" value={pct(share(p.reduce((s, x) => s + Number(x.spent_kobo ?? 0), 0), p.reduce((s, x) => s + Number(x.budget_kobo ?? 0), 0)))} icon="payments" foot={naira(p.reduce((s, x) => s + Number(x.spent_kobo ?? 0), 0))} />
      </KpiGrid>
      <Section title="Programmes" icon="diversity_3">
        <DataTable
          rows={p}
          rowKey={(x) => x.id}
          columns={[
            { label: "Programme", cell: (x) => <span className="font-medium">{x.name}</span> },
            { label: "Organisation", cell: (x) => x.organisation },
            { label: "Focus", cell: (x) => x.focus },
            { label: "Reach", cell: (x) => <div className="w-32"><Meter value={share((x.programme_beneficiaries ?? []).length, Number(x.target_farmers ?? 0))} /><span className="text-body-sm">{(x.programme_beneficiaries ?? []).length} / {x.target_farmers ?? "—"}</span></div> },
            { label: "Budget", numeric: true, cell: (x) => `${naira(x.spent_kobo)} / ${naira(x.budget_kobo)}` },
            { label: "Status", cell: (x) => <Status value={x.status} /> },
          ]}
        />
      </Section>
      <Split
        wide={
          <Section title="Beneficiaries" icon="badge">
            <DataTable
              rows={ben}
              rowKey={(b) => b.id}
              empty="No beneficiaries enrolled."
              columns={[
                { label: "Farmer", cell: (b) => <span className="font-medium">{b.farmer_name}</span> },
                { label: "Programme", cell: (b) => b.programme },
                { label: "Location", cell: (b) => [b.lga, b.state].filter(Boolean).join(", ") },
                { label: "Support", cell: (b) => b.support_type },
                { label: "Value", numeric: true, cell: (b) => naira(b.value_kobo) },
                { label: "Yield before → after", cell: (b) => (b.yield_before_kg_ha ? `${num(b.yield_before_kg_ha)} → ${b.yield_after_kg_ha ? num(b.yield_after_kg_ha) : "…"} kg/ha` : "—") },
                { label: "Status", cell: (b) => <Status value={b.status} /> },
              ]}
            />
          </Section>
        }
        side={
          <Section title="Reach by state" icon="public">
            <Bars items={byState} />
          </Section>
        }
      />
    </Stack>
  );
}
