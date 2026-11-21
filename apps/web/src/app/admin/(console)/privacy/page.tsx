import type { Metadata } from "next";
import Link from "next/link";
import { deleteAccountForRequest, resolveDataRequest } from "@/actions/admin-console";
import { AdminForm } from "@/components/admin/admin-form";
import { Alert, Badge, Card, Field, Input } from "@/components/ui";
import { phoneLabel, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Privacy requests" };

export default async function PrivacyRequestsPage() {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "privacy.manage")) return <Alert tone="danger">You need the privacy.manage permission.</Alert>;
  const supabase = await createClient();
  const { data: requests } = await supabase.from("data_requests")
    .select("id, profile_id, kind, status, reason, resolution_note, created_at, handled_at")
    .eq("kind", "deletion").order("created_at", { ascending: false }).limit(100);
  const ids = [...new Set((requests ?? []).map((r) => r.profile_id).filter((x): x is string => Boolean(x)))];
  const { data: people } = ids.length && can(staff, "users.read")
    ? await supabase.from("profiles").select("id, full_name, phone").in("id", ids)
    : { data: [] as { id: string; full_name: string | null; phone: string | null }[] };
  const person = new Map((people ?? []).map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">Account deletion requests</h1>
        <p className="mt-1 max-w-3xl text-muted">
          Answer within 30 days (NDPA). Delete account anonymises the profile, removes private documents and the
          sign-in, and keeps payment records. It is refused while the person has open bookings, orders, escrows or
          payouts. The request closes itself once deletion finishes. People download their own data from their
          account, so export requests close themselves.
        </p>
      </div>
      {(requests ?? []).length === 0 && <p className="text-muted">No requests.</p>}
      {(requests ?? []).map((r) => {
        const p = r.profile_id ? person.get(r.profile_id) : undefined;
        return (
          <Card key={r.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">
                {r.profile_id ? (
                  <Link href={`/admin/users/${r.profile_id}`} className="text-leaf-700 underline">{p?.full_name ?? "Profile"}</Link>
                ) : "Deleted account"}
                {p?.phone ? ` · ${phoneLabel(p.phone)}` : ""}
              </p>
              <span className="flex items-center gap-2 text-sm text-muted">{when(r.created_at)} <Badge>{r.status}</Badge></span>
            </div>
            {r.reason && <p className="rounded-md bg-cream p-3">&ldquo;{r.reason}&rdquo;</p>}
            {r.resolution_note && <p className="text-sm">Resolution ({when(r.handled_at)}): {r.resolution_note}</p>}
            {r.status === "open" && (
              <div className="grid gap-4 md:grid-cols-2">
                <AdminForm action={deleteAccountForRequest} hidden={{ id: r.id }} buttons={[{ label: "Delete account" }]}>
                  <Field id={`confirm-${r.id}`} label="Type DELETE to permanently delete this account">
                    <Input id={`confirm-${r.id}`} name="confirm" maxLength={10} autoComplete="off" />
                  </Field>
                </AdminForm>
                <AdminForm action={resolveDataRequest} hidden={{ id: r.id }}
                           buttons={[{ label: "Reject", variant: "secondary", name: "status", value: "rejected" }]}>
                  <Field id={`note-${r.id}`} label="Why it was rejected (kept on record, the person sees it)">
                    <Input id={`note-${r.id}`} name="note" maxLength={1000} />
                  </Field>
                </AdminForm>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
