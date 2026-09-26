"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";
import { cx } from "@/components/ui";
import type { Locale } from "@/i18n/config";

export type NavItem = { href: string; label: string };

/** Account sections: a list on wide screens, a disclosure menu on phones. */
export function AccountNav({ lang, items, signOutLabel, menuLabel }: { lang: Locale; items: NavItem[]; signOutLabel: string; menuLabel: string }) {
  const pathname = usePathname();
  const current = items.find((i) => (i.href === `/${lang}/account` ? pathname === i.href : pathname?.startsWith(i.href)));
  const list = (
    <ul className="flex flex-col gap-1">
      {items.map((i) => (
        <li key={i.href}>
          <Link
            href={i.href}
            aria-current={current?.href === i.href ? "page" : undefined}
            className={cx(
              "block rounded-md px-3 py-2.5 font-semibold hover:bg-leaf-50",
              current?.href === i.href ? "bg-leaf-100 text-leaf-800" : "text-ink",
            )}
          >
            {i.label}
          </Link>
        </li>
      ))}
      <li className="mt-2 border-t border-line pt-2">
        <form action={signOut}>
          <input type="hidden" name="lang" value={lang} />
          <button type="submit" className="w-full rounded-md px-3 py-2.5 text-left font-semibold text-leaf-700 hover:bg-leaf-50">
            {signOutLabel}
          </button>
        </form>
      </li>
    </ul>
  );
  return (
    <nav aria-label={menuLabel}>
      <details className="group rounded-lg border border-line bg-white lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold [&::-webkit-details-marker]:hidden">
          <span>{current?.label ?? menuLabel}</span>
          <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="border-t border-line p-2">{list}</div>
      </details>
      <div className="hidden lg:block">{list}</div>
    </nav>
  );
}
