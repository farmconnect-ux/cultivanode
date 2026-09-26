import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content Security Policy without nonces, so pages stay statically generated (fast on 3G).
// Allowed: our own origin, Supabase (API + storage) and Sentry error reports.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.supabase.co",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://*.ingest.de.sentry.io",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Location and camera are needed later for farm mapping and crop photos (same origin only).
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(self), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  // The shared package ships TypeScript source; let Next compile it.
  transpilePackages: ["@tillmate/shared"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
