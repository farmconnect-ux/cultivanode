import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { SmartIrrigation } from "@/components/screens/smart-irrigation";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Smart irrigation" };

export default async function Page({ params }: PageProps<"/[lang]/account/irrigation">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">Valve and moisture controls are a preview; they connect once an irrigation controller is installed.</LiveStrip>
      <SmartIrrigation lang={lang} />
    </>
  );
}
