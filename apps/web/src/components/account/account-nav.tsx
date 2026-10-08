"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "@/actions/auth";
import { cx } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import { WORKSPACE_DETAILS, type Workspace } from "@/lib/account/workspace";
import { WorkspaceSwitcher } from "./workspace-switcher";

export type NavItem = { href: string; label: string; icon?: string };

export function AccountNav({
  lang,
  signOutLabel,
  menuLabel,
  availableWorkspaces,
  unreadCount = 0,
}: {
  lang: Locale;
  signOutLabel: string;
  menuLabel: string;
  availableWorkspaces: Workspace[];
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawWs = searchParams.get("ws");
  const activeWorkspace: Workspace =
    rawWs && (availableWorkspaces as string[]).includes(rawWs)
      ? (rawWs as Workspace)
      : (availableWorkspaces[0] ?? "farmer");

  const base = `/${lang}/account`;
  const wsParam = `ws=${activeWorkspace}`;

  // Role-aware navigation tailored to operational mode
  let items: NavItem[] = [];

  if (activeWorkspace === "farmer") {
    items = [
      { href: `${base}?${wsParam}`, label: "Overview", icon: "🏠" },
      { href: `${base}/farms?${wsParam}`, label: "My Farms", icon: "🌱" },
      { href: `${base}/crops?${wsParam}`, label: "All Crops", icon: "🌽" },
      { href: `/${lang}/marketplace`, label: "Marketplace", icon: "🛒" },
      { href: `${base}/marketplace/seller?${wsParam}`, label: "Sell Produce", icon: "🏪" },
      { href: `${base}/assistant?${wsParam}`, label: "AI Farm Assistant", icon: "🤖" },
      { href: `${base}/bookings?${wsParam}`, label: "My Jobs", icon: "🚜" },
      { href: `${base}/bookings/new?${wsParam}`, label: "Request Service", icon: "➕" },
      { href: `${base}/find?${wsParam}`, label: "Find Machinery", icon: "🔍" },
      { href: `${base}/inbox?${wsParam}`, label: unreadCount ? `Inbox (${unreadCount})` : "Inbox", icon: "🔔" },
      { href: `${base}/verification?${wsParam}`, label: "Verification", icon: "🛡️" },
      { href: `${base}/profile?${wsParam}`, label: "Profile", icon: "👤" },
      { href: `${base}/privacy?${wsParam}`, label: "Privacy & Data", icon: "🔒" },
    ];
  } else if (activeWorkspace === "provider") {
    items = [
      { href: `${base}?${wsParam}`, label: "Overview", icon: "🏠" },
      { href: `${base}/marketplace/seller?${wsParam}`, label: "Marketplace Hub", icon: "🏪" },
      { href: `${base}/marketplace/new-listing?${wsParam}`, label: "List on Market", icon: "➕" },
      { href: `${base}/bookings?${wsParam}`, label: "Requests & Jobs", icon: "📋" },
      { href: `${base}/listings?${wsParam}`, label: "My Equipment", icon: "🚜" },
      { href: `${base}/business?${wsParam}`, label: "Business Details", icon: "🏢" },
      { href: `${base}/inbox?${wsParam}`, label: unreadCount ? `Inbox (${unreadCount})` : "Inbox", icon: "🔔" },
      { href: `${base}/verification?${wsParam}`, label: "Verification & Bank", icon: "🛡️" },
      { href: `${base}/profile?${wsParam}`, label: "Profile", icon: "👤" },
    ];
  } else {
    // Agent
    items = [
      { href: `${base}?${wsParam}`, label: "Field Console", icon: "📋" },
      { href: `${base}/agent?${wsParam}`, label: "My Farmers", icon: "👥" },
      { href: `${base}/assistant?${wsParam}`, label: "Agronomy Advisory", icon: "🤖" },
      { href: `${base}/agent?action=register&${wsParam}`, label: "Register Farmer", icon: "➕" },
      { href: `${base}/bookings?${wsParam}`, label: "Assisted Bookings", icon: "🚜" },
      { href: `${base}/inbox?${wsParam}`, label: unreadCount ? `Inbox (${unreadCount})` : "Inbox", icon: "🔔" },
      { href: `${base}/verification?${wsParam}`, label: "Verification", icon: "🛡️" },
      { href: `${base}/profile?${wsParam}`, label: "Profile", icon: "👤" },
    ];
  }

  // Determine current active link
  const current = items.find((i) => {
    const itemPath = i.href.split("?")[0];
    if (itemPath === `${base}`) {
      return pathname === itemPath;
    }
    return pathname?.startsWith(itemPath);
  });

  // Contextual mobile bottom nav target
  const contextualCta =
    activeWorkspace === "farmer"
      ? { href: `${base}/bookings/new?${wsParam}`, label: "Request", icon: "➕" }
      : activeWorkspace === "provider"
        ? { href: `${base}/listings?${wsParam}`, label: "Add", icon: "➕" }
        : { href: `${base}/agent?action=register&${wsParam}`, label: "Register", icon: "➕" };

  const list = (
    <ul className="flex flex-col gap-1">
      {items.map((i) => {
        const isCurrent = current?.href === i.href;
        return (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={isCurrent ? "page" : undefined}
              className={cx(
                "flex items-center gap-2.5 rounded-md px-3 py-2.5 font-semibold transition-colors",
                isCurrent ? "bg-leaf-100 text-leaf-800" : "text-ink hover:bg-leaf-50",
              )}
            >
              <span aria-hidden="true" className="text-base">{i.icon}</span>
              <span>{i.label}</span>
            </Link>
          </li>
        );
      })}
      <li className="mt-2 border-t border-line pt-2">
        <form action={signOut}>
          <input type="hidden" name="lang" value={lang} />
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2.5 text-left font-semibold text-leaf-700 hover:bg-leaf-50"
          >
            {signOutLabel}
          </button>
        </form>
      </li>
    </ul>
  );

  return (
    <>
      <nav aria-label={menuLabel} className="flex flex-col gap-4">
        {/* Workspace Switcher */}
        <WorkspaceSwitcher
          currentWorkspace={activeWorkspace}
          availableWorkspaces={availableWorkspaces}
        />

        {/* Mobile Disclosure Dropdown */}
        <details className="group rounded-lg border border-line bg-white lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <span className="text-muted text-xs uppercase font-bold">Menu:</span>
              <span>{current?.label ?? menuLabel}</span>
            </span>
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
          </summary>
          <div className="border-t border-line p-2">{list}</div>
        </details>

        {/* Desktop Sidebar List */}
        <div className="hidden lg:block">{list}</div>
      </nav>

      {/* Contextual Mobile Bottom Nav Bar (High contrast outdoor 48px targets) */}
      <aside
        aria-label="Mobile Navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 items-center justify-around border-t border-line bg-white px-2 py-1 shadow-lg lg:hidden"
      >
        <Link
          href={`${base}?${wsParam}`}
          className={cx(
            "flex min-h-12 min-w-12 flex-col items-center justify-center rounded-lg text-xs font-semibold",
            pathname === base ? "text-leaf-800 font-bold" : "text-muted",
          )}
        >
          <span className="text-lg" aria-hidden="true">🏠</span>
          <span>Home</span>
        </Link>

        <Link
          href={`${base}/bookings?${wsParam}`}
          className={cx(
            "flex min-h-12 min-w-12 flex-col items-center justify-center rounded-lg text-xs font-semibold",
            pathname?.includes("/bookings") && !pathname?.includes("/new")
              ? "text-leaf-800 font-bold"
              : "text-muted",
          )}
        >
          <span className="text-lg" aria-hidden="true">📋</span>
          <span>Jobs</span>
        </Link>

        {/* Prominent Contextual Action Button */}
        <Link
          href={contextualCta.href}
          aria-label={contextualCta.label}
          className="flex min-h-12 min-w-12 -translate-y-2 flex-col items-center justify-center rounded-full bg-leaf-700 text-white shadow-md active:bg-leaf-800"
        >
          <span className="text-xl font-bold" aria-hidden="true">{contextualCta.icon}</span>
        </Link>

        <Link
          href={`${base}/inbox?${wsParam}`}
          className={cx(
            "relative flex min-h-12 min-w-12 flex-col items-center justify-center rounded-lg text-xs font-semibold",
            pathname?.includes("/inbox") ? "text-leaf-800 font-bold" : "text-muted",
          )}
        >
          <span className="text-lg" aria-hidden="true">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-2 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
          <span>Inbox</span>
        </Link>

        <Link
          href={`${base}/profile?${wsParam}`}
          className={cx(
            "flex min-h-12 min-w-12 flex-col items-center justify-center rounded-lg text-xs font-semibold",
            pathname?.includes("/profile") ? "text-leaf-800 font-bold" : "text-muted",
          )}
        >
          <span className="text-lg" aria-hidden="true">👤</span>
          <span>Me</span>
        </Link>
      </aside>
    </>
  );
}
