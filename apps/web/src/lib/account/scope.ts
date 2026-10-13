// What a signed-in workspace can see: its farms (owned or via an organisation) and their plots and
// crop cycles. Loaded once per request and shared by the live module pages.
import { cache } from "react";
import type { Account } from "@/lib/account/session";
import { createClient } from "@/lib/supabase/server";

export type FarmLite = { id: string; name: string; state: string | null; lga: string | null; area_ha: number | null };
export type PlotLite = { id: string; farm_id: string; name: string; plot_code: string | null; area_ha: number | null };
export type CycleLite = {
  id: string;
  farm_id: string;
  plot_id: string | null;
  crop_id: string;
  variety_id: string | null;
  status: string;
  season: string;
};

export const loadFarmScope = cache(async (account: Account) => {
  const supabase = await createClient();
  const scope = [`owner_id.eq.${account.userId}`, ...(account.orgIds.length ? [`organization_id.in.(${account.orgIds.join(",")})`] : [])];
  const { data: farms } = await supabase.from("farms").select("id, name, state, lga, area_ha").or(scope.join(",")).order("created_at");
  const list = (farms ?? []) as FarmLite[];
  const ids = list.map((f) => f.id);
  if (!ids.length) return { farms: list, farmIds: ids, plots: [] as PlotLite[], cycles: [] as CycleLite[] };
  const [{ data: plots }, { data: cycles }] = await Promise.all([
    supabase.from("plots").select("id, farm_id, name, plot_code, area_ha").in("farm_id", ids).order("name"),
    supabase.from("crop_cycles").select("id, farm_id, plot_id, crop_id, variety_id, status, season").in("farm_id", ids).order("planting_date", { ascending: false }),
  ]);
  return { farms: list, farmIds: ids, plots: (plots ?? []) as PlotLite[], cycles: (cycles ?? []) as CycleLite[] };
});

export type FarmScope = Awaited<ReturnType<typeof loadFarmScope>>;

/** Options for select fields. */
export const farmOptions = (s: FarmScope) => s.farms.map((f) => ({ value: f.id, label: f.name }));
export const plotOptions = (s: FarmScope) => {
  const farmName = new Map(s.farms.map((f) => [f.id, f.name]));
  return s.plots.map((p) => ({ value: p.id, label: `${p.name} · ${farmName.get(p.farm_id) ?? ""}` }));
};
export const cycleLabel = (c: CycleLite) => `${cap(c.crop_id)}${c.variety_id ? ` ${c.variety_id}` : ""} · ${c.season}`;
export const cycleOptions = (s: FarmScope, activeOnly = true) =>
  s.cycles.filter((c) => !activeOnly || !["completed", "abandoned"].includes(c.status)).map((c) => ({ value: c.id, label: cycleLabel(c) }));

export function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
