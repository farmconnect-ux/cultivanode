import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { CreditReadiness } from "@/components/screens/credit-readiness";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Verified records & credit readiness" };

export default async function Page({ params }: PageProps<"/[lang]/account/reports">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">Scores and records show sample data; your verification tier and bookings feed this report as modules connect.</LiveStrip>
      <CreditReadiness lang={lang} />
    </>
  );
}
