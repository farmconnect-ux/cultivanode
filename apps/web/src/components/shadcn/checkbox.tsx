"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ds/icon";

/** DESIGN.md → 18px, 4px radius, forest fill with a white check. */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer flex size-[18px] shrink-0 items-center justify-center rounded-sm border border-input bg-surface-container-lowest outline-none transition-colors " +
          "focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 data-[state=checked]:border-primary-container data-[state=checked]:bg-primary-container data-[state=checked]:text-white",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Icon name="check" className="text-[14px]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
