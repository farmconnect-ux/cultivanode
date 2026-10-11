import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { FarmBooks } from "@/components/screens/farm-books";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Farm books & accounting" };

export default async function Page({ params }: PageProps<"/[lang]/account/finance">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">Ledger entries show sample data; booked services you have paid for appear under My Bookings.</LiveStrip>
      <FarmBooks lang={lang} />
    </>
  );
}
