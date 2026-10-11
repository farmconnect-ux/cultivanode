"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BooksScene, HireScene, PlanScene } from "./illustrations";

/** A slide is either one of the built-in illustrations or a picture uploaded in the admin console. */
export type CarouselSlide = {
  key: string;
  title: string | null;
  body: string | null;
  href?: string | null;
  image?: { src: string; alt: string } | null;
};
type Labels = { label: string; previous: string; next: string; pause: string; play: string; slideOf: string };

const scenes = [PlanScene, HireScene, BooksScene];
const INTERVAL_MS = 7000;

/**
 * Accessible carousel: pause/play, previous/next, swipe on touch screens, announces slides politely,
 * stops on hover/focus, and never auto-advances for people who prefer reduced motion.
 */
export function HeroCarousel({ slides, labels }: { slides: CarouselSlide[]; labels: Labels }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!playing || hovered || reduced || count < 2) return;
    const id = window.setInterval(() => go(1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [playing, hovered, go, count]);

  if (count === 0) return null;
  const slide = slides[Math.min(index, count - 1)]!;
  const Scene = scenes[index % scenes.length]!;
  const slideLabel = (n: number) => labels.slideOf.replace("{n}", String(n)).replace("{total}", String(count));

  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.label}
      className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div
        role="group"
        aria-roledescription="slide"
        aria-label={slideLabel(index + 1)}
        aria-live={playing && !hovered ? "off" : "polite"}
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX;
          touchX.current = null;
          if (start == null || end == null || Math.abs(end - start) < 40) return;
          go(end < start ? 1 : -1);
        }}
      >
        <div className="relative aspect-[3/2] w-full bg-surface-container-low">
          {slide.image ? (
            // Plain <img>: pictures come from Supabase Storage (allowed by the CSP) and are sized by CSS.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={slide.key}
              src={slide.image.src}
              alt={slide.image.alt}
              className="size-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <Scene />
          )}
        </div>
        {(slide.title || slide.body) && (
          <div className="p-5">
            {slide.title && (
              <h2 className="text-xl font-bold">
                {slide.href ? (
                  <Link href={slide.href} className="hover:text-primary-container hover:underline">
                    {slide.title}
                  </Link>
                ) : (
                  slide.title
                )}
              </h2>
            )}
            {slide.body && <p className="mt-1 text-on-surface-variant">{slide.body}</p>}
          </div>
        )}
      </div>
      {count > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
          <div className="flex items-center gap-1.5" role="group" aria-label={labels.label}>
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={slideLabel(i + 1)}
                aria-current={i === index}
                className="flex size-11 items-center justify-center"
              >
                <span className={`block h-2.5 rounded-full transition-all ${i === index ? "w-6 bg-primary-container" : "w-2.5 bg-surface-container"}`} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <CarouselButton label={labels.previous} onClick={() => go(-1)} path="M15 6l-6 6 6 6" />
            <CarouselButton
              label={playing ? labels.pause : labels.play}
              onClick={() => setPlaying((p) => !p)}
              path={playing ? "M9 6v12M15 6v12" : "M8 5l11 7-11 7z"}
            />
            <CarouselButton label={labels.next} onClick={() => go(1)} path="M9 6l6 6-6 6" />
          </div>
        </div>
      )}
    </section>
  );
}

function CarouselButton({ label, onClick, path }: { label: string; onClick: () => void; path: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-md text-primary-container hover:bg-surface-container-low"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </button>
  );
}
