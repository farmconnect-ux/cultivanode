"use client";

// Yorùbá for the public (marketing) screens.
//
// The ported design screens keep their English copy in the source, which stays the reference text. Each
// screen has a phrase book (src/i18n/yo-marketing/<screen>.ts) mapping that English to Yorùbá; every
// visible phrase in the screen is passed through the screen's `tYo`. With the site in Yorùbá the phrase is
// swapped; anything not in the phrase book (or with the site in English) shows the English unchanged.
//
// Phrase books are machine-drafted and must be reviewed by a fluent Yorùbá speaker before launch.
import { createContext, use, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";

const SiteLocale = createContext<Locale>("en");

/** Set once in the [lang] layout so every public screen knows the visitor's language. */
export function MarketingLocale({ lang, children }: { lang: Locale; children: ReactNode }) {
  return <SiteLocale value={lang}>{children}</SiteLocale>;
}

function swap(yo: Readonly<Record<string, string>>, value: string): string {
  const key = value.trim();
  const hit = yo[key];
  if (!hit) return value;
  const lead = value.slice(0, value.length - value.trimStart().length);
  const trail = value.slice(value.trimEnd().length);
  return lead + hit + trail;
}

export type Translator = (<V>(value: V) => V) & {
  /** For text shown from event handlers (toasts), outside rendering: reads the page language. */
  now: <V>(value: V) => V;
};

/** A translator for one screen's phrase book. Call it while rendering (JSX), or `.now` from handlers. */
export function phrasebook(yo: Readonly<Record<string, string>>): Translator {
  function tYo<V>(value: V): V {
    if (typeof value !== "string") return value;
    // `use` may be called conditionally; tYo only runs while a component renders.
    return (use(SiteLocale) === "yo" ? swap(yo, value) : value) as V;
  }
  tYo.now = function now<V>(value: V): V {
    if (typeof value !== "string" || typeof document === "undefined") return value;
    return (document.documentElement.lang.startsWith("yo") ? swap(yo, value) : value) as V;
  };
  return tYo;
}
