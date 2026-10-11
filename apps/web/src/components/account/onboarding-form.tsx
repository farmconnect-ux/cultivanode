"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { NIGERIAN_STATES } from "@cultivanode/shared/places";
import { completeOnboarding, type OnboardingState } from "@/actions/onboarding";
import { Alert, Button, Card, Field, Input, Select, cx } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export type RoleOption = { role: string; auto_approve: boolean };

type Props = {
  lang: Locale;
  roles: RoleOption[];
  t: Pick<Dictionary, "onboarding" | "roleNames" | "roleHints" | "providerTypes" | "auth">;
};

/** Splits "I accept the {terms}." around a placeholder and puts a link in its place. */
function withLink(template: string, key: string, link: ReactNode): ReactNode {
  const [a, b] = template.split(`{${key}}`);
  return (
    <>
      {a}
      {link}
      {b}
    </>
  );
}

export function OnboardingForm({ lang, roles, t }: Props) {
  const o = t.onboarding;
  const [state, submit, saving] = useActionState(completeOnboarding, {} as OnboardingState);
  const v = state.values ?? {};
  const initialRoles = Array.isArray(v.roles) && v.roles.length > 0 ? v.roles : ["crop_farmer"];
  const [accountType, setAccountType] = useState(String(v.account_type ?? "individual"));
  const [chosen, setChosen] = useState<string[]>(initialRoles);
  const str = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");

  const toggle = (role: string) => setChosen((c) => (c.includes(role) ? c.filter((r) => r !== role) : [...c, role]));

  return (
    <form action={submit} className="flex flex-col gap-8" noValidate>
      <input type="hidden" name="lang" value={lang} />
      {state.error && <Alert tone="danger">{o[state.error]}</Alert>}

      <Card className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">{o.aboutYou}</h2>
        <Field id="full_name" label={o.fullName} hint={o.fullNameHint}>
          <Input id="full_name" name="full_name" autoComplete="name" defaultValue={str("full_name")} required
                 aria-describedby="full_name-hint" aria-invalid={state.error === "errorName" || undefined} />
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-semibold">{o.accountType}</legend>
          {(["individual", "business"] as const).map((type) => (
            <label key={type} className={cx("flex min-h-12 cursor-pointer items-start gap-3 rounded-md border-2 p-3",
              accountType === type ? "border-primary-container bg-surface-container-low" : "border-border bg-white")}>
              <input type="radio" name="account_type" value={type} checked={accountType === type}
                     onChange={() => setAccountType(type)} className="mt-1 size-5 accent-secondary" />
              <span>
                <span className="block font-semibold">{o[type]}</span>
                <span className="block text-sm text-on-surface-variant">{type === "individual" ? o.individualHint : o.businessHint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {accountType === "business" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="business_name" label={o.businessName}>
              <Input id="business_name" name="business_name" defaultValue={str("business_name")} required
                     aria-invalid={state.error === "errorBusiness" || undefined} />
            </Field>
            <Field id="cac_number" label={o.cacNumber} optional={o.consentOptional}>
              <Input id="cac_number" name="cac_number" defaultValue={str("cac_number")} />
            </Field>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="state" label={o.state}>
            <Select id="state" name="state" defaultValue={str("state")}>
              <option value="">{o.statePlaceholder}</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field id="lga" label={o.lga} optional={o.consentOptional}>
            <Input id="lga" name="lga" defaultValue={str("lga")} />
          </Field>
        </div>
        <Field id="language" label={o.language}>
          <Select id="language" name="language" defaultValue={str("language") || lang}>
            <option value="en">English</option>
            <option value="yo">Yorùbá</option>
            <option value="pcm">Naijá (Pidgin)</option>
          </Select>
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold">{o.rolesTitle}</h2>
          <p className="text-on-surface-variant">{o.rolesIntro}</p>
        </div>
        {state.error === "errorRoles" && <p className="font-medium text-critical">{o.errorRoles}</p>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {roles.map((r) => {
            const key = r.role as keyof typeof t.roleNames;
            const on = chosen.includes(r.role);
            return (
              <li key={r.role}>
                <label
                  htmlFor={`onboard-role-${r.role}`}
                  className={cx("flex h-full min-h-12 cursor-pointer items-start gap-3 rounded-md border-2 p-3",
                    on ? "border-primary-container bg-surface-container-low" : "border-border bg-white")}
                >
                  <input
                    id={`onboard-role-${r.role}`}
                    type="checkbox"
                    name="roles"
                    value={r.role}
                    checked={on}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggle(r.role);
                    }}
                    className="mt-1 size-5 accent-secondary"
                  />
                  <span>
                    <span className="block font-semibold">{t.roleNames[key]}</span>
                    <span className="block text-sm text-on-surface-variant">{t.roleHints[key]}</span>
                    <span className={cx("mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold",
                      r.auto_approve ? "bg-secondary-container/40 text-primary" : "bg-tertiary-fixed/60 text-[#b45309]")}>
                      {r.auto_approve ? o.autoApproved : o.needsReview}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {chosen.includes("service_provider") && (
          <Field id="provider_type" label={o.providerType} error={state.error === "errorProviderType" ? o.errorProviderType : undefined}>
            <Select id="provider_type" name="provider_type" defaultValue={str("provider_type")}
                    aria-invalid={state.error === "errorProviderType" || undefined}>
              <option value="">{o.providerTypePlaceholder}</option>
              {Object.entries(t.providerTypes).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </Select>
          </Field>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{o.consentTitle}</h2>
        {[
          { name: "consent_terms", label: withLink(o.consentTerms, "terms",
              <Link href={`/${lang}/terms`} target="_blank" className="font-semibold text-primary-container underline">{t.auth.terms}</Link>), required: true },
          { name: "consent_privacy", label: withLink(o.consentPrivacy, "privacy",
              <Link href={`/${lang}/privacy`} target="_blank" className="font-semibold text-primary-container underline">{t.auth.privacy}</Link>), required: true },
          { name: "consent_data", label: o.consentData, required: false },
          { name: "consent_marketing", label: o.consentMarketing, required: false },
        ].map((c) => (
          <label key={c.name} className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name={c.name} className="mt-1 size-5 shrink-0 accent-secondary"
                   aria-invalid={(c.required && state.error === "errorConsent") || undefined} />
            <span>
              {c.label}{" "}
              <span className="text-sm text-on-surface-variant">({c.required ? o.required : o.consentOptional})</span>
            </span>
          </label>
        ))}
      </Card>

      <Button type="submit" size="lg" disabled={saving} className="self-start">
        {saving ? o.saving : o.submit}
      </Button>
    </form>
  );
}
