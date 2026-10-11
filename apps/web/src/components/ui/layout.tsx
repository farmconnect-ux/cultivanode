import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export function Container({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cx("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...rest} />;
}

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  intro?: ReactNode;
  tone?: "cream" | "white" | "leaf";
  className?: string;
  children?: ReactNode;
};

/** A page section with an optional eyebrow, heading and intro paragraph. */
export function Section({ id, eyebrow, title, intro, tone = "cream", className, children }: SectionProps) {
  const tones = {
    cream: "bg-surface-container-low",
    white: "bg-surface-container-lowest",
    leaf: "bg-primary text-on-primary",
  } as const;
  return (
    <section id={id} className={cx("py-16 sm:py-20", tones[tone], className)}>
      <Container>
        {(eyebrow || title || intro) && (
          <header className="mb-10 max-w-2xl">
            {eyebrow && (
              <p className={cx("mb-2 font-label-md text-label-md uppercase tracking-wider", tone === "leaf" ? "text-secondary-fixed-dim" : "text-secondary")}>
                {eyebrow}
              </p>
            )}
            {title && <h2 className={cx("font-headline-xl-mobile text-headline-xl-mobile sm:text-headline-xl", tone === "leaf" ? "text-white" : "text-primary")}>{title}</h2>}
            {intro && <p className={cx("mt-4 text-body-lg", tone === "leaf" ? "text-on-primary/80" : "text-on-surface-variant")}>{intro}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl border border-border bg-surface-container-lowest p-5 shadow-card sm:p-6", className)} {...rest} />;
}

export type BadgeTone = "default" | "leaf" | "warning" | "danger";

export function Badge({
  className,
  tone = "default",
  ...rest
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    default: "bg-surface-container text-on-surface-variant",
    leaf: "bg-positive-soft text-[#047857]",
    warning: "bg-caution-soft text-[#b45309]",
    danger: "bg-critical-soft text-[#b91c1c]",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-label-sm text-label-sm",
        tones[tone] || tones.default,
        className
      )}
      {...rest}
    />
  );
}

