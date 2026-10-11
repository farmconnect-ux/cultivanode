import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

/**
 * A thin banner placed above a ported screen to show what is live for this account,
 * while the rest of the screen still shows the design's reference data.
 */
export function LiveStrip({
  children,
  tone = "live",
  className,
}: {
  children: React.ReactNode;
  tone?: "live" | "preview";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-2.5 text-body-sm",
        tone === "live"
          ? "border-secondary/20 bg-positive-soft text-on-surface"
          : "border-caution/25 bg-caution-soft text-on-surface",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-label-sm text-label-sm uppercase",
          tone === "live" ? "text-secondary" : "text-[#b45309]",
        )}
      >
        <Icon name={tone === "live" ? "sensors" : "visibility"} className="text-base" />
        {tone === "live" ? "Live for your account" : "Preview data"}
      </span>
      {children}
    </div>
  );
}
