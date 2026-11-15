import { notFound } from "next/navigation";
import { BenefitGrid, CtaBox, PageHero } from "@/components/site/page-parts";
import { Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getInfoCopy } from "@/i18n/get-info";
import { pageMetadata } from "@/i18n/metadata";

// Plain about page built from the translated dictionary. It replaces the design mock-up (about-page),
// which named advisors and partners we have no agreement with, claimed bank escrow and regulator
// registrations, and showed invented figures. Say here only what the home page says.
export async function generateMetadata({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/about", t.about.title, t.about.intro);
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, info] = await Promise.all([getDictionary(lang), getInfoCopy(lang)]);
  const a = t.about;
  const inPilot = t.home.features.filter((f) => !f.soon);
  const soon = t.home.features.filter((f) => f.soon);
  return (
    <>
      <PageHero badge={t.common.pilotBadge} title={a.title} intro={a.intro} />
      <Section tone="white" title={a.whyTitle}>
        <div className="flex max-w-3xl flex-col gap-4 text-lg">
          {a.whyBody.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Section>
      <Section title={a.pilotTitle} intro={a.pilotBody} />
      <Section tone="white" title={info.aboutPage.inPilotTitle}>
        <BenefitGrid items={inPilot} />
      </Section>
      <Section title={info.aboutPage.soonTitle}>
        <BenefitGrid items={soon} soonLabel={t.common.comingSoon} columns={2} />
      </Section>
      <Section tone="white" title={a.valuesTitle}>
        <BenefitGrid items={a.values} />
      </Section>
      <Section title={a.nameTitle} intro={a.nameBody} />
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
