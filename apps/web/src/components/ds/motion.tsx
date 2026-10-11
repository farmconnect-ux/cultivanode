"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Quiet motion for the public site: sections fade up as they scroll into view, cards in a grid
 * follow with a short stagger, and the header gains depth once the page scrolls.
 *
 * Progressive by design: nothing is hidden on the server, content above the fold is never
 * hidden, and nothing moves for people who ask for reduced motion. Styles live in globals.css
 * under [data-motion].
 */
const STAGGER_MS = 70;
const MAX_STAGGER = 6;
const DURATION_MS = 650;

export function MarketingMotion({ rootId = "main" }: { rootId?: string }) {
  const pathname = usePathname();

  // Header depth on scroll.
  React.useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.toggleAttribute("data-scrolled", window.scrollY > 8);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Section and card reveals; re-run on every client-side navigation.
  React.useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const fold = window.innerHeight * 0.92;
    const below = (el: Element) => el.getBoundingClientRect().top > fold;
    const timers: number[] = [];

    const reveal = (el: HTMLElement) => {
      el.setAttribute("data-revealed", "");
      const delay = Number(el.style.getPropertyValue("--reveal-delay").replace("ms", "")) || 0;
      // Once in place, drop the stagger so hover transitions respond immediately.
      timers.push(window.setTimeout(() => el.setAttribute("data-reveal-done", ""), delay + DURATION_MS + 50));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          observer.unobserve(el);
          reveal(el);
          el.querySelectorAll<HTMLElement>("[data-reveal-item]:not([data-revealed])").forEach(reveal);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );

    // Sections: every <section>, plus top-level blocks of an imported screen.
    const sections = Array.from(
      new Set<HTMLElement>([
        ...root.querySelectorAll<HTMLElement>("section"),
        ...root.querySelectorAll<HTMLElement>(".screen > div, .screen > header, .screen > footer"),
      ]),
    ).sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

    sections.forEach((section) => {
      if (section.hasAttribute("data-no-reveal") || section.hasAttribute("data-revealed")) return;
      if (section.parentElement?.closest("[data-reveal]")) return;
      // Already prepared by an earlier run of this effect (React re-runs effects in development).
      if (!section.hasAttribute("data-reveal")) {
        if (!below(section)) return;
        section.setAttribute("data-reveal", "");
        // Stagger the cards of the first grid or card row inside the section.
        const grid = section.querySelector<HTMLElement>(".grid, [class*='md:grid-cols'], [class*='lg:grid-cols']");
        if (grid) {
          Array.from(grid.children).forEach((child, i) => {
            if (!(child instanceof HTMLElement)) return;
            child.setAttribute("data-reveal-item", "");
            child.style.setProperty("--reveal-delay", `${Math.min(i, MAX_STAGGER) * STAGGER_MS}ms`);
          });
        }
      }
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pathname, rootId]);

  return null;
}
