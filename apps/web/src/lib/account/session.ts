import { redirect } from "next/navigation";
import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export type AccountProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  state: string | null;
  lga: string | null;
  preferred_language: "en" | "yo" | "pcm";
  verification_tier: number;
  account_type: "individual" | "business";
  onboarded_at: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
};

export type Account = {
  userId: string;
  profile: AccountProfile;
  roles: { role: string; provider_type: string | null }[];
  isFarmer: boolean;
  isAgent: boolean;
  /** Machinery owner (equipment listings). */
  isOwner: boolean;
  /** Approved service types (service listings). */
  serviceTypes: string[];
  orgIds: string[];
};

/** The signed-in person with profile and roles, once per request (layout and page share it). */
export const loadAccount = cache(async (): Promise<Account | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const uid = data.user.id;
  const [{ data: profile }, { data: roles }, { data: orgs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, email, state, lga, preferred_language, verification_tier, account_type, onboarded_at, suspended_at, suspended_reason")
      .eq("id", uid)
      .maybeSingle(),
    supabase.from("user_roles").select("role, provider_type").eq("profile_id", uid),
    supabase.from("org_members").select("organization_id").eq("profile_id", uid),
  ]);
  if (!profile) return null;
  const held = roles ?? [];
  return {
    userId: uid,
    profile: profile as AccountProfile,
    roles: held,
    isFarmer: held.some((r) => r.role === "crop_farmer" || r.role === "animal_farmer"),
    isAgent: held.some((r) => r.role === "field_agent"),
    isOwner: held.some((r) => r.role === "machinery_owner"),
    serviceTypes: held.filter((r) => r.role === "service_provider" && r.provider_type).map((r) => r.provider_type as string),
    orgIds: (orgs ?? []).map((o) => o.organization_id),
  };
});

/** For account pages: signed in and set up, or a redirect to sign-in / onboarding. */
export async function requireAccount(lang: Locale): Promise<Account> {
  const account = await loadAccount();
  if (!account) redirect(`/${lang}/sign-in`);
  if (!account.profile.onboarded_at) redirect(`/${lang}/onboarding`);
  return account;
}
