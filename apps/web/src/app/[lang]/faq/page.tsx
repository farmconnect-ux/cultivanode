import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/faq">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/faq", t.faq.title, t.faq.intro);
}

export default async function FaqPage({ params }: PageProps<"/[lang]/faq">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
  return (
    <Container className="max-w-3xl py-14 sm:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <h1 className="text-4xl font-extrabold text-primary">{t.faq.title}</h1>
      <p className="mt-4 text-lg text-on-surface-variant">
        {t.faq.intro}{" "}
        <Link href={`/${lang}/contact`} className="font-semibold text-primary-container underline underline-offset-4">
          {t.nav.contact}
        </Link>
      </p>
      <div className="mt-10 flex flex-col gap-3">
        {t.faq.items.map((item) => (
          <details key={item.q} className="group rounded-lg border border-border bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
              {item.q}
              <span className="text-2xl leading-none text-secondary transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="px-5 pb-5 text-on-surface-variant">{item.a}</p>
          </details>
        ))}
      </div>
    </Container>
  );
}
