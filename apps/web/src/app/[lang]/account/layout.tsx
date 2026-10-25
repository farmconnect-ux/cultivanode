import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { getFlags } from "@/lib/flags";
import { Alert } from "@/components/ui";
import { site } from "@/config/site";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireAccount } from "@/lib/account/session";
import { getAvailableWorkspaces } from "@/lib/account/workspace";
import { createClient } from "@/lib/supabase/server";
import { fill } from "@/lib/text";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  crop_farmer: "Crop farmer",
  animal_farmer: "Livestock & fish farmer",
  machinery_owner: "Machinery owner",
  service_provider: "Service provider",
  field_agent: "Field agent",
  input_supplier: "Input supplier",
  buyer_offtaker: "Buyer / off-taker",
  logistics_provider: "Logistics provider",
  customer: "Customer",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "C") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}

export default async function AccountLayout({ children, params }: LayoutProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang, { customer: true });
  const t = await getDictionary(lang);
  const n = t.acct.nav;
  const supabase = await createClient();

  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const [{ count: unread }, { data: farms }] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    supabase.from("farms").select("id, name, state, lga, area_ha").or(scope.join(",")).order("created_at"),
  ]);

  const availableWorkspaces = getAvailableWorkspaces(account);
  const name = account.profile.full_name?.trim() || "CultivaNode member";
  const role = account.roles.map((r) => ROLE_LABEL[r.role]).find(Boolean) ?? "Member";
  const totalHa = (farms ?? []).reduce((s, f) => s + (Number(f.area_ha) || 0), 0);
  const first = farms?.[0];

  const context = first
    ? {
        eyebrow: farms!.length > 1 ? `${farms!.length} farms` : "Current farm",
        title: first.name,
        meta: [totalHa ? `${totalHa.toLocaleString("en-NG", { maximumFractionDigits: 1 })} ha` : null, [first.lga, first.state].filter(Boolean).join(", ")]
          .filter(Boolean)
          .join(" · "),
        status: "Active",
        href: `/${lang}/account/farms`,
      }
    : {
        eyebrow: "Get started",
        title: "Register your first farm",
        meta: "Map plots, then plan crops and book machinery",
        href: `/${lang}/account/farms/new`,
      };

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
      user={{ name, subtitle: [role, account.profile.state].filter(Boolean).join(" · "), initials: initials(name) }}
      context={context}
      supportHref={site.contact.whatsappUrl ?? `/${lang}/contact`}
      flags={await getFlags()}
    >
      {children}
    </AccountShell>
  );
}
