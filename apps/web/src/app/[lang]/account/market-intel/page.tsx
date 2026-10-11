import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { MarketIntelligence } from "@/components/screens/market-intelligence";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Food security & market intelligence" };

export default async function Page({ params }: PageProps<"/[lang]/account/market-intel">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">This module shows the design's sample records until it is connected to your account data.</LiveStrip>
      <MarketIntelligence lang={lang} />
    </>
  );
}
