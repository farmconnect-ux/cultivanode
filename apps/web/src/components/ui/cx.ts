import { cn } from "@/lib/utils";

/** Joins class names, skipping falsy values; conflicting Tailwind utilities resolve to the last one. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return cn(...parts);
}
