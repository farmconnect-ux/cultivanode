import type { Locale } from "@/i18n/config";

/** A post-sign-in destination, accepted only as a same-site path under the current language (e.g. /en/marketplace/checkout). */
export function safeNext(raw: unknown, lang: Locale): string | null {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s || s.length > 300 || !s.startsWith(`/${lang}/`) || s.startsWith("//") || /[\\\s]/.test(s)) return null;
  return s;
}
