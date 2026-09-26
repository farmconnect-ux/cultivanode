import { notFound } from "next/navigation";
import { BenefitGrid, CtaBox, PageHero } from "@/components/site/page-parts";
import { Card, Section } from "@/components/ui";
import { site } from "@/config/site";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/partners">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/partners", t.partnersPage.title, t.partnersPage.intro);
}

export default async function PartnersPage({ params }: PageProps<"/[lang]/partners">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const p = t.partnersPage;
  return (
    <>
      <PageHero title={p.title} intro={p.intro} />
      <Section tone="white" title={p.typesTitle}>
        <BenefitGrid items={p.types} />
      </Section>
      <Section title={p.currentTitle}>
        {site.partners.length === 0 ? (
          <p className="text-lg text-muted">{p.noneYet}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {site.partners.map((partner) => (
              <li key={partner.name}>
                <Card className="h-full font-bold">
                  {partner.url ? (
                    <a href={partner.url} target="_blank" rel="noopener noreferrer" className="text-leaf-700 hover:underline">
                      {partner.name}
                    </a>
                  ) : (
                    partner.name
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <CtaBox title={p.ctaTitle} body={p.ctaBody} href={`/${lang}/contact`} label={p.cta} />
    </>
  );
}
