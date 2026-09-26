import { notFound } from "next/navigation";
import { BenefitGrid, ChipList, PageHero } from "@/components/site/page-parts";
import { Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/crops">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/crops", t.cropsPage.title, t.cropsPage.intro);
}

export default async function CropsPage({ params }: PageProps<"/[lang]/crops">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const p = t.cropsPage;
  return (
    <>
      <PageHero title={p.title} intro={p.intro} />
      <Section tone="white" title={p.listTitle} intro={t.home.cropsNote}>
        <ChipList items={t.home.crops} />
      </Section>
      <Section title={p.seasonsTitle}>
        <BenefitGrid items={p.seasons} />
      </Section>
      <Section tone="white" title={p.zonesTitle}>
        <BenefitGrid items={p.zones} columns={2} />
      </Section>
      <Section title={p.standardsTitle} intro={p.standardsBody} />
    </>
  );
}
