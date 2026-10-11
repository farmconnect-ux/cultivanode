import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgronomyLibrary } from "@/components/screens/agronomy-library";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Agronomy library" };

export default async function Page({ params }: PageProps<"/[lang]/resources">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <AgronomyLibrary lang={lang} />;
}
