import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { FieldProfile } from "@/components/screens/field-profile";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Field profile" };

export default async function Page({ params }: PageProps<"/[lang]/account/farms/field">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">This module shows the design's sample records until it is connected to your account data.</LiveStrip>
      <FieldProfile lang={lang} />
    </>
  );
}
