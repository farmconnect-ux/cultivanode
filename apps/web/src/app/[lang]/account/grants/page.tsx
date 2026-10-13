import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { applyForGrant, createGrantProgramme, reviewGrantApplication } from "@/actions/ecosystem";
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

export const metadata: Metadata = { title: "Grants & subsidies" };

export default async function Page({ params }: PageProps<"/[lang]/account/grants">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const scope = await loadFarmScope(account);
  const supabase = await createClient();
  const uid = account.userId;
  const [{ data: programmes }, { data: mine }] = await Promise.all([
    supabase.from("grant_programmes").select("*, grant_applications(id, applicant_id, amount_requested_kobo, amount_awarded_kobo, proposal, score, status, submitted_at)").order("closes_on"),
    supabase.from("grant_applications").select("*, grant_programmes(title, funder)").eq("applicant_id", uid).order("submitted_at", { ascending: false }),
  ]);
  const p = programmes ?? [];
  const open = p.filter((x) => x.status === "open" && x.closes_on >= new Date().toISOString().slice(0, 10));
  const owned = p.filter((x) => x.owner_id === uid);
  const applied = new Set((mine ?? []).map((a) => a.programme_id));
  const awarded = (mine ?? []).reduce((s, a) => s + Number(a.amount_awarded_kobo ?? 0), 0);
  const reviewQueue = owned.flatMap((x) => (x.grant_applications ?? []).map((a) => ({ ...a, programme: x.title })));

  return (
    <Stack>
      <PageHeader
        eyebrow={<Chip icon="volunteer_activism">{open.length} programmes open</Chip>}
        title="Grants & Subsidies"
        description="Open programmes you can apply to, your applications, and — if you run a programme — the applications to score."
        actions={
          <ActionDialog
            title="Publish a grant programme"
            trigger="New programme"
            tone="secondary"
            action={createGrantProgramme}
            hidden={{ lang }}
            fields={[
              { name: "title", label: "Title", required: true, wide: true },
              { name: "funder", label: "Funder", required: true },
              { name: "focus_area", label: "Focus", required: true },
              { name: "max_award", label: "Max award (₦)", type: "number", required: true },
              { name: "total_pool", label: "Total pool (₦)", type: "number" },
              { name: "opens_on", label: "Opens", type: "date", required: true },
              { name: "closes_on", label: "Closes", type: "date", required: true },
              { name: "states", label: "States (comma separated)", placeholder: "Oyo, Ogun" },
              { name: "eligibility", label: "Eligibility", type: "textarea" },
              { name: "description", label: "Description", type: "textarea" },
            ]}
          />
        }
      />
      <KpiGrid>
        <MetricCard label="Open programmes" value={open.length} icon="volunteer_activism" foot={naira(open.reduce((s, x) => s + Number(x.total_pool_kobo ?? 0), 0)) + " in pools"} />
        <MetricCard label="My applications" value={(mine ?? []).length} icon="assignment" foot={`${(mine ?? []).filter((a) => a.status === "shortlisted").length} shortlisted`} />
        <MetricCard label="Awarded to me" value={naira(awarded)} icon="workspace_premium" foot={`${(mine ?? []).filter((a) => a.status === "awarded").length} awards`} />
        <MetricCard label="Applications to review" value={reviewQueue.filter((a) => a.status === "submitted").length} icon="rule" foot={`${owned.length} programmes you run`} />
      </KpiGrid>
      <Section title="Open programmes" icon="campaign">
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-3">
          {open.map((x) => (
            <div key={x.id} className="card-interactive flex flex-col gap-2 rounded-xl border border-outline-variant/40 p-space-md">
              <div className="flex items-start justify-between gap-2">
                <p className="font-label-lg text-label-lg text-on-surface">{x.title}</p>
                <Chip>{x.focus_area}</Chip>
              </div>
              <p className="text-body-sm text-on-surface-variant">{x.funder} · up to {naira(x.max_award_kobo)} · closes {relDays(x.closes_on)}</p>
              {x.description && <p className="text-body-sm text-on-surface">{x.description}</p>}
              {x.eligibility && <p className="text-body-sm text-on-surface-variant">Eligible: {x.eligibility}</p>}
              <div className="mt-auto pt-2">
                {applied.has(x.id) ? (
                  <Status value="submitted" />
                ) : x.owner_id === uid ? (
                  <Chip>Your programme</Chip>
                ) : (
                  <ActionDialog
                    title={`Apply — ${x.title}`}
                    trigger="Apply"
                    tone="secondary"
                    icon="send"
                    action={applyForGrant}
                    hidden={{ lang, programme_id: x.id }}
                    fields={[
                      { name: "amount_requested", label: "Amount (₦)", type: "number", required: true, max: Number(x.max_award_kobo) / 100 },
                      { name: "farm_id", label: "Farm", type: "select", options: farmOptions(scope) },
                      { name: "proposal", label: "Proposal", type: "textarea", required: true },
                    ]}
                  />
                )}
              </div>
            </div>
          ))}
          {!open.length && <p className="py-4 text-body-sm text-on-surface-variant">No programmes open right now.</p>}
        </div>
      </Section>
      <Section title="My applications" icon="assignment">
        <DataTable
          rows={mine ?? []}
          rowKey={(a) => a.id}
          empty="You haven't applied yet."
          columns={[
            { label: "Programme", cell: (a) => <span className="font-medium">{a.grant_programmes?.title}</span> },
            { label: "Funder", cell: (a) => a.grant_programmes?.funder },
            { label: "Requested", numeric: true, cell: (a) => naira(a.amount_requested_kobo) },
            { label: "Awarded", numeric: true, cell: (a) => (a.amount_awarded_kobo ? naira(a.amount_awarded_kobo) : "—") },
            { label: "Score", numeric: true, cell: (a) => a.score ?? "—" },
            { label: "Submitted", cell: (a) => (a.submitted_at ? formatDay(a.submitted_at.slice(0, 10), lang) : "—") },
            { label: "Status", cell: (a) => <Status value={a.status} /> },
          ]}
        />
      </Section>
      {owned.length > 0 && (
        <Section title="Applications to my programmes" icon="rule">
          <DataTable
            rows={reviewQueue}
            rowKey={(a) => a.id}
            empty="No applications yet."
            columns={[
              { label: "Programme", cell: (a) => a.programme },
              { label: "Proposal", cell: (a) => <span className="line-clamp-2 max-w-sm">{a.proposal}</span> },
              { label: "Requested", numeric: true, cell: (a) => naira(a.amount_requested_kobo) },
              { label: "Score", numeric: true, cell: (a) => a.score ?? "—" },
              { label: "Status", cell: (a) => <Status value={a.status} /> },
              {
                label: "",
                cell: (a) =>
                  a.status !== "awarded" && a.status !== "declined" ? (
                    <ActionDialog
                      title="Review application"
                      trigger="Review"
                      tone="ghost"
                      icon="rule"
                      action={reviewGrantApplication}
                      hidden={{ lang, id: a.id }}
                      fields={[
                        { name: "status", label: "Decision", type: "select", required: true, options: ["shortlisted", "awarded", "declined"].map((v) => ({ value: v, label: label(v) })) },
                        { name: "score", label: "Score (0–100)", type: "number", min: 0, max: 100 },
                        { name: "amount_awarded", label: "Award (₦)", type: "number", defaultValue: Number(a.amount_requested_kobo) / 100 },
                      ]}
                    />
                  ) : null,
              },
            ]}
          />
        </Section>
      )}
    </Stack>
  );
}
