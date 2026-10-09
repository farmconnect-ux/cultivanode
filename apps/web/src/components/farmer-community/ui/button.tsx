import * as React from "react";
import { cn } from "./utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-600 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";
    
    let variantCls = "bg-green-700 text-white shadow hover:bg-green-800";
    if (variant === "outline") {
      variantCls = "border border-gray-200 bg-white shadow-xs hover:bg-gray-50 text-gray-700";
    } else if (variant === "ghost") {
      variantCls = "hover:bg-gray-100 text-gray-700";
    } else if (variant === "destructive") {
      variantCls = "bg-red-600 text-white shadow-xs hover:bg-red-700";
    } else if (variant === "secondary") {
      variantCls = "bg-gray-100 text-gray-900 shadow-xs hover:bg-gray-200";
    } else if (variant === "link") {
      variantCls = "text-green-700 underline-offset-4 hover:underline";
    }

    let sizeCls = "h-8 px-3 py-1.5";
    if (size === "sm") {
      sizeCls = "h-7 rounded-md px-2.5 text-[11px]";
    } else if (size === "lg") {
      sizeCls = "h-10 rounded-lg px-4 text-sm";
    } else if (size === "icon") {
      sizeCls = "h-8 w-8 p-0";
    }

    return (
      <button
        ref={ref}
        className={cn(base, variantCls, sizeCls, className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
