import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { FarmGeospatialMap } from "@/components/screens/farm-geospatial-map";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Farm map & cadastre" };

export default async function Page({ params }: PageProps<"/[lang]/account/farms/map">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <FarmGeospatialMap lang={lang} />;
}
