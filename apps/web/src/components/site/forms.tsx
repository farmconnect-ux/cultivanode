"use client";

import { useActionState } from "react";
import { joinWaitlist, sendContactMessage, type FormState } from "@/actions/forms";
import { Alert, Button, Field, Input, Select, TextArea } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { nigerianStates } from "@/config/site";

const initial: FormState = { status: "idle" };

/** Hidden from people (and screen readers); bots tend to fill it in. */
function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Company
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

type WaitlistProps = {
  lang: Locale;
  t: Dictionary["marketplace"];
  errors: Dictionary["forms"];
  optional: string;
};

export function WaitlistForm({ lang, t, errors, optional }: WaitlistProps) {
  const [state, action, pending] = useActionState(joinWaitlist, initial);
  if (state.status === "success") return <Alert>{t.success}</Alert>;
  const f = state.fields ?? {};
  const v = state.values ?? {};
  const err = (k?: keyof Dictionary["forms"]) => (k ? errors[k] : undefined);

  return (
    <form action={action} className="relative flex flex-col gap-5" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <Honeypot />
      {state.error && <Alert tone="danger">{errors[state.error]}</Alert>}

      <fieldset className="flex flex-col gap-2" aria-describedby={f.side ? "side-error" : undefined}>
        <legend className="mb-1 font-semibold">{t.side}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["buyer", "seller"] as const).map((side) => (
            <label
              key={side}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border-2 border-line bg-white px-4 py-3 has-[:checked]:border-leaf-600 has-[:checked]:bg-leaf-50"
            >
              <input type="radio" name="side" value={side} defaultChecked={v.side === side} className="size-5 accent-leaf-600" required />
              <span>{side === "buyer" ? t.sideBuyer : t.sideSeller}</span>
            </label>
          ))}
        </div>
        {f.side && (
          <p id="side-error" className="text-sm font-medium text-danger">
            {errors[f.side]}
          </p>
        )}
      </fieldset>

      <Field id="wl-name" label={t.name} error={err(f.name)}>
        <Input id="wl-name" name="name" autoComplete="name" required defaultValue={v.name} aria-invalid={Boolean(f.name)} aria-describedby={describedBy("wl-name", f.name)} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="wl-phone" label={t.phone} hint={t.phoneHint} error={err(f.phone)}>
          <Input id="wl-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={v.phone} aria-invalid={Boolean(f.phone)} aria-describedby={describedBy("wl-phone", f.phone, t.phoneHint)} />
        </Field>
        <Field id="wl-email" label={t.emailLabel} optional={optional} error={err(f.email)}>
          <Input id="wl-email" name="email" type="email" autoComplete="email" defaultValue={v.email} aria-invalid={Boolean(f.email)} aria-describedby={describedBy("wl-email", f.email)} />
        </Field>
      </div>
      <Field id="wl-state" label={t.state} optional={optional}>
        <Select id="wl-state" name="state" defaultValue={v.state ?? ""}>
          <option value="">{t.statePlaceholder}</option>
          {nigerianStates.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="wl-interest" label={t.interest} optional={optional}>
        <Input id="wl-interest" name="interest" placeholder={t.interestPlaceholder} defaultValue={v.interest} maxLength={500} />
      </Field>
      <p className="text-sm text-muted">{t.contactHint}</p>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t.sending : t.submit}
      </Button>
    </form>
  );
}

type ContactProps = {
  lang: Locale;
  t: Dictionary["contact"];
  errors: Dictionary["forms"];
  optional: string;
};

export function ContactForm({ lang, t, errors, optional }: ContactProps) {
  const [state, action, pending] = useActionState(sendContactMessage, initial);
  if (state.status === "success") return <Alert>{t.success}</Alert>;
  const f = state.fields ?? {};
  const v = state.values ?? {};
  const err = (k?: keyof Dictionary["forms"]) => (k ? errors[k] : undefined);

  return (
    <form action={action} className="relative flex flex-col gap-5" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <Honeypot />
      {state.error && <Alert tone="danger">{errors[state.error]}</Alert>}
      <Field id="ct-name" label={t.name} error={err(f.name)}>
        <Input id="ct-name" name="name" autoComplete="name" required defaultValue={v.name} aria-invalid={Boolean(f.name)} aria-describedby={describedBy("ct-name", f.name)} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="ct-phone" label={t.phone} hint={t.phoneHint} error={err(f.phone)}>
          <Input id="ct-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={v.phone} aria-invalid={Boolean(f.phone)} aria-describedby={describedBy("ct-phone", f.phone, t.phoneHint)} />
        </Field>
        <Field id="ct-email" label={t.emailLabel} optional={optional} error={err(f.email)}>
          <Input id="ct-email" name="email" type="email" autoComplete="email" defaultValue={v.email} aria-invalid={Boolean(f.email)} aria-describedby={describedBy("ct-email", f.email)} />
        </Field>
      </div>
      <Field id="ct-message" label={t.message} error={err(f.message)}>
        <TextArea id="ct-message" name="message" required maxLength={2000} defaultValue={v.message} aria-invalid={Boolean(f.message)} aria-describedby={describedBy("ct-message", f.message)} />
      </Field>
      <p className="text-sm text-muted">{t.contactHint}</p>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t.sending : t.submit}
      </Button>
    </form>
  );
}
