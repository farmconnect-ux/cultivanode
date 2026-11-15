import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TechnicalWhitepaper } from "@/components/screens/technical-whitepaper";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Technical whitepaper (draft)",
  description:
    "How the CultivaNode pilot app is built: farm records in a Postgres database with farm locations, crop calendars, hiring and farm books. Draft for the pilot in South-West Nigeria.",
};

export default async function Page({ params }: PageProps<"/[lang]/whitepaper">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <TechnicalWhitepaper lang={lang} />;
}
