import { notFound } from "next/navigation";
import { cancelRoleRequest } from "@/actions/account";
import { RequestRoleForm, UploadDocumentForm } from "@/components/account/role-forms";
import { Badge, Button, Card, cx } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill, formatDate } from "@/lib/text";

const tone: Record<string, string> = {
  pending: "bg-harvest-100 text-harvest-700",
  approved: "bg-leaf-100 text-leaf-800",
  accepted: "bg-leaf-100 text-leaf-800",
  rejected: "bg-red-50 text-danger",
  cancelled: "bg-line text-muted",
};

export default async function RolesPage({
  params,
  searchParams,
}: PageProps<"/[lang]/account/roles"> & { searchParams?: Promise<{ role?: string }> }) {
  const { lang } = await params;
  const sParams = searchParams ? await searchParams : undefined;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const r = t.acct.roles;
  const supabase = await createClient();
  const [{ data: requests }, { data: docs }, { data: roleRules }] = await Promise.all([
    supabase.from("role_requests").select("id, role, provider_type, status, review_note, created_at")
      .eq("profile_id", account.userId).order("created_at", { ascending: false }),
    supabase.from("verification_documents").select("id, role_request_id, document_type, status, review_note, created_at")
      .eq("profile_id", account.userId).order("created_at"),
    supabase.from("roles").select("role, available, requires_documents"),
  ]);
  const rules = new Map((roleRules ?? []).map((x) => [x.role, x]));
  const held = new Set(account.roles.filter((x) => x.role !== "service_provider").map((x) => x.role));
  const pending = new Set((requests ?? []).filter((x) => x.status === "pending" && x.role !== "service_provider").map((x) => x.role));
  const requestable = (roleRules ?? [])
    .filter((x) => x.available && !held.has(x.role) && !pending.has(x.role))
    .map((x) => x.role);
  const roleName = (role: string, type: string | null) =>
    type ? `${t.roleNames[role as keyof typeof t.roleNames]}: ${t.providerTypes[type as keyof typeof t.providerTypes]}`
         : t.roleNames[role as keyof typeof t.roleNames];

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{r.title}</h1>
        <p className="mt-2 text-muted">{r.intro}</p>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{r.held}</h2>
        {account.roles.length === 0 ? <p className="text-muted">{t.acct.noRoles}</p> : (
          <ul className="flex flex-wrap gap-2">
            {account.roles.map((x) => (
              <li key={`${x.role}-${x.provider_type}`}><Badge className={tone.approved}>{roleName(x.role, x.provider_type)}</Badge></li>
            ))}
          </ul>
        )}
      </Card>

      {(requests ?? []).length > 0 && (
        <section aria-labelledby="requests" className="flex flex-col gap-4">
          <h2 id="requests" className="text-xl font-bold">{r.requests}</h2>
          {(requests ?? []).map((q) => {
            const qDocs = (docs ?? []).filter((d) => d.role_request_id === q.id);
            const needs = rules.get(q.role)?.requires_documents;
            return (
              <Card key={q.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold">{roleName(q.role, q.provider_type)}</h3>
                  <Badge className={tone[q.status]}>{t.status[q.status as keyof typeof t.status]}</Badge>
                </div>
                <p className="text-sm text-muted">{fill(r.requested, { date: formatDate(q.created_at, lang) })}</p>
                {q.review_note && q.status !== "approved" && (
                  <p><span className="font-semibold">{r.reviewNote}</span> {q.review_note}</p>
                )}
                {q.status === "rejected" && <p className="text-sm">{r.resubmit}</p>}
                {(needs || qDocs.length > 0) && (
                  <div className="flex flex-col gap-2">
                    <h4 className="font-semibold">{r.documents}</h4>
                    {qDocs.length === 0 ? (
                      <p className={cx("text-sm", q.status === "pending" ? "font-medium text-harvest-700" : "text-muted")}>
                        {q.status === "pending" ? r.needsDocs : r.noDocuments}
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {qDocs.map((d) => (
                          <li key={d.id} className="flex flex-wrap items-center gap-2 text-sm">
                            <span>{t.documentTypes[d.document_type as keyof typeof t.documentTypes]}</span>
                            <Badge className={tone[d.status]}>{t.status[d.status as keyof typeof t.status]}</Badge>
                            {d.review_note && <span className="text-muted">{d.review_note}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {q.status === "pending" && (
                  <>
                    {needs && <UploadDocumentForm lang={lang} requestId={q.id} t={t} />}
                    <form action={cancelRoleRequest}>
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="request_id" value={q.id} />
                      <Button type="submit" variant="ghost">{r.cancel}</Button>
                    </form>
                  </>
                )}
              </Card>
            );
          })}
        </section>
      )}

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{r.request}</h2>
        {requestable.length === 0 ? (
          <p className="text-muted">{r.noneLeft}</p>
        ) : (
          <RequestRoleForm
            lang={lang}
            roles={requestable}
            initialRole={sParams?.role}
            t={t}
          />
        )}
      </Card>
    </>
  );
}
