import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
        <Icon name={icon} className="text-2xl" />
      </span>
      <div className="max-w-sm">
        <p className="font-headline-sm text-headline-sm text-on-surface">{title}</p>
        {description && <p className="mt-1 text-body-sm text-on-surface-variant">{description}</p>}
      </div>
      {action}
    </div>
  );
}
