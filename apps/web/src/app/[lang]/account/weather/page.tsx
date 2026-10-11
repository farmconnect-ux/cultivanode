import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { FarmHealthRisk } from "@/components/screens/farm-health-risk";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Farm health & risk" };

export default async function Page({ params }: PageProps<"/[lang]/account/weather">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">Weather, pest and disease risk panels show sample advisories for the South-West pilot.</LiveStrip>
      <FarmHealthRisk lang={lang} />
    </>
  );
}
