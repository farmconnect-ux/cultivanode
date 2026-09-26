import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Badge, Card, Container, LinkButton } from "@/components/ui";

/** Placeholder for sign-in and sign-up until phone sign-in ships in milestone M1. */
export function AccountSoon({ lang, title, t, soon }: { lang: Locale; title: string; t: Dictionary["account"]; soon: string }) {
  return (
    <Container className="flex max-w-2xl flex-col gap-6 py-14 sm:py-20">
      <Badge className="self-start">{soon}</Badge>
      <h1 className="text-4xl font-extrabold text-leaf-800">{title}</h1>
      <p className="text-lg text-muted">{t.body}</p>
      <Card>
        <h2 className="text-xl font-bold">{t.stepsTitle}</h2>
        <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5">
          {t.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <LinkButton href={`/${lang}/contact`} className="mt-6">
          {t.cta}
        </LinkButton>
      </Card>
    </Container>
  );
}
