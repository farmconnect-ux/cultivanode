import * as React from "react";
import { cn } from "./utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ className, value = 0, ...props }: ProgressProps) {
  const safeVal = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray-100", className)}
      {...props}
    >
      <div
        className="h-full bg-green-600 transition-all duration-300 rounded-full"
        style={{ width: `${safeVal}%` }}
      />
    </div>
  );
}
