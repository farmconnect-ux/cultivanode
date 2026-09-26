import { notFound } from "next/navigation";
import { AuthPage } from "@/components/account/auth-page";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/sign-up">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { ...pageMetadata(lang, "/sign-up", t.auth.signUpTitle, t.auth.signUpIntro), robots: { index: false } };
}

export default async function Page({ params }: PageProps<"/[lang]/sign-up">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return <AuthPage lang={lang} t={t.auth} mode="sign-up" />;
}
