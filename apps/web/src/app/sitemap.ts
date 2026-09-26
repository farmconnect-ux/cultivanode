import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { htmlLang, locales } from "@/i18n/config";

export const publicPaths = [
  "", "/how-it-works", "/farmers", "/machinery", "/service-providers", "/crops", "/marketplace", "/waitlist",
  "/about", "/partners", "/faq", "/contact", "/privacy", "/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.flatMap((path) =>
    locales.map((lang) => ({
      url: `${site.url}/${lang}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
      alternates: { languages: Object.fromEntries(locales.map((l) => [htmlLang[l], `${site.url}/${l}${path}`])) },
    })),
  );
}
