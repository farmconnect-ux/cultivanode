"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeCookie, localeNames, switchLocalePath, type Locale } from "@/i18n/config";

/** Switches between English and Yorùbá on the same page, and remembers the choice for a year. */
export function LanguageToggle({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname() ?? `/${current}`;
  const other: Locale = current === "en" ? "yo" : "en";
  return (
    <Link
      href={switchLocalePath(pathname, other)}
      hrefLang={other}
      lang={other}
      aria-label={`${label}: ${localeNames[other]}`}
      onClick={() => {
        document.cookie = `${localeCookie}=${other}; path=/; max-age=31536000; samesite=lax`;
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-secondary/30 px-4 text-sm font-bold text-primary-container hover:border-primary-container"
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
      </svg>
      {localeNames[other]}
    </Link>
  );
}
