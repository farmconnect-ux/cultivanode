import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Container } from "@/components/ui";
import { site } from "@/config/site";
import { Logo } from "./logo";

export function Footer({ lang, t, nav }: { lang: Locale; t: Dictionary["footer"]; nav: Dictionary["nav"] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-white">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="text-muted">{t.tagline}</p>
        </div>
        <nav aria-label={t.product}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">{t.product}</h2>
          <ul className="flex flex-col gap-2">
            <li><Link className="hover:text-leaf-700" href={`/${lang}#how`}>{nav.how}</Link></li>
            <li><Link className="hover:text-leaf-700" href={`/${lang}/marketplace`}>{nav.marketplace}</Link></li>
            <li><Link className="hover:text-leaf-700" href={`/${lang}/faq`}>{nav.faq}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t.company}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">{t.company}</h2>
          <ul className="flex flex-col gap-2">
            <li><Link className="hover:text-leaf-700" href={`/${lang}/about`}>{nav.about}</Link></li>
            <li><Link className="hover:text-leaf-700" href={`/${lang}/contact`}>{nav.contact}</Link></li>
          </ul>
        </nav>
        <div className="flex flex-col gap-2 text-muted">
          {site.contact.phone && <a className="hover:text-leaf-700" href={site.contact.phoneHref}>{site.contact.phone}</a>}
          {site.contact.email && <a className="hover:text-leaf-700" href={`mailto:${site.contact.email}`}>{site.contact.email}</a>}
          <p>{t.madeIn}</p>
        </div>
      </Container>
      <div className="border-t border-line py-5 text-center text-sm text-muted">
        © {year} Tillmate. {t.rights}
      </div>
    </footer>
  );
}
