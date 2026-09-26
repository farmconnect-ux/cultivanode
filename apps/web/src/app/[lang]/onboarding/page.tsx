import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OnboardingForm, type RoleOption } from "@/components/account/onboarding-form";
import { Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false } };

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
    <Container className="flex max-w-3xl flex-col gap-6 py-10 sm:py-14">
      <div>
        <h1 className="text-4xl font-extrabold text-leaf-800">{t.onboarding.title}</h1>
        <p className="mt-3 text-lg text-muted">{t.onboarding.intro}</p>
      </div>
      <OnboardingForm lang={lang} roles={roles} t={t} />
    </Container>
  );
}
