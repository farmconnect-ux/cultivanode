import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OnboardingForm, type RoleOption } from "@/components/account/onboarding-form";
import { AuthShell } from "@/components/ds/auth-shell";
import { Icon } from "@/components/ds/icon";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false } };

const STEPS = [
  { icon: "badge", title: "Your details", body: "Name, state and language" },
  { icon: "work", title: "Your roles", body: "Farmer, provider, agent…" },
  { icon: "landscape", title: "First farm", body: "Add it right after" },
  { icon: "rocket_launch", title: "Launch", body: "Your workspace is ready" },
] as const;

export default async function OnboardingPage({ params }: PageProps<"/[lang]/onboarding">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await loadAccount();
  if (!account) redirect(`/${lang}/sign-in`);
  if (account.profile.onboarded_at) redirect(`/${lang}/account`);

  const t = await getDictionary(lang);
  const supabase = await createClient();
  const { data } = await supabase.from("roles").select("role, auto_approve").eq("available", true).order("auto_approve", { ascending: false });
  const roles: RoleOption[] = data ?? [];

  return (
    <AuthShell lang={lang}>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section className="card-surface animate-fade-up p-6 sm:p-8">
          <p className="mb-2 inline-flex items-center gap-1.5 font-label-md text-label-md uppercase tracking-wider text-secondary">
            <Icon name="how_to_reg" className="text-base" /> Farmer-first onboarding
          </p>
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-primary sm:text-headline-xl">{t.onboarding.title}</h1>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">{t.onboarding.intro}</p>
          <ol className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`flex items-center gap-3 rounded-xl p-3 ${i === 0 ? "bg-secondary-container/30" : "bg-surface-container-low"}`}>
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${i === 0 ? "bg-primary-container text-white" : "bg-surface-container-high text-on-surface-variant"}`}>
                  <Icon name={s.icon} className="text-lg" />
                </span>
                <span className="min-w-0">
                  <span className="block font-label-md text-label-md text-on-surface">{s.title}</span>
                  <span className="block truncate text-label-sm font-normal text-on-surface-variant">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="card-surface p-6 sm:p-8">
          <OnboardingForm lang={lang} roles={roles} t={t} />
        </section>
      </div>
    </AuthShell>
  );
}
