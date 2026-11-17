import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content Security Policy without nonces, so pages stay statically generated (fast on 3G).
// Allowed: our own origin, Supabase (API + storage) and Sentry error reports.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.supabase.co https://github.com https://avatars.githubusercontent.com",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://api.github.com",
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
  transpilePackages: ["@cultivanode/shared"],
  poweredByHeader: false,
  experimental: {
    // ID documents and equipment photos up to 5 MB are uploaded through a server action (see actions/account.ts).
    serverActions: { bodySizeLimit: "6mb" },
    cpus: 1,
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      {
        source: "/download/android",
        destination: "https://github.com/farmconnect-ux/cultivanode-android/releases/latest/download/cultivanode.apk",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
