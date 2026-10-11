import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Plan-Actual Variance Engine" };

export default async function Page({ params }: PageProps<"/[lang]/account/variance">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  redirect(`/${lang}/account/finance`);
}
