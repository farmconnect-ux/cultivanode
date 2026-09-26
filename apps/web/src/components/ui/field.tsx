import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

const control =
  "block w-full rounded-md border-2 border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/70 " +
  "focus:border-leaf-600 focus:outline-none aria-[invalid=true]:border-danger";

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
      <label htmlFor={id} className="font-semibold">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">({optional})</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
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

export function Alert({ tone = "success", children }: { tone?: "success" | "danger"; children: ReactNode }) {
  const tones = {
    success: "border-leaf-300 bg-leaf-50 text-leaf-800",
    danger: "border-danger/40 bg-red-50 text-danger",
  } as const;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx("rounded-md border-2 px-4 py-3 font-medium", tones[tone])}>
      {children}
    </div>
  );
}
