import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Card, Container } from "@/components/ui";
import { PhoneSignIn } from "./phone-sign-in";

/** Sign-in and sign-up share one flow: a new number gets an account, then onboarding. */
export function AuthPage({ lang, t, mode }: { lang: Locale; t: Dictionary["auth"]; mode: "sign-in" | "sign-up" }) {
  const title = mode === "sign-in" ? t.signInTitle : t.signUpTitle;
  const intro = mode === "sign-in" ? t.signInIntro : t.signUpIntro;
  const [before, rest] = t.termsNote.split("{terms}");
  const [middle, after] = (rest ?? "").split("{privacy}");
  return (
    <Container className="flex max-w-lg flex-col gap-6 py-12 sm:py-16">
      <div>
        <h1 className="text-4xl font-extrabold text-leaf-800">{title}</h1>
        <p className="mt-3 text-lg text-muted">{intro}</p>
      </div>
      <Card>
        <PhoneSignIn lang={lang} t={t} />
      </Card>
      <p className="text-sm text-muted">
        {before}
        <Link href={`/${lang}/terms`} className="font-semibold text-leaf-700 underline">{t.terms}</Link>
        {middle}
        <Link href={`/${lang}/privacy`} className="font-semibold text-leaf-700 underline">{t.privacy}</Link>
        {after}
      </p>
      <p>
        {mode === "sign-in" ? t.noAccount : t.haveAccount}{" "}
        <Link href={`/${lang}/${mode === "sign-in" ? "sign-up" : "sign-in"}`} className="font-semibold text-leaf-700 underline">
          {mode === "sign-in" ? t.signUpTitle : t.signInTitle}
        </Link>
      </p>
    </Container>
  );
}
