import { notFound } from "next/navigation";
import { BenefitGrid, CtaBox, PageHero, Steps } from "@/components/site/page-parts";
import { Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/farmers">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/farmers", t.farmersPage.title, t.farmersPage.intro);
}

export default async function FarmersPage({ params }: PageProps<"/[lang]/farmers">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const p = t.farmersPage;
  const steps = t.home.audiences.find((a) => a.key === "farmer")?.steps ?? [];
  return (
    <>
      <PageHero badge={p.badge} title={p.title} intro={p.intro} />
      <Section tone="white" title={p.benefitsTitle}>
        <BenefitGrid soonLabel={t.common.comingSoon} items={p.benefits} />
      </Section>
      <Section title={p.stepsTitle}>
        <Steps steps={steps} />
      </Section>
      <Section tone="white" title={p.helpTitle} intro={p.helpBody} />
      <CtaBox
        title={lang === "yo" ? "Ṣe Ìgbàsílẹ̀ Àpù Alágbèéká fún Oko Rẹ" : "Get the Offline Field App for Your Farm"}
        body={
          lang === "yo"
            ? "Ṣiṣẹ́ lórí oko láìsí intanẹẹti. Ṣe àkọsílẹ̀, ya ààlà oko pẹ̀lú GPS, kí o sì lo AI fún àyẹ̀wò àrùn ohun ọ̀gbìn."
            : "Operate in remote fields without cellular connectivity. Log operations, map boundary polygons with hardware GPS, and get instant AI pest diagnosis."
        }
        href={`/${lang}/download`}
        label={lang === "yo" ? "Gba Àpù Android (APK)" : "Download Android APK"}
        secondary={{ href: `/${lang}/sign-up`, label: t.home.pilotCta }}
      />
    </>
  );
}
