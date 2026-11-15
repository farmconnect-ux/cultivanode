import { notFound } from "next/navigation";
import { FeatureList } from "@/components/site/feature-list";
import { BenefitGrid, CtaBox, PageHero } from "@/components/site/page-parts";
import { LinkButton, Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getInfoCopy } from "@/i18n/get-info";
import { pageMetadata } from "@/i18n/metadata";

// Plain platform page. It replaces the design mock-up (platform-capabilities), which claimed bank
// escrow, regulator approvals, certified biometrics and uptime figures. The feature list and its
// "In the pilot" / "Coming soon" labels are the home page's own (t.home.features).
export async function generateMetadata({ params }: PageProps<"/[lang]/platform">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const info = await getInfoCopy(lang);
  return pageMetadata(lang, "/platform", info.platformPage.title, info.platformPage.intro);
}

export default async function PlatformPage({ params }: PageProps<"/[lang]/platform">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, info] = await Promise.all([getDictionary(lang), getInfoCopy(lang)]);
  const p = info.platformPage;
  return (
    <>
      <PageHero badge={t.common.pilotBadge} title={p.title} intro={p.intro} />
      <Section tone="white" title={t.home.featuresTitle} intro={t.home.featuresNote}>
        <FeatureList items={t.home.features} inPilotLabel={t.common.inPilot} soonLabel={t.common.comingSoon} />
      </Section>
      <Section title={p.trustTitle}>
        <BenefitGrid items={t.home.trust} columns={2} />
      </Section>
      <Section tone="white" title={p.appsTitle} intro={p.appsBody}>
        <LinkButton href={`/${lang}/download`} variant="secondary">
          {p.appsCta}
        </LinkButton>
      </Section>
      <CtaBox
        title={t.home.pilotTitle}
        body={t.home.pilotBody}
        href={`/${lang}/sign-up`}
        label={t.home.pilotCta}
        secondary={{ href: `/${lang}/how-it-works`, label: t.home.heroSecondary }}
      />
    </>
  );
}
