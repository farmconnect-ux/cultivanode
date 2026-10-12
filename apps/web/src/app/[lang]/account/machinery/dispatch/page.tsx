import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { OperatorDispatch, type BookingJobData } from "@/components/screens/operator-dispatch";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";
import type { BookingSummary } from "@/lib/account/bookings";
import { ACTIVE } from "@/components/live/booking-table";

export const metadata: Metadata = { title: "Operator dispatch & proof of work" };

export default async function Page({ params }: PageProps<"/[lang]/account/machinery/dispatch">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  const { data: bookingsRes } = await supabase.rpc("my_bookings", { p_limit: 50 });
  const bookings = (bookingsRes ?? []) as unknown as BookingSummary[];
  const providerBookings = bookings.filter((b) => b.my_side === "provider");
  const active = providerBookings.filter((b) => ACTIVE.includes(b.status)).sort((a, b) => a.job_date.localeCompare(b.job_date));

  // Transform first active booking to BookingJobData for OperatorDispatch
  const activeBooking = active[0];
  const activeJob: BookingJobData | null = activeBooking
    ? {
        id: activeBooking.id,
        booking_id: activeBooking.id,
        listing_title: activeBooking.title,
        listing_kind: activeBooking.kind,
        equipment_type: activeBooking.equipment_type,
        provider_type: activeBooking.provider_type,
        job_date: activeBooking.job_date,
        unit: activeBooking.unit,
        quantity: activeBooking.quantity,
        rate_kobo: activeBooking.rate_kobo,
        total_kobo: activeBooking.total_kobo,
        distance_km: activeBooking.distance_km,
        farm_name: activeBooking.farm_name,
        job_state: activeBooking.job_state,
        job_lga: activeBooking.job_lga,
        expires_at: activeBooking.expires_at,
        status: activeBooking.status,
        other_name: activeBooking.other_name,
        created_at: activeBooking.created_at,
      }
    : null;

  return (
    <>
      <LiveStrip tone={activeJob ? "live" : "preview"}>
        {activeJob
          ? "Live job data from your active bookings."
          : "This module shows the design's sample records until you have an active booking."}
      </LiveStrip>
      <OperatorDispatch lang={lang} activeJob={activeJob} />
    </>
  );
}
