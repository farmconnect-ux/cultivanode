import { createClient } from "@supabase/supabase-js";
import type { Database } from "@cultivanode/shared";
import { buildIcs, type CalendarEvent } from "@/lib/calendar";
import { logger } from "@/lib/logger";
import { supabaseEnv } from "@/lib/supabase/env";

// Private iCalendar feed: /api/calendar/<token>.ics. The secret token is the only credential;
// calendar_feed_events() checks it in the database and returns that person's farm work.
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = raw.replace(/\.ics$/i, "");
  if (!/^[0-9a-f]{32,128}$/.test(token)) return new Response("Not found", { status: 404 });

  const { url, key } = supabaseEnv();
  const supabase = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc("calendar_feed_events", { p_token: token });
  if (error) {
    logger.warn("calendar_feed_failed", { code: error.code });
    return new Response("Calendar unavailable", { status: 503 });
  }
  const events: CalendarEvent[] = (data ?? [])
    .filter((e) => e.starts_on)
    .map((e) => ({
      uid: e.uid,
      title: e.title,
      details: e.details,
      startsOn: e.starts_on,
      endsOn: e.ends_on,
      location: e.location,
      status: e.status,
      updatedAt: e.updated_at,
    }));
  const host = new URL(request.url).host;
  return new Response(buildIcs("CultivaNode field work", events, host), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="cultivanode.ics"',
      "Cache-Control": "private, max-age=900",
      "X-Robots-Tag": "noindex",
    },
  });
}
