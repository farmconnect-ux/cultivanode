import { notFound } from "next/navigation";
import { MachineryDirectory } from "@/components/screens/machinery-directory";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/machinery">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/machinery", t.machineryPage.title, t.machineryPage.intro);
}

export default async function Page({ params }: PageProps<"/[lang]/machinery">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <MachineryDirectory lang={lang} />;
}
