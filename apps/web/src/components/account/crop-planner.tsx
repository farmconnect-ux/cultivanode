"use client";

import { useActionState, useMemo, useState } from "react";
import { createPlannedCropCycle } from "@/actions/farm-ops";
import { Icon } from "@/components/ds/icon";
import { label } from "@/lib/format";
import { OP_TYPES, addDays, suggestCropPlan, type CropChoice, type OpType } from "@/lib/crop-plan";
import { cn } from "@/lib/utils";

type Farm = { id: string; name: string };
type Plot = { id: string; farm_id: string; name: string; area_ha: number | null };
type Row = { key: string; keep: boolean; name: string; stage: string; operation_type: OpType; scheduled_date: string; required_machinery: string | null; notes: string | null; custom?: boolean };

const input =
  "h-10 w-full rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:bg-surface-container-lowest";
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });

function rowsFor(cropId: string, planting: string, variety: string): Row[] {
  return suggestCropPlan(cropId, planting, variety).operations.map((o) => ({
    key: o.key,
    keep: true,
    name: o.name,
    stage: o.stage,
    operation_type: o.operationType,
    scheduled_date: o.startsOn,
    required_machinery: o.machinery,
    notes: o.description,
  }));
}

/** Plan a crop cycle: pick the crop and planting day, then accept, edit or drop the suggested stages and operations. */
export function CropPlanner({ lang, farms, plots, crops, today }: { lang: string; farms: Farm[]; plots: Plot[]; crops: CropChoice[]; today: string }) {
  const [state, submit, saving] = useActionState(createPlannedCropCycle, null);
  const [farmId, setFarmId] = useState(farms[0]?.id ?? "");
  const [plotId, setPlotId] = useState("");
  const [area, setArea] = useState("");
  const [cropId, setCropId] = useState(crops[0]?.id ?? "maize");
  const crop = crops.find((c) => c.id === cropId);
  const [variety, setVariety] = useState(crop?.varieties[0]?.id ?? "");
  const [planting, setPlanting] = useState(addDays(today, 14));
  const plan = useMemo(() => suggestCropPlan(cropId, planting, variety), [cropId, planting, variety]);
  const [harvest, setHarvest] = useState<string | null>(null); // null = follow the suggestion
  const [rows, setRows] = useState<Row[]>(() => rowsFor(cropId, planting, variety));
  const [custom, setCustom] = useState({ name: "", date: "", type: "other" as OpType });

  const farmPlots = plots.filter((p) => p.farm_id === farmId);
  const harvestOn = harvest ?? plan.harvestOn;
  const ha = Number(area) || 0;
  const yieldKg = plan.targetYieldKgPerHa && ha ? Math.round(plan.targetYieldKgPerHa * ha) : "";
  const kept = rows.filter((r) => r.keep);

  // Re-suggest when the crop, variety or planting day changes (custom rows are kept).
  const resuggest = (c: string, v: string, p: string) => {
    setHarvest(null);
    setRows((cur) => [...rowsFor(c, p, v), ...cur.filter((r) => r.custom)]);
  };
  const update = (key: string, patch: Partial<Row>) => setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <form action={submit} className="flex flex-col gap-6">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="crop_id" value={cropId} />
      <input type="hidden" name="operations" value={JSON.stringify(kept.map((r) => ({ name: r.name, stage: r.stage, operation_type: r.operation_type, scheduled_date: r.scheduled_date, required_machinery: r.required_machinery, notes: r.notes })))} />
      <input type="hidden" name="current_stage" value={plan.stages[0]?.name ?? ""} />

      <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
          <Icon name="terrain" className="text-secondary" /> Where
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Farm *</span>
            <select name="farm_id" required className={input} value={farmId} onChange={(e) => { setFarmId(e.target.value); setPlotId(""); }}>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Plot</span>
            <select
              name="plot_id"
              className={input}
              value={plotId}
              onChange={(e) => {
                setPlotId(e.target.value);
                const p = plots.find((x) => x.id === e.target.value);
                if (p?.area_ha && !area) setArea(String(p.area_ha));
              }}
            >
              <option value="">Whole farm / not mapped</option>
              {farmPlots.map((p) => <option key={p.id} value={p.id}>{p.name}{p.area_ha ? ` · ${p.area_ha} ha` : ""}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Area to plant (ha) *</span>
            <input name="target_area_ha" type="number" min="0.01" step="any" required className={input} value={area} onChange={(e) => setArea(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Season</span>
            <input name="season" className={input} placeholder={`${today.slice(0, 4)} early rainy`} />
          </label>
        </div>
      </section>

      <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
          <Icon name="eco" className="text-secondary" /> Crop & timing
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Crop *</span>
            <select
              className={input}
              value={cropId}
              onChange={(e) => {
                const c = crops.find((x) => x.id === e.target.value);
                const v = c?.varieties[0]?.id ?? "";
                setCropId(e.target.value);
                setVariety(v);
                resuggest(e.target.value, v, planting);
              }}
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.localName && !c.name.includes("(") ? ` (${c.localName})` : ""}{c.hasTemplate ? "" : " · general plan"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Variety</span>
            <select name="variety_id" className={input} value={variety} onChange={(e) => { setVariety(e.target.value); resuggest(cropId, e.target.value, planting); }}>
              {(crop?.varieties ?? []).map((v) => <option key={v.id} value={v.id}>{v.name} · {v.days} days</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Planting date *</span>
            <input
              name="planting_date"
              type="date"
              required
              className={input}
              value={planting}
              onChange={(e) => { if (e.target.value) { setPlanting(e.target.value); resuggest(cropId, variety, e.target.value); } }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Expected harvest *</span>
            <input name="expected_harvest_date" type="date" required min={planting} className={input} value={harvestOn} onChange={(e) => setHarvest(e.target.value)} />
            {harvest === null && <span className="text-body-sm text-on-surface-variant">Suggested from the variety&apos;s days to maturity.</span>}
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Target yield (kg)</span>
            <input name="target_yield_kg" type="number" min="0" step="any" className={input} key={`${yieldKg}`} defaultValue={yieldKg} />
            {plan.targetYieldKgPerHa && <span className="text-body-sm text-on-surface-variant">Variety average: {plan.targetYieldKgPerHa.toLocaleString("en-NG")} kg/ha</span>}
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-md text-label-md text-on-surface-variant">Budget (₦)</span>
            <input name="estimated_budget" type="number" min="0" step="any" className={input} />
          </label>
        </div>
      </section>

      {plan.stages.length > 0 && (
        <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
            <Icon name="timeline" className="text-secondary" /> Suggested growth stages
          </h2>
          <p className="mb-4 text-body-sm text-on-surface-variant">Dated from your planting day. The crop page tracks which stage you&apos;re in.</p>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {plan.stages.map((s, i) => (
              <li key={s.id} className="rounded-lg bg-surface-container-low p-3">
                <p className="font-label-sm text-label-sm text-secondary">Stage {i + 1} · {fmt(s.startsOn)} – {fmt(s.endsOn)}</p>
                <p className="font-label-lg text-label-lg text-on-surface">{s.name}</p>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">{s.description}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
            <Icon name="tips_and_updates" className="text-secondary" /> Suggested operations
          </h2>
          <span className="rounded-full bg-secondary-container/50 px-2.5 py-0.5 font-label-sm text-label-sm text-on-secondary-container">
            {kept.length} of {rows.length} kept
          </span>
        </div>
        <p className="mb-4 text-body-sm text-on-surface-variant">
          {plan.specific ? "From the good agricultural practice calendar for this crop." : "A general field-crop calendar; adjust it to your practice."} Untick what you won&apos;t do and change any name or date. Kept operations go straight onto Field Operations &amp; Calendar.
        </p>
        <ul className="flex flex-col divide-y divide-outline-variant/30">
          {rows.map((r) => (
            <li key={r.key} className={cn("grid gap-2 py-3 sm:grid-cols-[auto_1fr_150px] sm:items-start", !r.keep && "opacity-55")}>
              <input type="checkbox" checked={r.keep} onChange={(e) => update(r.key, { keep: e.target.checked })} className="mt-2.5 size-4 accent-[#14532d]" aria-label={`Keep ${r.name}`} />
              <div className="min-w-0">
                <input value={r.name} onChange={(e) => update(r.key, { name: e.target.value })} className={cn(input, "h-9 font-medium")} aria-label="Operation name" />
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {r.stage} · {label(r.operation_type)}{r.required_machinery ? ` · ${r.required_machinery}` : ""}
                </p>
                {r.notes && <p className="text-body-sm text-on-surface-variant">{r.notes}</p>}
              </div>
              <input type="date" value={r.scheduled_date} onChange={(e) => update(r.key, { scheduled_date: e.target.value })} className={cn(input, "h-9")} aria-label="Date" />
            </li>
          ))}
        </ul>
        <div className="mt-3 grid gap-2 rounded-lg bg-surface-container-low p-3 sm:grid-cols-[1fr_170px_150px_auto] sm:items-end">
          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Add your own operation</span>
            <input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} className={cn(input, "h-9")} placeholder="e.g. Bird scaring" />
          </label>
          <select value={custom.type} onChange={(e) => setCustom({ ...custom, type: e.target.value as OpType })} className={cn(input, "h-9")} aria-label="Type">
            {OP_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
          </select>
          <input type="date" value={custom.date} onChange={(e) => setCustom({ ...custom, date: e.target.value })} className={cn(input, "h-9")} aria-label="Date" />
          <button
            type="button"
            disabled={custom.name.trim().length < 2 || !custom.date}
            onClick={() => {
              setRows((cur) => [...cur, { key: `custom-${cur.length}-${custom.date}`, keep: true, custom: true, name: custom.name.trim(), stage: "General", operation_type: custom.type, scheduled_date: custom.date, required_machinery: null, notes: null }]);
              setCustom({ name: "", date: "", type: "other" });
            }}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-surface-container-high px-3 font-label-md text-label-md text-on-surface hover:bg-surface-container-highest disabled:opacity-50"
          >
            <Icon name="add" className="text-base" /> Add
          </button>
        </div>
      </section>

      {state && !state.ok && <p role="alert" className="rounded-lg bg-critical-soft px-3 py-2 text-body-sm text-[#b91c1c]">{state.message}</p>}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="text-body-sm text-on-surface-variant">{kept.length} operations will be scheduled.</p>
        <button
          type="submit"
          disabled={saving || !farmId}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-5 py-3 font-label-lg text-label-lg text-on-primary shadow-sm hover:bg-primary disabled:opacity-60"
        >
          <Icon name={saving ? "progress_activity" : "check_circle"} className={cn("text-lg", saving && "animate-spin")} /> {saving ? "Saving plan…" : "Start crop cycle"}
        </button>
      </div>
    </form>
  );
}
