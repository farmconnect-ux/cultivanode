"use client";

import { useState } from "react";
import { enableCalendarFeed, resetCalendarFeed } from "@/actions/calendar";
import { Icon } from "@/components/ds/icon";
import { ActionButton } from "@/components/live/action-form";
import { googleSubscribeUrl } from "@/lib/calendar";

/** Subscribe your phone's calendar to your crop operations and field tasks. */
export function CalendarSync({ lang, feedUrl }: { lang: string; feedUrl: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!feedUrl) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body-sm text-on-surface-variant">
          Get every crop operation and field task in Google Calendar on your phone. New operations appear automatically, with a reminder the day before.
        </p>
        <ActionButton action={enableCalendarFeed} hidden={{ lang }} label="Turn on phone calendar" icon="calendar_add_on" tone="primary" />
      </div>
    );
  }
  const webcal = feedUrl.replace(/^https?:/, "webcal:");
  return (
    <div className="flex flex-col gap-3 text-body-sm">
      <a
        href={googleSubscribeUrl(feedUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-container px-3 py-2.5 font-label-md text-label-md text-on-primary hover:bg-primary"
      >
        <Icon name="calendar_add_on" className="text-base" /> Add to Google Calendar
      </a>
      <a href={webcal} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container-highest">
        <Icon name="phone_iphone" className="text-base" /> iPhone / Apple Calendar
      </a>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(feedUrl).then(() => setCopied(true), () => setCopied(false));
        }}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-label-md text-label-md text-primary hover:bg-surface-container-low"
      >
        <Icon name={copied ? "check" : "content_copy"} className="text-base" /> {copied ? "Link copied" : "Copy calendar link"}
      </button>
      <ol className="list-decimal space-y-1 pl-5 text-on-surface-variant">
        <li>On your phone, tap <strong>Add to Google Calendar</strong> (it opens in the browser) and confirm <strong>Add</strong>.</li>
        <li>Open the Google Calendar app, go to Settings, tap <strong>CultivaNode field work</strong> and switch on <strong>Sync</strong>.</li>
        <li>Google refreshes subscribed calendars every few hours, so new operations can take a little while to appear.</li>
      </ol>
      <p className="text-on-surface-variant">Keep this link private: anyone with it can see your farm schedule.</p>
      <ActionButton
        action={resetCalendarFeed}
        hidden={{ lang }}
        label="Reset link"
        icon="sync"
        confirm="Create a new link? Calendars using the old link will stop updating."
      />
    </div>
  );
}
