import * as React from "react";
import { cn } from "./utils";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-xs font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 block",
        className
      )}
      {...props}
    />
  );
}
