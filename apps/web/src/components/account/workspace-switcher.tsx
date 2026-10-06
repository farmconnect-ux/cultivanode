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
      <div className="flex items-center gap-2 rounded-lg border border-line bg-cream px-3 py-1.5 text-xs">
        <span className="font-semibold text-muted">WORKSPACE:</span>
        <Badge className="bg-leaf-100 font-bold text-leaf-800">{info.name}</Badge>
      </div>
    );
  }

  const buildWorkspaceUrl = (ws: Workspace) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ws", ws);
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-cream p-2">
      <span className="px-1 text-[11px] font-bold tracking-wider text-muted uppercase">
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
                  ? "bg-leaf-700 text-white shadow-xs"
                  : "bg-white text-ink hover:bg-leaf-50",
              )}
            >
              {info.name}
              {isActive && <span className="ml-1.5 text-[10px] text-leaf-200">●</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
