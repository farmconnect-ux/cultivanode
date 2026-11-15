import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBox, PageHero } from "@/components/site/page-parts";
import { Card, Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getInfoCopy } from "@/i18n/get-info";
import { pageMetadata } from "@/i18n/metadata";

// Plain "solutions by role" page. It replaces the design mock-up (solutions-by-role), which promised
// bank escrow, ADP partnerships, offtake deals and invented figures. Each card says only what that
// role can do in the app today; the roles follow the home page tabs plus the live marketplace.
const rolePaths = ["/farmers", "/machinery", "/service-providers", "/marketplace"] as const;

export async function generateMetadata({ params }: PageProps<"/[lang]/solutions">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const info = await getInfoCopy(lang);
  return pageMetadata(lang, "/solutions", info.solutionsPage.title, info.solutionsPage.intro);
}

export default async function SolutionsPage({ params }: PageProps<"/[lang]/solutions">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, info] = await Promise.all([getDictionary(lang), getInfoCopy(lang)]);
  const p = info.solutionsPage;
  return (
    <>
      <PageHero badge={t.common.pilotBadge} title={p.title} intro={p.intro} />
      <Section tone="white">
        <ul className="grid gap-4 sm:grid-cols-2">
          {p.roles.map((role, i) => (
            <li key={role.title}>
              <Card className="flex h-full flex-col gap-3">
                <h2 className="text-xl font-bold text-primary-container">{role.title}</h2>
                <p className="text-on-surface-variant">{role.body}</p>
                <Link
                  href={`/${lang}${rolePaths[i] ?? ""}`}
                  className="mt-auto self-start font-semibold text-primary underline underline-offset-4"
                >
                  {p.more}
                </Link>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-3xl text-on-surface-variant">{p.checksNote}</p>
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
