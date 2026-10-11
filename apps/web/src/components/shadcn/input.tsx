import * as React from "react";
import { cn } from "@/lib/utils";

/** DESIGN.md → Inputs: 40px, white, slate-300 border, 8px radius, forest border + 3px tinted ring on focus. */
const inputBase =
  "w-full min-w-0 rounded-lg border border-input bg-surface-container-lowest px-3 text-body-md text-on-surface " +
  "shadow-[0_1px_0_rgb(15_23_42/0.02)] outline-none transition-[border-color,box-shadow] duration-150 " +
  "placeholder:text-outline focus-visible:border-primary-container focus-visible:ring-[3px] focus-visible:ring-primary-container/10 " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-critical aria-invalid:ring-critical/10";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        inputBase,
        "h-10 file:mr-3 file:border-0 file:bg-transparent file:font-label-md file:text-label-md file:text-on-surface",
        className,
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(inputBase, "min-h-24 py-2.5", className)} {...props} />;
}

export { Input, Textarea, inputBase };
