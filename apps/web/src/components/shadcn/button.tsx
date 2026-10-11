import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * DESIGN.md → Buttons
 * primary: deep forest, secondary: white with slate border, harvest: ochre for escrow / dispatch,
 * destructive: red outline. 8px radius, 40px default height, emerald focus ring.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-label-lg text-label-lg " +
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out " +
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary-container text-white shadow-card hover:bg-[#0d3a26]",
        secondary: "border border-border bg-surface-container-lowest text-[#1e293b] shadow-card hover:border-[#cbd5e1] hover:bg-[#f1f5f9]",
        harvest: "bg-caution text-white shadow-card hover:bg-[#b45309]",
        emerald: "bg-secondary text-white shadow-card hover:bg-[#005236]",
        destructive: "border border-critical/60 bg-surface-container-lowest text-critical hover:bg-critical-soft",
        ghost: "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
        soft: "bg-primary-fixed/50 text-on-primary-fixed-variant hover:bg-primary-fixed",
        link: "h-auto px-0 text-secondary underline-offset-4 hover:underline",
        onDark: "border border-white/30 bg-white/5 text-white hover:bg-white/15",
      },
      size: {
        sm: "h-8 px-3 text-label-md [&_.material-symbol]:text-base",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-body-md font-semibold",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
