import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { Alert } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { getAvailableWorkspaces } from "@/lib/account/workspace";
import { createClient } from "@/lib/supabase/server";
import { fill } from "@/lib/text";

export const metadata: Metadata = { robots: { index: false } };

export default async function AccountLayout({ children, params }: LayoutProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const n = t.acct.nav;
  const supabase = await createClient();
  const { count: unread } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  const availableWorkspaces = getAvailableWorkspaces(account);

  const suspendedAlert = account.profile.suspended_at ? (
    <Alert tone="danger">{fill(t.acct.suspended, { reason: account.profile.suspended_reason ?? "" })}</Alert>
  ) : null;

  return (
    <AccountShell
      lang={lang}
      signOutLabel={n.signOut}
      menuLabel={n.menu}
      availableWorkspaces={availableWorkspaces}
      unreadCount={unread ?? 0}
      suspendedAlert={suspendedAlert}
    >
      {children}
    </AccountShell>
  );
}
