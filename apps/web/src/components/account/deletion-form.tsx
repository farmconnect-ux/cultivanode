"use client";

import { requestDeletion } from "@/actions/account";
import { Button, Field, TextArea } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { ActionForm } from "./action-form";

export function DeletionForm({ lang, t }: { lang: Locale; t: Pick<Dictionary, "acct" | "onboarding"> }) {
  const p = t.acct.privacy;
  return (
    <ActionForm action={requestDeletion} hidden={{ lang }} messages={[t.acct]} success={p.deleteSent}>
      {(pending) => (
        <>
          <Field id="reason" label={p.deleteReason}>
            <TextArea id="reason" name="reason" maxLength={1000} />
          </Field>
          <Button type="submit" variant="secondary" disabled={pending} className="self-start border-danger text-danger hover:bg-red-50">
            {p.deleteButton}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
