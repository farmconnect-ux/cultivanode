import { signOut } from "@/actions/admin-auth";
import { AppShell } from "@/components/ds/app-shell";
import { BrandLockup } from "@/components/ds/brand";
import { adminNav, type NavGroup } from "@/components/ds/nav-config";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { can, requireStaff } from "@/lib/admin/staff";

export default async function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireStaff();

  if (!staff) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
        <BrandLockup tagline="Operations console" />
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h1 className="font-headline-md text-headline-md text-primary">No staff access</h1>
            <p className="text-body-md text-on-surface-variant">
              You are signed in, but this account has no admin role. Ask a super admin to add you.
            </p>
            <form action={signOut}>
              <Button type="submit" variant="secondary">Sign out</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  const groups: NavGroup[] = adminNav
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.perm || it.perm.some((p) => can(staff, p))),
    }))
    .filter((g) => g.items.length > 0);

  const name = staff.name ?? staff.phone ?? "Staff";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

  return (
    <AppShell
      basePath=""
      groups={groups}
      user={{ name, subtitle: "CultivaNode operations", initials: initials || "OP" }}
      consoleBadge="Ops"
      brandTagline="Operations console"
      signOutAction={signOut}
    >
      {children}
    </AppShell>
  );
}
