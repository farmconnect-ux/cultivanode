import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { site } from "@/config/site";
import { BrandLockup } from "./brand";
import { Icon } from "./icon";

export function SiteFooter({ lang, t, nav }: { lang: Locale; t: Dictionary["footer"]; nav: Dictionary["nav"] }) {
  const year = new Date().getFullYear();
  const y = (en: string, yo: string) => (lang === "yo" ? yo : en);
  const cols: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: y("Solutions", "Ojútùú"),
      links: [
        { href: `/${lang}/platform`, label: y("Platform & architecture", "Pèpéle àti ètò rẹ̀") },
        { href: `/${lang}/whitepaper`, label: y("Technical whitepaper", "Ìwé àlàyé ìmọ̀ ẹ̀rọ") },
        { href: `/${lang}/solutions`, label: y("Solutions by role", "Ojútùú fún iṣẹ́ kọ̀ọ̀kan") },
        { href: `/${lang}/marketplace`, label: y("Escrow marketplace", "Ọjà owó ìdógò ààbò") },
        { href: `/${lang}/machinery`, label: y("Machinery & services", "Ẹ̀rọ oko àti iṣẹ́") },
        { href: `/${lang}/farmers`, label: nav.farmers },
        { href: `/${lang}/service-providers`, label: nav.providers },
      ],
    },
    {
      title: y("Pilot & network", "Ìdánwò àkọ́kọ́ àti nẹ́tíwọ̀ọ̀kì"),
      links: [
        { href: `/${lang}/waitlist`, label: y("Join the South-West pilot", "Darapọ̀ mọ́ ìdánwò Gúúsù Ìwọ̀-Oòrùn") },
        { href: `/${lang}/how-it-works`, label: nav.how },
        { href: `/${lang}/resources`, label: y("Agronomy library", "Ilé ìkàwé ìmọ̀ oko") },
        { href: `/${lang}/crops`, label: nav.crops },
        { href: `/${lang}/partners`, label: nav.partners },
      ],
    },
    {
      title: t.company,
      links: [
        { href: `/${lang}/about`, label: nav.about },
        { href: `/${lang}/faq`, label: nav.faq },
        { href: `/${lang}/contact`, label: nav.contact },
      ],
    },
    {
      title: t.legal,
      links: [
        { href: `/${lang}/legal`, label: y("Governance & NDPA 2023", "Ìṣàkóso àti NDPA 2023") },
        { href: `/${lang}/privacy`, label: nav.privacy },
        { href: `/${lang}/terms`, label: nav.terms },
      ],
    },
  ];
  return (
    <footer className="mt-16 border-t border-border bg-surface-container-low">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <BrandLockup />
            <p className="max-w-sm text-body-md text-on-surface-variant">{t.tagline} {t.madeIn}</p>
            <p className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
              <span className="size-2 rounded-full bg-secondary" />
              {y("Regional operations: Ibadan, Oyo State & Lagos", "Iṣẹ́ agbègbè: Ìbàdàn, Ìpínlẹ̀ Ọ̀yọ́ àti Èkó")}
            </p>
            <div className="flex flex-col gap-1 text-body-sm">
              {site.contact.phone && site.contact.phoneHref && (
                <a className="text-on-surface-variant hover:text-on-surface" href={site.contact.phoneHref}>{site.contact.phone}</a>
              )}
              {site.contact.email && (
                <a className="text-on-surface-variant hover:text-on-surface" href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              )}
            </div>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title} className="flex flex-col gap-3">
              <h2 className="font-label-md text-label-md uppercase tracking-wider text-on-surface">{c.title}</h2>
              <ul className="flex flex-col gap-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-body-sm text-on-surface-variant transition-colors hover:text-primary-container">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-body-sm text-on-surface-variant">
            © {year} {site.name}. {t.rights} Data handled under NDPA 2023.
          </p>
          <div className="flex items-center gap-2">
            {site.contact.whatsappUrl && (
              <a
                href={site.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex size-9 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <Icon name="chat" className="text-lg" />
              </a>
            )}
            {site.contact.email && (
              <a
                href={`mailto:${site.contact.email}`}
                aria-label="Email"
                className="flex size-9 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <Icon name="mail" className="text-lg" />
              </a>
            )}
            <Link
              href={`/${lang}/contact`}
              aria-label={nav.contact}
              className="flex size-9 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <Icon name="public" className="text-lg" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
