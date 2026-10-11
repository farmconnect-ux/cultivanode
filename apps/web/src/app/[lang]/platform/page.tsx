import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlatformCapabilities } from "@/components/screens/platform-capabilities";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Platform & architecture" };

export default async function Page({ params }: PageProps<"/[lang]/platform">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <PlatformCapabilities lang={lang} />;
}
