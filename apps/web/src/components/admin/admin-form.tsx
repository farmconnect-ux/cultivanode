"use client";

import { useActionState, type ReactNode } from "react";
import type { AdminResult } from "@/actions/admin-console";
import { Button, cx } from "@/components/ui";

type Props = {
  action: (prev: AdminResult | null, form: FormData) => Promise<AdminResult>;
  hidden?: Record<string, string>;
  /** One or more submit buttons: [label, variant, name=value]. */
  buttons: { label: string; variant?: "primary" | "secondary" | "ghost"; name?: string; value?: string }[];
  className?: string;
  children?: ReactNode;
};

/** A staff form bound to one action, with its own result line. Fields are passed in as plain elements. */
export function AdminForm({ action, hidden, buttons, className, children }: Props) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} className={cx("flex flex-col gap-3", className)}>
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => (
          <Button key={b.label} type="submit" variant={b.variant ?? "primary"} name={b.name} value={b.value} disabled={pending}>
            {b.label}
          </Button>
        ))}
      </div>
      {state && (
        <p key={state.at} role={state.ok ? "status" : "alert"} className={cx("text-sm font-semibold", state.ok ? "text-primary-container" : "text-critical")}>
          {state.message}
        </p>
      )}
    </form>
  );
}
