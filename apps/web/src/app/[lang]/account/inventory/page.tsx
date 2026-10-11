import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { InventoryHub } from "@/components/screens/inventory-hub";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Inventory & supplies" };

export default async function Page({ params }: PageProps<"/[lang]/account/inventory">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <LiveStrip tone="preview">Stock levels and movements show sample data until you add your first store and items.</LiveStrip>
      <InventoryHub lang={lang} />
    </>
  );
}
