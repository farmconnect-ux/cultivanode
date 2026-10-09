"use client";

import * as React from "react";
import { cn } from "./utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
  value: "",
  onValueChange: () => {},
});

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internalVal, setInternalVal] = React.useState(defaultValue || "");
  const currentVal = value !== undefined ? value : internalVal;

  const handleChange = (newVal: string) => {
    if (value === undefined) setInternalVal(newVal);
    onValueChange?.(newVal);
  };

  return (
    <TabsContext.Provider value={{ value: currentVal, onValueChange: handleChange }}>
      <div className={cn("w-full space-y-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { value: activeVal, onValueChange } = React.useContext(TabsContext);
  const isActive = activeVal === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        isActive
          ? "bg-white text-gray-900 shadow-xs font-semibold"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { value: activeVal } = React.useContext(TabsContext);
  if (activeVal !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn("focus-visible:outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}
