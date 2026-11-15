import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBox, PageHero } from "@/components/site/page-parts";
import { Card, Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getInfoCopy } from "@/i18n/get-info";
import { pageMetadata } from "@/i18n/metadata";

// Plain resources page that links to real help: the crop guide, the FAQ and the farm assistant.
// It replaces the design mock-up (agronomy-library), which listed invented authors, institutions,
// seed-certification tags and "authenticated" PDF downloads.
const itemPaths = ["/crops", "/faq", "/account/assistant"] as const;

export async function generateMetadata({ params }: PageProps<"/[lang]/resources">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const info = await getInfoCopy(lang);
  return pageMetadata(lang, "/resources", info.resourcesPage.title, info.resourcesPage.intro);
}

export default async function ResourcesPage({ params }: PageProps<"/[lang]/resources">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, info] = await Promise.all([getDictionary(lang), getInfoCopy(lang)]);
  const p = info.resourcesPage;
  return (
    <>
      <PageHero title={p.title} intro={p.intro} />
      <Section tone="white">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {p.items.map((item, i) => (
            <li key={item.title}>
              <Card className="flex h-full flex-col gap-3">
                <h2 className="text-xl font-bold text-primary-container">{item.title}</h2>
                <p className="text-on-surface-variant">{item.body}</p>
                <Link
                  href={`/${lang}${itemPaths[i] ?? ""}`}
                  className="mt-auto self-start font-semibold text-primary underline underline-offset-4"
                >
                  {item.cta}
                </Link>
              </Card>
            </li>
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
