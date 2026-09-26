"use client";

import { checkIdentity } from "@/actions/account";
import { Button, Field, Input, Select } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { ActionForm } from "./action-form";

type V = Dictionary["acct"]["verification"];

export function IdCheckForm({ lang, kind, t }: { lang: Locale; kind: "nin" | "bvn"; t: V }) {
  const id = `number-${kind}`;
  return (
    <ActionForm action={checkIdentity} hidden={{ lang, kind }} messages={[t.result, t.errors]} success={t.result.verified}>
      {(pending) => (
        <>
          <Field id={id} label={kind === "nin" ? t.nin : t.bvn} hint={kind === "nin" ? t.ninHint : t.bvnHint}>
            <Input id={id} name="number" inputMode="numeric" autoComplete="off" maxLength={11} pattern="[0-9]{11}"
                   required aria-describedby={`${id}-hint`} className="tracking-widest" />
          </Field>
          <Button type="submit" disabled={pending} className="self-start">{pending ? t.checking : t.check}</Button>
        </>
      )}
    </ActionForm>
  );
}

export function BankCheckForm({ lang, banks, t }: { lang: Locale; banks: { code: string; name: string }[]; t: V }) {
  return (
    <ActionForm action={checkIdentity} hidden={{ lang, kind: "bank_account" }} messages={[t.result, t.errors]} success={t.result.verified}>
      {(pending) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="bank_code" label={t.bankName}>
              <Select id="bank_code" name="bank_code" defaultValue="" required>
                <option value="">{t.bankPlaceholder}</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </Select>
            </Field>
            <Field id="account_number" label={t.accountNumber}>
              <Input id="account_number" name="number" inputMode="numeric" autoComplete="off" maxLength={10} pattern="[0-9]{10}"
                     required className="tracking-widest" />
            </Field>
          </div>
          <Button type="submit" disabled={pending} className="self-start">{pending ? t.checking : t.check}</Button>
        </>
      )}
    </ActionForm>
  );
}
