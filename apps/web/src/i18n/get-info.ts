import type { Locale } from "./config";
import type { InfoDictionary } from "./dictionaries/en-info";

// Copy for the plain information pages (about, platform, solutions, resources, whitepaper, legal, waitlist).
// Kept beside the main dictionary so those pages can be changed without touching en.ts / yo.ts.
const books: Record<Locale, () => Promise<InfoDictionary>> = {
  en: () => import("./dictionaries/en-info").then((m) => m.default),
  yo: () => import("./dictionaries/yo-info").then((m) => m.default),
};

export async function getInfoCopy(locale: Locale): Promise<InfoDictionary> {
  return books[locale]();
}

export type { InfoDictionary };
