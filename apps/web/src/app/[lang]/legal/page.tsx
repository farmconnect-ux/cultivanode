import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/page-parts";
import { Card, Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getInfoCopy } from "@/i18n/get-info";
import { pageMetadata } from "@/i18n/metadata";

// Index of the legal documents that exist (privacy policy and terms of use), with their draft notice.
// It replaces the design mock-up (legal-governance), which showed a company registration number,
// a regulator registration number, bank accounts, a penalty notice and a data protection mailbox
// that are not real.
export async function generateMetadata({ params }: PageProps<"/[lang]/legal">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const info = await getInfoCopy(lang);
  return pageMetadata(lang, "/legal", info.legalPage.title, info.legalPage.intro);
}

export default async function LegalPage({ params }: PageProps<"/[lang]/legal">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, info] = await Promise.all([getDictionary(lang), getInfoCopy(lang)]);
  const p = info.legalPage;
  const docs = [
    { href: `/${lang}/privacy`, title: t.legal.privacy.title, intro: t.legal.privacy.intro },
    { href: `/${lang}/terms`, title: t.legal.terms.title, intro: t.legal.terms.intro },
  ];
  return (
    <>
      <PageHero title={p.title} intro={p.intro}>
        <p className="max-w-3xl rounded-md border-l-4 border-harvest-500 bg-harvest-50 p-4 text-ink">{t.legal.draftNotice}</p>
      </PageHero>
      <Section tone="white">
        <ul className="grid gap-4 sm:grid-cols-2">
          {docs.map((d) => (
            <li key={d.href}>
              <Card className="flex h-full flex-col gap-3">
                <h2 className="text-xl font-bold text-primary-container">{d.title}</h2>
                <p className="text-on-surface-variant">{d.intro}</p>
                <Link href={d.href} className="mt-auto self-start font-semibold text-primary underline underline-offset-4">
                  {p.open}
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={p.dataTitle} intro={p.dataBody}>
        <p className="max-w-3xl text-on-surface-variant">
          <Link href={`/${lang}/contact`} className="font-semibold text-primary underline underline-offset-4">
            {t.legal.contactLine}
          </Link>
        </p>
      </Section>
    </>
  );
}
