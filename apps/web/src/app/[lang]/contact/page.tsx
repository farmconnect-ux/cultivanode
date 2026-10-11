import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { ContactPage as ContactScreen } from "@/components/screens/contact-page";
import { ContactForm } from "@/components/site/forms";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

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
  return (
    <ContactScreen
      lang={lang}
      slots={{
        // The design's ticket form, wired to the real contact inbox (Admin → Website inbox).
        form: (
          <div className="rounded-lg bg-surface-container-lowest p-8 shadow-sm lg:col-span-7 lg:p-10" id="contact-inquiry-form">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary">
                <Icon name="forward_to_inbox" className="text-xl" />
              </span>
              <div>
                <h3 className="font-headline-md text-headline-md text-primary">{c.formTitle}</h3>
                <p className="text-body-sm text-on-surface-variant">{c.intro}</p>
              </div>
            </div>
            <ContactForm lang={lang} t={c} errors={t.forms} optional={t.common.optional} />
          </div>
        ),
      }}
    />
  );
}
