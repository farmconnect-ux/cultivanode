import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { BrandLockup } from "./brand";
import { LocaleSwitch } from "./locale-switch";
import { SiteAuthActions, SiteMobileMenu, SiteNavLinks, type SiteLink } from "./site-nav";

export function siteLinks(lang: Locale, t: Dictionary["nav"]): SiteLink[] {
  return [
    { href: `/${lang}/platform`, label: lang === "yo" ? "Pèpéle" : "Platform" },
    { href: `/${lang}/solutions`, label: lang === "yo" ? "Ojútùú" : "Solutions" },
    { href: `/${lang}/how-it-works`, label: t.how },
    { href: `/${lang}/marketplace`, label: t.marketplace },
    { href: `/${lang}/machinery`, label: lang === "yo" ? "Ẹ̀rọ Oko" : "Machinery" },
    { href: `/${lang}/download`, label: lang === "yo" ? "Gba Àpù (APK)" : "Get App" },
    { href: `/${lang}/resources`, label: lang === "yo" ? "Ìmọ̀ Oko" : "Resources" },
    { href: `/${lang}/waitlist`, label: lang === "yo" ? "Ìdánwò Àkọ́kọ́" : "Pilot" },
    { href: `/${lang}/about`, label: t.about },
  ];
}

/** Public site header (design: white bar, brand lockup, text nav, EN/YOR, sign-in + primary CTA). */
export function SiteHeader({ lang, t }: { lang: Locale; t: Dictionary["nav"] }) {
  const links = siteLinks(lang, t);
  return (
    <header data-site-header="" className="site-header sticky top-0 z-40 border-b border-border/70 bg-surface-container-lowest/95">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-surface-container-lowest focus:px-4 focus:py-2 focus:shadow-overlay"
      >
        {t.skip}
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          {/* The visible name and tagline are the link's name (no aria-label, so speech users can say what they see). */}
          <Link href={`/${lang}`} className="shrink-0 rounded-lg">
            <BrandLockup tagline={lang === "yo" ? "Ọgbọ́n Iṣẹ́ Àgbẹ̀" : "Agri-Intelligence"} />
            <span className="sr-only">{lang === "yo" ? " (ojú-ìwé àkọ́kọ́)" : " (home)"}</span>
          </Link>
          <SiteNavLinks links={links} />
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitch current={lang} className="hidden sm:flex" />
          <SiteAuthActions lang={lang} t={t} />
          <SiteMobileMenu lang={lang} links={links} t={t} />
        </div>
      </div>
    </header>
  );
}
