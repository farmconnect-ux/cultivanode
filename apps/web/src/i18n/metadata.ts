import type { Metadata } from "next";
import { site } from "@/config/site";
import { htmlLang, locales, type Locale } from "./config";

/** Canonical URL and hreflang alternates for a page path such as "/faq" ("" for home). */
export function pageMetadata(lang: Locale, path: string, title: string | undefined, description: string): Metadata {
  const languages = Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}${path}`]));
  return {
    title,
    description,
    alternates: { canonical: `/${lang}${path}`, languages: { ...languages, "x-default": `/en${path}` } },
    openGraph: {
      title: title ? `${title} · ${site.name}` : site.name,
      description,
      url: `/${lang}${path}`,
      siteName: site.name,
      locale: htmlLang[lang].replace("-", "_"),
      type: "website",
    },
  };
}
