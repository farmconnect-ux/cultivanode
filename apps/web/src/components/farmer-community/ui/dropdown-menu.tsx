"use client";

import * as React from "react";
import { cn } from "./utils";

interface DropdownContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextType>({
  open: false,
  setOpen: () => {},
});

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, setOpen } = React.useContext(DropdownContext);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn("inline-flex items-center justify-center cursor-pointer", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  align = "end",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }) {
  const { open } = React.useContext(DropdownContext);
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-lg border border-gray-100 bg-white p-1 text-gray-900 shadow-lg animate-in fade-in-80",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  children,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = React.useContext(DropdownContext);

  return (
    <div
      role="menuitem"
      onClick={(e) => {
        setOpen(false);
        onClick?.(e);
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-1.5 text-xs outline-none transition-colors hover:bg-gray-100 hover:text-gray-900",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
