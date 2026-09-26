import type { Metadata } from "next";
import Link from "next/link";
import { approveRoleRequest, rejectRoleRequest, reviewDocument } from "@/actions/admin-console";
import { AdminForm } from "@/components/admin/admin-form";
import { Alert, Badge, Card, Field, Input } from "@/components/ui";
import { documentLabel, phoneLabel, roleLabel, TIER_LABELS, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Approvals" };

type Doc = { id: string; profile_id: string; role_request_id: string | null; document_type: string; storage_path: string;
  mime_type: string; status: string; review_note: string | null; created_at: string };

export default async function ApprovalsPage() {
  const staff = await requireStaff();
  if (!staff) return null;
  const reviewRoles = can(staff, "roles.review");
  const reviewDocs = can(staff, "verification.review");
  if (!reviewRoles && !reviewDocs) return <Alert tone="danger">You need the roles.review or verification.review permission.</Alert>;

  const supabase = await createClient();
  const [{ data: requests }, { data: rules }] = await Promise.all([
    reviewRoles
      ? supabase.from("role_requests").select("id, profile_id, role, provider_type, details, created_at")
          .eq("status", "pending").order("created_at").limit(50)
      : Promise.resolve({ data: [] as { id: string; profile_id: string; role: string; provider_type: string | null; details: unknown; created_at: string }[] }),
    supabase.from("roles").select("role, requires_documents, min_verification_tier"),
  ]);
  const ids = (requests ?? []).map((r) => r.id);
  const { data: docs } = reviewDocs
    ? await supabase.from("verification_documents")
        .select("id, profile_id, role_request_id, document_type, storage_path, mime_type, status, review_note, created_at")
        .or(ids.length ? `status.eq.pending,role_request_id.in.(${ids.join(",")})` : "status.eq.pending")
        .order("created_at").limit(300)
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

  const docRow = (d: Doc) => (
    <li key={d.id} className="flex flex-col gap-2 rounded-md border border-line p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{documentLabel(d.document_type)}</span>
        <Badge className={d.status === "accepted" ? "bg-leaf-100 text-leaf-800" : d.status === "rejected" ? "bg-red-50 text-danger" : ""}>{d.status}</Badge>
        <span className="text-sm text-muted">{when(d.created_at)}</span>
        {signed.get(d.storage_path) && (
          <a href={signed.get(d.storage_path)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-leaf-700 underline">
            Open {d.mime_type === "application/pdf" ? "PDF" : "image"} (link lasts 10 minutes)
          </a>
        )}
      </div>
      {d.review_note && <p className="text-sm text-muted">Note: {d.review_note}</p>}
      {d.status === "pending" && reviewDocs && d.profile_id !== staff.userId && (
        <AdminForm action={reviewDocument} hidden={{ id: d.id }}
                   buttons={[{ label: "Accept", name: "status", value: "accepted" }, { label: "Reject", variant: "secondary", name: "status", value: "rejected" }]}>
          <Field id={`dn-${d.id}`} label="Note to the applicant (needed to reject)">
            <Input id={`dn-${d.id}`} name="note" maxLength={1000} />
          </Field>
        </AdminForm>
      )}
    </li>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">Approvals</h1>
        <p className="mt-1 max-w-3xl text-muted">
          Oldest first. Roles that need documents can only be approved after at least one document is accepted; field agents
          must have a verified NIN. You cannot review your own requests.
        </p>
      </div>

      {reviewRoles && (
        <section className="flex flex-col gap-4" aria-labelledby="req-h">
          <h2 id="req-h" className="text-2xl font-bold">Role requests ({reqs.length})</h2>
          {reqs.length === 0 && <p className="text-muted">Nothing waiting.</p>}
          {reqs.map((r) => {
            const p = person.get(r.profile_id);
            const rr = rule.get(r.role);
            const note = (r.details as { note?: string } | null)?.note;
            const rDocs = allDocs.filter((d) => d.role_request_id === r.id);
            return (
              <Card key={r.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xl font-bold">{roleLabel(r.role, r.provider_type)}</h3>
                  <span className="text-sm text-muted">Requested {when(r.created_at)}</span>
                </div>
                <p>
                  <Link href={`/admin/users/${r.profile_id}`} className="font-semibold text-leaf-700 underline">{p?.full_name ?? "Unnamed"}</Link>
                  {" · "}{phoneLabel(p?.phone)}{" · "}{TIER_LABELS[p?.verification_tier ?? 0]}
                  {p?.state ? ` · ${[p.lga, p.state].filter(Boolean).join(", ")}` : ""}
                </p>
                {note && <p className="rounded-md bg-cream p-3">&ldquo;{note}&rdquo;</p>}
                <p className="text-sm text-muted">
                  {rr?.requires_documents ? "Needs an accepted document." : "No documents required."}
                  {rr && rr.min_verification_tier > 0 ? ` Needs verification tier ${rr.min_verification_tier}.` : ""}
                </p>
                {rDocs.length > 0 ? <ul className="flex flex-col gap-2">{rDocs.map(docRow)}</ul> : rr?.requires_documents && <p className="font-semibold text-harvest-700">No documents uploaded yet.</p>}
                {r.profile_id !== staff.userId && (
                  <div className="grid gap-4 border-t border-line pt-3 md:grid-cols-2">
                    <AdminForm action={approveRoleRequest} hidden={{ id: r.id }} buttons={[{ label: "Approve" }]}>
                      <Field id={`an-${r.id}`} label="Note (optional)">
                        <Input id={`an-${r.id}`} name="note" maxLength={1000} />
                      </Field>
                    </AdminForm>
                    <AdminForm action={rejectRoleRequest} hidden={{ id: r.id }} buttons={[{ label: "Reject", variant: "secondary" }]}>
                      <Field id={`rn-${r.id}`} label="Reason the applicant will see">
                        <Input id={`rn-${r.id}`} name="note" maxLength={1000} />
                      </Field>
                    </AdminForm>
                  </div>
                )}
              </Card>
            );
          })}
        </section>
      )}

      {reviewDocs && looseDocs.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="doc-h">
          <h2 id="doc-h" className="text-2xl font-bold">Other documents waiting ({looseDocs.length})</h2>
          {looseDocs.map((d) => (
            <Card key={d.id} className="flex flex-col gap-2">
              <p>
                <Link href={`/admin/users/${d.profile_id}`} className="font-semibold text-leaf-700 underline">
                  {person.get(d.profile_id)?.full_name ?? "Unnamed"}
                </Link>
              </p>
              <ul>{docRow(d)}</ul>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
