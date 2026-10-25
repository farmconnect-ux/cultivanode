import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { AuthShell } from "@/components/ds/auth-shell";
import { Icon, type IconName } from "@/components/ds/icon";
import { Button } from "@/components/shadcn/button";
import { PhoneSignIn } from "./phone-sign-in";

const TIERS: { icon: IconName; tone: string; tier: string; title: string; body: string }[] = [
  { icon: "agriculture", tone: "bg-primary-container text-on-primary", tier: "Farmers", title: "Smallholder & farm owner", body: "Add your farms, plan your crops, hire machinery and farm hands, and sell your harvest." },
  { icon: "precision_manufacturing", tone: "bg-tertiary-container text-on-tertiary", tier: "Providers", title: "Machinery owner or service provider", body: "Get job requests from farms near you, set your prices and get paid by the farmer." },
  { icon: "storefront", tone: "bg-surface-container-high text-primary", tier: "Suppliers", title: "Agro-dealer & supplier", body: "List seed, fertiliser and other inputs and fill orders from farmers." },
  { icon: "corporate_fare", tone: "bg-primary text-on-primary", tier: "Buyers", title: "Produce buyer", body: "Buy produce for your home or business, or post a bulk request for what you need." },
];

/** Sign-in and sign-up share one flow: a new number gets an account, then onboarding. */
export function AuthPage({
  lang,
  t,
  mode,
  next = "",
  as = "",
}: {
  lang: Locale;
  t: Dictionary["auth"];
  mode: "sign-in" | "sign-up";
  /** Same-site path to return to after sign-in (already validated by the page). */
  next?: string;
  /** "customer": a marketplace shopper; onboarding then asks only for name, state and consent. */
  as?: string;
}) {
  const customer = as === "customer";
  const title = customer ? (mode === "sign-in" ? "Sign in to check out" : "Create your customer account") : mode === "sign-in" ? t.signInTitle : t.signUpTitle;
  const intro = customer
    ? "Use your phone number or email. We'll send a 6-digit code, then you're back at checkout. Your account only shows your orders and deliveries."
    : mode === "sign-in"
      ? t.signInIntro
      : t.signUpIntro;
  const carry = new URLSearchParams({ ...(next ? { next } : {}), ...(customer ? { as: "customer" } : {}) }).toString();
  const [before, rest] = t.termsNote.split("{terms}");
  const [middle, after] = (rest ?? "").split("{privacy}");
  const other = mode === "sign-in" ? "sign-up" : "sign-in";

  return (
    <AuthShell lang={lang}>
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-7">
          <section className="card-surface animate-fade-up p-6 sm:p-8">
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-primary sm:text-headline-xl">{title}</h1>
            <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">{intro}</p>
          </section>

          <section className="card-surface p-6 sm:p-8">
            <PhoneSignIn lang={lang} t={t} next={next} as={as} />
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
              { icon: "verified_user" as const, title: "Your data is yours", body: "Built to follow the Nigeria Data Protection Act 2023" },
              { icon: "enhanced_encryption" as const, title: "One-time codes", body: "No passwords to leak or forget" },
              { icon: "location_on" as const, title: "South-West pilot", body: "Oyo · Ogun · Osun · Ondo · Ekiti · Lagos" },
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
              {mode === "sign-in" ? "New here?" : "Who CultivaNode is for"}
            </p>
            <h2 className="mt-1 font-headline-lg text-headline-lg text-primary">
              {mode === "sign-in" ? "New to CultivaNode?" : "One account, every role"}
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              {mode === "sign-in"
                ? "Create a free account for your farm, your equipment or your business."
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
              <Link href={`/${lang}/${other}${carry ? `?${carry}` : ""}`}>
                <Icon name={mode === "sign-in" ? "person_add" : "login"} className="text-lg" />
                {mode === "sign-in" ? t.noAccount : t.haveAccount} {mode === "sign-in" ? t.signUpTitle : t.signInTitle}
              </Link>
            </Button>
            <p className="mt-3 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
              <Icon name="bolt" className="text-base text-caution" /> About three minutes to set up, with BVN or NIN checks later.
            </p>
          </section>

        </aside>
      </div>
    </AuthShell>
  );
}
