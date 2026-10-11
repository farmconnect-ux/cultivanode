import { notFound } from "next/navigation";
import { HomePage as HomeScreen } from "@/components/screens/home-page";
import { HeroCarousel } from "@/components/site/hero-carousel";
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

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, pictures] = await Promise.all([getDictionary(lang), loadHeroSlides(lang)]);
  const h = t.home;

  return (
    <HomeScreen
      lang={lang}
      slots={{
        // Headline and lede follow the visitor's language; the rest of the page is the design's copy.
        heroTitle: (
          <h1 className="font-headline-xl-mobile text-[2.5rem] leading-[1.05] tracking-tight text-primary sm:text-display-lg lg:text-[3.75rem]">
            {h.heroPromise}
          </h1>
        ),
        heroLede: <p className="mt-6 max-w-xl text-body-lg text-on-surface-variant">{h.heroBody}</p>,
        // Pictures uploaded in Admin → Content replace the design's hero photo.
        ...(pictures.length > 0
          ? {
              heroMedia: (
                <div className="overflow-hidden rounded-2xl bg-surface-container-high shadow-xl">
                  <HeroCarousel
                    slides={pictures.map((p) => ({ key: p.id, title: p.title, body: p.body, href: p.href, image: { src: p.src, alt: p.alt } }))}
                    labels={{ label: h.carouselLabel, previous: h.previous, next: h.next, pause: h.pause, play: h.play, slideOf: h.slideOf }}
                  />
                </div>
              ),
            }
          : {}),
      }}
    />
  );
}
