"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ScreenToasts } from "./screen-dialog";

/**
 * The public header/footer frame every /[lang] page, except areas that bring their own chrome:
 * the account workspace (AppShell) and the focused sign-in / sign-up / onboarding flows (AuthShell).
 */
const OWN_CHROME = /^\/[a-z]{2}\/(account|sign-in|sign-up|onboarding)(\/|$)/;

export function SiteChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const bare = OWN_CHROME.test(pathname);
  if (bare)
    return (
      <>
        {children}
        <ScreenToasts />
      </>
    );
  return (
    <>
      <ScreenToasts />
      {header}
      <main id="main" className="flex-1">
        {children}
      </main>
      {footer}
    </>
  );
}
