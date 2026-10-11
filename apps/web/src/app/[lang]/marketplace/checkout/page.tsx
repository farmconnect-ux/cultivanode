import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketplaceCheckout } from "@/components/screens/marketplace-checkout";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Checkout & escrow" };

export default async function Page({ params }: PageProps<"/[lang]/marketplace/checkout">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <MarketplaceCheckout lang={lang} />;
}
