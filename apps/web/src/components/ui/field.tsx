import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

// DESIGN.md → Inputs: 40px+, white, slate border, forest focus border with a soft 3px ring.
const control =
  "block w-full min-h-10 rounded-lg border border-input bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface " +
  "placeholder:text-outline transition-[border-color,box-shadow] duration-150 " +
  "focus:border-primary-container focus:outline-none focus:ring-[3px] focus:ring-primary-container/10 " +
  "aria-[invalid=true]:border-critical aria-[invalid=true]:ring-critical/10 disabled:opacity-50";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: string; // e.g. "optional" / "kò pọn dandan"
  children: ReactNode;
};

/** Label, control, hint and error message wired together for screen readers. */
export function Field({ id, label, hint, error, optional, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-label-md text-label-md text-[#475569]">
        {label}
        {optional && <span className="ml-1 font-normal text-outline">({optional})</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-body-sm text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-body-sm font-medium text-critical">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cx(control, className)} {...rest} />;
}

export function TextArea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cx(control, "min-h-32", className)} {...rest} />;
}

export function Select({ className, ...rest }: ComponentProps<"select">) {
  return <select className={cx(control, "appearance-auto", className)} {...rest} />;
}

export function Alert({ tone = "success", children }: { tone?: "success" | "danger" | "warning"; children: ReactNode }) {
  const tones = {
    success: "border-positive/25 bg-positive-soft text-[#065f46]",
    danger: "border-critical/25 bg-critical-soft text-[#991b1b]",
    warning: "border-caution/30 bg-caution-soft text-[#92400e]",
  } as const;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx("rounded-xl border px-4 py-3 text-body-sm font-medium", tones[tone])}>
      {children}
    </div>
  );
}
