import { notFound } from "next/navigation";
import { BenefitGrid, CtaBox, PageHero } from "@/components/site/page-parts";
import { LinkButton, Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getInfoCopy } from "@/i18n/get-info";
import { pageMetadata } from "@/i18n/metadata";

// Short, plain "how it is built" page. It replaces the design mock-up (technical-whitepaper), which
// described bank escrow rails, ledger hashes, formulas and version numbers that are not in place.
export async function generateMetadata({ params }: PageProps<"/[lang]/whitepaper">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const info = await getInfoCopy(lang);
  return pageMetadata(lang, "/whitepaper", info.techPage.title, info.techPage.intro);
}

export default async function WhitepaperPage({ params }: PageProps<"/[lang]/whitepaper">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, info] = await Promise.all([getDictionary(lang), getInfoCopy(lang)]);
  const p = info.techPage;
  return (
    <>
      <PageHero title={p.title} intro={p.intro} />
      <Section tone="white">
        <BenefitGrid items={p.items} columns={2} />
        <div className="mt-8">
          <LinkButton href={`/${lang}/privacy`} variant="secondary">
            {p.privacyCta}
          </LinkButton>
        </div>
      </Section>
      <CtaBox
        title={t.partnersPage.ctaTitle}
        body={t.contact.intro}
        href={`/${lang}/contact`}
        label={t.partnersPage.cta}
      />
    </>
  );
}
