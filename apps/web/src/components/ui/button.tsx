import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "accent" | "onDark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-60 min-h-12 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-leaf-600 text-white hover:bg-leaf-700 active:bg-leaf-800",
  secondary: "border-2 border-leaf-600 bg-white text-leaf-700 hover:bg-leaf-50",
  ghost: "text-leaf-700 hover:bg-leaf-50",
  gold: "bg-harvest-300 text-ink hover:bg-harvest-400",
  // For deep-green (leaf-800) backgrounds, as on the home-page hero.
  accent: "bg-node-300 text-leaf-900 hover:bg-node-200",
  onDark: "border-2 border-white/60 text-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs min-h-8",
  md: "px-5 text-base",
  lg: "px-7 text-lg",
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
