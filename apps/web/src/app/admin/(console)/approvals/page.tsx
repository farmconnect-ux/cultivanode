import type { Metadata } from "next";
import Link from "next/link";
import { approveRoleRequest, rejectRoleRequest, reviewDocument } from "@/actions/admin-console";
import { AdminForm } from "@/components/admin/admin-form";
import { EmptyState } from "@/components/ds/empty-state";
import { Icon } from "@/components/ds/icon";
import { MetricCard } from "@/components/live/metric-card";
import { VerificationHub } from "@/components/screens/verification-hub";
import { Badge } from "@/components/shadcn/badge";
import { Alert, Field, Input } from "@/components/ui";
import { documentLabel, phoneLabel, roleLabel, TIER_LABELS, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "User verification & KYC" };

type Doc = {
  id: string; profile_id: string; role_request_id: string | null; document_type: string; storage_path: string;
  mime_type: string; status: string; review_note: string | null; created_at: string;
};

export default async function ApprovalsPage() {
  const staff = await requireStaff();
  if (!staff) return null;
  const reviewRoles = can(staff, "roles.review");
  const reviewDocs = can(staff, "verification.review");
  if (!reviewRoles && !reviewDocs) return <Alert tone="danger">You need the roles.review or verification.review permission.</Alert>;

  const supabase = await createClient();
  const [{ data: requests }, { data: rules }] = await Promise.all([
    reviewRoles
      ? supabase.from("role_requests").select("id, profile_id, role, provider_type, details, created_at").eq("status", "pending").order("created_at").limit(50)
      : Promise.resolve({ data: [] as { id: string; profile_id: string; role: string; provider_type: string | null; details: unknown; created_at: string }[] }),
    supabase.from("roles").select("role, requires_documents, min_verification_tier"),
  ]);
  const ids = (requests ?? []).map((r) => r.id);
  const { data: docs } = reviewDocs
    ? await supabase
        .from("verification_documents")
        .select("id, profile_id, role_request_id, document_type, storage_path, mime_type, status, review_note, created_at")
        .or(ids.length ? `status.eq.pending,role_request_id.in.(${ids.join(",")})` : "status.eq.pending")
        .order("created_at")
        .limit(300)
    : { data: [] as Doc[] };
  const reqs = requests ?? [];
  const requestIds = new Set(reqs.map((r) => r.id));
  const allDocs = (docs ?? []) as Doc[];
  const shownDocs = allDocs.filter((d) => (d.role_request_id && requestIds.has(d.role_request_id)) || d.status === "pending");
  const profileIds = [...new Set([...reqs.map((r) => r.profile_id), ...shownDocs.map((d) => d.profile_id)])];
  const { data: people } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name, phone, verification_tier, state, lga, created_at").in("id", profileIds)
    : { data: [] as { id: string; full_name: string | null; phone: string | null; verification_tier: number; state: string | null; lga: string | null; created_at: string }[] };
  const person = new Map((people ?? []).map((p) => [p.id, p]));
  const rule = new Map<string, { requires_documents: boolean; min_verification_tier: number }>((rules ?? []).map((r) => [r.role, r]));

  // Short-lived links: staff open private files without the bucket ever becoming public.
  const signed = new Map<string, string>();
  if (shownDocs.length) {
    const { data: urls } = await supabase.storage.from("verification-documents").createSignedUrls(shownDocs.map((d) => d.storage_path), 600);
    for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
  }
  const looseDocs = shownDocs.filter((d) => !d.role_request_id || !requestIds.has(d.role_request_id));
  // eslint-disable-next-line react-hooks/purity -- Server Component: timestamp for age calculation
  const now = Date.now();
  const oldestH = reqs.length ? Math.round((now - new Date(reqs[0]!.created_at).getTime()) / 36e5) : null;

  const docRow = (d: Doc) => (
    <li key={d.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-container-lowest p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Icon name={d.mime_type === "application/pdf" ? "picture_as_pdf" : "image"} className="text-lg text-secondary" />
        <span className="font-semibold">{documentLabel(d.document_type)}</span>
        <Badge tone={d.status === "accepted" ? "positive" : d.status === "rejected" ? "critical" : "caution"} dot>{d.status}</Badge>
        <span className="text-body-sm text-on-surface-variant">{when(d.created_at)}</span>
        {signed.get(d.storage_path) && (
          <a href={signed.get(d.storage_path)} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 font-label-md text-label-md text-secondary hover:underline">
            Open {d.mime_type === "application/pdf" ? "PDF" : "image"} <Icon name="open_in_new" className="text-sm" />
            <span className="text-label-sm font-normal text-on-surface-variant">(10 min link)</span>
          </a>
        )}
      </div>
      {d.review_note && <p className="text-body-sm text-on-surface-variant">Note: {d.review_note}</p>}
      {d.status === "pending" && reviewDocs && d.profile_id !== staff.userId && (
        <AdminForm action={reviewDocument} hidden={{ id: d.id }} buttons={[{ label: "Accept", name: "status", value: "accepted" }, { label: "Reject", variant: "secondary", name: "status", value: "rejected" }]}>
          <Field id={`dn-${d.id}`} label="Note to the applicant (needed to reject)">
            <Input id={`dn-${d.id}`} name="note" maxLength={1000} />
          </Field>
        </AdminForm>
      )}
    </li>
  );

  return (
    <VerificationHub
      lang="en"
      slots={{
        kpis: (
          <div className="mb-space-lg grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Pending total" value={reqs.length + shownDocs.length} icon="pending_actions" iconTone="bg-tertiary-fixed/50 text-tertiary-container" foot="Role requests and documents" />
            <MetricCard label="Role requests" value={reqs.length} icon="how_to_reg" foot="Oldest first" />
            <MetricCard label="Documents to review" value={shownDocs.length} icon="description" iconTone="bg-surface-container-high text-primary" foot="IDs, CAC, equipment papers" />
            <MetricCard label="Oldest request" value={oldestH ?? "—"} unit={oldestH !== null ? "hours" : undefined} icon="avg_time" iconTone="bg-primary-fixed/60 text-on-primary-fixed-variant" foot="Target: decide within 12 hours" />
          </div>
        ),
        review: reviewRoles ? (
          <section className="mb-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-md">
            <div className="mb-space-md flex flex-col justify-between gap-2 border-b border-surface-container pb-space-md md:flex-row md:items-center">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Role requests ({reqs.length})</h2>
                <p className="text-body-sm text-on-surface-variant">
                  Roles that need documents can only be approved after one is accepted; field agents need a verified NIN. You cannot review your own requests.
                </p>
              </div>
            </div>
            {reqs.length === 0 ? (
              <EmptyState icon="task_alt" title="Nothing waiting" description="New role requests appear here, oldest first." />
            ) : (
              <div className="flex flex-col gap-space-md">
                {reqs.map((r) => {
                  const p = person.get(r.profile_id);
                  const rr = rule.get(r.role);
                  const note = (r.details as { note?: string } | null)?.note;
                  const rDocs = allDocs.filter((d) => d.role_request_id === r.id);
                  return (
                    <article key={r.id} className="rounded-xl border border-border p-space-md">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">{roleLabel(r.role, r.provider_type)}</h3>
                          <p className="text-body-sm text-on-surface-variant">
                            <Link href={`/admin/users/${r.profile_id}`} className="font-semibold text-secondary hover:underline">{p?.full_name ?? "Unnamed"}</Link>
                            {" · "}{phoneLabel(p?.phone)}{" · "}{TIER_LABELS[p?.verification_tier ?? 0]}
                            {p?.state ? ` · ${[p.lga, p.state].filter(Boolean).join(", ")}` : ""}
                          </p>
                        </div>
                        <Badge tone="outline"><Icon name="schedule" /> {when(r.created_at)}</Badge>
                      </div>
                      {note && <p className="mt-3 rounded-lg bg-surface-container-low p-3 text-body-sm">&ldquo;{note}&rdquo;</p>}
                      <p className="mt-3 flex flex-wrap gap-2 text-body-sm text-on-surface-variant">
                        <Badge tone={rr?.requires_documents ? "caution" : "neutral"}>{rr?.requires_documents ? "Needs an accepted document" : "No documents required"}</Badge>
                        {rr && rr.min_verification_tier > 0 && <Badge tone="atmos">Needs tier {rr.min_verification_tier}</Badge>}
                      </p>
                      {rDocs.length > 0 ? (
                        <ul className="mt-3 flex flex-col gap-2">{rDocs.map(docRow)}</ul>
                      ) : (
                        rr?.requires_documents && <p className="mt-3 font-semibold text-[#b45309]">No documents uploaded yet.</p>
                      )}
                      {r.profile_id !== staff.userId && (
                        <div className="mt-space-md grid gap-4 border-t border-surface-container pt-space-md md:grid-cols-2">
                          <AdminForm action={approveRoleRequest} hidden={{ id: r.id }} buttons={[{ label: "Approve" }]}>
                            <Field id={`an-${r.id}`} label="Note (optional)"><Input id={`an-${r.id}`} name="note" maxLength={1000} /></Field>
                          </AdminForm>
                          <AdminForm action={rejectRoleRequest} hidden={{ id: r.id }} buttons={[{ label: "Reject", variant: "secondary" }]}>
                            <Field id={`rn-${r.id}`} label="Reason the applicant will see"><Input id={`rn-${r.id}`} name="note" maxLength={1000} /></Field>
                          </AdminForm>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null,
        alert: null,
        triage:
          reviewDocs && looseDocs.length > 0 ? (
            <section className="mb-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <h2 className="mb-space-md font-headline-md text-headline-md text-on-surface">Other documents waiting ({looseDocs.length})</h2>
              <div className="flex flex-col gap-space-md">
                {looseDocs.map((d) => (
                  <div key={d.id} className="flex flex-col gap-2">
                    <Link href={`/admin/users/${d.profile_id}`} className="font-semibold text-secondary hover:underline">
                      {person.get(d.profile_id)?.full_name ?? "Unnamed"}
                    </Link>
                    <ul>{docRow(d)}</ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null,
        auditLog: null,
      }}
    />
  );
}
