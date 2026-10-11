import { LogoMark } from "@/components/site/logo";
import { brand } from "@cultivanode/shared/brand";
import { cn } from "@/lib/utils";

/** Brand mark + word mark in the suite's display type. "Node" keeps the brand cyan accent. */
export function BrandLockup({
  tagline = brand.tagline,
  tone = "light",
  compact,
  className,
}: {
  tagline?: string | null;
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark className={compact ? "size-8 shrink-0" : "size-9 shrink-0"} />
      <span className="flex min-w-0 flex-col">
        <span
          className={cn(
            "font-display text-[1.0625rem] font-bold leading-5 tracking-tight",
            tone === "dark" ? "text-white" : "text-primary",
          )}
        >
          Cultiva<span className={tone === "dark" ? "text-node-300" : "text-node-600"}>Node</span>
        </span>
        {tagline && !compact && (
          <span
            className={cn(
              "truncate font-label-sm text-label-sm font-medium",
              tone === "dark" ? "text-white/60" : "text-on-surface-variant",
            )}
          >
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
