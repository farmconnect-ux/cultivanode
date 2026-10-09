import * as React from "react";
import { cn } from "./utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  let variantCls = "border-transparent bg-green-100 text-green-800";
  if (variant === "secondary") {
    variantCls = "border-transparent bg-gray-100 text-gray-800";
  } else if (variant === "destructive") {
    variantCls = "border-transparent bg-red-100 text-red-800";
  } else if (variant === "outline") {
    variantCls = "text-gray-950 border border-gray-200";
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2",
        variantCls,
        className
      )}
      {...props}
    />
  );
}
