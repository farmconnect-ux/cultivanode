import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveStrip } from "@/components/ds/live-strip";
import { WorkspaceSettings } from "@/components/screens/workspace-settings";
import { hasLocale } from "@/i18n/config";
import { requireAccount } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings & workspace roles" };

export default async function Page({ params }: PageProps<"/[lang]/account/settings">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const account = await requireAccount(lang);
  const supabase = await createClient();

  // Fetch organization members if user belongs to any orgs
  let orgMembers: any[] = [];
  if (account.orgIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, state, lga, created_at, verification_tier")
      .in("id", account.orgIds);
    orgMembers = (profiles ?? []) as any[];
  }

  // Fetch user roles
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role, provider_type, granted_at")
    .eq("profile_id", account.userId);

  return (
    <>
      <LiveStrip tone={orgMembers.length > 0 ? "live" : "preview"}>
        {orgMembers.length > 0
          ? `Showing ${orgMembers.length} organization member${orgMembers.length === 1 ? "" : "s"} and ${userRoles?.length ?? 0} role${userRoles?.length === 1 ? "" : "s"}.`
          : "Workspace settings show reference design data until you create or join an organization."}
      </LiveStrip>
      <WorkspaceSettings
        lang={lang}
        account={account}
        orgMembers={orgMembers}
        userRoles={userRoles ?? []}
      />
    </>
  );
}
