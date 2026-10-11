"use client";

import { NIGERIAN_STATES } from "@cultivanode/shared/places";
import { updateProfile } from "@/actions/account";
import { Button, Field, Input, Select } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import type { AccountProfile } from "@/lib/account/session";
import { localPhone } from "@/lib/text";
import { ActionForm } from "./action-form";

type T = Pick<Dictionary, "acct" | "onboarding">;

export function ProfileForm({ lang, profile, t }: { lang: Locale; profile: AccountProfile; t: T }) {
  const p = t.acct.profile;
  const o = t.onboarding;
  const locked = profile.verification_tier > 0;
  return (
    <ActionForm action={updateProfile} hidden={{ lang }} messages={[t.acct]} success={t.acct.saved}>
      {(pending) => (
        <>
          <Field id="full_name" label={o.fullName} hint={locked ? p.nameLocked : o.fullNameHint}>
            <Input id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} readOnly={locked}
                   aria-readonly={locked} className={locked ? "bg-surface-container-low" : undefined} aria-describedby="full_name-hint" />
          </Field>
          <Field id="phone" label={p.phone} hint={p.phoneHint}>
            <Input id="phone" value={localPhone(profile.phone)} readOnly className="bg-surface-container-low" aria-describedby="phone-hint" />
          </Field>
          <Field id="email" label={p.email} optional={o.consentOptional}>
            <Input id="email" name="email" type="email" autoComplete="email" defaultValue={profile.email ?? ""} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="state" label={o.state}>
              <Select id="state" name="state" defaultValue={profile.state ?? ""}>
                <option value="">{o.statePlaceholder}</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field id="lga" label={o.lga} optional={o.consentOptional}>
              <Input id="lga" name="lga" defaultValue={profile.lga ?? ""} />
            </Field>
          </div>
          <Field id="preferred_language" label={o.language}>
            <Select id="preferred_language" name="preferred_language" defaultValue={profile.preferred_language}>
              <option value="en">English</option>
              <option value="yo">Yorùbá</option>
              <option value="pcm">Naijá (Pidgin)</option>
            </Select>
          </Field>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? o.saving : p.save}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
