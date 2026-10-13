"use server";

// The overview's field-operations roster. Operations are the crop-cycle operations planned on the
// account's farms (crop_cycle_operations), shaped for the executive dashboard. Spray and fertiliser
// jobs on a cycle with an open weather alert show as "weather hold" until someone overrides it.
import { revalidatePath } from "next/cache";
import type { OperationItem } from "@/components/screens/executive-dashboard";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const WEATHER_SENSITIVE = new Set(["pest_control", "disease_control", "fertiliser", "weed_control"]);
const ICON: Record<string, string> = {
  land_prep: "agriculture",
  planting: "grass",
  fertiliser: "science",
  weed_control: "yard",
  pest_control: "pest_control",
  disease_control: "coronavirus",
  irrigation: "water_drop",
  scouting: "search",
  harvest: "grain",
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export async function getFarmOperations(farmIds: string[]): Promise<OperationItem[]> {
  if (!farmIds.length) return [];
  const supabase = await createClient();
  const { data: cycles } = await supabase
    .from("crop_cycles")
    .select("id, farm_id, plot_id, crop_id, variety_id, target_area_ha")
    .in("farm_id", farmIds);
  const cyc = cycles ?? [];
  if (!cyc.length) return [];
  const [{ data: ops, error }, { data: plots }, { data: farms }, { data: alerts }] = await Promise.all([
    supabase
      .from("crop_cycle_operations")
      .select("id, crop_cycle_id, operation_type, name, stage, status, scheduled_date, completed_date, required_machinery, notes, created_at")
      .in("crop_cycle_id", cyc.map((c) => c.id))
      .order("scheduled_date", { ascending: true }),
    supabase.from("plots").select("id, name").in("farm_id", farmIds),
    supabase.from("farms").select("id, name, lga").in("id", farmIds),
    supabase.from("crop_alerts").select("crop_cycle_id, farm_id").in("farm_id", farmIds).eq("category", "weather").eq("is_dismissed", false),
  ]);
  if (error) {
    logger.warn("farm_operations_load_failed", { code: error.code });
    return [];
  }
  const cycle = new Map(cyc.map((c) => [c.id, c]));
  const plotName = new Map((plots ?? []).map((p) => [p.id, p.name]));
  const farm = new Map((farms ?? []).map((f) => [f.id, f]));
  const held = new Set((alerts ?? []).map((a) => a.crop_cycle_id).filter(Boolean));
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);

  const order = { in_progress: 0, pending: 1, completed: 2, skipped: 3, cancelled: 3 } as Record<string, number>;
  const rows = (ops ?? [])
    .slice()
    .sort((a, b) => (order[a.status] ?? 1) - (order[b.status] ?? 1) || (a.status === "completed" ? b.scheduled_date.localeCompare(a.scheduled_date) : a.scheduled_date.localeCompare(b.scheduled_date)))
    .slice(0, 14);
  return rows.map((o) => {
    const c = cycle.get(o.crop_cycle_id)!;
    const f = farm.get(c.farm_id);
    const hold = o.status === "completed" || (o.notes ?? "").startsWith("[override]") ? false : held.has(o.crop_cycle_id) && WEATHER_SENSITIVE.has(o.operation_type);
    const status: OperationItem["status"] =
      o.status === "completed"
        ? "completed"
        : o.status === "cancelled" || o.status === "skipped"
          ? "cancelled"
          : o.status === "in_progress"
            ? "in_progress"
            : hold
              ? "weather_hold"
              : o.scheduled_date <= soon
                ? "ready_to_execute"
                : "planned";
    const due = o.scheduled_date < today && status !== "completed" ? "Overdue" : o.scheduled_date === today ? "Today" : null;
    return {
      id: o.id,
      farm_id: c.farm_id,
      plot_id: c.plot_id,
      crop_cycle_id: o.crop_cycle_id,
      name: o.name,
      subtext: o.stage,
      crop_area: `${cap(c.crop_id)}${c.variety_id ? ` ${c.variety_id}` : ""} · ${Number(c.target_area_ha)} ha${c.plot_id && plotName.get(c.plot_id) ? ` · ${plotName.get(c.plot_id)}` : ""}`,
      timeline: new Date(`${o.scheduled_date}T00:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" }),
      timing_note: hold ? "Weather alert on this field" : due,
      resource: o.required_machinery ?? "Field crew",
      resource_icon: ICON[o.operation_type] ?? "agriculture",
      location: f ? `${f.name}${f.lga ? `, ${f.lga}` : ""}` : null,
      status,
      action_label: null,
      scheduled_at: o.scheduled_date,
      started_at: null,
      completed_at: o.completed_date,
      notes: o.notes,
      created_at: o.created_at,
      updated_at: o.created_at,
    } satisfies OperationItem;
  });
}

export async function logOperationCompletion(form: FormData): Promise<void> {
  const id = String(form.get("id") ?? "").trim();
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("crop_cycle_operations")
    .update({ status: "completed", completed_date: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  if (error) logger.warn("operation_complete_failed", { code: error.code });
  revalidatePath("/[lang]/account", "page");
}

export async function overrideWeatherHold(form: FormData): Promise<void> {
  const id = String(form.get("id") ?? "").trim();
  if (!id) return;
  const supabase = await createClient();
  const { data: op } = await supabase.from("crop_cycle_operations").select("notes").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("crop_cycle_operations")
    .update({ status: "in_progress", notes: `[override] ${op?.notes ?? "Weather hold overridden by farm manager."}`.slice(0, 1000) })
    .eq("id", id);
  if (error) logger.warn("operation_override_failed", { code: error.code });
  revalidatePath("/[lang]/account", "page");
}
