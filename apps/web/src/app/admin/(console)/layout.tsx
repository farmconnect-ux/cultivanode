import Link from "next/link";
import { signOut } from "@/actions/admin-auth";
import { Logo } from "@/components/site/logo";
import { Badge, Button, Card, Container } from "@/components/ui";
import { can, requireStaff } from "@/lib/admin/staff";

export default async function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireStaff();

  if (!staff) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
        <Card className="flex flex-col gap-4">
          <h1 className="text-2xl font-extrabold text-leaf-800">No staff access</h1>
          <p>You are signed in, but this account has no admin role. Ask a super admin to add you.</p>
          <form action={signOut}>
            <Button type="submit" variant="secondary">Sign out</Button>
          </form>
        </Card>
      </main>
    );
  }

  const navSections = [
    {
      title: "OPERATIONS",
      icon: "⚙️",
      links: [
        { href: "/admin", label: "Overview", icon: "📊", show: true },
        { href: "/admin/jobs", label: "Jobs Console", icon: "📋", show: true },
        { href: "/admin/disputes", label: "Disputes Workstation", icon: "⚖️", show: can(staff, "disputes.decide") || can(staff, "bookings.read") },
        { href: "/admin/cancellations", label: "Cancellations", icon: "❌", show: true },
      ],
    },
    {
      title: "PEOPLE & VERIFICATION",
      icon: "👥",
      links: [
        { href: "/admin/users", label: "User Directory (360°)", icon: "👤", show: can(staff, "users.read") },
        { href: "/admin/approvals", label: "Verification Queue", icon: "🛡️", show: can(staff, "roles.review") || can(staff, "verification.review") },
        { href: "/admin/access", label: "Staff & Field Agents", icon: "🧑‍💼", show: can(staff, "users.read") },
      ],
    },
    {
      title: "MARKETPLACE",
      icon: "🛒",
      links: [
        { href: "/admin/marketplace", label: "Equipment & Listings", icon: "🚜", show: can(staff, "listings.moderate") || can(staff, "settings.manage") },
      ],
    },
    {
      title: "ANALYTICS & GEOGRAPHY",
      icon: "📈",
      links: [
        { href: "/admin/analytics", label: "Operations Analytics", icon: "📊", show: true },
        { href: "/admin/geo", label: "Geographic Map", icon: "🗺️", show: true },
      ],
    },
    {
      title: "CONFIGURATION",
      icon: "🛠️",
      links: [
        { href: "/admin/agronomy", label: "Agronomy Standards", icon: "🌱", show: true },
        { href: "/admin/integrations", label: "Integrations & APIs", icon: "🔌", show: can(staff, "integrations.manage") },
        { href: "/admin/content", label: "Website Content", icon: "📝", show: can(staff, "site_content.manage") },
      ],
    },
    {
      title: "TRUST & SYSTEM",
      icon: "🔒",
      links: [
        { href: "/admin/audit", label: "Tamper-Evident Audit", icon: "📜", show: can(staff, "audit.read") },
        { href: "/admin/health", label: "System Health", icon: "💓", show: true },
        { href: "/admin/privacy", label: "Privacy Requests", icon: "🛡️", show: can(staff, "privacy.manage") },
        { href: "/admin/inbox", label: "Website Inbox", icon: "📬", show: can(staff, "website_inbox.manage") },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-leaf-900 bg-leaf-900 text-white shadow-sm">
        <Container className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-node-300">
              <Logo tone="dark" />
              <span className="rounded-full bg-node-300 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-leaf-950">
                Operations
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs font-medium text-white/80">
              Signed in as <strong className="text-white">{staff.name ?? staff.phone ?? "Staff"}</strong>
            </span>
            <form action={signOut}>
              <Button type="submit" variant="onDark" size="sm">Sign out</Button>
            </form>
          </div>
        </Container>
      </header>

      {/* Main Console Layout: Sidebar + Main Workspace */}
      <div className="flex flex-1">
        <aside className="w-68 shrink-0 border-r border-line bg-earth-50/40 p-4 hidden md:block">
          <nav aria-label="Admin Navigation" className="space-y-4">
            {navSections.map((sec) => {
              const activeLinks = sec.links.filter((l) => l.show);
              if (activeLinks.length === 0) return null;
              return (
                <div key={sec.title} className="rounded-xl border border-line/60 bg-white/70 p-2 space-y-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold tracking-wider text-muted uppercase">
                    <span>{sec.icon}</span>
                    <span>{sec.title}</span>
                  </div>
                  <ul className="space-y-0.5 border-l-2 border-line/50 ml-2 pl-2">
                    {activeLinks.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-ink/80 hover:bg-leaf-100/60 hover:text-leaf-900 transition-colors"
                        >
                          <span className="text-xs">{l.icon}</span>
                          <span>{l.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Workspace Main Area */}
        <main id="main" className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
