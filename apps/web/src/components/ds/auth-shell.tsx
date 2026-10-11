import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { site } from "@/config/site";
import { BrandLockup } from "./brand";
import { Icon } from "./icon";
import { LocaleSwitch } from "./locale-switch";

/**
 * Focused frame for sign-in, sign-up and onboarding (design: "Agrarian Identity" portal).
 * A slim header with trust cue + language + support, and a compliance footer — no marketing nav.
 */
export function AuthShell({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  const support = site.contact.whatsappUrl ?? `/${lang}/contact`;
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-surface-container-lowest/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
          <div className="flex min-w-0 items-center gap-5">
            <Link href={`/${lang}`} className="shrink-0 rounded-lg" aria-label="CultivaNode home">
              <BrandLockup tagline="Agrarian Identity" />
            </Link>
            <span className="hidden items-center gap-1.5 rounded-full border border-surface-container-high bg-surface-container-low px-3 py-1 font-label-sm text-label-sm text-on-surface-variant xl:inline-flex">
              <Icon name="verified_user" className="text-base text-secondary" />
              NDPA 2023 compliant · secured agrarian ID
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LocaleSwitch current={lang} />
            <a
              href={support}
              target={support.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 font-label-md text-label-md text-secondary transition-colors hover:text-primary-container sm:inline-flex"
            >
              <Icon name="support_agent" className="text-lg" />
              {site.contact.whatsappUrl ? "WhatsApp support" : "Support"}
            </a>
          </div>
        </div>
      </header>
      <main id="main" className="relative flex-1 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#003620_1px,transparent_1px)] [background-size:22px_22px]"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">{children}</div>
      </main>
      <footer className="border-t border-border bg-surface-container-lowest py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div className="flex flex-col gap-0.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </span>
            <span className="text-label-sm text-on-surface-variant/80">South-West pilot · Ogun, Oyo, Ondo &amp; Osun</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 font-label-sm text-label-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5"><Icon name="lock" className="text-base text-secondary" /> Escrow-protected payments</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="shield" className="text-base text-secondary" /> NDPA 2023</span>
            <Link href={`/${lang}/privacy`} className="hover:text-on-surface">Privacy</Link>
            <Link href={`/${lang}/terms`} className="hover:text-on-surface">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
