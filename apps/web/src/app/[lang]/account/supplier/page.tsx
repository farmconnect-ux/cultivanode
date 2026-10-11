import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { SupplierHub } from "@/components/screens/supplier-hub";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Input supplier hub" };

export default async function Page({ params }: PageProps<"/[lang]/account/supplier">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">This module shows the design's sample records until it is connected to your account data.</LiveStrip>
      <SupplierHub lang={lang} />
    </>
  );
}
