// Calendar helpers: one-tap "Add to Google Calendar" links and an iCalendar (.ics) feed that
// Google Calendar, Apple Calendar and Outlook can subscribe to, so field work shows up on the phone.

export type CalendarEvent = {
  uid: string;
  title: string;
  details?: string | null;
  /** All-day events: YYYY-MM-DD. */
  startsOn: string;
  /** Inclusive last day, YYYY-MM-DD. Defaults to startsOn. */
  endsOn?: string | null;
  location?: string | null;
  status?: string | null;
  updatedAt?: string | null;
};

const compact = (iso: string) => iso.slice(0, 10).replace(/-/g, "");

function nextDay(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Opens Google Calendar's "new event" screen pre-filled (works in the Google Calendar app on Android too). */
export function googleCalendarUrl(e: Omit<CalendarEvent, "uid">): string {
  const end = nextDay(e.endsOn && e.endsOn >= e.startsOn ? e.endsOn : e.startsOn); // Google's end date is exclusive
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title.slice(0, 200),
    dates: `${compact(e.startsOn)}/${compact(end)}`,
    ctz: "Africa/Lagos",
  });
  if (e.details) q.set("details", e.details.slice(0, 1500));
  if (e.location) q.set("location", e.location.slice(0, 200));
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Google Calendar "add calendar by URL" (subscribe). Google needs the http(s) feed address. */
export function googleSubscribeUrl(feedUrl: string): string {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl.replace(/^https?:/, "webcal:"))}`;
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545 line folding: lines longer than 75 octets continue on the next line after a space. */
const utf8 = new TextEncoder();
const octets = (s: string) => utf8.encode(s).length;

function fold(line: string): string {
  if (octets(line) <= 75) return line;
  const parts: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (octets(cur + ch) > (parts.length ? 74 : 75)) {
      parts.push(cur);
      cur = "";
    }
    cur += ch;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

function stamp(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  return (Number.isNaN(d.getTime()) ? new Date() : d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildIcs(name: string, events: CalendarEvent[], host: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CultivaNode//Field operations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(name)}`,
    "X-WR-TIMEZONE:Africa/Lagos",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];
  for (const e of events) {
    const end = nextDay(e.endsOn && e.endsOn >= e.startsOn ? e.endsOn : e.startsOn);
    const done = e.status === "completed";
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@${host}`,
      `DTSTAMP:${stamp(e.updatedAt)}`,
      `DTSTART;VALUE=DATE:${compact(e.startsOn)}`,
      `DTEND;VALUE=DATE:${compact(end)}`,
      `SUMMARY:${esc((done ? "✓ " : "") + e.title)}`,
      ...(e.details ? [`DESCRIPTION:${esc(e.details)}`] : []),
      ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
      `STATUS:${e.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
      "TRANSP:TRANSPARENT",
      ...(done
        ? []
        : ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)}`, "TRIGGER:-PT12H", "END:VALARM"]),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
