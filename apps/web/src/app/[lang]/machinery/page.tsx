import { notFound } from "next/navigation";
import { BenefitGrid, ChipList, CtaBox, PageHero, Steps } from "@/components/site/page-parts";
import { Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/machinery">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/machinery", t.machineryPage.title, t.machineryPage.intro);
}

export default async function MachineryPage({ params }: PageProps<"/[lang]/machinery">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const p = t.machineryPage;
  const steps = t.home.audiences.find((a) => a.key === "owner")?.steps ?? [];
  return (
    <>
      <PageHero badge={p.badge} title={p.title} intro={p.intro} />
      <Section tone="white" title={p.typesTitle}>
        <ChipList items={p.types} />
      </Section>
      <Section title={p.benefitsTitle}>
        <BenefitGrid items={p.benefits} columns={2} />
      </Section>
      <Section tone="white" title={p.stepsTitle}>
        <Steps steps={steps} />
      </Section>
      <Section title={p.requirementsTitle}>
        <ul className="flex max-w-3xl list-disc flex-col gap-2 pl-6 text-lg">
          {p.requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
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
