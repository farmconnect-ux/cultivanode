"use client";

import { useActionState, useEffect, useState } from "react";
import { requestCode, verifyCode, type AuthMethod, type AuthState } from "@/actions/auth";
import { Alert, Button, Field, Input, cx } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { fill, localPhone } from "@/lib/text";

const RESEND_AFTER_SECONDS = 60;

type T = Dictionary["auth"];

/** Phone or email, then the 6-digit code. Works without JavaScript for the first step (plain form post). */
export function PhoneSignIn({ lang, t }: { lang: Locale; t: T }) {
  const [state, send, sending] = useActionState(requestCode, { step: "input", method: "phone" } as AuthState);
  const [method, setMethod] = useState<AuthMethod>(state.method ?? "phone");

  // Keep method in sync if action returns with a different method (e.g. from an error state)
  useEffect(() => {
    if (state.method) setMethod(state.method);
  }, [state.method]);

  if (state.step === "code") return <CodeStep key={state.sentAt} lang={lang} t={t} start={state} />;

  return (
    <div className="flex flex-col gap-5">
      {/* Method switcher tabs */}
      <div role="tablist" aria-label="Sign-in method" className="grid grid-cols-2 p-1 bg-stone-100 rounded-lg">
        <button
          type="button"
          role="tab"
          id="auth-tab-phone"
          aria-selected={method === "phone"}
          aria-controls="auth-panel-phone"
          onClick={() => setMethod("phone")}
          className={cx(
            "py-2 text-sm font-semibold rounded-md transition-all text-center",
            method === "phone"
              ? "bg-white text-leaf-800 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          )}
        >
          {t.usePhone}
        </button>
        <button
          type="button"
          role="tab"
          id="auth-tab-email"
          aria-selected={method === "email"}
          aria-controls="auth-panel-email"
          onClick={() => setMethod("email")}
          className={cx(
            "py-2 text-sm font-semibold rounded-md transition-all text-center",
            method === "email"
              ? "bg-white text-leaf-800 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          )}
        >
          {t.useEmail}
        </button>
      </div>

      <form action={send} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="method" value={method} />
        {state.error && <Alert tone="danger">{t[state.error]}</Alert>}

        {method === "phone" ? (
          <div id="auth-panel-phone" role="tabpanel" aria-labelledby="auth-tab-phone">
            <Field id="phone" label={t.phone} hint={t.phoneHint}>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                defaultValue={state.method === "phone" ? state.raw : undefined}
                required
                aria-invalid={state.error === "errorPhone" || undefined}
                aria-describedby="phone-hint"
              />
            </Field>
          </div>
        ) : (
          <div id="auth-panel-email" role="tabpanel" aria-labelledby="auth-tab-email">
            <Field id="email" label={t.email} hint={t.emailHint}>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                defaultValue={state.method === "email" ? state.raw : undefined}
                required
                aria-invalid={state.error === "errorEmail" || undefined}
                aria-describedby="email-hint"
              />
            </Field>
          </div>
        )}

        <Button type="submit" size="lg" disabled={sending}>
          {sending ? t.sending : t.sendCode}
        </Button>
      </form>
    </div>
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
  const isEmail = start.method === "email";
  const displayTarget = isEmail ? (start.email ?? start.target) : localPhone(start.phone ?? start.target);

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="font-medium">
        {isEmail
          ? fill(t.codeSentToEmail, { email: displayTarget })
          : fill(t.codeSentTo, { phone: displayTarget })}
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
        <input type="hidden" name="method" value={start.method} />
        {isEmail ? (
          <input type="hidden" name="email" value={start.email ?? start.target} />
        ) : (
          <input type="hidden" name="phone" value={start.phone ?? start.target} />
        )}
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
        {isEmail ? t.changeEmail : t.changeNumber}
      </Button>
    </div>
  );
}
