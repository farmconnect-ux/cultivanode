import type { ReactNode } from "react";
import { Badge, Card, Container, LinkButton } from "@/components/ui";

/** Page title block used at the top of every content page. */
export function PageHero({ badge, title, intro, children }: { badge?: string; title: string; intro: string; children?: ReactNode }) {
  return (
    <Container className="flex flex-col items-start gap-5 py-14 sm:py-20">
      {badge && <Badge>{badge}</Badge>}
      <h1 className="max-w-3xl text-4xl font-extrabold text-primary sm:text-5xl">{title}</h1>
      <p className="max-w-3xl text-xl text-on-surface-variant">{intro}</p>
      {children}
    </Container>
  );
}

/** Cards of title + body. Items with `soon: true` get a "coming soon" label (pass the translated text). */
export function BenefitGrid({ items, columns = 3, soonLabel }: {
  items: readonly { title: string; body: string; soon?: boolean }[];
  columns?: 2 | 3;
  soonLabel?: string;
}) {
  return (
    <ul className={columns === 3 ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>
      {items.map((b) => (
        <li key={b.title}>
          <Card className="h-full">
            <h3 className="text-lg font-bold text-primary-container">{b.title}</h3>
            <p className="mt-2 text-on-surface-variant">{b.body}</p>
            {b.soon && soonLabel && (
              <span className="mt-3 inline-block rounded-full bg-tertiary-fixed/60 px-3 py-1 text-sm font-semibold text-[#b45309]">{soonLabel}</span>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}

/** Numbered steps, readable without colour (numbers carry the order). */
export function Steps({ steps }: { steps: readonly (string | { title: string; body: string })[] }) {
  return (
    <ol className="flex max-w-3xl flex-col gap-4">
      {steps.map((s, i) => {
        const title = typeof s === "string" ? undefined : s.title;
        const body = typeof s === "string" ? s : s.body;
        return (
          <li key={i} className="flex gap-4">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-lg font-bold text-white">
              {i + 1}
            </span>
            <div className="pt-1.5 text-lg">
              {title && <p className="font-bold">{title}</p>}
              <p className={title ? "text-on-surface-variant" : undefined}>{body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ChipList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {items.map((c) => (
        <li key={c} className="rounded-full border-2 border-secondary/30 bg-white px-4 py-2 font-semibold text-primary">
          {c}
        </li>
      ))}
    </ul>
  );
}

export function CtaBox({ title, body, href, label, secondary }: {
  title: string;
  body: string;
  href: string;
  label: string;
  secondary?: { href: string; label: string };
}) {
  return (
    <Container className="py-16">
      <div className="flex flex-col items-start gap-5 rounded-xl bg-primary p-8 text-white sm:p-12">
        <h2 className="text-3xl font-extrabold">{title}</h2>
        <p className="max-w-2xl text-lg text-on-primary/80">{body}</p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={href} variant="gold">{label}</LinkButton>
          {secondary && <LinkButton href={secondary.href} variant="secondary">{secondary.label}</LinkButton>}
        </div>
      </div>
    </Container>
  );
}
