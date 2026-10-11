"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Badge, cx } from "@/components/ui";
import { WORKSPACE_DETAILS, type Workspace } from "@/lib/account/workspace";

export function WorkspaceSwitcher({
  currentWorkspace,
  availableWorkspaces,
}: {
  currentWorkspace: Workspace;
  availableWorkspaces: Workspace[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // If user has only one workspace, show current badge
  if (availableWorkspaces.length <= 1) {
    const info = WORKSPACE_DETAILS[currentWorkspace];
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-container-low px-3 py-1.5 text-xs">
        <span className="font-semibold text-on-surface-variant">WORKSPACE:</span>
        <Badge className="bg-secondary-container/40 font-bold text-primary">{info.name}</Badge>
      </div>
    );
  }

  const buildWorkspaceUrl = (ws: Workspace) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ws", ws);
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface-container-low p-2">
      <span className="px-1 text-[11px] font-bold tracking-wider text-on-surface-variant uppercase">
        Current Workspace
      </span>
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Select operational workspace">
        {availableWorkspaces.map((ws) => {
          const info = WORKSPACE_DETAILS[ws];
          const isActive = ws === currentWorkspace;
          return (
            <Link
              key={ws}
              href={buildWorkspaceUrl(ws)}
              role="tab"
              aria-selected={isActive}
              className={cx(
                "inline-flex min-h-9 items-center rounded-md px-3 text-xs font-bold transition-colors",
                isActive
                  ? "bg-primary-container text-white shadow-xs"
                  : "bg-white text-on-surface hover:bg-surface-container-low",
              )}
            >
              {info.name}
              {isActive && <span className="ml-1.5 text-[10px] text-on-primary/70">●</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
