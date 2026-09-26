// Shared input schemas (Zod). Web server actions, mobile screens and Edge Functions validate with
// the same schema, so a rule is written once. Issue messages are translation keys, not English text.
//
// The database still enforces its own constraints and permissions: these schemas give fast, friendly
// feedback and reject malformed input early, they are not the security boundary.

import { z } from 'zod';
import { Constants } from './database.types';
import { isValidEmail, normalizeNgPhone } from './phone';

const E = Constants.public.Enums;

/** Trims, and treats an empty string as "not given". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { message: 'errorTooLong' })
    .optional()
    .transform((v) => (v ? v : undefined));

export const fullNameSchema = z
  .string({ message: 'errorName' })
  .trim()
  .min(2, { message: 'errorName' })
  .max(120, { message: 'errorName' });

/** Nigerian phone number in any common format; output is 234XXXXXXXXXX or undefined. */
export const ngPhoneSchema = z
  .string()
  .trim()
  .max(30, { message: 'errorPhone' })
  .optional()
  .transform((v, ctx) => {
    const normalized = normalizeNgPhone(v);
    if (normalized === 'invalid') {
      ctx.addIssue({ code: 'custom', message: 'errorPhone' });
      return z.NEVER;
    }
    return normalized ?? undefined;
  });

export const emailSchema = z
  .string()
  .trim()
  .max(200, { message: 'errorEmail' })
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    if (!isValidEmail(v)) {
      ctx.addIssue({ code: 'custom', message: 'errorEmail' });
      return z.NEVER;
    }
    return v.toLowerCase();
  });

export const languageSchema = z.enum(E.app_language).catch('en');

/** People must leave a phone number or an email so we can reply. */
const needsContact = <T extends { phone?: string; email?: string }>(value: T, ctx: z.RefinementCtx) => {
  if (!value.phone && !value.email) {
    ctx.addIssue({ code: 'custom', message: 'errorContact', path: ['phone'] });
  }
};

export const waitlistSchema = z
  .object({
    side: z.enum(E.waitlist_side, { message: 'errorSide' }),
    name: fullNameSchema,
    phone: ngPhoneSchema,
    email: emailSchema,
    state: optionalText(60),
    interest: optionalText(500),
    lang: languageSchema,
  })
  .superRefine(needsContact);
export type WaitlistInput = z.output<typeof waitlistSchema>;

export const contactSchema = z
  .object({
    name: fullNameSchema,
    phone: ngPhoneSchema,
    email: emailSchema,
    message: z.string().trim().min(5, { message: 'errorMessage' }).max(2000, { message: 'errorTooLong' }),
    lang: languageSchema,
  })
  .superRefine(needsContact);
export type ContactInput = z.output<typeof contactSchema>;

export const roleRequestSchema = z
  .object({
    role: z.enum(E.app_role, { message: 'errorRole' }),
    providerType: z.enum(E.provider_type).optional(),
    details: z.record(z.string(), z.string().max(500)).default({}),
  })
  .superRefine((v, ctx) => {
    if ((v.role === 'service_provider') !== (v.providerType !== undefined)) {
      ctx.addIssue({ code: 'custom', message: 'errorProviderType', path: ['providerType'] });
    }
  });
export type RoleRequestInput = z.output<typeof roleRequestSchema>;

export const consentSchema = z.object({
  consentType: z.enum(E.consent_type),
  granted: z.boolean(),
  documentVersion: z.string().trim().min(1).max(40),
  channel: z.enum(['web', 'mobile', 'field_agent', 'sms', 'admin']).default('web'),
});
export type ConsentInput = z.output<typeof consentSchema>;

export const VERIFICATION_UPLOAD_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const,
};

export const verificationDocumentSchema = z.object({
  documentType: z.enum(E.verification_document_type),
  roleRequestId: z.uuid().optional(),
  mimeType: z.enum(VERIFICATION_UPLOAD_LIMITS.mimeTypes, { message: 'errorFileType' }),
  sizeBytes: z.number().int().min(1).max(VERIFICATION_UPLOAD_LIMITS.maxBytes, { message: 'errorFileSize' }),
});
export type VerificationDocumentInput = z.output<typeof verificationDocumentSchema>;

/** Flatten Zod issues to { field: messageKey } (first issue per field) for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form');
    if (!(field in out)) out[field] = issue.message;
  }
  return out;
}
