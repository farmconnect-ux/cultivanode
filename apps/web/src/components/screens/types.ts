import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";

/**
 * Every ported screen receives the active locale (for links) and optional slots.
 * A slot replaces one region of the design (e.g. its sample table) with live content;
 * leave it out to show the design's reference content, pass null to hide the region.
 */
export type ScreenProps<S extends string = never> = {
  lang: Locale;
  slots?: Partial<Record<S, ReactNode>>;
};

export function slot<S extends string>(
  slots: Partial<Record<S, ReactNode>> | undefined,
  name: S,
  fallback: ReactNode,
): ReactNode {
  return slots && name in slots ? slots[name] : fallback;
}
