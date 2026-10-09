"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { Container } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Workspace } from "@/lib/account/workspace";

/** Farmer OS pages that draw their own sidebar. Every other account route needs AccountNav. */
const FARMER_SHELL_PATHS = new Set([
  "",
  "/farms",
  "/crops",
  "/livestock",
  "/machinery",
  "/inventory",
  "/tasks",
  "/iot",
  "/irrigation",
  "/weather",
  "/reports",
  "/finance",
]);

function farmerShellOwns(pathname: string): boolean {
  const rest = pathname.replace(/^\/[a-z]{2}\/account/, "");
  return FARMER_SHELL_PATHS.has(rest);
}

export function AccountShell({
  lang,
  signOutLabel,
  menuLabel,
  availableWorkspaces,
  unreadCount = 0,
  suspendedAlert,
  children,
}: {
  lang: Locale;
  signOutLabel: string;
  menuLabel: string;
  availableWorkspaces: Workspace[];
  unreadCount?: number;
  suspendedAlert?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawWs = searchParams.get("ws");
  const activeWorkspace: Workspace =
    rawWs && (availableWorkspaces as string[]).includes(rawWs)
      ? (rawWs as Workspace)
      : (availableWorkspaces[0] ?? "farmer");

  // The farmer home draws its own menu. Bookings, search, listings, inbox and
  // identity pages stay in the shared nav so those workflows are reachable.
  if (activeWorkspace === "farmer" && farmerShellOwns(pathname)) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)]">
        {suspendedAlert}
        {children}
      </div>
    );
  }

  return (
    <Container className="grid gap-6 py-8 pb-24 sm:py-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10 lg:pb-12">
      <AccountNav
        lang={lang}
        signOutLabel={signOutLabel}
        menuLabel={menuLabel}
        availableWorkspaces={availableWorkspaces}
        unreadCount={unreadCount}
      />
      <div className="flex min-w-0 flex-col gap-6">
        {suspendedAlert}
        {children}
      </div>
    </Container>
  );
}
