import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { BrandLockup } from "./brand";
import { LocaleSwitch } from "./locale-switch";
import { SiteAuthActions, SiteMobileMenu, SiteNavLinks, type SiteLink } from "./site-nav";

export function siteLinks(lang: Locale, t: Dictionary["nav"]): SiteLink[] {
  return [
    { href: `/${lang}/platform`, label: "Platform" },
    { href: `/${lang}/solutions`, label: "Solutions" },
    { href: `/${lang}/how-it-works`, label: t.how },
    { href: `/${lang}/marketplace`, label: t.marketplace },
    { href: `/${lang}/machinery`, label: "Machinery" },
    { href: `/${lang}/resources`, label: "Resources" },
    { href: `/${lang}/waitlist`, label: "Pilot" },
    { href: `/${lang}/about`, label: t.about },
  ];
}

/** Public site header (design: white bar, brand lockup, text nav, EN/YOR, sign-in + primary CTA). */
export function SiteHeader({ lang, t }: { lang: Locale; t: Dictionary["nav"] }) {
  const links = siteLinks(lang, t);
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface-container-lowest/95 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-surface-container-lowest focus:px-4 focus:py-2 focus:shadow-overlay"
      >
        {t.skip}
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link href={`/${lang}`} aria-label="CultivaNode home" className="shrink-0 rounded-lg">
            <BrandLockup tagline="Agri-Intelligence" />
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
