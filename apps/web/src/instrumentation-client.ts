// Browser-side monitoring. The Sentry SDK is downloaded only when NEXT_PUBLIC_SENTRY_DSN is set,
// so visitors on slow networks do not pay for it otherwise.
import { sentryDataCollection } from "./lib/sentry-privacy";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
      tracesSampleRate: 0.05,
      dataCollection: sentryDataCollection,
    });
  });
}
