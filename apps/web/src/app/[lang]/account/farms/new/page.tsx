import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FarmForm } from "@/components/account/farm-form";
import { Icon } from "@/components/ds/icon";
import { FarmRegistrationWizard } from "@/components/screens/farm-registration-wizard";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";

export const metadata: Metadata = { title: "Register a farm" };

export default async function NewFarmPage({ params }: PageProps<"/[lang]/account/farms/new">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);

  return (
    <FarmRegistrationWizard
      lang={lang}
      slots={{
        form: (
          <div className="grid gap-space-lg lg:grid-cols-12">
            <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm lg:col-span-8">
              <div className="flex flex-col justify-between gap-3 bg-surface-container-low px-space-lg py-space-md md:flex-row md:items-center">
                <div className="flex items-center gap-space-sm">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-container text-on-primary">
                    <Icon name="corporate_fare" className="text-xl" />
                  </span>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Farm identity &amp; location</h2>
                    <p className="text-body-sm text-on-surface-variant">Name, state, size and a GPS point — boundaries and plots come next.</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 self-start rounded-full bg-surface-container-lowest px-2.5 py-1 font-label-sm text-label-sm text-secondary md:self-auto">
                  <Icon name="my_location" className="text-sm" /> Uses your phone GPS
                </span>
              </div>
              <div className="p-space-lg">
                <FarmForm lang={lang} t={t} defaultState={account.profile.state} />
              </div>
            </section>
            <aside className="flex flex-col gap-space-md lg:col-span-4">
              <div className="rounded-xl bg-primary p-space-lg text-on-primary shadow-sm">
                <p className="font-label-md text-label-md uppercase tracking-wider text-secondary-fixed-dim">Why the location matters</p>
                <ul className="mt-space-sm space-y-2 text-body-sm text-on-primary/85">
                  {[
                    "Matches you with machinery and crews within reach",
                    "Sets the agro-ecological zone for crop calendars",
                    "Anchors proof-of-work GPS checks on job day",
                  ].map((x) => (
                    <li key={x} className="flex gap-2">
                      <Icon name="check_circle" className="mt-0.5 text-base text-secondary-fixed-dim" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
                <p className="font-headline-sm text-headline-sm text-on-surface">Standing on the farm?</p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Tap “Use my location” for the most accurate point. You can also type coordinates from a surveyor plan.
                </p>
              </div>
            </aside>
          </div>
        ),
      }}
    />
  );
}
