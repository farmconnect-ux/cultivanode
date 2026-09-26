// Server-side monitoring. Sentry starts only when SENTRY_DSN is set (see .env.example).
import * as Sentry from "@sentry/nextjs";
import { sentryDataCollection } from "./lib/sentry-privacy";

export async function register() {
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    dataCollection: sentryDataCollection,
  });
}

export const onRequestError = Sentry.captureRequestError;
