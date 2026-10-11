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
  return (
    <span
      className={cn("material-symbol", className)}
      data-filled={filled ? "" : undefined}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      {...props}
    >
      {String.fromCodePoint(ICON_CODEPOINTS[name])}
    </span>
  );
}
