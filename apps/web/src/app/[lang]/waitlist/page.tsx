import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { PageHero } from "@/components/site/page-parts";
import { WaitlistForm } from "@/components/site/forms";
import { Card, Container, LinkButton } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getInfoCopy } from "@/i18n/get-info";
import { pageMetadata } from "@/i18n/metadata";

// Plain waitlist page. The form is the real waitlist (Admin → Website inbox), wired as before.
// It replaces the design mock-up (pilot-page), which showed an invented quota tracker, ADP clusters,
// bank escrow and past pilot dates.
export async function generateMetadata({ params }: PageProps<"/[lang]/waitlist">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/waitlist", t.waitlistPage.title, t.waitlistPage.intro);
}

export default async function WaitlistPage({ params }: PageProps<"/[lang]/waitlist">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, info] = await Promise.all([getDictionary(lang), getInfoCopy(lang)]);
  const w = info.waitlistExtra;
  return (
    <>
      <PageHero badge={t.common.pilotBadge} title={t.waitlistPage.title} intro={t.waitlistPage.intro} />
      <Container className="grid gap-10 pb-16 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col items-start gap-5">
          <p className="flex items-start gap-2 rounded-lg bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
            <Icon name="info" className="mt-0.5 text-lg text-secondary" />
            {w.note}
          </p>
          <LinkButton href={`/${lang}/sign-up`} variant="secondary">
            {w.pilotCta}
          </LinkButton>
        </div>
        <Card className="p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold">{t.marketplace.formTitle}</h2>
          <WaitlistForm lang={lang} t={t.marketplace} errors={t.forms} optional={t.common.optional} />
        </Card>
      </Container>
    </>
  );
}
