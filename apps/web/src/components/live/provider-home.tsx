import Link from "next/link";
import { formatNaira } from "@cultivanode/shared";
import { Icon } from "@/components/ds/icon";
import { LiveStrip } from "@/components/ds/live-strip";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { BookingSummary } from "@/lib/account/bookings";
import type { Account } from "@/lib/account/session";
import { ACTIVE, BookingTable } from "./booking-table";
import { MetricCard } from "./metric-card";

/** Provider workspace home: live counts and the job queue from farmers' bookings. */
export function ProviderHome({
  lang,
  t,
  account,
  bookings,
  listingsCount,
}: {
  lang: Locale;
  t: Dictionary;
  account: Account;
  bookings: BookingSummary[];
  listingsCount: number;
}) {
  const active = bookings.filter((b) => ACTIVE.includes(b.status)).sort((a, b) => a.job_date.localeCompare(b.job_date));
  const earned = bookings.filter((b) => ["confirmed", "completed"].includes(b.status)).reduce((s, b) => s + b.total_kobo, 0);
  const name = (account.profile.full_name ?? "").trim().split(/\s+/)[0] || "operator";

  return (
    <>
      <LiveStrip>
        <span className="text-on-surface-variant">
          Job requests, bookings, earnings and listings here are live for {name}. Job photos are taken on each booking page.
        </span>
      </LiveStrip>
      <section className="mb-space-lg grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Awaiting your reply" value={bookings.filter((b) => b.status === "requested").length} icon="notifications_active" iconTone="bg-tertiary-fixed/50 text-tertiary-container" href={`/${lang}/account/bookings`} foot="Requests expire if not answered" />
        <MetricCard label="Jobs in motion" value={bookings.filter((b) => ["accepted", "in_progress", "awaiting_confirmation"].includes(b.status)).length} icon="agriculture" href={`/${lang}/account/bookings`} foot="Accepted, on site or awaiting sign-off" />
        <MetricCard label="Confirmed earnings" value={formatNaira(earned).replace(/\.00$/, "")} icon="payments" iconTone="bg-surface-container-high text-primary" foot="Paid directly by farmers · 0% commission" />
        <MetricCard label="Live listings" value={listingsCount} icon="list_alt" iconTone="bg-primary-fixed/60 text-on-primary-fixed-variant" href={`/${lang}/account/listings`} foot="Equipment and services farmers can find" />
      </section>
      <BookingTable
        lang={lang}
        t={t}
        bookings={active.length ? active : bookings}
        title="Dispatch queue"
        description="Requests and jobs from farmers who booked your listings."
        emptyAction={
          <Link href={`/${lang}/account/listings`} className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 font-label-md text-label-md text-white hover:bg-primary">
            <Icon name="add_circle" className="text-base" /> Publish a listing
          </Link>
        }
      />
    </>
  );
}
