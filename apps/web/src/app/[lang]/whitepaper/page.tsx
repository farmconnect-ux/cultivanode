import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TechnicalWhitepaper } from "@/components/screens/technical-whitepaper";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Technical Whitepaper · Agrarian Mesh & Digital Rail Operating System",
  description:
    "Comprehensive engineering and agronomic architecture specification for CultivaNode, detailing cadastral GIS, degree-day phenology, cryptographic double-entry ledger, and fleet transit optimization.",
};

export default async function Page({ params }: PageProps<"/[lang]/whitepaper">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <TechnicalWhitepaper lang={lang} />;
}
