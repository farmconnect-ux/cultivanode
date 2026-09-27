import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { PageViewTracker } from "@/components/site/page-view-tracker";
import { site } from "@/config/site";
import { hasLocale, htmlLang, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#236639",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return {
    metadataBase: new URL(site.url),
    title: { default: t.meta.title, template: `%s · ${site.name}` },
    description: t.meta.description,
    applicationName: site.name,
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return (
    <html lang={htmlLang[lang]} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Header lang={lang} t={t.nav} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer lang={lang} t={t.footer} nav={t.nav} />
        <PageViewTracker />
      </body>
    </html>
  );
}
