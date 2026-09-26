// Runtime configuration helpers shared by server code (web server actions, Edge Functions).

export const PAYMENT_MODES = ['test', 'live'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

/**
 * PAYMENT_MODE decides which payment-provider keys and which ledger may be used.
 * - Missing or unknown values fall back to 'test' (never to real money).
 * - 'live' is refused unless the deployment is production AND LIVE_PAYMENTS_APPROVED=yes, which is
 *   set only after the legal/compliance review of the escrow structure (see docs/PAYMENTS.md).
 */
export function resolvePaymentMode(env: Record<string, string | undefined>): PaymentMode {
  const requested = env.PAYMENT_MODE === 'live' ? 'live' : 'test';
  if (requested === 'test') return 'test';
  const isProduction = env.VERCEL_ENV === 'production' || env.APP_ENV === 'production';
  if (!isProduction || env.LIVE_PAYMENTS_APPROVED !== 'yes') {
    throw new Error('PAYMENT_MODE=live requires a production deployment and LIVE_PAYMENTS_APPROVED=yes.');
  }
  return 'live';
}
