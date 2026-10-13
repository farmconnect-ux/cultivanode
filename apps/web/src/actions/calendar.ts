"use server";

// Phone calendar sync: a private feed link per person (see /api/calendar/[token]).
import { randomBytes } from "node:crypto";
import type { FormResult } from "@/components/live/action-form";
import { actor, dbFail, ok, refreshPages } from "@/lib/account/act";

export async function enableCalendarFeed(_: FormResult, form: FormData): Promise<FormResult> {
  const { supabase, uid } = await actor(form);
  const { error } = await supabase.from("calendar_feeds").upsert({ profile_id: uid }, { onConflict: "profile_id", ignoreDuplicates: true });
  if (error) return dbFail(error, "enable_calendar_feed");
  refreshPages("/tasks");
  return ok("Phone calendar link is ready.");
}

/** New secret link; calendars subscribed to the old one stop updating. */
export async function resetCalendarFeed(_: FormResult, form: FormData): Promise<FormResult> {
  const { supabase, uid } = await actor(form);
  const { error } = await supabase
    .from("calendar_feeds")
    .update({ token: randomBytes(24).toString("hex"), rotated_at: new Date().toISOString() })
    .eq("profile_id", uid);
  if (error) return dbFail(error, "reset_calendar_feed");
  refreshPages("/tasks");
  return ok("New link created. Subscribe again on your phone.");
}
