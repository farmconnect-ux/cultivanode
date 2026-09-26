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

export function Badge({ className, ...rest }: ComponentProps<"span">) {
  return (
    <span
      className={cx("inline-flex items-center rounded-full bg-harvest-100 px-3 py-1 text-sm font-semibold text-harvest-700", className)}
      {...rest}
    />
  );
}
