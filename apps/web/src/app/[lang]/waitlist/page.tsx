import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/icon";
import { PilotPage } from "@/components/screens/pilot-page";
import { WaitlistForm } from "@/components/site/forms";
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
    <PilotPage
      lang={lang}
      slots={{
        // The pilot application posts to the real waitlist (Admin → Website inbox).
        form: (
          <div className="flex flex-col gap-6">
            <p className="flex items-start gap-2 rounded-lg bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
              <Icon name="info" className="mt-0.5 text-lg text-secondary" />
              {t.waitlistPage.intro}
            </p>
            <WaitlistForm lang={lang} t={t.marketplace} errors={t.forms} optional={t.common.optional} />
          </div>
        ),
      }}
    />
  );
}
