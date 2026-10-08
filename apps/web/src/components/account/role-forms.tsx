"use client";

import { useState } from "react";
import { requestRole, uploadDocument } from "@/actions/account";
import { Button, Field, Input, Select, TextArea } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { ActionForm } from "./action-form";

type T = Pick<Dictionary, "acct" | "onboarding" | "roleNames" | "providerTypes" | "documentTypes">;

export function RequestRoleForm({
  lang,
  roles,
  initialRole,
  t,
}: {
  lang: Locale;
  roles: string[];
  initialRole?: string;
  t: T;
}) {
  const r = t.acct.roles;
  const defaultSelected = initialRole && roles.includes(initialRole) ? initialRole : (roles[0] ?? "");
  const [role, setRole] = useState(defaultSelected);

  const isInstant = role === "crop_farmer" || role === "animal_farmer";

  return (
    <ActionForm action={requestRole} hidden={{ lang }} messages={[r, t.onboarding, t.acct]} success={r.requestSent}>
      {(pending) => (
        <>
          <Field id="role" label={t.onboarding.rolesTitle}>
            <Select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((k) => (
                <option key={k} value={k}>
                  {t.roleNames[k as keyof T["roleNames"]]}
                  {k === "crop_farmer" || k === "animal_farmer" ? " (Instant Activation)" : " (Requires Review)"}
                </option>
              ))}
            </Select>
          </Field>

          <div className="rounded-lg border border-line bg-surface/50 p-3 text-xs">
            <span className="font-semibold text-ink">
              {isInstant ? "⚡ Instant Role Activation:" : "🛡️ Verification Review Required:"}
            </span>{" "}
            <span className="text-muted">
              {isInstant
                ? "This role will be approved immediately upon submission so you can access tools without waiting."
                : "This role requires review or supporting verification documents before it is activated."}
            </span>
          </div>

          {role === "service_provider" && (
            <Field id="provider_type" label={t.onboarding.providerType}>
              <Select id="provider_type" name="provider_type" defaultValue="">
                <option value="">{t.onboarding.providerTypePlaceholder}</option>
                {Object.entries(t.providerTypes).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field id="details" label={r.details} hint={r.detailsHint} optional={t.onboarding.consentOptional}>
            <TextArea id="details" name="details" maxLength={500} aria-describedby="details-hint" />
          </Field>
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? t.onboarding.saving : isInstant ? "Activate Role Instantly" : r.requestButton}
          </Button>
        </>
      )}
    </ActionForm>
  );
}

export function UploadDocumentForm({ lang, requestId, t }: { lang: Locale; requestId: string; t: T }) {
  const r = t.acct.roles;
  const id = `doc-${requestId}`;
  return (
    <ActionForm action={uploadDocument} hidden={{ lang, request_id: requestId }} messages={[r, t.acct]} success={r.uploaded}
                className="rounded-md bg-cream p-4">
      {(pending) => (
        <>
          <p className="font-semibold">{r.upload}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${id}-type`} label={r.documentType}>
              <Select id={`${id}-type`} name="document_type" defaultValue="national_id">
                {Object.entries(t.documentTypes).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field id={`${id}-file`} label={r.file}>
              <Input id={`${id}-file`} name="file" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf"
                     capture="environment" className="py-2" />
            </Field>
          </div>
          <Button type="submit" variant="secondary" disabled={pending} className="self-start">
            {pending ? r.uploading : r.uploadButton}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
