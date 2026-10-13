// People the signed-in account can pick as a counterparty (grower, lender, recipient). Profiles are
// private, so the pickers draw on public marketplace seller cards plus people already in a thread
// or contract with this account.
import { createClient } from "@/lib/supabase/server";

export type Party = { value: string; label: string };

export async function sellerParties(types?: string[]): Promise<Party[]> {
  const supabase = await createClient();
  let q = supabase.from("marketplace_sellers").select("profile_id, business_name, seller_type").eq("is_suspended", false).order("business_name");
  if (types?.length) q = q.in("seller_type", types);
  const { data } = await q;
  const seen = new Set<string>();
  return (data ?? [])
    .filter((s) => (seen.has(s.profile_id) ? false : (seen.add(s.profile_id), true)))
    .map((s) => ({ value: s.profile_id, label: `${s.business_name} · ${s.seller_type.replace(/_/g, " ")}` }));
}
