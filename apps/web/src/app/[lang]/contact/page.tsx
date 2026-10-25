import { notFound } from "next/navigation";
import { ContactForm } from "@/components/site/forms";
import { Card, Container, LinkButton } from "@/components/ui";
import { site } from "@/config/site";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

// Plain contact page built from the translated dictionary. It replaces the design mock-up
// (contact-page), which hard-coded the design's sample phone/WhatsApp number ("+234 800-CULTIVA")
// and described escrow arrangements that are not in place. Phone, WhatsApp and email come from
// NEXT_PUBLIC_CONTACT_* (config/site.ts); anything left blank is not shown.
export async function generateMetadata({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/contact", t.contact.title, t.contact.intro);
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const c = t.contact;
  const { whatsappUrl, phone, phoneHref, email } = site.contact;
  return (
    <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.3fr]">
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl font-extrabold text-primary">{c.title}</h1>
        <p className="text-lg text-on-surface-variant">{c.intro}</p>
        <div className="flex flex-col items-start gap-3">
          {whatsappUrl && (
            <LinkButton href={whatsappUrl} external variant="primary">
              {c.whatsapp}
            </LinkButton>
          )}
          {phone && phoneHref && (
            <LinkButton href={phoneHref} variant="secondary">
              {c.call}: {phone}
            </LinkButton>
          )}
          {email && (
            <a href={`mailto:${email}`} className="font-semibold text-primary underline underline-offset-4">
              {c.email}: {email}
            </a>
          )}
        </div>
      </div>
      <Card className="p-6 sm:p-8">
        <h2 className="mb-6 text-2xl font-bold">{c.formTitle}</h2>
        <ContactForm lang={lang} t={c} errors={t.forms} optional={t.common.optional} />
      </Card>
    </Container>
  );
}
