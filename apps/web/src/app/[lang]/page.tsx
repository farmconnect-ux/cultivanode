import { notFound } from "next/navigation";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { HowItWorks } from "@/components/site/how-it-works";
import { Card, Container, LinkButton, Section } from "@/components/ui";
import { site } from "@/config/site";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/i18n/metadata";
import { loadHeroSlides } from "@/lib/site-content";

// Rebuilt in the background at most every 5 minutes; saving a slide in the admin console refreshes it at once.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return pageMetadata(lang, "", undefined, t.meta.description);
}

const featureIcons = [
  "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z", // calendar
  "M12 22c4-4 7-7.5 7-11a7 7 0 1 0-14 0c0 3.5 3 7 7 11Z M12 8v6M9 11h6", // planner drop
  "M3 17h2l2-6h9l2 6h3M7 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0", // tractor-ish
  "M4 15a4 4 0 0 0 4 4h9a5 5 0 1 0-1.4-9.8A6 6 0 0 0 4 12v3Z", // cloud
  "M3 7l9-4 9 4v10l-9 4-9-4V7Z M3 7l9 4 9-4 M12 11v10", // box
  "M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6", // chart
  "M4 5h16v11H8l-4 4V5Z M8 9h8M8 12h5", // chat
  "M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01", // signal
];

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, pictures] = await Promise.all([getDictionary(lang), loadHeroSlides(lang)]);
  const h = t.home;
  // Pictures uploaded in the admin console replace the built-in illustrated slides.
  const slides = pictures.length > 0
    ? pictures.map((p) => ({ key: p.id, title: p.title, body: p.body, href: p.href, image: { src: p.src, alt: p.alt } }))
    : h.slides.map((s) => ({ key: s.title, title: s.title, body: s.body }));

  return (
    <>
      {/* Hero: deep brand green with the cyan accent (Figma: Screens > Landing · desktop 1440) */}
      <section className="relative overflow-hidden bg-leaf-800 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 size-[34rem] rounded-full bg-node-300/10 blur-3xl" />
        <Container className="relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-leaf-700 px-3 py-1.5 text-sm font-semibold text-leaf-100">
              <span aria-hidden="true" className="size-2 rounded-full bg-harvest-300" />
              {t.common.pilotBadge}
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <HeroTitle title={h.heroTitle} accent={h.heroAccent} />
            </h1>
            <p className="max-w-xl text-lg text-leaf-100 sm:text-xl">
              <strong className="font-semibold text-white">{h.heroPromise}</strong> {h.heroBody}
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href={`/${lang}/sign-up`} size="lg" variant="accent">
                {h.heroPrimary}
              </LinkButton>
              <LinkButton href={`/${lang}#how`} size="lg" variant="onDark">
                {h.heroSecondary}
              </LinkButton>
            </div>
            <ul className="grid w-full max-w-xl gap-4 pt-2 sm:grid-cols-3">
              {h.heroProof.map((p) => (
                <li key={p.title} className="border-l-2 border-node-300/60 pl-3">
                  <p className="font-bold text-white">{p.title}</p>
                  <p className="text-sm text-leaf-100">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
          <HeroCarousel
            slides={slides}
            labels={{ label: h.carouselLabel, previous: h.previous, next: h.next, pause: h.pause, play: h.play, slideOf: h.slideOf }}
          />
        </Container>
      </section>

      {/* Features */}
      <Section tone="white" eyebrow={h.featuresEyebrow} title={h.featuresTitle} intro={h.featuresNote}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {h.features.map((f, i) => (
            <li key={f.title}>
              <Card className="flex h-full flex-col gap-3">
                <span className="flex size-12 items-center justify-center rounded-md bg-leaf-50 text-leaf-700" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={featureIcons[i % featureIcons.length]} />
                  </svg>
                </span>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="text-muted">{f.body}</p>
                <span className={`mt-auto self-start rounded-full px-3 py-1 text-sm font-semibold ${f.soon ? "bg-harvest-100 text-harvest-700" : "bg-leaf-100 text-leaf-800"}`}>
                  {f.soon ? t.common.comingSoon : t.common.inPilot}
                </span>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      {/* How it works */}
      <Section id="how" eyebrow={h.howEyebrow} title={h.howTitle} intro={h.howIntro} className="scroll-mt-16">
        <HowItWorks audiences={h.audiences} />
      </Section>

      {/* Crops */}
      <Section tone="white" eyebrow={h.cropsEyebrow} title={h.cropsTitle} intro={h.cropsNote}>
        <ul className="flex flex-wrap gap-2">
          {h.crops.map((c) => (
            <li key={c} className="rounded-full border-2 border-leaf-100 bg-leaf-50 px-4 py-2 font-semibold text-leaf-800">
              {c}
            </li>
          ))}
        </ul>
      </Section>

      {/* Trust */}
      <Section tone="leaf" eyebrow={h.trustEyebrow} title={h.trustTitle}>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {h.trust.map((item) => (
            <li key={item.title} className="rounded-lg border border-leaf-600 bg-leaf-900/40 p-6">
              <h3 className="text-lg font-bold text-harvest-200">{item.title}</h3>
              <p className="mt-2 text-leaf-100">{item.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Partners: shown once there are signed partners in config/site.ts */}
      {site.partners.length > 0 && (
        <Section tone="white" title={h.partnersTitle}>
          <ul className="flex flex-wrap items-center gap-8">
            {site.partners.map((p) => (
              <li key={p.name} className="text-lg font-bold text-muted">
                {p.url ? <a href={p.url} rel="noopener noreferrer" target="_blank">{p.name}</a> : p.name}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Pilot call to action */}
      <section className="bg-harvest-100">
        <Container className="flex flex-col items-start gap-5 py-14 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold text-ink">{h.pilotTitle}</h2>
            <p className="mt-3 text-lg text-ink/80">{h.pilotBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={`/${lang}/sign-up`} size="lg">
              {h.pilotCta}
            </LinkButton>
            <LinkButton href={`/${lang}/contact`} size="lg" variant="secondary">
              {h.pilotSecondary}
            </LinkButton>
          </div>
        </Container>
      </section>
    </>
  );
}

/** The tagline with one phrase in the brand cyan (falls back to plain text if the phrase is missing). */
function HeroTitle({ title, accent }: { title: string; accent: string }) {
  const i = accent ? title.indexOf(accent) : -1;
  if (i < 0) return <>{title}</>;
  return (
    <>
      {title.slice(0, i)}
      <span className="text-node-300">{accent}</span>
      {title.slice(i + accent.length)}
    </>
  );
}
