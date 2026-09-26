// Error monitoring adapter. Code reports problems here, never to a vendor SDK directly, so the
// provider can change. Today: Sentry when SENTRY_DSN is set, otherwise the structured log only.

import * as Sentry from "@sentry/nextjs";
import { isAppError } from "@cultivanode/shared";
import { logger, redact } from "./logger";

export type Area = "auth" | "forms" | "payments" | "bookings" | "sync" | "ai" | "weather" | "database" | "other";

export function reportError(error: unknown, context: { area: Area; action: string; extra?: Record<string, unknown> }) {
  const appError = isAppError(error) ? error : undefined;
  const cause = appError?.cause as { code?: string; message?: string } | undefined;

  logger.error(`${context.area}.${context.action}`, {
    code: appError?.code ?? "internal",
    cause: cause ? { code: cause.code, message: cause.message } : String(error),
    ...(context.extra ?? {}),
  });

  // Expected user errors (bad input, rate limits) are not incidents.
  if (appError && ["validation", "rate_limited", "forbidden", "not_found", "conflict"].includes(appError.code)) return;

  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setTag("area", context.area);
      scope.setTag("action", context.action);
      if (context.extra) scope.setContext("extra", redact(context.extra) as Record<string, unknown>);
      Sentry.captureException(error);
    });
  }
}
