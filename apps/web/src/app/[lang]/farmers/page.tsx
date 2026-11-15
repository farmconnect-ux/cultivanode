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
        title={lang === "yo" ? "Ṣe Ìgbàsílẹ̀ Àpù Alágbèéká fún Oko Rẹ" : "Get the Mobile App for Your Farm"}
        body={
          lang === "yo"
            ? "Kọ iṣẹ́ oko rẹ sílẹ̀, sàmì sí ibi tí oko rẹ wà pẹ̀lú GPS, kí o sì béèrè ìbéèrè lọ́wọ́ olùrànlọ́wọ́ oko. Ṣíṣiṣẹ́ láìsí nẹ́tíwọ́ọ̀kì àti àyẹ̀wò àwòrán ewéko ń bọ̀ láìpẹ́."
            : "Log your farm work, drop a pin on your farm with GPS, and ask the farm assistant. Offline mode and photo diagnosis are coming soon."
        }
        href={`/${lang}/download`}
        label={lang === "yo" ? "Gba Àpù Android (APK)" : "Download Android APK"}
        secondary={{ href: `/${lang}/sign-up`, label: t.home.pilotCta }}
      />
    </>
  );
}
