import { notFound } from "next/navigation";
import { AgentDashboard } from "@/components/account/agent-dashboard";
import { FarmerDashboard } from "@/components/account/farmer-dashboard";
import { ProviderDashboard } from "@/components/account/provider-dashboard";
import { Alert } from "@/components/ui";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import type { BookingSummary } from "@/lib/account/bookings";
import { requireAccount } from "@/lib/account/session";
import { resolveWorkspace } from "@/lib/account/workspace";
import { createClient } from "@/lib/supabase/server";

export default async function AccountHome({ params, searchParams }: PageProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { welcome, ws } = await searchParams;
  const account = await requireAccount(lang);
  const t = await getDictionary(lang);
  const a = t.acct;
  const supabase = await createClient();

  const activeWorkspace = resolveWorkspace(account, typeof ws === "string" ? ws : null);

  // Parallel fetch based on active operational workspace
  if (activeWorkspace === "provider") {
    const [{ data: bookingsRes }, { count: listingsCount }] = await Promise.all([
      supabase.rpc("my_bookings", { p_limit: 50 }),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", account.userId),
    ]);
    const all = (bookingsRes ?? []) as unknown as BookingSummary[];
    const providerBookings = all.filter((b) => b.my_side === "provider");

    return (
      <>
        {welcome && <Alert>{a.welcomeNew}</Alert>}
        <ProviderDashboard
          lang={lang}
          account={account}
          t={t}
          bookings={providerBookings}
          listingsCount={listingsCount ?? 0}
        />
      </>
    );
  }

  if (activeWorkspace === "agent") {
    const { data: farmers } = await supabase
      .from("profiles")
      .select("id, full_name, phone, state, lga, created_at")
      .eq("onboarded_by", account.userId)
      .order("created_at", { ascending: false })
      .limit(50);

    return (
      <>
        {welcome && <Alert>{a.welcomeNew}</Alert>}
        <AgentDashboard
          lang={lang}
          account={account}
          t={t}
          farmers={farmers ?? []}
        />
      </>
    );
  }

  // Default: Farmer Workspace
  const scope = [
    `owner_id.eq.${account.userId}`,
    ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : []),
  ];
  const [{ data: farms }, { data: bookingsRes }] = await Promise.all([
    supabase.from("farms").select("id, name, state, lga, area_ha").or(scope.join(",")).order("created_at"),
    supabase.rpc("my_bookings", { p_limit: 50 }),
  ]);
  const all = (bookingsRes ?? []) as unknown as BookingSummary[];
  const farmerBookings = all.filter((b) => b.my_side === "farmer");

  return (
    <>
      {welcome && <Alert>{a.welcomeNew}</Alert>}
      <FarmerDashboard
        lang={lang}
        account={account}
        t={t}
        farms={farms ?? []}
        bookings={farmerBookings}
      />
    </>
  );
}
