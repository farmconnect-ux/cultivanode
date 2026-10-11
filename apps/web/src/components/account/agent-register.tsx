"use client";

import { useActionState, useState } from "react";
import { NIGERIAN_STATES } from "@cultivanode/shared/places";
import { agentRegister, agentSendCode, type ActionState } from "@/actions/account";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { messageFor } from "./action-form";

type T = Pick<Dictionary, "acct" | "onboarding" | "roleNames" | "auth">;

/** Two steps: text a code to the farmer, then register them with the code they read back. */
export function AgentRegister({ lang, t, defaultState }: { lang: Locale; t: T; defaultState?: string | null }) {
  const g = t.acct.agent;
  const o = t.onboarding;
  const [round, setRound] = useState(0);
  return <Flow key={round} lang={lang} t={t} g={g} o={o} defaultState={defaultState} restart={() => setRound((r) => r + 1)} />;
}

function Flow({ lang, t, g, o, defaultState, restart }: {
  lang: Locale; t: T; g: T["acct"]["agent"]; o: T["onboarding"]; defaultState?: string | null; restart: () => void;
}) {
  const [sent, send, sending] = useActionState(agentSendCode, {} as ActionState);
  const [done, register, registering] = useActionState(agentRegister, {} as ActionState);
  const phone = sent.data?.phone ?? "";
  const errorText = (s: ActionState) => (s.ok === false ? messageFor(s.error, [g.errors]) : undefined);

  if (done.ok) {
    return (
      <div className="flex flex-col gap-4">
        <Alert>{g.registered}</Alert>
        <Button variant="secondary" onClick={restart} className="self-start">{g.startAgain}</Button>
      </div>
    );
  }

  if (!sent.ok) {
    return (
      <form action={send} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="lang" value={lang} />
        <h3 className="font-bold">{g.step1}</h3>
        {errorText(sent) && <Alert tone="danger">{errorText(sent)}</Alert>}
        <Field id="farmer-phone" label={t.auth.phone} hint={t.auth.phoneHint}>
          <Input id="farmer-phone" name="phone" type="tel" inputMode="tel" defaultValue={phone} required aria-describedby="farmer-phone-hint" />
        </Field>
        <Button type="submit" disabled={sending} className="self-start">{sending ? t.auth.sending : g.sendCode}</Button>
      </form>
    );
  }

  return (
    <form action={register} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="phone" value={phone} />
      <Alert>{g.codeSent}</Alert>
      <h3 className="font-bold">{g.step2}</h3>
      {errorText(done) && <Alert tone="danger">{errorText(done)}</Alert>}
      <Field id="farmer-name" label={o.fullName} hint={o.fullNameHint}>
        <Input id="farmer-name" name="full_name" required aria-describedby="farmer-name-hint" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="farmer-state" label={o.state}>
          <Select id="farmer-state" name="state" defaultValue={defaultState ?? ""}>
            <option value="">{o.statePlaceholder}</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field id="farmer-lga" label={o.lga} optional={o.consentOptional}>
          <Input id="farmer-lga" name="lga" />
        </Field>
      </div>
      <Field id="farmer-language" label={o.language}>
        <Select id="farmer-language" name="language" defaultValue="yo">
          <option value="yo">Yorùbá</option>
          <option value="en">English</option>
          <option value="pcm">Naijá (Pidgin)</option>
        </Select>
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">{o.rolesTitle}</legend>
        {(["crop_farmer", "animal_farmer"] as const).map((r) => (
          <label key={r} className="flex items-center gap-3">
            <input type="checkbox" name="roles" value={r} defaultChecked={r === "crop_farmer"} className="size-5 accent-secondary" />
            {t.roleNames[r]}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-3 rounded-md bg-surface-container-low p-4">
        <p className="font-medium">{g.readTerms}</p>
        {[
          { name: "consent_terms", label: g.farmerAccepts },
          { name: "consent_data", label: g.farmerData },
          { name: "consent_marketing", label: g.farmerMarketing },
        ].map((c) => (
          <label key={c.name} className="flex items-start gap-3">
            <input type="checkbox" name={c.name} className="mt-1 size-5 shrink-0 accent-secondary" />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
      <Field id="farmer-code" label={g.farmerCode}>
        <Input id="farmer-code" name="code" inputMode="numeric" autoComplete="off" maxLength={6} required
               className="text-center text-2xl tracking-[0.5em]" />
      </Field>
      <Button type="submit" disabled={registering} className="self-start">{registering ? o.saving : g.register}</Button>
    </form>
  );
}
