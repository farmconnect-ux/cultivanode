import { describe, expect, it } from 'vitest';
import {
  AppError,
  brand,
  logoSvg,
  contactSchema,
  fieldErrors,
  fromDatabaseError,
  resolvePaymentMode,
  roleRequestSchema,
  verificationDocumentSchema,
  waitlistSchema,
} from '../index';

describe('waitlistSchema', () => {
  it('accepts a buyer with a Nigerian phone number and normalises it', () => {
    const r = waitlistSchema.safeParse({ side: 'buyer', name: '  Funke  ', phone: '0803 123 4567', lang: 'yo' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.phone).toBe('2348031234567');
      expect(r.data.name).toBe('Funke');
      expect(r.data.email).toBeUndefined();
      expect(r.data.lang).toBe('yo');
    }
  });
  it('needs a phone number or an email', () => {
    const r = waitlistSchema.safeParse({ side: 'seller', name: 'Tunde' });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error)).toEqual({ phone: 'errorContact' });
  });
  it('reports each bad field with a translation key', () => {
    const r = waitlistSchema.safeParse({ side: 'farmer', name: 'A', phone: '12345', email: 'nope' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(fieldErrors(r.error)).toMatchObject({ side: 'errorSide', name: 'errorName', phone: 'errorPhone', email: 'errorEmail' });
    }
  });
  it('falls back to English for an unknown language', () => {
    const r = waitlistSchema.safeParse({ side: 'buyer', name: 'Ada', email: 'ada@example.com', lang: 'xx' });
    expect(r.success && r.data.lang).toBe('en');
  });
});

describe('contactSchema', () => {
  it('requires a real message', () => {
    const r = contactSchema.safeParse({ name: 'Ada', email: 'ada@example.com', message: 'hi' });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error)).toEqual({ message: 'errorMessage' });
  });
  it('lower-cases the email address', () => {
    const r = contactSchema.safeParse({ name: 'Ada', email: 'Ada@Example.com', message: 'Hello there' });
    expect(r.success && r.data.email).toBe('ada@example.com');
  });
});

describe('roleRequestSchema', () => {
  it('requires a provider type exactly for service providers', () => {
    expect(roleRequestSchema.safeParse({ role: 'service_provider' }).success).toBe(false);
    expect(roleRequestSchema.safeParse({ role: 'service_provider', providerType: 'mechanic' }).success).toBe(true);
    expect(roleRequestSchema.safeParse({ role: 'machinery_owner', providerType: 'mechanic' }).success).toBe(false);
  });
  it('rejects roles that do not exist', () => {
    expect(roleRequestSchema.safeParse({ role: 'admin' }).success).toBe(false);
  });
});

describe('verificationDocumentSchema', () => {
  it('matches the database limits (images/PDF, 5 MB)', () => {
    expect(verificationDocumentSchema.safeParse({ documentType: 'national_id', mimeType: 'application/pdf', sizeBytes: 1000 }).success).toBe(true);
    expect(verificationDocumentSchema.safeParse({ documentType: 'national_id', mimeType: 'text/html', sizeBytes: 1000 }).success).toBe(false);
    expect(verificationDocumentSchema.safeParse({ documentType: 'national_id', mimeType: 'image/png', sizeBytes: 6_000_000 }).success).toBe(false);
  });
});

describe('errors', () => {
  it('maps database errors to safe codes without leaking the message', () => {
    const e = fromDatabaseError({ code: '42501', message: 'new row violates row-level security policy for table "farms"' });
    expect(e.code).toBe('forbidden');
    expect(e.toPublic()).toEqual({ code: 'forbidden', messageKey: 'errorForbidden', fields: {} });
    expect(JSON.stringify(e.toPublic())).not.toContain('farms');
  });
  it('maps our rate limit and unknown errors', () => {
    expect(fromDatabaseError({ code: '54000' }).code).toBe('rate_limited');
    expect(fromDatabaseError({ code: 'XX000' }).code).toBe('internal');
    expect(fromDatabaseError(null).code).toBe('internal');
  });
  it('is an Error with a cause', () => {
    const cause = new Error('socket hang up');
    const e = new AppError('unavailable', { cause });
    expect(e).toBeInstanceOf(Error);
    expect(e.cause).toBe(cause);
  });
});

describe('payment mode', () => {
  it('defaults to test', () => {
    expect(resolvePaymentMode({})).toBe('test');
    expect(resolvePaymentMode({ PAYMENT_MODE: 'LIVE' })).toBe('test');
  });
  it('refuses live money outside an approved production deployment', () => {
    expect(() => resolvePaymentMode({ PAYMENT_MODE: 'live' })).toThrow();
    expect(() => resolvePaymentMode({ PAYMENT_MODE: 'live', VERCEL_ENV: 'production' })).toThrow();
    expect(resolvePaymentMode({ PAYMENT_MODE: 'live', VERCEL_ENV: 'production', LIVE_PAYMENTS_APPROVED: 'yes' })).toBe('live');
  });
});

describe('brand', () => {
  it('uses the final name with its capital N and the agreed taglines', () => {
    expect(brand.name).toBe('CultivaNode');
    expect(brand.tagline).toBe('Connected intelligence for agriculture');
    expect(brand.promise).toBe("Your farm's working partner");
  });

  it('draws the logo as a standalone SVG', () => {
    expect(logoSvg()).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 40 40">/);
    expect(logoSvg({ background: false })).not.toContain('<rect');
  });
});
