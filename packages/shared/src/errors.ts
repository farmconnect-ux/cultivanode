// Structured errors shared by web server code, mobile and Edge Functions.
//
// Rules (SECURITY.md): users see a message key, never SQL, stack traces, secrets or internal IDs.
// Technical detail goes to the server log / Sentry through `cause`, not to the client.

export const ERROR_CODES = [
  'validation',
  'unauthenticated',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
  'unavailable',
  'internal',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

/** Safe, translatable message keys. Apps map these to their dictionaries. */
export const ERROR_MESSAGE_KEYS: Record<ErrorCode, string> = {
  validation: 'errorValidation',
  unauthenticated: 'errorSignIn',
  forbidden: 'errorForbidden',
  not_found: 'errorNotFound',
  conflict: 'errorConflict',
  rate_limited: 'errorBusy',
  unavailable: 'errorUnavailable',
  internal: 'errorGeneric',
};

export class AppError extends Error {
  readonly code: ErrorCode;
  /** Field name -> message key, for form errors. */
  readonly fields: Record<string, string>;

  constructor(code: ErrorCode, options: { message?: string; fields?: Record<string, string>; cause?: unknown } = {}) {
    super(options.message ?? code);
    if (options.cause !== undefined) {
      (this as any).cause = options.cause;
    }
    this.name = 'AppError';
    this.code = code;
    this.fields = options.fields ?? {};
  }

  get messageKey(): string {
    return ERROR_MESSAGE_KEYS[this.code];
  }

  /** What may be sent to a client. */
  toPublic(): { code: ErrorCode; messageKey: string; fields: Record<string, string> } {
    return { code: this.code, messageKey: this.messageKey, fields: this.fields };
  }
}

/** Postgres SQLSTATE codes our database functions and constraints raise, mapped to app errors. */
const SQLSTATE_TO_CODE: Record<string, ErrorCode> = {
  '42501': 'forbidden', // RLS / permission checks
  '23505': 'conflict', // unique violation
  '23503': 'validation', // foreign key
  '23514': 'validation', // check constraint
  '22023': 'validation', // invalid parameter (raised by our functions)
  '22P02': 'validation', // invalid enum / text representation
  '54000': 'rate_limited', // raised by our rate limits
  P0002: 'not_found',
  P0001: 'conflict',
  PGRST301: 'unauthenticated', // expired / invalid JWT
};

/** Convert a Supabase/PostgREST error ({ code, message }) into an AppError, keeping the original as cause. */
export function fromDatabaseError(error: { code?: string | null; message?: string } | null | undefined): AppError {
  const code = (error?.code && SQLSTATE_TO_CODE[error.code]) || 'internal';
  return new AppError(code, { message: error?.message ?? 'database error', cause: error });
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
