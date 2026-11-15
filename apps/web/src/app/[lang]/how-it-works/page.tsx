import { notFound } from "next/navigation";
import { HowItWorks } from "@/components/site/how-it-works";
import { BenefitGrid, CtaBox, PageHero } from "@/components/site/page-parts";
import { Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

// Plain how-it-works page: the home page's steps per role and its trust section. It replaces the
// design mock-up (how-it-works), which described bank escrow, ADP agents and NIMC face matching.
export async function generateMetadata({ params }: PageProps<"/[lang]/how-it-works">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/how-it-works", t.howPage.title, t.howPage.intro);
}

export default async function HowItWorksPage({ params }: PageProps<"/[lang]/how-it-works">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const h = t.home;
  return (
    <>
      <PageHero title={t.howPage.title} intro={t.howPage.intro} />
      <Section tone="white" title={h.howTitle} intro={h.howIntro}>
        <HowItWorks audiences={h.audiences} />
        {/* Phone sign-in is switched off until an SMS provider is set up (feature switch phone_sign_in). */}
        <p className="mt-8 max-w-3xl text-on-surface-variant">{t.auth.phoneSoon}</p>
      </Section>
      <Section title={h.trustTitle}>
        <BenefitGrid items={h.trust} columns={2} />
      </Section>
      <CtaBox
        title={h.pilotTitle}
        body={h.pilotBody}
        href={`/${lang}/sign-up`}
        label={h.pilotCta}
        secondary={{ href: `/${lang}/contact`, label: h.pilotSecondary }}
      />
    </>
  );
}
