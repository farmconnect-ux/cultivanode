'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from './utils';

interface SelectContextType {
  value: string;
  onValueChange: (val: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

export function Select({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(false);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleValueChange = (val: string) => {
    if (controlledValue === undefined) setInternalValue(val);
    onValueChange?.(val);
    if (controlledOpen === undefined) setInternalOpen(false);
    onOpenChange?.(false);
  };

  const handleOpenChange = (newOpen: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof newOpen === 'function' ? newOpen(open) : newOpen;
    if (controlledOpen === undefined) setInternalOpen(nextVal);
    onOpenChange?.(nextVal);
  };

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen: handleOpenChange as any,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => context?.setOpen((prev) => !prev)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-container disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 text-gray-500 opacity-70" />
    </button>
  );
}

export function SelectValue({
  placeholder,
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const context = useContext(SelectContext);
  return (
    <span className={cn('block truncate', !context?.value && 'text-gray-400', className)}>
      {context?.value || placeholder || 'Select option'}
    </span>
  );
}

export function SelectContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const context = useContext(SelectContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        context?.setOpen(false);
      }
    };
    if (context?.open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [context?.open, context]);

  if (!context?.open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg animate-in fade-in-80',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(SelectContext);
  const isSelected = context?.value === value;

  return (
    <div
      onClick={() => context?.onValueChange(value)}
      className={cn(
        'relative flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 transition hover:bg-surface-container-low hover:text-primary',
        isSelected && 'bg-surface-container-low font-semibold text-primary',
        className
      )}
    >
      <span>{children}</span>
      {isSelected && <Check className="h-4 w-4 text-primary-container" />}
    </div>
  );
}
