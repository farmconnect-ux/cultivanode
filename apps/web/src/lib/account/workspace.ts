import type { Account } from "@/lib/account/session";

export type Workspace = "farmer" | "provider" | "agent" | "customer";

export type WorkspaceInfo = {
  id: Workspace;
  name: string;
  roleDescription: string;
  badge: string;
};

export const WORKSPACE_DETAILS: Record<Workspace, WorkspaceInfo> = {
  farmer: {
    id: "farmer",
    name: "Farmer",
    roleDescription: "Farm & Crop Operations",
    badge: "Farmer",
  },
  provider: {
    id: "provider",
    name: "Machinery & Services",
    roleDescription: "Equipment & Service Provider",
    badge: "Provider",
  },
  customer: {
    id: "customer",
    name: "My Orders",
    roleDescription: "Marketplace purchases & deliveries",
    badge: "Customer",
  },
  agent: {
    id: "agent",
    name: "Field Agent",
    roleDescription: "Field Operations & Assisted Onboarding",
    badge: "Agent",
  },
};

/**
 * Returns all workspaces the account is approved to operate in.
 */
export function getAvailableWorkspaces(account: Account): Workspace[] {
  const list: Workspace[] = [];
  // Marketplace-only customers get just their orders workspace.
  if (account.isCustomerOnly) return ["customer"];
  if (account.isFarmer) list.push("farmer");
  if (account.isOwner || account.serviceTypes.length > 0) list.push("provider");
  if (account.isAgent) list.push("agent");

  if (account.isCustomer) list.push("customer");
  // Fallback if no specific role held yet
  if (list.length === 0) list.push("farmer");
  return list;
}

/**
 * Resolves the active workspace from user preference, request param, or primary role.
 */
export function resolveWorkspace(account: Account, requested?: string | null): Workspace {
  const available = getAvailableWorkspaces(account);
  if (requested && (available as readonly string[]).includes(requested)) {
    return requested as Workspace;
  }
  return available[0] ?? "farmer";
}
