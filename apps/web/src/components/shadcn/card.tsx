import * as React from "react";
import { cn } from "@/lib/utils";

/** DESIGN.md → Cards: white surface, 1px slate border, 16px radius, micro-shadow, ruled header. */
function Card({ className, interactive, ...props }: React.ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-card",
        interactive && "card-interactive",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-[#f1f5f9] px-5 py-4 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("font-headline-sm text-headline-sm text-on-surface", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("mt-0.5 text-body-sm text-on-surface-variant", className)} {...props} />;
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-action" className={cn("flex shrink-0 items-center gap-2", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-5 py-5 sm:px-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-3 border-t border-[#f1f5f9] px-5 py-3.5 sm:px-6", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter };
