"use client";

import { addStaff, updateBusiness } from "@/actions/account";
import { Button, Field, Input, Select } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { ActionForm } from "./action-form";

type T = Pick<Dictionary, "acct" | "orgRoles" | "onboarding">;

export function BusinessDetailsForm({ lang, org, t }: { lang: Locale; org: { id: string; name: string; cac_number: string | null }; t: T }) {
  const b = t.acct.business;
  return (
    <ActionForm action={updateBusiness} hidden={{ lang, organization_id: org.id }} messages={[t.acct]} success={t.acct.saved}>
      {(pending) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="biz-name" label={b.name}>
              <Input id="biz-name" name="name" defaultValue={org.name} required />
            </Field>
            <Field id="biz-cac" label={b.cac} optional={t.onboarding.consentOptional}>
              <Input id="biz-cac" name="cac_number" defaultValue={org.cac_number ?? ""} />
            </Field>
          </div>
          <Button type="submit" variant="secondary" disabled={pending} className="self-start">{b.save}</Button>
        </>
      )}
    </ActionForm>
  );
}

export function AddStaffForm({ lang, orgId, t }: { lang: Locale; orgId: string; t: T }) {
  const b = t.acct.business;
  return (
    <ActionForm action={addStaff} hidden={{ lang, organization_id: orgId }} messages={[b, t.acct]} success={b.added}>
      {(pending) => (
        <>
          <p className="text-sm text-muted">{b.addStaffHint}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="staff-phone" label={b.staffPhone}>
              <Input id="staff-phone" name="phone" type="tel" inputMode="tel" required />
            </Field>
            <Field id="staff-role" label={b.staffRole}>
              <Select id="staff-role" name="member_role" defaultValue="worker">
                {Object.entries(t.orgRoles).filter(([k]) => k !== "owner").map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" disabled={pending} className="self-start">{b.add}</Button>
        </>
      )}
    </ActionForm>
  );
}
