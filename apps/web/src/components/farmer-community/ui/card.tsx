import * as React from "react";
import { cn } from "./utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-5 pb-3 border-b border-gray-100", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-base font-semibold leading-none tracking-tight text-gray-900", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs text-gray-500", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("p-5 pt-3", className)}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center p-5 pt-0 border-t border-gray-100 mt-4", className)}
      {...props}
    />
  );
}
