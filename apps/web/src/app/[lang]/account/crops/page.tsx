import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { CropManagement } from "@/components/screens/crop-management";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Crop management" };

export default async function Page({ params }: PageProps<"/[lang]/account/crops">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">Crop cycles, phenology and scouting logs show sample data until you start a crop cycle on one of your plots.</LiveStrip>
      <CropManagement lang={lang} />
    </>
  );
}
