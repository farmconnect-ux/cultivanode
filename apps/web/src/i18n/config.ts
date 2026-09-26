// Website languages. Pidgin (pcm) joins when its copy is written; the app already stores it.
export const locales = ["en", "yo"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeCookie = "NEXT_LOCALE";

export const localeNames: Record<Locale, string> = { en: "English", yo: "Yorùbá" };
// BCP 47 tags for <html lang> and hreflang.
export const htmlLang: Record<Locale, string> = { en: "en-NG", yo: "yo-NG" };

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Picks a locale from an Accept-Language header. Yorùbá wins if the browser lists it at all. */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return defaultLocale;
  const tags = header.toLowerCase().split(",").map((part) => part.split(";")[0]!.trim());
  return tags.some((t) => t === "yo" || t.startsWith("yo-")) ? "yo" : defaultLocale;
}

/** Swaps the first path segment for another locale: /yo/faq -> /en/faq. */
export function switchLocalePath(pathname: string, to: Locale): string {
  const parts = pathname.split("/");
  if (parts.length > 1 && hasLocale(parts[1] ?? "")) parts[1] = to;
  else parts.splice(1, 0, to);
  const next = parts.join("/");
  return next.endsWith("/") && next.length > 1 ? next.slice(0, -1) : next;
}
