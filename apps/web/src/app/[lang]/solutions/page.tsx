import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SolutionsByRole } from "@/components/screens/solutions-by-role";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Solutions by role" };

export default async function Page({ params }: PageProps<"/[lang]/solutions">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <SolutionsByRole lang={lang} />;
}
