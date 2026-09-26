import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { htmlLang, locales } from "@/i18n/config";

const paths = ["", "/about", "/marketplace", "/faq", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.flatMap((path) =>
    locales.map((lang) => ({
      url: `${site.url}/${lang}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
      alternates: { languages: Object.fromEntries(locales.map((l) => [htmlLang[l], `${site.url}/${l}${path}`])) },
    })),
  );
}
