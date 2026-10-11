"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeCookie, localeNames, switchLocalePath, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const SHORT: Record<Locale, string> = { en: "EN", yo: "YOR" };

/** EN / YOR segmented switch (design files' header control). Remembers the choice for a year. */
export function LocaleSwitch({ current, className }: { current: Locale; className?: string }) {
  const pathname = usePathname() ?? `/${current}`;
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn("flex items-center rounded-lg border border-surface-container bg-surface-container-low p-0.5", className)}
    >
      {(Object.keys(SHORT) as Locale[]).map((l) => {
        const active = l === current;
        return (
          <Link
            key={l}
            href={switchLocalePath(pathname, l)}
            hrefLang={l}
            lang={l}
            aria-current={active ? "true" : undefined}
            title={localeNames[l]}
            onClick={() => {
              document.cookie = `${localeCookie}=${l}; path=/; max-age=31536000; samesite=lax`;
            }}
            className={cn(
              "rounded-md px-2 py-1 font-label-sm text-label-sm transition-all duration-150",
              active
                ? "bg-surface-container-lowest text-primary shadow-card"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {SHORT[l]}
          </Link>
        );
      })}
    </div>
  );
}
