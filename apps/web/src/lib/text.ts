import type { Locale } from "@/i18n/config";

/** Replaces {name} placeholders in dictionary strings. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

/** A date in the reader's language, e.g. "26 Sept 2026". */
export function formatDate(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang === "yo" ? "yo-NG" : "en-NG", { dateStyle: "medium" }).format(new Date(iso));
}

/** 2348031234567 -> "0803 123 4567". */
export function localPhone(international: string | null | undefined): string {
  if (!international || !/^234[0-9]{10}$/.test(international)) return international ?? "";
  const l = `0${international.slice(3)}`;
  return `${l.slice(0, 4)} ${l.slice(4, 7)} ${l.slice(7)}`;
}
