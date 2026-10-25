"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/shadcn/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/shadcn/sheet";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { BrandLockup } from "./brand";
import { Icon } from "./icon";
import { LocaleSwitch } from "./locale-switch";

export type SiteLink = { href: string; label: string };

// Public pages are static: the session cookie only decides which buttons to show
// (account pages verify the session properly on the server).
const hasSession = () => /(?:^|;\s*)sb-[^=]+-auth-token(?:\.0)?=/.test(document.cookie);
const noop = () => () => {};
function useSignedIn() {
  return useSyncExternalStore(noop, hasSession, () => false);
}

export function SiteNavLinks({ links }: { links: SiteLink[] }) {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-lg px-3 py-2 font-label-lg text-label-lg transition-colors",
              active ? "text-primary" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
            )}
          >
            {l.label}
            {active && <span className="absolute inset-x-3 -bottom-[1.3rem] h-0.5 rounded-full bg-secondary" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteAuthActions({
  lang,
  t,
}: {
  lang: Locale;
  t: { signIn: string; signUp: string; myAccount: string };
}) {
  const signedIn = useSignedIn();
  return (
    <div className="hidden items-center gap-1 sm:flex">
      <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex border-primary/20 text-primary hover:bg-primary/5">
        <Link href={`/${lang}/download`}>
          <Icon name="phone_android" className="text-base" />
          {lang === "yo" ? "Gba Àpù (APK)" : "Get App"}
        </Link>
      </Button>

      {signedIn ? (
        <Button asChild size="md">
          <Link href={`/${lang}/account`}>
            <Icon name="space_dashboard" className="text-lg" />
            {t.myAccount}
          </Link>
        </Button>
      ) : (
        <>
          <Button asChild variant="ghost">
            <Link href={`/${lang}/sign-in`}>{t.signIn}</Link>
          </Button>
          <Button asChild>
            <Link href={`/${lang}/sign-up`}>{t.signUp}</Link>
          </Button>
        </>
      )}
    </div>
  );
}

export function SiteMobileMenu({
  lang,
  links,
  t,
}: {
  lang: Locale;
  links: SiteLink[];
  t: { signIn: string; signUp: string; myAccount: string; menu: string };
}) {
  const [open, setOpen] = React.useState(false);
  const signedIn = useSignedIn();
  const pathname = usePathname() ?? "";
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="icon-sm" className="xl:hidden" aria-label={t.menu}>
          <Icon name="menu" className="text-xl" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-surface-container-lowest">
        <SheetTitle className="sr-only">{t.menu}</SheetTitle>
        <div className="flex h-16 items-center border-b border-border px-5">
          <BrandLockup compact tagline={null} />
        </div>
        <nav aria-label="Mobile" className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-3 text-body-md transition-colors",
                  active ? "bg-surface-container-low font-semibold text-primary" : "text-on-surface hover:bg-surface-container-low",
                )}
              >
                {l.label}
                <Icon name="chevron_right" className="text-lg text-outline" />
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-2 border-t border-border p-4">
          <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 font-bold mb-1">
            <Link href={`/${lang}/download`} onClick={() => setOpen(false)}>
              <Icon name="phone_android" className="text-lg" />
              {lang === "yo" ? "Gba Àpù Android (APK)" : "Download Android App"}
            </Link>
          </Button>

          <LocaleSwitch current={lang} className="self-start my-1" />
          {signedIn ? (
            <Button asChild size="lg" variant="secondary">
              <Link href={`/${lang}/account`} onClick={() => setOpen(false)}>{t.myAccount}</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href={`/${lang}/sign-up`} onClick={() => setOpen(false)}>{t.signUp}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={`/${lang}/sign-in`} onClick={() => setOpen(false)}>{t.signIn}</Link>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
