import { notFound } from "next/navigation";
import { BenefitGrid, ChipList, CtaBox, PageHero, Steps } from "@/components/site/page-parts";
import { LinkButton, Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

// Plain page for machinery owners, built from the translated dictionary. It replaces the design
// mock-up (machinery-directory), whose fleet cards, booking and sign-up forms were not connected
// to anything and told visitors a booking or registration had gone through when it had not.
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
      <PageHero badge={p.badge} title={p.title} intro={p.intro}>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={`/${lang}/sign-up`}>{t.home.pilotCta}</LinkButton>
          {/* Farmers land here from the menu looking for a tractor: send them to the real search. */}
          <LinkButton href={`/${lang}/account/find`} variant="secondary">
            {p.findCta}
          </LinkButton>
        </div>
      </PageHero>
      <Section tone="white" title={p.typesTitle}>
        <ChipList items={p.types} />
      </Section>
      <Section title={p.benefitsTitle}>
        <BenefitGrid soonLabel={t.common.comingSoon} items={p.benefits} columns={2} />
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
