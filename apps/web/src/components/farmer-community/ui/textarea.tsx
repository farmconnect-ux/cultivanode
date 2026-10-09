import * as React from "react";
import { cn } from "./utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-xs placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-600 focus-visible:border-green-600 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
