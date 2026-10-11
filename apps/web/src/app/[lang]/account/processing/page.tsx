import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { ProcessingOps } from "@/components/screens/processing-ops";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Agro-processing operations" };

export default async function Page({ params }: PageProps<"/[lang]/account/processing">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">This module shows the design's sample records until it is connected to your account data.</LiveStrip>
      <ProcessingOps lang={lang} />
    </>
  );
}
