// Server-component counterpart of ./marketing: the page records the visitor's language once per request
// (setPageLocale), and tYo swaps English for the screen's Yorùbá phrase book while it renders.
import { cache } from "react";
import type { Locale } from "@/i18n/config";

const requestLocale = cache(() => ({ lang: "en" as Locale }));

/** Call at the top of a server page, after the locale is validated. */
export function setPageLocale(lang: Locale) {
  requestLocale().lang = lang;
}

export function serverPhrasebook(yo: Readonly<Record<string, string>>) {
  return function tYo<V>(value: V): V {
    if (typeof value !== "string" || requestLocale().lang !== "yo") return value;
    const hit = yo[value.trim()];
    if (!hit) return value;
    return (value.slice(0, value.length - value.trimStart().length) + hit + value.slice(value.trimEnd().length)) as V;
  };
}
