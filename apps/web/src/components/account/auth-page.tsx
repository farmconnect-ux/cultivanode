import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { AuthShell } from "@/components/ds/auth-shell";
import { Icon, type IconName } from "@/components/ds/icon";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { PhoneSignIn } from "./phone-sign-in";

const TIERS: { icon: IconName; tone: string; tier: string; title: string; body: string }[] = [
  { icon: "agriculture", tone: "bg-primary-container text-on-primary", tier: "Farmers", title: "Smallholder & farm owner", body: "Map plots, plan crop cycles, book machinery and sell harvests with escrow." },
  { icon: "precision_manufacturing", tone: "bg-tertiary-container text-on-tertiary", tier: "Providers", title: "Machinery syndicate", body: "Receive job requests, log proof of work by GPS and photo, get paid on confirmation." },
  { icon: "storefront", tone: "bg-surface-container-high text-primary", tier: "Suppliers", title: "Agro-dealer & supplier", body: "List certified inputs, fill orders across clusters and reconcile settlements." },
  { icon: "corporate_fare", tone: "bg-primary text-on-primary", tier: "Buyers", title: "Institutional buyer", body: "Source graded lots and off-take contracts with batch traceability." },
];

/** Sign-in and sign-up share one flow: a new number gets an account, then onboarding. */
export function AuthPage({ lang, t, mode }: { lang: Locale; t: Dictionary["auth"]; mode: "sign-in" | "sign-up" }) {
  const title = mode === "sign-in" ? t.signInTitle : t.signUpTitle;
  const intro = mode === "sign-in" ? t.signInIntro : t.signUpIntro;
  const [before, rest] = t.termsNote.split("{terms}");
  const [middle, after] = (rest ?? "").split("{privacy}");
  const other = mode === "sign-in" ? "sign-up" : "sign-in";

  return (
    <AuthShell lang={lang}>
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-7">
          <section className="card-surface animate-fade-up p-6 sm:p-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Badge tone="outline" className="py-1">
                <Icon name="verified" className="text-secondary" /> Secured agrarian identity access
              </Badge>
              <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                <span className="size-2 rounded-full bg-secondary animate-pulse-dot" /> South-West network online
              </span>
            </div>
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-primary sm:text-headline-xl">{title}</h1>
            <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">{intro}</p>
          </section>

          <section className="card-surface p-6 sm:p-8">
            <PhoneSignIn lang={lang} t={t} />
            <p className="mt-6 border-t border-[#f1f5f9] pt-4 text-body-sm text-on-surface-variant">
              {before}
              <Link href={`/${lang}/terms`} className="font-semibold text-secondary underline-offset-4 hover:underline">{t.terms}</Link>
              {middle}
              <Link href={`/${lang}/privacy`} className="font-semibold text-secondary underline-offset-4 hover:underline">{t.privacy}</Link>
              {after}
            </p>
          </section>

          <div className="grid gap-3 rounded-2xl bg-surface-container-low px-5 py-4 sm:grid-cols-3">
            {[
              { icon: "verified_user" as const, title: "NDPA 2023", body: "Nigeria Data Protection Act" },
              { icon: "enhanced_encryption" as const, title: "One-time codes", body: "No passwords to leak or forget" },
              { icon: "hub" as const, title: "South-West mesh", body: "Ogun · Oyo · Ondo · Osun" },
            ].map((x) => (
              <div key={x.title} className="flex items-start gap-2.5">
                <Icon name={x.icon} className="mt-0.5 text-xl text-secondary" />
                <div>
                  <p className="font-label-md text-label-md text-on-surface">{x.title}</p>
                  <p className="text-label-sm font-normal text-on-surface-variant">{x.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-5 lg:col-span-5">
          <section className="card-surface p-6 sm:p-7">
            <p className="font-label-md text-label-md uppercase tracking-wider text-secondary">
              {mode === "sign-in" ? "Join the agrarian network" : "Who CultivaNode is for"}
            </p>
            <h2 className="mt-1 font-headline-lg text-headline-lg text-primary">
              {mode === "sign-in" ? "New to CultivaNode?" : "One account, every role"}
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              {mode === "sign-in"
                ? "Create an agrarian identity linked to your farm plots, machinery fleet or produce contracts."
                : "Start as a farmer, provider, supplier or buyer — add more roles later from Settings."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {TIERS.map((x) => (
                <div key={x.title} className="card-interactive rounded-xl bg-surface-container-low p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`flex size-9 items-center justify-center rounded-lg ${x.tone}`}>
                      <Icon name={x.icon} className="text-xl" />
                    </span>
                    <span className="rounded-full bg-surface-container-lowest px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                      {x.tier}
                    </span>
                  </div>
                  <p className="font-headline-sm text-[1rem] leading-snug text-on-surface">{x.title}</p>
                  <p className="mt-1 text-body-sm text-on-surface-variant">{x.body}</p>
                </div>
              ))}
            </div>
            <Button asChild variant="soft" size="lg" className="mt-5 w-full">
              <Link href={`/${lang}/${other}`}>
                <Icon name={mode === "sign-in" ? "person_add" : "login"} className="text-lg" />
                {mode === "sign-in" ? t.noAccount : t.haveAccount} {mode === "sign-in" ? t.signUpTitle : t.signInTitle}
              </Link>
            </Button>
            <p className="mt-3 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
              <Icon name="bolt" className="text-base text-caution" /> About three minutes to set up, with BVN or NIN checks later.
            </p>
          </section>

          <section className="card-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-label-md text-label-md uppercase text-on-surface-variant">Pilot network</span>
              <Badge tone="positive" dot pulse>South-West pilot</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-container-low p-3 text-center">
              {[
                ["4", "States"],
                ["₦0", "Pilot commission"],
                ["24/7", "Agronomy desk"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="font-metric-num text-headline-md text-primary">{v}</p>
                  <p className="text-label-sm text-on-surface-variant">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
              <Icon name="location_on" className="text-base" /> Abeokuta · Ibadan · Akure · Osogbo
            </p>
          </section>
        </aside>
      </div>
    </AuthShell>
  );
}
