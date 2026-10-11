"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />;
}

/** Segmented control on a tinted rail; the active tab lifts onto white. */
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "no-scrollbar inline-flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-surface-container-low p-1",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 font-label-lg text-label-lg text-on-surface-variant " +
          "outline-none transition-all duration-150 hover:text-on-surface focus-visible:ring-2 focus-visible:ring-ring " +
          "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-surface-container-lowest " +
          "data-[state=active]:text-primary-container data-[state=active]:shadow-card",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none data-[state=active]:animate-fade-up", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
