import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "accent" | "onDark";
type Size = "sm" | "md" | "lg";

// Legacy API, restyled to the Agro-Enterprise suite (DESIGN.md → Buttons). New code can use
// "@/components/shadcn/button" directly; both share the same look.
const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-label-lg text-label-lg select-none " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary-container text-white shadow-card hover:bg-[#0d3a26]",
  secondary: "border border-border bg-surface-container-lowest text-[#1e293b] shadow-card hover:border-[#cbd5e1] hover:bg-[#f1f5f9]",
  ghost: "text-primary-container hover:bg-surface-container-high",
  gold: "bg-caution text-white shadow-card hover:bg-[#b45309]",
  accent: "bg-secondary-container text-on-primary-fixed hover:bg-secondary-fixed-dim",
  onDark: "border border-white/30 bg-white/5 text-white hover:bg-white/15",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-label-md",
  md: "h-10 px-4",
  lg: "h-12 px-6 text-body-md font-semibold",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cx(base, variants[variant], sizes[size], extra);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant = "primary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

type LinkButtonProps = {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  external?: boolean;
};

/** A link that looks like a button. External links open in a new tab. */
export function LinkButton({ href, variant = "primary", size = "md", className, children, external }: LinkButtonProps) {
  const cls = buttonClass(variant, size, className);
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
