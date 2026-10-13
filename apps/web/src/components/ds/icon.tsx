import * as React from "react";
import { cn } from "@/lib/utils";
import { ICON_CODEPOINTS, type IconName } from "./icon-codepoints";

export type { IconName };

/**
 * Material Symbols glyph from the self-hosted subset font (see scripts/build-icon-font.py).
 * Rendered by code point, so there is no flash of ligature text while the font loads.
 * Size follows font-size (default 1.25em); colour follows currentColor.
 */
export function Icon({
  name,
  filled,
  label,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & { name: IconName; filled?: boolean; label?: string }) {
  // Names can come from data (status maps, DB rows). A name outside the subset font must never
  // crash the page: String.fromCodePoint(undefined) throws RangeError and takes the route down.
  const codepoint = (ICON_CODEPOINTS as Record<string, number | undefined>)[name];
  if (codepoint === undefined) {
    if (process.env.NODE_ENV !== "production") console.warn(`Icon "${name}" is not in the icon subset font.`);
    return <span className={cn("material-symbol", className)} data-icon={name} aria-hidden {...props} />;
  }
  return (
    <span
      className={cn("material-symbol", className)}
      data-filled={filled ? "" : undefined}
      data-icon={name}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      {...props}
    >
      {String.fromCodePoint(codepoint)}
    </span>
  );
}
