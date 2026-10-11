import { notFound } from "next/navigation";
import { HowItWorks } from "@/components/screens/how-it-works";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/how-it-works">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/how-it-works", t.howPage.title, t.howPage.intro);
}

export default async function Page({ params }: PageProps<"/[lang]/how-it-works">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <HowItWorks lang={lang} />;
}
