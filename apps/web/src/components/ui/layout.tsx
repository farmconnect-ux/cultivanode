import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export function Container({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...rest} />;
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
    cream: "bg-cream",
    white: "bg-white",
    leaf: "bg-leaf-800 text-white",
  } as const;
  return (
    <section id={id} className={cx("py-16 sm:py-20", tones[tone], className)}>
      <Container>
        {(eyebrow || title || intro) && (
          <header className="mb-10 max-w-2xl">
            {eyebrow && (
              <p className={cx("mb-2 text-sm font-bold uppercase tracking-wider", tone === "leaf" ? "text-harvest-300" : "text-harvest-700")}>
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>}
            {intro && <p className={cx("mt-4 text-lg", tone === "leaf" ? "text-leaf-100" : "text-muted")}>{intro}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cx("rounded-lg border border-line bg-white p-6", className)} {...rest} />;
}

export type BadgeTone = "default" | "leaf" | "warning" | "danger";

export function Badge({
  className,
  tone = "default",
  ...rest
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    default: "bg-neutral-100 text-neutral-800",
    leaf: "bg-leaf-100 text-leaf-800",
    warning: "bg-harvest-100 text-harvest-800",
    danger: "bg-danger-100 text-danger-800",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone] || tones.default,
        className
      )}
      {...rest}
    />
  );
}

