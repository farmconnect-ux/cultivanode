import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** DESIGN.md → Status pills: full-pill radius, soft fill, optional leading dot. */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 " +
    "font-label-sm text-label-sm transition-colors [&_.material-symbol]:text-[0.95rem]",
  {
    variants: {
      tone: {
        positive: "border-transparent bg-positive-soft text-[#047857]",
        caution: "border-transparent bg-caution-soft text-[#b45309]",
        critical: "border-transparent bg-critical-soft text-[#b91c1c]",
        atmos: "border-transparent bg-atmos-soft text-atmos",
        neutral: "border-transparent bg-surface-container text-on-surface-variant",
        brand: "border-transparent bg-primary-container text-on-primary-container",
        mint: "border-transparent bg-secondary-container/60 text-on-secondary-container",
        outline: "border-border bg-surface-container-lowest text-on-surface-variant",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

const dotColour: Record<string, string> = {
  positive: "bg-[#10b981]",
  caution: "bg-[#f59e0b]",
  critical: "bg-[#ef4444]",
  atmos: "bg-atmos",
  neutral: "bg-outline",
  brand: "bg-secondary-fixed-dim",
  mint: "bg-secondary",
  outline: "bg-outline",
};

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean; dot?: boolean; pulse?: boolean };

function Badge({ className, tone, asChild = false, dot, pulse, children, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && (
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", dotColour[tone ?? "neutral"], pulse && "animate-pulse-dot")}
        />
      )}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants, type BadgeProps };
