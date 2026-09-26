import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DbConstants } from "@cultivanode/shared";
import { grantAdminRole, revokeAdminRole } from "@/actions/admin-console";
import { AdminForm } from "@/components/admin/admin-form";
import { Alert, Badge, Card, Field, Input, Select } from "@/components/ui";
import { phoneLabel, roleLabel, TIER_LABELS, when } from "@/lib/admin/labels";
import { can, requireStaff } from "@/lib/admin/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "User" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function UserPage({ params }: PageProps<"/admin/users/[id]">) {
  const staff = await requireStaff();
  if (!staff) return null;
  if (!can(staff, "users.read")) return <Alert tone="danger">You need the users.read permission.</Alert>;
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles")
    .select("id, full_name, phone, email, account_type, verification_tier, state, lga, preferred_language, created_at, onboarded_at, onboarded_by")
    .eq("id", id).maybeSingle();
  if (!p) notFound();

  const manage = can(staff, "admin.manage");
  const [roles, requests, checks, banks, consents, orgs, farms, staffRoles] = await Promise.all([
    supabase.from("user_roles").select("role, provider_type, granted_at").eq("profile_id", id),
    supabase.from("role_requests").select("id, role, provider_type, status, review_note, created_at").eq("profile_id", id).order("created_at", { ascending: false }),
    supabase.from("verifications").select("kind, status, masked_value, failure_reason, created_at").eq("profile_id", id).order("created_at", { ascending: false }),
    can(staff, "bank_accounts.read")
      ? supabase.from("bank_accounts").select("bank_name, account_name, account_number_last4, status, created_at").eq("profile_id", id)
      : Promise.resolve({ data: null }),
    supabase.from("current_consents").select("consent_type, granted, channel, created_at").eq("profile_id", id),
    supabase.from("org_members").select("member_role, organizations(name)").eq("profile_id", id),
    can(staff, "farms.read") ? supabase.from("farms").select("name, state, area_ha, created_at").eq("owner_id", id) : Promise.resolve({ data: null }),
    manage ? supabase.from("admin_roles").select("admin_role, created_at").eq("profile_id", id) : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{p.full_name ?? "(not set up)"}</h1>
        <p className="text-muted">
          {phoneLabel(p.phone)} · {p.account_type} · {TIER_LABELS[p.verification_tier]} · joined {when(p.created_at)}
          {p.onboarded_by ? " · registered by a field agent" : ""}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Details</h2>
          <dl className="grid grid-cols-[8rem_1fr] gap-1">
            <dt className="text-muted">Email</dt><dd>{p.email ?? "-"}</dd>
            <dt className="text-muted">Place</dt><dd>{[p.lga, p.state].filter(Boolean).join(", ") || "-"}</dd>
            <dt className="text-muted">Language</dt><dd>{p.preferred_language}</dd>
            <dt className="text-muted">Set up</dt><dd>{p.onboarded_at ? when(p.onboarded_at) : "not finished"}</dd>
            <dt className="text-muted">Businesses</dt>
            <dd>{(orgs.data ?? []).map((o) => `${o.organizations?.name} (${o.member_role})`).join(", ") || "-"}</dd>
          </dl>
        </Card>
        <Card className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Roles</h2>
          <ul className="flex flex-wrap gap-2">
            {(roles.data ?? []).map((r) => <li key={`${r.role}${r.provider_type}`}><Badge className="bg-leaf-100 text-leaf-800">{roleLabel(r.role, r.provider_type)}</Badge></li>)}
            {(roles.data ?? []).length === 0 && <li className="text-muted">None</li>}
          </ul>
          <h3 className="mt-2 font-bold">Requests</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {(requests.data ?? []).map((r) => (
              <li key={r.id}>{roleLabel(r.role, r.provider_type)}: <strong>{r.status}</strong> ({when(r.created_at)}){r.review_note ? `, "${r.review_note}"` : ""}</li>
            ))}
            {(requests.data ?? []).length === 0 && <li className="text-muted">None</li>}
          </ul>
        </Card>
        <Card className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Identity checks</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {(checks.data ?? []).map((c, i) => (
              <li key={i}>{c.kind.toUpperCase()} {c.masked_value}: <strong>{c.status}</strong>{c.failure_reason ? ` (${c.failure_reason})` : ""}, {when(c.created_at)}</li>
            ))}
            {(checks.data ?? []).length === 0 && <li className="text-muted">None</li>}
          </ul>
          {banks.data && (
            <>
              <h3 className="mt-2 font-bold">Bank accounts</h3>
              <ul className="flex flex-col gap-1 text-sm">
                {banks.data.map((b, i) => <li key={i}>{b.bank_name} ••••{b.account_number_last4} ({b.account_name}): <strong>{b.status}</strong></li>)}
                {banks.data.length === 0 && <li className="text-muted">None</li>}
              </ul>
            </>
          )}
        </Card>
        <Card className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Consents</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {(consents.data ?? []).map((c) => (
              <li key={c.consent_type}>{(c.consent_type ?? "").replaceAll("_", " ")}: <strong>{c.granted ? "yes" : "no"}</strong> via {c.channel}, {when(c.created_at)}</li>
            ))}
          </ul>
        </Card>
        {farms.data && (
          <Card className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">Farms</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {farms.data.map((f, i) => <li key={i}>{f.name} ({f.state ?? "-"}){f.area_ha ? `, ${f.area_ha} ha` : ""}</li>)}
              {farms.data.length === 0 && <li className="text-muted">None</li>}
            </ul>
          </Card>
        )}
      </div>

      {manage && staffRoles.data && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Staff roles</h2>
          <ul className="flex flex-wrap gap-2">
            {staffRoles.data.map((r) => <li key={r.admin_role}><Badge>{r.admin_role.replaceAll("_", " ")}</Badge></li>)}
            {staffRoles.data.length === 0 && <li className="text-muted">Not staff</li>}
          </ul>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminForm action={grantAdminRole} hidden={{ profile_id: id }} buttons={[{ label: "Grant staff role" }]}>
              <Field id="grant-role" label="Staff role">
                <Select id="grant-role" name="admin_role" defaultValue="verification_officer">
                  {DbConstants.public.Enums.admin_role.map((r) => <option key={r} value={r}>{r.replaceAll("_", " ")}</option>)}
                </Select>
              </Field>
              <Field id="grant-reason" label="Reason (kept in the audit log)">
                <Input id="grant-reason" name="reason" maxLength={1000} />
              </Field>
            </AdminForm>
            {staffRoles.data.length > 0 && (
              <AdminForm action={revokeAdminRole} hidden={{ profile_id: id }} buttons={[{ label: "Remove staff role", variant: "secondary" }]}>
                <Field id="revoke-role" label="Staff role">
                  <Select id="revoke-role" name="admin_role">
                    {staffRoles.data.map((r) => <option key={r.admin_role} value={r.admin_role}>{r.admin_role.replaceAll("_", " ")}</option>)}
                  </Select>
                </Field>
                <Field id="revoke-reason" label="Reason (kept in the audit log)">
                  <Input id="revoke-reason" name="reason" maxLength={1000} />
                </Field>
              </AdminForm>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
