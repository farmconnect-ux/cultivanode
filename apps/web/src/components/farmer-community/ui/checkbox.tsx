import * as React from "react";
import { cn } from "./utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ className, checked, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn(
        "h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600",
        className
      )}
      {...props}
    />
  );
}
