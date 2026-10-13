import { notFound } from "next/navigation";
import { AuthPage } from "@/components/account/auth-page";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";
import { safeNext } from "@/lib/safe-next";

export async function generateMetadata({ params }: PageProps<"/[lang]/sign-in">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { ...pageMetadata(lang, "/sign-in", t.auth.signInTitle, t.auth.signInIntro), robots: { index: false } };
}

export default async function Page({ params, searchParams }: PageProps<"/[lang]/sign-in">) {
  const { lang } = await params;
  const sp = await searchParams;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return <AuthPage lang={lang} t={t.auth} mode="sign-in" next={safeNext(sp.next, lang) ?? ""} as={sp.as === "customer" ? "customer" : ""} />;
}
