import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Container } from "@/components/ui";
import { site } from "@/config/site";
import { Logo } from "./logo";

export function Footer({ lang, t, nav }: { lang: Locale; t: Dictionary["footer"]; nav: Dictionary["nav"] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-primary text-on-primary/80">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-3">
          <Logo tone="dark" />
          <p className="text-on-primary/70">{t.tagline}</p>
        </div>
        <nav aria-label={t.product}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-on-primary/70">{t.product}</h2>
          <ul className="flex flex-col gap-2">
            <li><Link className="hover:text-node-300" href={`/${lang}/how-it-works`}>{nav.how}</Link></li>
            <li><Link className="hover:text-node-300" href={`/${lang}/farmers`}>{nav.farmers}</Link></li>
            <li><Link className="hover:text-node-300" href={`/${lang}/machinery`}>{nav.machinery}</Link></li>
            <li><Link className="hover:text-node-300" href={`/${lang}/service-providers`}>{nav.providers}</Link></li>
            <li><Link className="hover:text-node-300" href={`/${lang}/crops`}>{nav.crops}</Link></li>
            <li><Link className="hover:text-node-300" href={`/${lang}/marketplace`}>{nav.marketplace}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t.company}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-on-primary/70">{t.company}</h2>
          <ul className="flex flex-col gap-2">
            <li><Link className="hover:text-node-300" href={`/${lang}/about`}>{nav.about}</Link></li>
            <li><Link className="hover:text-node-300" href={`/${lang}/partners`}>{nav.partners}</Link></li>
            <li><Link className="hover:text-node-300" href={`/${lang}/faq`}>{nav.faq}</Link></li>
            <li><Link className="hover:text-node-300" href={`/${lang}/contact`}>{nav.contact}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t.legal}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-on-primary/70">{t.legal}</h2>
          <ul className="flex flex-col gap-2">
            <li><Link className="hover:text-node-300" href={`/${lang}/privacy`}>{nav.privacy}</Link></li>
            <li><Link className="hover:text-node-300" href={`/${lang}/terms`}>{nav.terms}</Link></li>
          </ul>
        </nav>
        <div className="flex flex-col gap-2 text-on-primary/70">
          {site.contact.phone && <a className="hover:text-node-300" href={site.contact.phoneHref}>{site.contact.phone}</a>}
          {site.contact.email && <a className="hover:text-node-300" href={`mailto:${site.contact.email}`}>{site.contact.email}</a>}
          <p>{t.madeIn}</p>
        </div>
      </Container>
      <div className="border-t border-primary-container py-5 text-center text-sm text-on-primary/70">
        © {year} {site.name}. {t.rights}
      </div>
    </footer>
  );
}
