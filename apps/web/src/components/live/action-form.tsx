"use client";

import * as React from "react";
import { useActionState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Icon, type IconName } from "@/components/ds/icon";
import { cn } from "@/lib/utils";

export type FormResult = { ok: boolean; message: string; at: number } | null;
export type FormAction = (prev: FormResult, form: FormData) => Promise<FormResult>;

export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "datetime-local" | "textarea" | "select" | "email" | "tel";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  step?: string;
  min?: string | number;
  max?: string | number;
  hint?: string;
  /** Spans both columns of the form grid. */
  wide?: boolean;
};

const input =
  "h-10 w-full rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 text-body-md text-on-surface outline-none transition-colors focus:border-primary-container focus:bg-surface-container-lowest";

function Field({ f }: { f: FieldSpec }) {
  const id = `f-${f.name}`;
  return (
    <label htmlFor={id} className={cn("flex flex-col gap-1", (f.wide || f.type === "textarea") && "sm:col-span-2")}>
      <span className="font-label-md text-label-md text-on-surface-variant">
        {f.label}
        {f.required && <span className="text-critical"> *</span>}
      </span>
      {f.type === "textarea" ? (
        <textarea id={id} name={f.name} required={f.required} placeholder={f.placeholder} defaultValue={f.defaultValue} rows={3} className={cn(input, "h-auto py-2")} />
      ) : f.type === "select" ? (
        <select id={id} name={f.name} required={f.required} defaultValue={f.defaultValue ?? ""} className={input}>
          {!f.required && <option value="">—</option>}
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={f.name}
          type={f.type ?? "text"}
          required={f.required}
          placeholder={f.placeholder}
          defaultValue={f.defaultValue}
          step={f.step ?? (f.type === "number" ? "any" : undefined)}
          min={f.min}
          max={f.max}
          className={input}
        />
      )}
      {f.hint && <span className="text-body-sm text-on-surface-variant">{f.hint}</span>}
    </label>
  );
}

const btnBase = "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-label-md text-label-md shadow-sm transition-all active:scale-[0.98] disabled:opacity-60";
export const buttonTone = {
  primary: `${btnBase} bg-primary-container text-on-primary hover:bg-primary`,
  secondary: `${btnBase} bg-surface-container-lowest text-on-surface ring-1 ring-outline-variant/60 hover:bg-surface-container-low`,
  ghost: `${btnBase} bg-transparent shadow-none text-primary-container hover:bg-surface-container-low`,
} as const;

/** The inner form: fields, hidden values, submit, inline result. Closes the dialog on success. */
function ActionFormBody({
  action,
  fields,
  hidden,
  submit,
  onDone,
}: {
  action: FormAction;
  fields: FieldSpec[];
  hidden?: Record<string, string>;
  submit: string;
  onDone?: () => void;
}) {
  const [state, run, pending] = useActionState(action, null);
  const done = React.useRef(0);
  React.useEffect(() => {
    if (state?.ok && state.at !== done.current) {
      done.current = state.at;
      onDone?.();
    }
  }, [state, onDone]);
  return (
    <form action={run} className="flex flex-col gap-4">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.name} f={f} />
        ))}
      </div>
      {state && !state.ok && (
        <p role="alert" className="flex items-center gap-1.5 rounded-lg bg-critical-soft px-3 py-2 text-body-sm text-[#b91c1c]">
          <Icon name="error" className="text-base" /> {state.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="submit" disabled={pending} className={buttonTone.primary}>
          {pending ? <Icon name="progress_activity" className="animate-spin text-base" /> : <Icon name="check" className="text-base" />}
          {submit}
        </button>
      </div>
    </form>
  );
}

let toast: ((m: string) => void) | null = null;

/** One toast host per page, rendered by the first ActionDialog. */
function Toast() {
  const [msg, setMsg] = React.useState<string | null>(null);
  React.useEffect(() => {
    toast = (m) => {
      setMsg(m);
      window.setTimeout(() => setMsg((c) => (c === m ? null : c)), 3200);
    };
    return () => {
      toast = null;
    };
  }, []);
  if (!msg) return null;
  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-inverse-surface px-4 py-3 text-body-sm text-inverse-on-surface shadow-overlay">
      <Icon name="check_circle" className="text-lg text-secondary-fixed-dim" filled />
      {msg}
    </div>
  );
}

/**
 * A button that opens a dialog with a form bound to a server action. The action returns
 * { ok, message }; on success the dialog closes and a toast confirms, on failure the message shows inline.
 */
export function ActionDialog({
  title,
  description,
  trigger,
  icon = "add",
  tone = "primary",
  action,
  fields,
  hidden,
  submit = "Save",
}: {
  title: string;
  description?: string;
  trigger: string;
  icon?: IconName;
  tone?: keyof typeof buttonTone;
  action: FormAction;
  fields: FieldSpec[];
  hidden?: Record<string, string>;
  submit?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [key, setKey] = React.useState(0);
  const onDone = React.useCallback(() => {
    setOpen(false);
    setKey((k) => k + 1);
    toast?.(`${title} — saved`);
  }, [title]);
  return (
    <>
      <Toast />
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Trigger asChild>
          <button type="button" className={buttonTone[tone]}>
            <Icon name={icon} className="text-base" />
            {trigger}
          </button>
        </DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#0b1c30]/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-[6vh] z-50 max-h-[88vh] w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto rounded-2xl bg-surface-container-lowest p-space-lg shadow-overlay outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <DialogPrimitive.Title className="font-headline-sm text-headline-sm text-primary">{title}</DialogPrimitive.Title>
                {description && <p className="mt-1 text-body-sm text-on-surface-variant">{description}</p>}
              </div>
              <DialogPrimitive.Close className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-low" aria-label="Close">
                <Icon name="close" />
              </DialogPrimitive.Close>
            </div>
            <ActionFormBody key={key} action={action} fields={fields} hidden={hidden} submit={submit} onDone={onDone} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

/** A one-click action (e.g. "Mark done") rendered as a tiny form with a single button. */
export function ActionButton({
  action,
  hidden,
  label,
  icon = "check",
  tone = "ghost",
  confirm,
}: {
  action: FormAction;
  hidden: Record<string, string>;
  label: string;
  icon?: IconName;
  tone?: keyof typeof buttonTone;
  confirm?: string;
}) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className="inline-flex items-center gap-2"
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" disabled={pending} className={cn(buttonTone[tone], "px-2.5 py-1")}>
        <Icon name={pending ? "progress_activity" : icon} className={cn("text-base", pending && "animate-spin")} />
        {label}
      </button>
      {state && !state.ok && <span className="text-body-sm text-critical">{state.message}</span>}
    </form>
  );
}

/** The same form without a dialog, for inline composers (e.g. a message box). Resets after success. */
export function InlineForm({ action, fields, hidden, submit = "Send" }: { action: FormAction; fields: FieldSpec[]; hidden?: Record<string, string>; submit?: string }) {
  const [key, setKey] = React.useState(0);
  const onDone = React.useCallback(() => setKey((k) => k + 1), []);
  return <ActionFormBody key={key} action={action} fields={fields} hidden={hidden} submit={submit} onDone={onDone} />;
}
