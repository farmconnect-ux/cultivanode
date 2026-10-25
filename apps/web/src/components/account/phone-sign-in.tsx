"use client";

import { useActionState, useEffect, useState } from "react";
import { requestCode, verifyCode, type AuthMethod, type AuthState } from "@/actions/auth";
import { Icon } from "@/components/ds/icon";
import { Alert, Button, Field, Input, cx } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { fill, localPhone } from "@/lib/text";

const RESEND_AFTER_SECONDS = 60;

type T = Dictionary["auth"];

/** Phone or email, then the 6-digit code. Works without JavaScript for the first step (plain form post). */
export function PhoneSignIn({ lang, t, next = "", as = "" }: { lang: Locale; t: T; next?: string; as?: string }) {
  const [state, send, sending] = useActionState(requestCode, { step: "input", method: "phone" } as AuthState);
  const [method, setMethod] = useState<AuthMethod>(state.method ?? "phone");

  // Follow the method the action came back with (e.g. after an error), adjusting state while rendering
  // instead of in an effect, so there's no extra render pass.
  const [methodFrom, setMethodFrom] = useState(state.method);
  if (state.method && state.method !== methodFrom) {
    setMethodFrom(state.method);
    setMethod(state.method);
  }

  if (state.step === "code") return <CodeStep key={state.sentAt} lang={lang} t={t} start={state} next={next} as={as} />;

  return (
    <div className="flex flex-col gap-5">
      {/* Method switcher tabs */}
      <div role="tablist" aria-label="Sign-in method" className="grid grid-cols-2 gap-1 rounded-xl bg-surface-container-low p-1">
        <button
          type="button"
          role="tab"
          id="auth-tab-phone"
          aria-selected={method === "phone"}
          aria-controls="auth-panel-phone"
          onClick={() => setMethod("phone")}
          className={cx(
            "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 font-label-lg text-label-lg transition-all duration-150",
            method === "phone"
              ? "bg-surface-container-lowest text-primary shadow-card"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <Icon name="smartphone" className="text-lg" />
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
            "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 font-label-lg text-label-lg transition-all duration-150",
            method === "email"
              ? "bg-surface-container-lowest text-primary shadow-card"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <Icon name="mail" className="text-lg" />
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
              <div className="flex gap-2">
                <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-input bg-surface-container-low px-3 font-label-lg text-label-lg text-on-surface" aria-hidden>
                  <span className="text-base leading-none">🇳🇬</span> +234
                </span>
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
                placeholder="0803 000 0000"
                className="h-11 tnum"
              />
              </div>
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
                placeholder="you@farm.ng"
                className="h-11"
              />
            </Field>
          </div>
        )}

        <Button type="submit" size="lg" disabled={sending} className="w-full">
          <Icon name={sending ? "progress_activity" : "lock"} className={cx("text-lg", sending && "animate-spin")} />
          {sending ? t.sending : t.sendCode}
          {!sending && <Icon name="arrow_forward" className="text-lg" />}
        </Button>
      </form>
    </div>
  );
}

function CodeStep({ lang, t, start, next, as }: { lang: Locale; t: T; start: Extract<AuthState, { step: "code" }>; next: string; as: string }) {
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
      <p role="status" className="flex items-start gap-2 rounded-xl bg-positive-soft px-3 py-2.5 text-body-sm font-medium text-[#065f46]">
        <Icon name="mark_email_read" className="mt-px text-lg" />
        {isEmail
          ? fill(t.codeSentToEmail, { email: displayTarget })
          : fill(t.codeSentTo, { phone: displayTarget })}
      </p>
      {error && <Alert tone="danger">{t[error]}</Alert>}
      <form action={verify} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="as" value={as} />
        <Field id="code" label={t.code}>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            pattern="[0-9]{6,10}"
            required
            autoFocus
            placeholder="••••••"
            className="h-14 text-center font-metric-num text-metric-num tracking-[0.5em] tnum"
            aria-invalid={state.error === "errorCode" || state.error === "errorWrongCode" || undefined}
          />
        </Field>
        <Button type="submit" size="lg" disabled={checking} className="w-full">
          <Icon name={checking ? "progress_activity" : "verified_user"} className={cx("text-lg", checking && "animate-spin")} />
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
          <p className="flex items-center gap-1.5 text-body-sm text-on-surface-variant" aria-live="off">
            <Icon name="timer" className="text-base" />
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
