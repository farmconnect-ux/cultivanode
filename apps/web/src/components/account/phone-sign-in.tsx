"use client";

import { useActionState, useEffect, useState } from "react";
import { requestCode, verifyCode, type AuthState } from "@/actions/auth";
import { Alert, Button, Field, Input } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { fill, localPhone } from "@/lib/text";

const RESEND_AFTER_SECONDS = 60;

type T = Dictionary["auth"];

/** Phone number, then the SMS code. Works without JavaScript for the first step (plain form post). */
export function PhoneSignIn({ lang, t }: { lang: Locale; t: T }) {
  const [state, send, sending] = useActionState(requestCode, { step: "phone" } as AuthState);
  if (state.step === "code") return <CodeStep key={state.sentAt} lang={lang} t={t} start={state} />;
  return (
    <form action={send} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      {state.error && <Alert tone="danger">{t[state.error]}</Alert>}
      <Field id="phone" label={t.phone} hint={t.phoneHint}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={state.raw}
          required
          aria-invalid={state.error === "errorPhone" || undefined}
          aria-describedby="phone-hint"
        />
      </Field>
      <Button type="submit" size="lg" disabled={sending}>
        {sending ? t.sending : t.sendCode}
      </Button>
    </form>
  );
}

function CodeStep({ lang, t, start }: { lang: Locale; t: T; start: Extract<AuthState, { step: "code" }> }) {
  const [state, verify, checking] = useActionState(verifyCode, start as AuthState);
  const [resent, resend, resending] = useActionState(requestCode, start as AuthState);
  const sentAt = resent.step === "code" ? resent.sentAt : start.sentAt;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const wait = Math.max(0, RESEND_AFTER_SECONDS - Math.floor((now - sentAt) / 1000));
  const error = state.error ?? (resent !== start ? resent.error : undefined);

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="font-medium">
        {fill(t.codeSentTo, { phone: localPhone(start.phone) })}
      </p>
      {error && <Alert tone="danger">{t[error]}</Alert>}
      <form action={verify} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="lang" value={lang} />
        <Field id="code" label={t.code}>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]{6}"
            required
            autoFocus
            className="text-center text-2xl tracking-[0.5em]"
            aria-invalid={state.error === "errorCode" || state.error === "errorWrongCode" || undefined}
          />
        </Field>
        <Button type="submit" size="lg" disabled={checking}>
          {checking ? t.checking : t.verify}
        </Button>
      </form>
      <form action={resend} className="flex flex-col gap-2">
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="phone" value={start.phone} />
        {wait > 0 ? (
          <p className="text-sm text-muted" aria-live="off">
            {fill(t.resendIn, { seconds: wait })}
          </p>
        ) : (
          <Button type="submit" variant="secondary" disabled={resending}>
            {resending ? t.sending : t.resend}
          </Button>
        )}
      </form>
      <Button variant="ghost" onClick={() => window.location.reload()}>
        {t.changeNumber}
      </Button>
    </div>
  );
}
