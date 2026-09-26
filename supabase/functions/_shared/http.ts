// JSON responses and CORS for functions called from the web and mobile apps.

// Browsers call these functions from the website; the Supabase anon key alone grants nothing here,
// every function checks the user's session itself.
export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** Errors are stable codes the apps translate; never provider messages or stack traces. */
export function fail(code: string, status: number): Response {
  return json({ error: code }, status);
}

export function preflight(req: Request): Response | null {
  return req.method === 'OPTIONS' ? new Response(null, { status: 204, headers: CORS_HEADERS }) : null;
}
