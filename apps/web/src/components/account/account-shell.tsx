"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "@/actions/auth";
import { AppShell, type ShellContext, type ShellUser } from "@/components/ds/app-shell";
import { accountNav } from "@/components/ds/nav-config";
import type { Locale } from "@/i18n/config";
import { WORKSPACE_DETAILS, type Workspace } from "@/lib/account/workspace";
import type { Flags } from "@/lib/flags";

/**
 * Account workspace frame: the suite's sidebar + top bar around every /[lang]/account page.
 * The active workspace (farmer / provider / agent) comes from ?ws= and picks the sidebar menu.
 */
export function AccountShell({
  lang,
  signOutLabel,
  availableWorkspaces,
  unreadCount = 0,
  suspendedAlert,
  user,
  context,
  supportHref,
  flags = {},
  children,
}: {
  lang: Locale;
  signOutLabel: string;
  /** Kept for compatibility with older callers; the mobile menu label is fixed now. */
  menuLabel?: string;
  availableWorkspaces: Workspace[];
  unreadCount?: number;
  suspendedAlert?: React.ReactNode;
  user: ShellUser;
  context?: ShellContext;
  supportHref?: string;
  /** Admin feature switches: hide menu items for modules that are switched off. */
  flags?: Flags;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const rawWs = searchParams.get("ws");
  const activeWorkspace: Workspace =
    rawWs && (availableWorkspaces as string[]).includes(rawWs)
      ? (rawWs as Workspace)
      : (availableWorkspaces[0] ?? "farmer");

  const groups = React.useMemo(() => accountNav(activeWorkspace, flags), [activeWorkspace, flags]);
  const base = `/${lang}`;

  return (
    <AppShell
      basePath={base}
      lang={lang}
      groups={groups}
      user={user}
      context={activeWorkspace === "farmer" ? context : undefined}
      workspaces={availableWorkspaces.map((w) => ({
        id: w,
        name: WORKSPACE_DETAILS[w].name,
        description: WORKSPACE_DETAILS[w].roleDescription,
      }))}
      activeWorkspace={activeWorkspace}
      unreadCount={unreadCount}
      notificationsHref={`${base}/account/inbox`}
      profileHref={`${base}/account/profile`}
      settingsHref={`${base}/account/settings`}
      supportHref={supportHref}
      signOutAction={signOut}
      signOutLabel={signOutLabel}
    >
      {suspendedAlert && <div className="mb-6">{suspendedAlert}</div>}
      {children}
    </AppShell>
  );
}
