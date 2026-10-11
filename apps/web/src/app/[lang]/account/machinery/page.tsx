import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { MachineryFleet } from "@/components/screens/machinery-fleet";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Fleet & workshop" };

export default async function Page({ params }: PageProps<"/[lang]/account/machinery">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">Fleet and maintenance records show sample data until you add your own machinery.</LiveStrip>
      <MachineryFleet lang={lang} />
    </>
  );
}
