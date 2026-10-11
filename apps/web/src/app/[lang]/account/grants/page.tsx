import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { GrantsHub } from "@/components/screens/grants-hub";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Grants, subsidies & programmes" };

export default async function Page({ params }: PageProps<"/[lang]/account/grants">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">This module shows the design's sample records until it is connected to your account data.</LiveStrip>
      <GrantsHub lang={lang} />
    </>
  );
}
