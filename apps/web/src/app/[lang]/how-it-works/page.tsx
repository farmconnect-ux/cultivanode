import { notFound } from "next/navigation";
import { HowItWorks } from "@/components/site/how-it-works";
import { CtaBox, PageHero, Steps } from "@/components/site/page-parts";
import { Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

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
  const p = t.howPage;
  return (
    <>
      <PageHero title={p.title} intro={p.intro} />
      <Section tone="white" title={t.home.howTitle} intro={t.home.howIntro}>
        <HowItWorks audiences={t.home.audiences} />
      </Section>
      <Section title={p.moneyTitle} intro={p.moneyIntro}>
        <Steps steps={p.money} />
        <p className="mt-8 max-w-3xl rounded-md border-l-4 border-harvest-500 bg-harvest-50 p-4 text-ink">{p.moneyNote}</p>
      </Section>
      <CtaBox
        title={t.home.pilotTitle}
        body={t.home.pilotBody}
        href={`/${lang}/sign-up`}
        label={t.home.pilotCta}
        secondary={{ href: `/${lang}/contact`, label: t.home.pilotSecondary }}
      />
    </>
  );
}
