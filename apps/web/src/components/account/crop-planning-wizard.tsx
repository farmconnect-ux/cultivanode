"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NORMALIZED_CROP_CATALOGUE,
  getCropById,
  calculatePlantPopulation,
  formatNaira,
  type FarmZone,
  type AgronomySeason,
} from "@cultivanode/shared";
import { createCropPlanAction, type CropActionState } from "@/actions/crop-cycles";
import { Alert, Badge, Button, Card } from "@/components/ui";
import type { Locale } from "@/i18n/config";

interface PlotOption {
  id: string;
  name: string;
  area_ha: number | null;
  soil_texture?: string | null;
  irrigation_type?: string | null;
  farm_id: string;
  farm_name?: string;
}

export function CropPlanningWizard({
  lang,
  plots,
  farmZone = "derived_savanna",
}: {
  lang: Locale;
  plots: PlotOption[];
  farmZone?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  const [selectedPlotId, setSelectedPlotId] = useState<string>(plots[0]?.id ?? "");
  const [selectedCropId, setSelectedCropId] = useState<string>("maize");
  const [selectedVarietyId, setSelectedVarietyId] = useState<string>("");
  const [season, setSeason] = useState<AgronomySeason>("early_rainy");
  const [plantingDate, setPlantingDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]!;
  });
  const [targetYieldKg, setTargetYieldKg] = useState<string>("");
  const [estimatedBudgetNgn, setEstimatedBudgetNgn] = useState<string>("250000");

  const [state, formAction, isPending] = useActionState<CropActionState, FormData>(
    async (prev, form) => {
      const res = await createCropPlanAction(prev, form);
      if (res.ok && res.cycleId) {
        router.push(`/${lang}/account/crops/${res.cycleId}`);
      }
      return res;
    },
    {}
  );

  const selectedPlot = useMemo(
    () => plots.find((p) => p.id === selectedPlotId) ?? plots[0],
    [plots, selectedPlotId]
  );

  const selectedCrop = useMemo(
    () => getCropById(selectedCropId) ?? NORMALIZED_CROP_CATALOGUE[0]!,
    [selectedCropId]
  );

  const selectedVariety = useMemo(() => {
    return (
      selectedCrop.varieties.find((v) => v.id === selectedVarietyId) ??
      selectedCrop.varieties[0]!
    );
  }, [selectedCrop, selectedVarietyId]);

  const targetAreaHa = selectedPlot?.area_ha ?? 1.0;

  // Plant population calculation
  const population = useMemo(() => {
    if (selectedCrop.spacing) {
      return calculatePlantPopulation(
        targetAreaHa,
        selectedCrop.spacing.interRowCm,
        selectedCrop.spacing.intraRowCm
      );
    }
    return Math.round(targetAreaHa * 50000);
  }, [selectedCrop, targetAreaHa]);

  // Expected harvest date
  const expectedHarvestDate = useMemo(() => {
    const [y, m, d] = plantingDate.split("-").map(Number);
    if (!y || !m || !d) return "";
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + selectedVariety.daysToMaturity);
    return date.toISOString().split("T")[0]!;
  }, [plantingDate, selectedVariety]);

  // Default target yield
  const defaultTargetYield = useMemo(() => {
    const yieldPerHa = selectedVariety.typicalYieldTonsPerHa ?? selectedVariety.expectedYieldTonnesPerHa ?? 3;
    return Math.round(yieldPerHa * targetAreaHa * 1000);
  }, [selectedVariety, targetAreaHa]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Step Indicators */}
      <div className="flex items-center justify-between border-b pb-4 overflow-x-auto">
        {[
          { num: 1, label: "Field / Plot" },
          { num: 2, label: "Crop & Variety" },
          { num: 3, label: "Season & Dates" },
          { num: 4, label: "Population & Yield" },
          { num: 5, label: "Review & Commit" },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              step === s.num
                ? "bg-forest-600 text-white shadow-sm"
                : step > s.num
                ? "text-forest-700 bg-forest-50"
                : "text-neutral-400 bg-neutral-100"
            }`}
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-black/10 text-xs">
              {s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {state.error && (
        <Alert tone="danger">
          <strong>Planning Error:</strong> {state.error}
        </Alert>
      )}

      {/* STEP 1: Select Plot */}
      {step === 1 && (
        <Card className="p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Select Field or Plot</h2>
            <p className="text-sm text-neutral-600">
              Choose the physical land parcel for this crop production cycle.
            </p>
          </div>

          {plots.length === 0 ? (
            <Alert tone="warning">
              No plots found on your farms. Please register a plot in your farm dashboard first.
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plots.map((plot) => (
                <div
                  key={plot.id}
                  onClick={() => setSelectedPlotId(plot.id)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    selectedPlotId === plot.id
                      ? "border-forest-600 bg-forest-50/50"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900">{plot.name}</span>
                    <Badge className="bg-leaf-100 text-leaf-800">{plot.area_ha ?? "—"} ha</Badge>
                  </div>
                  <div className="text-xs text-neutral-500 mt-2 flex flex-col gap-1">
                    <span>Farm: {plot.farm_name ?? "My Farm"}</span>
                    <span>Soil: {plot.soil_texture ?? "Sandy loam"}</span>
                    <span>Irrigation: {plot.irrigation_type ?? "Rainfed"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              type="button"
              disabled={!selectedPlotId}
              onClick={() => setStep(2)}
            >
              Continue to Crop Selection →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: Select Crop & Variety */}
      {step === 2 && (
        <Card className="p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Choose Pilot Crop & Certified Variety</h2>
            <p className="text-sm text-neutral-600">
              Select an agronomic template optimized for the South-West agro-ecological zone.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">Crop</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {NORMALIZED_CROP_CATALOGUE.map((crop) => (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => {
                    setSelectedCropId(crop.id);
                    setSelectedVarietyId(crop.varieties[0]?.id ?? "");
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedCropId === crop.id
                      ? "border-forest-600 bg-forest-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className="font-bold text-sm text-neutral-900">{crop.name}</div>
                  <div className="text-xs text-neutral-500 capitalize">{crop.category}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">
              Certified Variety
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedCrop.varieties.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVarietyId(v.id)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    (selectedVarietyId || selectedCrop.varieties[0]?.id) === v.id
                      ? "border-forest-600 bg-forest-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900">{v.name}</span>
                    <Badge className="bg-neutral-100 text-neutral-700">{v.daysToMaturity} days maturity</Badge>
                  </div>
                  <p className="text-xs text-neutral-600 mt-2">{v.description}</p>
                  <div className="text-xs font-semibold text-forest-700 mt-2">
                    Yield Potential: {v.typicalYieldTonsPerHa ?? v.expectedYieldTonnesPerHa} tons/ha
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button type="button" onClick={() => setStep(3)}>
              Continue to Season & Timing →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: Season & Timing */}
      {step === 3 && (
        <Card className="p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Season & Planting Schedule</h2>
            <p className="text-sm text-neutral-600">
              Set your target planting date to anchor the operational calendar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">
                Production Season
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as AgronomySeason)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="early_rainy">Early Rainy Season (March - July)</option>
                <option value="late_rainy">Late Rainy Season (August - November)</option>
                <option value="dry_irrigation">Dry Season / Irrigation (December - February)</option>
                <option value="all_year">All Year / Continuous</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">
                Target Planting Date
              </label>
              <input
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="p-4 bg-forest-50/70 border border-forest-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-forest-800 font-semibold uppercase">Estimated Harvest Window</div>
              <div className="text-base font-bold text-forest-950 mt-0.5">
                {expectedHarvestDate} ({selectedVariety.daysToMaturity} days cycle)
              </div>
            </div>
            <Badge className="bg-leaf-100 text-leaf-800">Target: {selectedCrop.name}</Badge>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button type="button" onClick={() => setStep(4)}>
              Continue to Population & Yield →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: Population & Yield */}
      {step === 4 && (
        <Card className="p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Plant Population & Yield Targets</h2>
            <p className="text-sm text-neutral-600">
              Verify agronomic planting density and harvest projections.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-50 rounded-xl border">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Recommended Spacing</span>
              <div className="text-lg font-bold text-neutral-900 mt-1">
                {selectedCrop.spacing
                  ? `${selectedCrop.spacing.interRowCm} × ${selectedCrop.spacing.intraRowCm} cm`
                  : "Standard"}
              </div>
            </div>

            <div className="p-4 bg-neutral-50 rounded-xl border">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Plant Population</span>
              <div className="text-lg font-bold text-forest-700 mt-1">
                {population.toLocaleString()} stands
              </div>
              <span className="text-xs text-neutral-400">across {targetAreaHa} ha</span>
            </div>

            <div className="p-4 bg-neutral-50 rounded-xl border">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Seed Requirement</span>
              <div className="text-lg font-bold text-neutral-900 mt-1">
                {selectedCrop.seedRate
                  ? `${(selectedCrop.seedRate.amountPerHa * targetAreaHa).toFixed(1)} ${selectedCrop.seedRate.unit}`
                  : "Standard"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">
                Target Yield Projections (kg)
              </label>
              <input
                type="number"
                placeholder={String(defaultTargetYield)}
                value={targetYieldKg}
                onChange={(e) => setTargetYieldKg(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
              <span className="text-xs text-neutral-500 mt-1 block">
                Typical standard: {defaultTargetYield.toLocaleString()} kg
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">
                Estimated Production Budget (₦)
              </label>
              <input
                type="number"
                value={estimatedBudgetNgn}
                onChange={(e) => setEstimatedBudgetNgn(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
              <span className="text-xs text-neutral-500 mt-1 block">
                Includes land prep, certified seeds, fertilisers and protection
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setStep(3)}>
              ← Back
            </Button>
            <Button type="button" onClick={() => setStep(5)}>
              Preview Operations & Commit →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: Review & Commit */}
      {step === 5 && (
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="plot_id" value={selectedPlotId} />
          <input type="hidden" name="crop_id" value={selectedCropId} />
          <input type="hidden" name="variety_id" value={selectedVariety.id} />
          <input type="hidden" name="season" value={season} />
          <input type="hidden" name="planting_date" value={plantingDate} />
          <input type="hidden" name="target_area_ha" value={String(targetAreaHa)} />
          <input
            type="hidden"
            name="target_yield_kg"
            value={targetYieldKg || String(defaultTargetYield)}
          />
          <input type="hidden" name="estimated_budget_ngn" value={estimatedBudgetNgn} />

          <Card className="p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Review & Confirm Crop Cycle Plan</h2>
              <p className="text-sm text-neutral-600">
                Confirm your parameters to automatically generate scheduled field tasks, inputs, and tractor hiring checkpoints.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-neutral-50 rounded-xl border">
              <div>
                <span className="text-xs text-neutral-500 uppercase font-semibold">Plot</span>
                <div className="font-bold text-neutral-900">{selectedPlot?.name}</div>
                <div className="text-xs text-neutral-500">{targetAreaHa} ha</div>
              </div>
              <div>
                <span className="text-xs text-neutral-500 uppercase font-semibold">Crop & Variety</span>
                <div className="font-bold text-neutral-900">{selectedCrop.name}</div>
                <div className="text-xs text-forest-700">{selectedVariety.name}</div>
              </div>
              <div>
                <span className="text-xs text-neutral-500 uppercase font-semibold">Planting Window</span>
                <div className="font-bold text-neutral-900">{plantingDate}</div>
                <div className="text-xs text-neutral-500">Harvest ~ {expectedHarvestDate}</div>
              </div>
              <div>
                <span className="text-xs text-neutral-500 uppercase font-semibold">Target Yield</span>
                <div className="font-bold text-forest-700">
                  {Number(targetYieldKg || defaultTargetYield).toLocaleString()} kg
                </div>
                <div className="text-xs text-neutral-500">
                  Budget: {formatNaira(Number(estimatedBudgetNgn || 0) * 100)}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="secondary" type="button" onClick={() => setStep(4)}>
                ← Back
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Generating Schedule & Committing..." : "Commit Crop Plan →"}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}
