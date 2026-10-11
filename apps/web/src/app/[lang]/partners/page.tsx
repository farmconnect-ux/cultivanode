import { notFound } from "next/navigation";
import { PartnershipsPage } from "@/components/screens/partnerships-page";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/partners">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/partners", t.partnersPage.title, t.partnersPage.intro);
}

export default async function Page({ params }: PageProps<"/[lang]/partners">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <PartnershipsPage lang={lang} />;
}
