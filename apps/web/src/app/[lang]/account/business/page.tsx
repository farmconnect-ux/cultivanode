import { notFound } from "next/navigation";
import { changeStaffRole, removeStaff } from "@/actions/account";
import { AddStaffForm, BusinessDetailsForm } from "@/components/account/business-forms";
import { Button, Card, Select } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import { fill } from "@/lib/text";

export default async function BusinessPage({ params }: PageProps<"/[lang]/account/business">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const b = t.acct.business;
  const supabase = await createClient();
  const { data: memberships } = await supabase.from("org_members")
    .select("member_role, organizations(id, name, cac_number)").eq("profile_id", account.userId);

  const orgs = await Promise.all((memberships ?? []).flatMap((m) => {
    const org = m.organizations;
    if (!org) return [];
    return [supabase.rpc("org_member_list", { p_org: org.id }).then(({ data }) => ({ org, myRole: m.member_role, staff: data ?? [] }))];
  }));

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold text-leaf-800">{b.title}</h1>
        <p className="mt-2 text-muted">{b.intro}</p>
      </div>
      {orgs.length === 0 && <p className="text-muted">{b.none}</p>}
      {orgs.map(({ org, myRole, staff }) => {
        const owner = myRole === "owner";
        return (
          <section key={org.id} aria-label={org.name} className="flex flex-col gap-4">
            <Card className="flex flex-col gap-3">
              <h2 className="text-xl font-bold">{org.name}</h2>
              <p className="text-muted">{fill(b.yourRole, { role: t.orgRoles[myRole] })}</p>
              {owner && <BusinessDetailsForm lang={lang} org={org} t={t} />}
            </Card>
            <Card className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">{b.staff}</h3>
              <ul className="flex flex-col divide-y divide-line">
                {staff.map((s) => (
                  <li key={s.profile_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span>
                      <span className="block font-semibold">{s.full_name ?? "-"}</span>
                      <span className="block text-sm text-muted">{s.phone_hint} · {t.orgRoles[s.member_role]}</span>
                    </span>
                    {owner && s.member_role !== "owner" && (
                      <span className="flex flex-wrap items-center gap-2">
                        <form action={changeStaffRole} className="flex items-center gap-2">
                          <input type="hidden" name="lang" value={lang} />
                          <input type="hidden" name="organization_id" value={org.id} />
                          <input type="hidden" name="profile_id" value={s.profile_id} />
                          <label className="sr-only" htmlFor={`role-${s.profile_id}`}>{b.changeRole}</label>
                          <Select id={`role-${s.profile_id}`} name="member_role" defaultValue={s.member_role} className="py-2">
                            {Object.entries(t.orgRoles).filter(([k]) => k !== "owner").map(([k, label]) => (
                              <option key={k} value={k}>{label}</option>
                            ))}
                          </Select>
                          <Button type="submit" variant="secondary">{b.changeRole}</Button>
                        </form>
                        <form action={removeStaff}>
                          <input type="hidden" name="lang" value={lang} />
                          <input type="hidden" name="organization_id" value={org.id} />
                          <input type="hidden" name="profile_id" value={s.profile_id} />
                          <Button type="submit" variant="ghost">{b.remove}</Button>
                        </form>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {owner && (
                <div className="border-t border-line pt-4">
                  <h4 className="mb-2 font-bold">{b.addStaff}</h4>
                  <AddStaffForm lang={lang} orgId={org.id} t={t} />
                </div>
              )}
            </Card>
          </section>
        );
      })}
    </>
  );
}
