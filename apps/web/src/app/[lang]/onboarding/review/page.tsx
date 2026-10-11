import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthShell } from "@/components/ds/auth-shell";
import { OnboardingReview } from "@/components/screens/onboarding-review";
import { hasLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Review & launch", robots: { index: false } };

export default async function Page({ params }: PageProps<"/[lang]/onboarding/review">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <AuthShell lang={lang}>
      <OnboardingReview lang={lang} />
    </AuthShell>
  );
}
