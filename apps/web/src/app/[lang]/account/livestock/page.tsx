import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { LivestockManagement } from "@/components/screens/livestock-management";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Livestock & aquaculture" };

export default async function Page({ params }: PageProps<"/[lang]/account/livestock">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">Herd, flock and pond records show sample data until you register animals or ponds.</LiveStrip>
      <LivestockManagement lang={lang} />
    </>
  );
}
