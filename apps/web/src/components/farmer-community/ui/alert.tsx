import * as React from "react";
import { cn } from "./utils";

export function Alert({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-900 shadow-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-xs text-gray-600 mt-1 leading-relaxed", className)}
      {...props}
    >
      {children}
    </div>
  );
}
