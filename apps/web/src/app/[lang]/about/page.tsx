import { notFound } from "next/navigation";
import { Card, Container, Section } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "/about", t.about.title, t.about.intro);
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const a = (await getDictionary(lang)).about;
  return (
    <>
      <Container className="py-14 sm:py-20">
        <h1 className="text-4xl font-extrabold text-leaf-800 sm:text-5xl">{a.title}</h1>
        <p className="mt-5 max-w-3xl text-xl text-muted">{a.intro}</p>
      </Container>
      <Section tone="white" title={a.whyTitle}>
        <div className="flex max-w-3xl flex-col gap-4 text-lg">
          {a.whyBody.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Section>
      <Section title={a.pilotTitle} intro={a.pilotBody} />
      <Section tone="white" title={a.nameTitle} intro={a.nameBody} />
      <Section title={a.valuesTitle}>
        <ul className="grid gap-4 md:grid-cols-3">
          {a.values.map((v) => (
            <li key={v.title}>
              <Card className="h-full">
                <h3 className="text-lg font-bold text-leaf-700">{v.title}</h3>
                <p className="mt-2 text-muted">{v.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
