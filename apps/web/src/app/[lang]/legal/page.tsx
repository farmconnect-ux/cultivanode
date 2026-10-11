import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalGovernance } from "@/components/screens/legal-governance";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Governance & legal policies" };

export default async function Page({ params }: PageProps<"/[lang]/legal">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <LegalGovernance lang={lang} />;
}
