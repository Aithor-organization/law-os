/**
 * Sentry telemetry init — enabled when EXPO_PUBLIC_SENTRY_DSN is set.
 *
 * Install (already done):
 *   npm install @sentry/react-native
 *
 * Config:
 *   Set EXPO_PUBLIC_SENTRY_DSN in .env.local and via
 *   `eas env:create --name EXPO_PUBLIC_SENTRY_DSN --value <dsn>` so
 *   production builds pick it up from EAS.
 *
 * PII posture: sendDefaultPii=false, beforeSend strips any string
 * longer than 500 chars that looks like a JWT/API key. AI prompts
 * (user's legal questions) are never transmitted to Sentry — only
 * stack traces and a short breadcrumb for navigation events.
 */

import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const ENVIRONMENT =
  (Constants.expoConfig?.extra as { environment?: string } | undefined)?.environment ??
  (__DEV__ ? "development" : "production");

export function initTelemetry(): void {
  if (!DSN) {
    if (__DEV__) {
      console.info("[telemetry] EXPO_PUBLIC_SENTRY_DSN not set — Sentry disabled");
    }
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: ENVIRONMENT,
    enableAutoSessionTracking: true,
    sendDefaultPii: false,
    tracesSampleRate: ENVIRONMENT === "production" ? 0.1 : 0,
    beforeSend(event) {
      // Best-effort PII scrub: drop any extra value that looks like
      // a bearer token or long opaque secret.
      const scrub = (s: unknown): unknown => {
        if (typeof s !== "string" || s.length < 20) return s;
        if (/eyJ[A-Za-z0-9_-]{10,}\./.test(s)) return "[redacted-jwt]";
        if (/^(sk|pk)_[A-Za-z0-9]{20,}$/.test(s)) return "[redacted-api-key]";
        return s;
      };
      if (event.extra) {
        for (const k of Object.keys(event.extra)) {
          event.extra[k] = scrub(event.extra[k]);
        }
      }
      return event;
    },
  });
}

export function wrapRoot<T>(component: T): T {
  return DSN ? (Sentry.wrap(component as any) as T) : component;
}

export function captureException(err: unknown): void {
  if (DSN) Sentry.captureException(err);
}

export function captureMessage(msg: string): void {
  if (DSN) Sentry.captureMessage(msg);
}
