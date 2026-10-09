"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { Container } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Workspace } from "@/lib/account/workspace";

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
  const searchParams = useSearchParams();
  const rawWs = searchParams.get("ws");
  const activeWorkspace: Workspace =
    rawWs && (availableWorkspaces as string[]).includes(rawWs)
      ? (rawWs as Workspace)
      : (availableWorkspaces[0] ?? "farmer");

  // In the Farmer workspace, the new FarmerCommunityDashboard manages its own complete
  // full-width parent/sub-parent menu sidebar, navbar, and layouts without being constrained
  // by the legacy 2-column container.
  if (activeWorkspace === "farmer") {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)]">
        {suspendedAlert}
        {children}
      </div>
    );
  }

  // Provider and Agent workspaces continue to render inside the traditional 2-column AccountNav layout.
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
