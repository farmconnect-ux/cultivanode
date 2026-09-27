// Crash reporting with Sentry. Off unless EXPO_PUBLIC_SENTRY_DSN is set, and even then no personal data
// is sent: no user identity, no request bodies, and every message passes through redact().
import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';
import { redact, redactString } from './redact';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
export const monitoringEnabled = Boolean(dsn);

export function initMonitoring(): void {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    sendDefaultPii: false,
    tracesSampleRate: 0,
    attachScreenshot: false,
    attachViewHierarchy: false,
    beforeSend(event) {
      delete event.user;
      delete event.request;
      if (event.message) event.message = redactString(event.message);
      for (const ex of event.exception?.values ?? []) {
        if (ex.value) ex.value = redactString(ex.value);
      }
      if (event.extra) event.extra = redact(event.extra);
      if (event.contexts) event.contexts = redact(event.contexts);
      event.breadcrumbs = event.breadcrumbs?.map((b) => redact(b));
      return event;
    },
    beforeBreadcrumb(crumb) {
      // Console output and network bodies can hold personal data; keep navigation and UI taps only.
      if (crumb.category === 'console' || crumb.category === 'xhr' || crumb.category === 'fetch') return null;
      return redact(crumb);
    },
  });
}

/** Wraps the root component so Sentry can catch render errors; a no-op when monitoring is off. */
export function withMonitoring(App: ComponentType): ComponentType {
  return dsn ? Sentry.wrap(App as ComponentType<Record<string, unknown>>) : App;
}

/** Reports an unexpected error. Pass a short event name and codes only, never personal data. */
export function reportError(event: string, error: unknown, data?: Record<string, string | number | boolean>): void {
  if (__DEV__) console.warn(event, redact(data ?? {}));
  if (!dsn) return;
  Sentry.withScope((scope) => {
    scope.setTag('event', event);
    if (data) scope.setExtras(redact(data));
    Sentry.captureException(error instanceof Error ? error : new Error(event));
  });
}
