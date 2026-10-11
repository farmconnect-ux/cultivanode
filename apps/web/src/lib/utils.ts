import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Design-system scale names from globals.css, so tailwind-merge doesn't mistake them for colours. */
const typeScale = [
  "display-lg", "headline-xl", "headline-xl-mobile", "headline-lg", "headline-md", "headline-sm",
  "metric-num", "body-lg", "body-md", "body-sm", "label-lg", "label-md", "label-sm",
];

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: typeScale,
      font: ["display", ...typeScale],
      spacing: [
        "space-xs", "space-sm", "space-md", "space-lg", "space-xl",
        "gutter", "gutter-desktop", "margin", "margin-tablet", "margin-desktop",
      ],
      shadow: ["card", "lift", "overlay"],
    },
  },
});

/** Merge class names; later Tailwind utilities win over earlier ones (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
