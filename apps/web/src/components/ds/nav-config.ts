import type { IconName } from "./icon";
import type { Workspace } from "@/lib/account/workspace";
import type { FlagKey, Flags } from "@/lib/flags";

export type NavItem = {
  /** Path after the locale for account pages ("/account/farms"), absolute for admin ("/admin/health"). */
  href: string;
  label: string;
  icon: IconName;
  /** Shown as a pill (e.g. "Live", or a count). */
  badge?: string;
  /** Match only the exact path (for parent routes like "/account"). */
  exact?: boolean;
  /** Shown only while this admin feature switch is on (Admin → Feature switches). */
  flag?: FlagKey;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
  /** Collapsed by default (secondary groups such as the ecosystem hubs). */
  collapsible?: boolean;
  /** The whole group is shown only while this admin feature switch is on. */
  flag?: FlagKey;
};

const farmer: NavGroup[] = [
  {
    id: "operations",
    label: "Farm operations",
    items: [
      { href: "/account", label: "Overview", icon: "grid_view", exact: true },
      { href: "/account/farms", label: "My Farms & Fields", icon: "landscape" },
      { href: "/account/farms/map", label: "Farm Map & Cadastre", icon: "map", flag: "module_farm_map" },
      { href: "/account/crops", label: "Crop Management", icon: "potted_plant" },
      { href: "/account/crops/scouting", label: "Field Scouting", icon: "pest_control" },
      { href: "/account/livestock", label: "Livestock & Aquaculture", icon: "pets", flag: "module_livestock" },
      { href: "/account/tasks", label: "Field Operations & Calendar", icon: "calendar_month" },
    ],
  },
  {
    id: "machinery",
    label: "Machinery & automation",
    items: [
      { href: "/account/find", label: "Service & Machinery Marketplace", icon: "precision_manufacturing" },
      { href: "/account/bookings", label: "My Bookings", icon: "event_available" },
      { href: "/account/machinery", label: "Fleet & Workshop", icon: "agriculture", flag: "module_fleet" },
      { href: "/account/machinery/telemetry", label: "Telemetry & Tracking", icon: "satellite_alt", flag: "module_telemetry" },
      { href: "/account/iot", label: "IoT & Smart Farm", icon: "sensors", flag: "module_iot" },
      { href: "/account/irrigation", label: "Smart Irrigation", icon: "water_drop", flag: "module_irrigation" },
      { href: "/account/inventory", label: "Inventory & Supplies", icon: "inventory_2" },
    ],
  },
  {
    id: "commerce",
    label: "Commerce & finance",
    items: [
      { href: "/account/marketplace/seller", label: "My Shop: Listings & Orders", icon: "store" },
      { href: "/account/marketplace/orders", label: "My Purchases", icon: "receipt_long" },
      { href: "/account/harvest", label: "Produce & Harvest Commerce", icon: "storefront", flag: "module_harvest" },
      { href: "/account/contracts", label: "Off-take Contracts", icon: "handshake", flag: "module_contracts" },
      { href: "/account/finance", label: "Farm Books & Accounting (₦)", icon: "account_balance_wallet" },
      { href: "/account/reports", label: "Verified Records & Credit", icon: "verified", flag: "module_credit_reports" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { href: "/account/risk", label: "Farm Health & Risk", icon: "shield_with_heart", flag: "module_risk" },
      { href: "/account/assistant", label: "Farm assistant", icon: "neurology" },
    ],
  },
];

const provider: NavGroup[] = [
  {
    id: "dispatch",
    label: "Dispatch & jobs",
    items: [
      { href: "/account", label: "Operator Dispatch & PoW", icon: "grid_view", exact: true },
      { href: "/account/bookings", label: "Job Requests & Bookings", icon: "assignment" },
      { href: "/account/listings", label: "My Listings", icon: "list_alt" },
      { href: "/account/marketplace/seller", label: "Marketplace Shop & Orders", icon: "store" },
      { href: "/account/machinery/dispatch", label: "Proof-of-Work Log", icon: "fact_check", flag: "module_pow_log" },
    ],
  },
  {
    id: "fleet",
    label: "Fleet",
    items: [
      { href: "/account/machinery", label: "Fleet & Workshop", icon: "agriculture", flag: "module_fleet" },
      { href: "/account/machinery/telemetry", label: "Telemetry & Tracking", icon: "satellite_alt", flag: "module_telemetry" },
      { href: "/account/logistics", label: "Logistics & Haulage", icon: "local_shipping", flag: "module_logistics" },
      { href: "/account/finance", label: "Earnings & Books (₦)", icon: "account_balance_wallet" },
    ],
  },
];

const agent: NavGroup[] = [
  {
    id: "field",
    label: "Field agent",
    items: [
      { href: "/account", label: "Assisted Onboarding Hub", icon: "badge", exact: true },
      { href: "/account/agent", label: "Register a Farmer", icon: "person_add" },
      { href: "/account/bookings/new", label: "Book for a Farmer", icon: "event_available" },
      { href: "/account/cooperative", label: "Cooperative Management", icon: "groups" },
      { href: "/account/crops/scouting", label: "Field Scouting", icon: "pest_control" },
    ],
  },
];

const ecosystem: NavGroup = {
  id: "ecosystem",
  label: "Ecosystem hubs",
  collapsible: true,
  flag: "ecosystem_hubs",
  items: [
    { href: "/account/buyer", label: "Produce Buyer & Aggregator", icon: "shopping_bag" },
    { href: "/account/supplier", label: "Input Supplier & Agro-dealer", icon: "store" },
    { href: "/account/logistics", label: "Logistics & Haulage", icon: "local_shipping", flag: "module_logistics" },
    { href: "/account/processing", label: "Agro-processing", icon: "factory" },
    { href: "/account/cooperative", label: "Cooperative", icon: "groups" },
    { href: "/account/enterprise", label: "Enterprise Agribusiness", icon: "corporate_fare" },
    { href: "/account/lender", label: "Lender & Agri-credit", icon: "account_balance" },
    { href: "/account/insurance", label: "Insurance & Underwriting", icon: "health_and_safety" },
    { href: "/account/grants", label: "Grants & Subsidies", icon: "volunteer_activism" },
    { href: "/account/investor", label: "Investor Hub", icon: "monitoring" },
    { href: "/account/gov", label: "Government Intelligence", icon: "account_balance" },
    { href: "/account/ngo", label: "NGO & Development", icon: "diversity_3" },
    { href: "/account/research", label: "Research & Extension", icon: "biotech" },
    { href: "/account/market-intel", label: "Food Security & Market Intel", icon: "query_stats" },
  ],
};

const account: NavGroup = {
  id: "account",
  label: "Account",
  items: [
    { href: "/account/messages", label: "Messages", icon: "forum" },
    { href: "/account/inbox", label: "Notifications", icon: "notifications" },
    { href: "/account/settings", label: "Settings & Workspace Roles", icon: "manage_accounts" },
    { href: "/account/verification", label: "Verification", icon: "verified_user" },
  ],
};

const customer: NavGroup[] = [
  {
    id: "orders",
    label: "My orders",
    items: [
      { href: "/account/marketplace/orders", label: "Orders & deliveries", icon: "receipt_long" },
      { href: "/marketplace", label: "Shop the marketplace", icon: "storefront" },
      { href: "/marketplace/checkout", label: "Cart & checkout", icon: "shopping_cart" },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { href: "/account/messages", label: "Messages", icon: "forum" },
      { href: "/account/inbox", label: "Notifications", icon: "notifications" },
      { href: "/account/profile", label: "Profile", icon: "person" },
      { href: "/account/settings", label: "Settings", icon: "manage_accounts" },
      { href: "/account/privacy", label: "Data & privacy", icon: "lock" },
    ],
  },
];

/** Drop items and groups whose admin switch is off, and groups left empty. */
export function withFlags(groups: NavGroup[], flags: Flags): NavGroup[] {
  return groups
    .filter((g) => !g.flag || flags[g.flag] === true)
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.flag || flags[i.flag] === true) }))
    .filter((g) => g.items.length > 0);
}

