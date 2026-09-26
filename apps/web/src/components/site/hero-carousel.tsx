"use client";

import { useCallback, useEffect, useState } from "react";
import { BooksScene, HireScene, PlanScene } from "./illustrations";

type Slide = { title: string; body: string };
type Labels = { label: string; previous: string; next: string; pause: string; play: string; slideOf: string };

const scenes = [PlanScene, HireScene, BooksScene];
const INTERVAL_MS = 7000;

/**
 * Accessible carousel: pause/play, previous/next, announces slides politely, stops on hover/focus,
 * and never auto-advances for people who prefer reduced motion.
 */
export function HeroCarousel({ slides, labels }: { slides: Slide[]; labels: Labels }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const count = slides.length;

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!playing || hovered || reduced) return;
    const id = window.setInterval(() => go(1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [playing, hovered, go]);

  const slide = slides[index]!;
  const Scene = scenes[index % scenes.length]!;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.label}
      className="overflow-hidden rounded-xl border border-line bg-white shadow-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div
        role="group"
        aria-roledescription="slide"
        aria-label={labels.slideOf.replace("{n}", String(index + 1)).replace("{total}", String(count))}
        aria-live={playing && !hovered ? "off" : "polite"}
      >
        <div className="aspect-[3/2] w-full">
          <Scene />
        </div>
        <div className="p-5">
          <h2 className="text-xl font-bold">{slide.title}</h2>
          <p className="mt-1 text-muted">{slide.body}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
        <div className="flex items-center gap-1.5" role="group" aria-label={labels.label}>
          {slides.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={labels.slideOf.replace("{n}", String(i + 1)).replace("{total}", String(count))}
              aria-current={i === index}
              className="flex size-11 items-center justify-center"
            >
              <span className={`block h-2.5 rounded-full transition-all ${i === index ? "w-6 bg-leaf-600" : "w-2.5 bg-line"}`} />
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
    </section>
  );
}

function CarouselButton({ label, onClick, path }: { label: string; onClick: () => void; path: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-md text-leaf-700 hover:bg-leaf-50"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </button>
  );
}
