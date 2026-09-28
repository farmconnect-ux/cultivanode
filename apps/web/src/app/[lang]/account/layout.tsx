import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { Alert, Container } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { fill } from "@/lib/text";

export const metadata: Metadata = { robots: { index: false } };

export default async function AccountLayout({ children, params }: LayoutProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const n = t.acct.nav;
  const base = `/${lang}/account`;
  const items = [
    { href: base, label: n.overview, show: true },
    { href: `${base}/profile`, label: n.profile, show: true },
    { href: `${base}/roles`, label: n.roles, show: true },
    { href: `${base}/verification`, label: n.verification, show: true },
    { href: `${base}/farms`, label: n.farms, show: true },
    { href: `${base}/find`, label: n.find, show: account.isFarmer },
    { href: `${base}/listings`, label: n.listings, show: account.isOwner || account.serviceTypes.length > 0 },
    { href: `${base}/business`, label: n.business, show: account.profile.account_type === "business" || account.orgIds.length > 0 },
    { href: `${base}/agent`, label: n.agent, show: account.isAgent },
    { href: `${base}/privacy`, label: n.privacy, show: true },
  ].filter((i) => i.show);

  return (
    <Container className="grid gap-6 py-8 sm:py-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
      <AccountNav lang={lang} items={items} signOutLabel={n.signOut} menuLabel={n.menu} />
      <div className="flex min-w-0 flex-col gap-6">
        {account.profile.suspended_at && (
          <Alert tone="danger">{fill(t.acct.suspended, { reason: account.profile.suspended_reason ?? "" })}</Alert>
        )}
        {children}
      </div>
    </Container>
  );
}