export function accountNav(ws: Workspace, flags: Flags = {}): NavGroup[] {
  if (ws === "customer") return customer;
  const base = ws === "provider" ? provider : ws === "agent" ? agent : farmer;
  return withFlags([...base, account, ecosystem], flags);
}

/** Admin console. `perm` items are hidden when the staff member lacks that permission. */
export type AdminNavItem = NavItem & { perm?: string[] };
export type AdminNavGroup = Omit<NavGroup, "items"> & { items: AdminNavItem[] };

export const adminNav: AdminNavGroup[] = [
  {
    id: "ops",
    label: "Operations",
    items: [
      { href: "/admin", label: "Overview", icon: "dashboard", exact: true },
      { href: "/admin/health", label: "Super Admin & System Health", icon: "monitor_heart" },
      { href: "/admin/jobs", label: "Jobs Console", icon: "assignment" },
      { href: "/admin/disputes", label: "Dispute Resolution & PoW", icon: "gavel", perm: ["disputes.decide", "bookings.read"] },
      { href: "/admin/cancellations", label: "Cancellations", icon: "event_busy" },
      { href: "/admin/support", label: "Support & SLA Desk", icon: "support_agent", perm: ["website_inbox.manage"] },
    ],
  },
  {
    id: "people",
    label: "People & verification",
    items: [
      { href: "/admin/users", label: "User Directory (360°)", icon: "group", perm: ["users.read"] },
      { href: "/admin/approvals", label: "Verification & KYC", icon: "how_to_reg", perm: ["roles.review", "verification.review"] },
      { href: "/admin/access", label: "Staff & Field Agents", icon: "badge", perm: ["users.read"] },
    ],
  },
  {
    id: "money",
    label: "Marketplace & finance",
    items: [
      { href: "/admin/finance", label: "Platform Finance", icon: "account_balance_wallet", perm: ["ledger.read", "payments.read", "payouts.approve"] },
      { href: "/admin/marketplace", label: "Equipment & Listings", icon: "storefront", perm: ["listings.moderate", "settings.manage"] },
      { href: "/admin/analytics", label: "Operations Analytics", icon: "analytics" },
      { href: "/admin/geo", label: "Geographic Map", icon: "map" },
    ],
  },
  {
    id: "config",
    label: "Configuration",
    items: [
      { href: "/admin/content", label: "Content & Knowledge", icon: "library_books", perm: ["site_content.manage"] },
      { href: "/admin/agronomy", label: "Agronomy Standards", icon: "eco" },
      { href: "/admin/features", label: "Feature switches", icon: "tune", perm: ["settings.manage"] },
      { href: "/admin/integrations", label: "Integrations & APIs", icon: "api", perm: ["integrations.manage"] },
    ],
  },
  {
    id: "trust",
    label: "Trust & system",
    items: [
      { href: "/admin/audit", label: "Security, Audit & Compliance", icon: "security", perm: ["audit.read"] },
      { href: "/admin/privacy", label: "Privacy Requests", icon: "policy", perm: ["privacy.manage"] },
      { href: "/admin/inbox", label: "Website Inbox", icon: "inbox", perm: ["website_inbox.manage"] },
    ],
  },
];
