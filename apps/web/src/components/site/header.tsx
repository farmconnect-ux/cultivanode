import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Container } from "@/components/ui";
import { AuthLinks } from "./auth-links";
import { LanguageToggle } from "./language-toggle";
import { Logo } from "./logo";
import { brand } from "@cultivanode/shared/brand";

export function Header({ lang, t }: { lang: Locale; t: Dictionary["nav"] }) {
  const links = [
    { href: `/${lang}/how-it-works`, label: t.how },
    { href: `/${lang}/crops`, label: t.crops },
    { href: `/${lang}/marketplace`, label: t.marketplace },
    { href: `/${lang}/about`, label: t.about },
    { href: `/${lang}/faq`, label: t.faq },
    { href: `/${lang}/contact`, label: t.contact },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-container-low/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-md focus:bg-white focus:px-4 focus:py-2">
        {t.skip}
      </a>
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href={`/${lang}`} aria-label={brand.name}>
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="rounded-md px-3 py-2 font-semibold text-on-surface hover:bg-surface-container-low hover:text-primary-container">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle current={lang} label={t.language} />
          {/* Wrapped so `hidden` never competes with the button's own display class */}
          <div className="hidden items-center gap-2 md:flex">
            <AuthLinks lang={lang} t={t} variant="bar" />
          </div>
          {/* Small screens: a no-JavaScript disclosure menu */}
          <details className="group relative lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-md border-2 border-border bg-white px-3 font-semibold [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">{t.menu}</span>
              <span className="hidden group-open:inline">{t.close}</span>
            </summary>
            <nav aria-label="Mobile" className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-white p-2 shadow-lg">
              <ul className="flex flex-col">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="block rounded-md px-3 py-3 font-semibold hover:bg-surface-container-low">
                      {l.label}
                    </Link>
                  </li>
                ))}
                <AuthLinks lang={lang} t={t} variant="menu" />
              </ul>
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}
