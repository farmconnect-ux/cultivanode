import { notFound } from "next/navigation";
import { WaitlistForm } from "@/components/site/forms";
import { Badge, Card, Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/marketplace">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/marketplace", t.marketplace.title, t.marketplace.intro);
}

export default async function MarketplacePage({ params }: PageProps<"/[lang]/marketplace">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const m = t.marketplace;
  return (
    <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-col items-start gap-5">
        <Badge>{m.badge}</Badge>
        <h1 className="text-4xl font-extrabold text-leaf-800 sm:text-5xl">{m.title}</h1>
        <p className="text-lg text-muted">{m.intro}</p>
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Card>
            <h2 className="text-lg font-bold text-leaf-700">{m.buyersTitle}</h2>
            <p className="mt-2 text-muted">{m.buyersBody}</p>
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-leaf-700">{m.sellersTitle}</h2>
            <p className="mt-2 text-muted">{m.sellersBody}</p>
          </Card>
        </div>
      </div>
      <Card className="p-6 sm:p-8">
        <h2 className="mb-6 text-2xl font-bold">{m.formTitle}</h2>
        <WaitlistForm lang={lang} t={m} errors={t.forms} optional={t.common.optional} />
      </Card>
    </Container>
  );
}
