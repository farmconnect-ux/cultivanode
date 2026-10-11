"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ds/icon";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-surface-container-lowest px-3 text-body-md text-on-surface " +
          "outline-none transition-[border-color,box-shadow] data-[placeholder]:text-outline focus-visible:border-primary-container " +
          "focus-visible:ring-[3px] focus-visible:ring-primary-container/10 disabled:opacity-50 [&>span]:truncate",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <Icon name="expand_more" className="text-lg text-on-surface-variant" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn(
          "relative z-50 max-h-80 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover shadow-overlay " +
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          position === "popper" && "w-[var(--radix-select-trigger-width)] translate-y-1",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-2.5 pr-8 text-body-sm outline-none " +
          "focus:bg-surface-container-low data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Icon name="check" className="text-base text-secondary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem };
