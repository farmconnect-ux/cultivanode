"use client";

import { useActionState } from "react";
import { sendSignInCode, verifySignInCode, type SignInState } from "@/actions/admin-auth";
import { Alert, Button, Field, Input } from "@/components/ui";

export function AdminSignInForm() {
  const [phoneState, sendCode, sending] = useActionState(sendSignInCode, { step: "phone" } as SignInState);

  if (phoneState.step === "code") return <CodeStep start={phoneState} />;

  return (
    <form action={sendCode} className="flex flex-col gap-4" noValidate>
      {phoneState.error && <Alert tone="danger">{phoneState.error}</Alert>}
      <Field id="phone" label="Phone number" hint="The number on your staff account.">
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={phoneState.phone}
          required
          aria-describedby={phoneState.error ? undefined : "phone-hint"}
        />
      </Field>
      <Button type="submit" disabled={sending}>
        {sending ? "Sending..." : "Send code"}
      </Button>
    </form>
  );
}

function CodeStep({ start }: { start: Extract<SignInState, { step: "code" }> }) {
  const [state, verify, checking] = useActionState(verifySignInCode, start as SignInState);
  const local = `0${start.phone.slice(3)}`;
  return (
    <form action={verify} className="flex flex-col gap-4" noValidate>
      <p role="status">Code sent to {local.slice(0, 4)} {local.slice(4, 7)} {local.slice(7)}.</p>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Field id="code" label="6-digit code">
        <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required autoFocus />
      </Field>
      <Button type="submit" disabled={checking}>
        {checking ? "Checking..." : "Sign in"}
      </Button>
      {/* A full reload starts the form again (new number, or a fresh code). */}
      <Button variant="ghost" onClick={() => window.location.reload()}>
        Use a different number or resend
      </Button>
    </form>
  );
}
