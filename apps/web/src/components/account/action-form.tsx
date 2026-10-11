"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/actions/account";
import { cx } from "@/components/ui";

type Props = {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  /** Dictionary keys -> text. The first map that has the key wins. */
  messages: object[];
  success?: string;
  hidden?: Record<string, string>;
  className?: string;
  children: (pending: boolean, state: ActionState) => ReactNode;
};

export function messageFor(key: string | undefined, maps: object[]): string | undefined {
  if (!key) return undefined;
  const get = (m: object, k: string) => {
    const v = (m as Record<string, unknown>)[k];
    return typeof v === "string" ? v : undefined;
  };
  for (const m of maps) {
    const v = get(m, key);
    if (v) return v;
  }
  for (const m of maps) {
    const v = get(m, "generic") ?? get(m, "errorGeneric");
    if (v) return v;
  }
  return undefined;
}

/** A form bound to one account action, with a spoken result line under it. */
export function ActionForm({ action, messages, success, hidden, className, children }: Props) {
  const [state, run, pending] = useActionState(action, {} as ActionState);
  const text = state.ok ? (state.message ? messageFor(state.message, messages) ?? success : success) : messageFor(state.error, messages);
  return (
    <form action={run} className={cx("flex flex-col gap-4", className)} noValidate>
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children(pending, state)}
      {text && (
        <p key={state.at} role={state.ok ? "status" : "alert"} className={cx("font-medium", state.ok ? "text-primary-container" : "text-critical")}>
          {text}
        </p>
      )}
    </form>
  );
}
