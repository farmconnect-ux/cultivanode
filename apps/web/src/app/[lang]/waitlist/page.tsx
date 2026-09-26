import { notFound } from "next/navigation";
import { WaitlistForm } from "@/components/site/forms";
import { Card, Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/waitlist">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/waitlist", t.waitlistPage.title, t.waitlistPage.intro);
}

export default async function WaitlistPage({ params }: PageProps<"/[lang]/waitlist">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return (
    <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl font-extrabold text-leaf-800 sm:text-5xl">{t.waitlistPage.title}</h1>
        <p className="text-lg text-muted">{t.waitlistPage.intro}</p>
      </div>
      <Card className="p-6 sm:p-8">
        <WaitlistForm lang={lang} t={t.marketplace} errors={t.forms} optional={t.common.optional} />
      </Card>
    </Container>
  );
}
