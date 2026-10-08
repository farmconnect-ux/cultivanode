"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "@/actions/auth";
import { Badge, cx } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Workspace } from "@/lib/account/workspace";
import { WorkspaceSwitcher } from "./workspace-switcher";

export type NavSubItem = {
  href: string;
  label: string;
  icon?: string;
  badge?: string | number;
  badgeTone?: "default" | "leaf" | "danger" | "warning";
};

export type NavParentGroup = {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
  items: NavSubItem[];
};

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

  // Helper to determine if a sub-item is active
  const isSubItemActive = (href: string) => {
    const [itemPath, itemQuery] = href.split("?");
    const currentTab = searchParams.get("tab");

    if (itemQuery) {
      const itemSearchParams = new URLSearchParams(itemQuery);
      const itemTab = itemSearchParams.get("tab");
      if (itemTab) {
        return pathname.includes(itemPath) && currentTab === itemTab;
      }
    }

    if (itemPath === base) {
      return pathname === base && !currentTab;
    }

    return pathname === itemPath || (itemPath !== base && pathname.startsWith(itemPath));
  };

  // Structured Parent and Sub-Parent Navigation Hierarchy
  let parentGroups: NavParentGroup[] = [];

  if (activeWorkspace === "farmer") {
    parentGroups = [
      {
        id: "farm_enterprise",
        label: "Farm Enterprise",
        icon: "🌾",
        items: [
          { href: `${base}?${wsParam}`, label: "Farm Overview", icon: "🏠" },
          { href: `${base}/farms?${wsParam}`, label: "Farms & Land", icon: "🗺️" },
          { href: `${base}/crops?${wsParam}`, label: "Crop Cycles & GAP", icon: "🌽" },
          { href: `${base}/livestock?${wsParam}`, label: "Livestock Enterprise", icon: "🐄" },
        ],
      },
      {
        id: "operations_tasks",
        label: "Operations & Fleet",
        icon: "🛠️",
        items: [
          { href: `${base}/tasks?${wsParam}`, label: "Daily Tasks & Labour", icon: "✅" },
          { href: `${base}/machinery?${wsParam}`, label: "Machinery Fleet", icon: "🚜" },
          { href: `${base}/inventory?${wsParam}`, label: "Multi-Location Inventory", icon: "📦" },
          { href: `${base}/bookings?${wsParam}`, label: "Service Bookings", icon: "📋" },
        ],
      },
      {
        id: "financials_governance",
        label: "Financials & Advisory",
        icon: "💰",
        items: [
          { href: `${base}/finance?${wsParam}`, label: "Farm Budgets & Cost", icon: "💰" },
          { href: `${base}/variance?${wsParam}`, label: "Standard vs Actual", icon: "⚖️" },
          { href: `${base}/assistant?${wsParam}`, label: "AI Farm Assistant", icon: "🤖" },
          {
            href: `${base}/inbox?${wsParam}`,
            label: "Notification Inbox",
            icon: "🔔",
            badge: unreadCount > 0 ? unreadCount : undefined,
            badgeTone: "danger",
          },
        ],
      },
      {
        id: "marketplace_commerce",
        label: "Marketplace & Trade",
        icon: "🛒",
        items: [
          { href: `/${lang}/marketplace`, label: "Browse Marketplace", icon: "🛒" },
          { href: `${base}/marketplace/seller?${wsParam}`, label: "Seller Hub & Produce", icon: "🏪" },
          { href: `${base}/marketplace/new-listing?${wsParam}`, label: "List on Market", icon: "➕" },
          { href: `/${lang}/marketplace/rfq`, label: "RFQs & Bulk Orders", icon: "📑" },
        ],
      },
      {
        id: "account_trust",
        label: "Account & Trust",
        icon: "⚙️",
        items: [
          { href: `${base}/roles?${wsParam}`, label: "Roles & Permissions", icon: "🎖️" },
          { href: `${base}/verification?${wsParam}`, label: "Identity Verification", icon: "🛡️" },
          { href: `${base}/profile?${wsParam}`, label: "Profile & Farm Org", icon: "👤" },
          { href: `${base}/privacy?${wsParam}`, label: "Data & Privacy", icon: "🔒" },
        ],
      },
    ];
  } else if (activeWorkspace === "provider") {
    parentGroups = [
      {
        id: "provider_ops",
        label: "Provider Operations",
        icon: "🚜",
        items: [
          { href: `${base}?${wsParam}`, label: "Provider Overview", icon: "🏠" },
          { href: `${base}/bookings?${wsParam}`, label: "Service Requests & Jobs", icon: "📋" },
          { href: `${base}/listings?${wsParam}`, label: "Machinery Fleet", icon: "🚜" },
          { href: `${base}/business?${wsParam}`, label: "Business Details", icon: "🏢" },
        ],
      },
      {
        id: "marketplace_hub",
        label: "Marketplace Hub",
        icon: "🏪",
        items: [
          { href: `${base}/marketplace/seller?${wsParam}`, label: "Seller Console", icon: "🏪" },
          { href: `${base}/marketplace/new-listing?${wsParam}`, label: "List Machinery on Market", icon: "➕" },
          { href: `/${lang}/marketplace`, label: "Public Marketplace", icon: "🛒" },
        ],
      },
      {
        id: "provider_account",
        label: "Account & Payouts",
        icon: "⚙️",
        items: [
          {
            href: `${base}/inbox?${wsParam}`,
            label: "Notifications",
            icon: "🔔",
            badge: unreadCount > 0 ? unreadCount : undefined,
            badgeTone: "danger",
          },
          { href: `${base}/roles?${wsParam}`, label: "Roles & Permissions", icon: "🎖️" },
          { href: `${base}/verification?${wsParam}`, label: "Verification & Bank", icon: "🛡️" },
          { href: `${base}/profile?${wsParam}`, label: "Profile Settings", icon: "👤" },
        ],
      },
    ];
  } else {
    // Agent
    parentGroups = [
      {
        id: "agent_ops",
        label: "Field Console",
        icon: "👥",
        items: [
          { href: `${base}?${wsParam}`, label: "Agent Overview", icon: "📋" },
          { href: `${base}/agent?${wsParam}`, label: "Managed Farmers", icon: "👥" },
          { href: `${base}/agent?action=register&${wsParam}`, label: "Register New Farmer", icon: "➕" },
          { href: `${base}/bookings?${wsParam}`, label: "Assisted Bookings", icon: "🚜" },
        ],
      },
      {
        id: "agronomy_tools",
        label: "Field Advisory",
        icon: "🧠",
        items: [
          { href: `${base}/assistant?${wsParam}`, label: "GAP Agronomy Advisory", icon: "🤖" },
          {
            href: `${base}/inbox?${wsParam}`,
            label: "Field Alerts & Inbox",
            icon: "🔔",
            badge: unreadCount > 0 ? unreadCount : undefined,
            badgeTone: "danger",
          },
        ],
      },
      {
        id: "agent_account",
        label: "Account & Accreditation",
        icon: "⚙️",
        items: [
          { href: `${base}/roles?${wsParam}`, label: "Roles & Permissions", icon: "🎖️" },
          { href: `${base}/verification?${wsParam}`, label: "Accreditation Status", icon: "🛡️" },
          { href: `${base}/profile?${wsParam}`, label: "Agent Profile", icon: "👤" },
        ],
      },
    ];
  }

  // Manage open/collapsed state of parent groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    parentGroups.forEach((group, index) => {
      // Open groups that contain the currently active link or first two groups by default
      const hasActive = group.items.some((i) => isSubItemActive(i.href));
      initial[group.id] = hasActive || index < 2;
    });
    return initial;
  });

  // Whenever the route or search changes, ensure the parent group with the active item is open
  useEffect(() => {
    parentGroups.forEach((group) => {
      if (group.items.some((i) => isSubItemActive(i.href))) {
        setOpenGroups((prev) => (prev[group.id] ? prev : { ...prev, [group.id]: true }));
      }
    });
  }, [pathname, searchParams]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Find currently active item for mobile summary
  let activeSubItem: NavSubItem | undefined;
  for (const group of parentGroups) {
    const found = group.items.find((i) => isSubItemActive(i.href));
    if (found) {
      activeSubItem = found;
      break;
    }
  }

  // Contextual mobile bottom nav target
  const contextualCta =
    activeWorkspace === "farmer"
      ? { href: `${base}/bookings/new?${wsParam}`, label: "Request", icon: "➕" }
      : activeWorkspace === "provider"
        ? { href: `${base}/listings?${wsParam}`, label: "Add", icon: "➕" }
        : { href: `${base}/agent?action=register&${wsParam}`, label: "Register", icon: "➕" };

  // Render parent and sub-parent menu hierarchy
  const renderNavList = () => (
    <div className="flex flex-col gap-3">
      {parentGroups.map((group) => {
        const isOpen = !!openGroups[group.id];
        const groupHasActive = group.items.some((i) => isSubItemActive(i.href));

        return (
          <div
            key={group.id}
            className={cx(
              "rounded-xl border transition-all duration-150 overflow-hidden",
              groupHasActive
                ? "border-leaf-200 bg-leaf-50/20"
                : "border-line/70 bg-white hover:border-line"
            )}
          >
            {/* Parent Menu Header / Toggle */}
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={isOpen}
              className={cx(
                "w-full flex items-center justify-between px-3 py-2.5 text-left font-bold text-xs uppercase tracking-wider transition-colors",
                groupHasActive
                  ? "text-leaf-900 bg-leaf-50/60"
                  : "text-neutral-700 hover:text-ink hover:bg-neutral-50/80"
              )}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-sm">{group.icon}</span>
                <span>{group.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {group.badge && (
                  <Badge className="bg-leaf-100 text-leaf-800 text-[10px] px-1.5 py-0.5">
                    {group.badge}
                  </Badge>
                )}
                <span
                  aria-hidden="true"
                  className={cx(
                    "text-xs text-neutral-400 transition-transform duration-150",
                    isOpen ? "rotate-180" : ""
                  )}
                >
                  ▾
                </span>
              </div>
            </button>

            {/* Sub-Parent / Sub-Menu Items */}
            {isOpen && (
              <ul className="py-1.5 px-2 space-y-0.5 border-t border-line/40 bg-surface/30">
                {group.items.map((item) => {
                  const isActive = isSubItemActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cx(
                          "group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition-all",
                          isActive
                            ? "bg-leaf-700 text-white shadow-xs font-bold"
                            : "text-neutral-700 hover:bg-leaf-50 hover:text-leaf-900"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            aria-hidden="true"
                            className={cx(
                              "text-sm transition-transform group-hover:scale-110",
                              isActive ? "text-white" : ""
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={cx(
                              "flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-4",
                              isActive
                                ? "bg-white text-leaf-800"
                                : item.badgeTone === "danger"
                                  ? "bg-danger text-white"
                                  : "bg-leaf-100 text-leaf-800"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      {/* Sign Out Action */}
      <div className="mt-2 border-t border-line pt-2 px-1">
        <form action={signOut}>
          <input type="hidden" name="lang" value={lang} />
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-neutral-600 hover:bg-red-50 hover:text-danger transition-colors flex items-center gap-2"
          >
            <span>🚪</span>
            <span>{signOutLabel}</span>
          </button>
        </form>
      </div>
    </div>
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
        <details className="group rounded-xl border border-line bg-white lg:hidden shadow-xs">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold text-xs [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <span className="text-muted uppercase font-bold text-[10px]">Menu:</span>
              <span className="text-leaf-900 font-bold">{activeSubItem?.label ?? menuLabel}</span>
            </span>
            <span aria-hidden="true" className="transition-transform group-open:rotate-180 text-muted">▾</span>
          </summary>
          <div className="border-t border-line p-3">{renderNavList()}</div>
        </details>

        {/* Desktop Hierarchical Sidebar */}
        <div className="hidden lg:block">{renderNavList()}</div>
      </nav>

      {/* Contextual Mobile Bottom Nav Bar */}
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

        {/* Contextual Primary Action Button */}
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
