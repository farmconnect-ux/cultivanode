"use client";

import * as React from "react";
import { Dialog as DialogPrimitive, Slot } from "radix-ui";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

/**
 * Dialogs for the ported screens. The design files shipped their modals as hidden markup toggled by
 * inline scripts; here the trigger button opens the same panel in an accessible Radix dialog
 * (focus trap, Esc to close, scroll lock). Primary actions inside a panel close it and confirm with a toast.
 */

type Ctx = { close: () => void; confirm: (label?: string) => void };
const DialogCtx = React.createContext<Ctx | null>(null);

let toastSink: ((msg: string) => void) | null = null;

export function showScreenToast(msg: string, detail?: string) {
  const full = detail ? `${msg} — ${detail}` : msg;
  if (toastSink) {
    toastSink(full);
  } else if (typeof window !== "undefined") {
    console.log("[Toast]", full);
  }
}

function ToastHost() {
  const [msg, setMsg] = React.useState<string | null>(null);
  React.useEffect(() => {
    toastSink = (m) => {
      setMsg(m);
      window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 3200);
    };
    return () => {
      toastSink = null;
    };
  }, []);
  if (!msg) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-inverse-surface px-4 py-3 text-body-sm text-inverse-on-surface shadow-overlay animate-in fade-in-0 slide-in-from-bottom-2"
    >
      <Icon name="check_circle" className="text-lg text-secondary-fixed-dim" filled />
      {msg}
    </div>
  );
}

export function ScreenDialog({
  title,
  subtitle,
  onClose,
  open: controlledOpen,
  onOpenChange,
  panel,
  side = "center",
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  panel: React.ReactNode;
  side?: "center" | "right";
  children?: React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(true);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : (children ? uncontrolledOpen : true);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose?.();
    }
    if (onOpenChange) {
      onOpenChange(nextOpen);
    }
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
  };

  const ctx = React.useMemo<Ctx>(
    () => ({
      close: () => {
        handleOpenChange(false);
      },
      confirm: (label) => {
        handleOpenChange(false);
        toastSink?.(label ? `${label} — saved in preview` : "Saved in preview");
      },
    }),
    [onClose, onOpenChange, isControlled],
  );

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      {children ? (
        <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
      ) : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#0b1c30]/45 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) handleOpenChange(false);
          }}
          className={cn(
            "fixed inset-0 z-50 flex overflow-y-auto outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            side === "right"
              ? "justify-end data-[state=open]:slide-in-from-right-8"
              : "items-start justify-center p-4 pt-[8vh] data-[state=open]:zoom-in-[0.98] sm:items-center sm:pt-4",
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogCtx.Provider value={ctx}>
            <div className={cn("contents [&>*]:max-h-full", side === "right" && "[&>*]:min-h-full")}>{panel}</div>
          </DialogCtx.Provider>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Wrap a panel button so it closes the dialog. */
export function ScreenDialogClose({
  children,
  onClick,
  className,
}: {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<any>) => void;
  className?: string;
}) {
  const ctx = React.useContext(DialogCtx);
  const handleClick = (e: React.MouseEvent<any>) => {
    onClick?.(e);
    ctx?.close();
  };

  if (React.isValidElement(children)) {
    return (
      <Slot.Root onClick={handleClick}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors", className)}
    >
      {children}
    </button>
  );
}

/** Wrap a panel's primary action: closes the dialog and confirms with a toast. */
export function ScreenDialogAction({
  children,
  onClick,
  className,
}: {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<any>) => void;
  className?: string;
}) {
  const ctx = React.useContext(DialogCtx);
  const handleClick = (e: React.MouseEvent<any>) => {
    onClick?.(e);
    const label = (e.currentTarget?.textContent ?? "").replace(/[-]/g, "").trim();
    ctx?.confirm(label);
  };

  if (React.isValidElement(children)) {
    return (
      <Slot.Root onClick={handleClick}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("px-space-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-colors", className)}
    >
      {children}
    </button>
  );
}

/** Mount once near the root of screens that use dialogs (rendered by AppShell and the site layout). */
export function ScreenToasts() {
  return <ToastHost />;
}
