import Link from "next/link";
import { signOut } from "@/actions/admin-auth";
import { LogoMark } from "@/components/site/logo";
import { Button, Card, Container } from "@/components/ui";
import { can, requireStaff } from "@/lib/admin/staff";
import { site } from "@/config/site";

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

  const links = [
    { href: "/admin", label: "Overview", show: true },
    { href: "/admin/approvals", label: "Approvals", show: can(staff, "roles.review") || can(staff, "verification.review") },
    { href: "/admin/users", label: "Users", show: can(staff, "users.read") },
    { href: "/admin/inbox", label: "Inbox", show: can(staff, "website_inbox.manage") },
    { href: "/admin/privacy", label: "Privacy requests", show: can(staff, "privacy.manage") },
    { href: "/admin/content", label: "Website", show: can(staff, "site_content.manage") },
    { href: "/admin/audit", label: "Audit", show: can(staff, "audit.read") },
    { href: "/admin/integrations", label: "Integrations", show: can(staff, "integrations.manage") },
  ].filter((l) => l.show);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-white">
        <Container className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-2">
          <Link href="/admin" className="inline-flex items-center gap-2 font-extrabold text-leaf-800">
            <LogoMark className="size-8" />
            <span>{site.name} admin</span>
          </Link>
          <nav aria-label="Admin">
            <ul className="flex flex-wrap items-center gap-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="rounded-md px-3 py-2 font-semibold hover:bg-leaf-50 hover:text-leaf-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <form action={signOut}>
            <Button type="submit" variant="ghost">Sign out</Button>
          </form>
        </Container>
      </header>
      <main id="main" className="flex-1 py-8">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
