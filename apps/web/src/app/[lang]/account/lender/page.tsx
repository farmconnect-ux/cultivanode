import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { LenderHub } from "@/components/screens/lender-hub";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Lender & agricultural credit" };

export default async function Page({ params }: PageProps<"/[lang]/account/lender">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">This module shows the design's sample records until it is connected to your account data.</LiveStrip>
      <LenderHub lang={lang} />
    </>
  );
}
