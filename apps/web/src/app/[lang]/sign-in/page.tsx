import { notFound } from "next/navigation";
import { AccountSoon } from "@/components/site/account-soon";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/sign-in">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { ...pageMetadata(lang, "/sign-in", t.account.signInTitle, t.account.body), robots: { index: false } };
}

export default async function Page({ params }: PageProps<"/[lang]/sign-in">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return <AccountSoon lang={lang} title={t.account.signInTitle} t={t.account} soon={t.common.comingSoon} />;
}
