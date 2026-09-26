import type { init } from "@sentry/nextjs";

// What error reports may contain (NDPA; see docs/SECURITY.md): no user details, cookies, bodies or
// query strings, and only harmless request headers.
export const sentryDataCollection: NonNullable<Parameters<typeof init>[0]>["dataCollection"] = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: { allow: ["user-agent", "content-type", "accept-language"] }, response: false },
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
};
