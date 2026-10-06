"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import {
  getCropById,
  formatNaira,
  computeFarmGrossMargin,
  APPROVED_CHEMICALS_REGISTRY,
  type CropCycle,
  type CropCycleOperation,
  type CropObservation,
  type CropMeasurement,
  type CropInputApplication,
  type CropHarvest,
  type CropAlert,
} from "@cultivanode/shared";
import {
  completeOperationAction,
  rescheduleOperationAction,
  skipOperationAction,
  recordInputApplicationAction,
  type OperationActionState,
} from "@/actions/crop-operations";
import {
  recordScoutingObservationAction,
  resolveScoutingObservationAction,
  recordMeasurementAction,
  type ScoutingActionState,
} from "@/actions/crop-scouting";
import { recordHarvestAction, type HarvestActionState } from "@/actions/crop-harvest";
import {
  activateCropCycleAction,
  completeCropCycleAction,
  abandonCropCycleAction,
} from "@/actions/crop-cycles";
import { Alert, Badge, Button, Card } from "@/components/ui";
import type { Locale } from "@/i18n/config";

interface CropCycleDetailProps {
  lang: Locale;
  cycle: CropCycle;
  plot: {
    id: string;
    name: string;
    area_ha: number | null;
    soil_texture?: string | null;
    irrigation_type?: string | null;
    farm: { id: string; name: string; zone?: string | null };
  };
  operations: CropCycleOperation[];
  observations: CropObservation[];
  measurements: CropMeasurement[];
  inputs: CropInputApplication[];
  harvests: CropHarvest[];
  alerts: CropAlert[];
}

export function CropCycleDetailView({
  lang,
  cycle,
  plot,
  operations,
  observations,
  measurements,
  inputs,
  harvests,
  alerts,
}: CropCycleDetailProps) {
  const [tab, setTab] = useState<
    "overview" | "operations" | "scouting" | "inputs" | "health" | "harvest" | "costs" | "profitability"
  >("overview");

  // Modal / Form toggles
  const [activeModal, setActiveModal] = useState<
    "completeOp" | "addObs" | "addInput" | "addHarvest" | "addMeasurement" | null
  >(null);
  const [selectedOp, setSelectedOp] = useState<CropCycleOperation | null>(null);

  const crop = getCropById(cycle.cropId);
  const variety = crop?.varieties.find((v) => v.id === cycle.varietyId);

  // Profitability computation via shared agronomy engine
  const assumedPricePerKgKobo = (crop?.category === "cereal" ? 450 : crop?.category === "legume" ? 950 : 350) * 100;
  const currentRevenueKobo = Math.round((cycle.actualYieldKg || cycle.targetYieldKg) * assumedPricePerKgKobo);

  // Group costs by category
  let machineryKobo = 0;
  let labourKobo = 0;
  let seedsKobo = 0;
  let fertiliserKobo = 0;
  let chemicalsKobo = 0;

  operations.forEach((op) => {
    if (op.requiredEquipment) {
      machineryKobo += Number(op.actualCostKobo) || 0;
    } else {
      labourKobo += Number(op.actualCostKobo) || 0;
    }
  });

  inputs.forEach((inp) => {
    const cost = Number(inp.costKobo) || 0;
    if (inp.category === "seed") seedsKobo += cost;
    else if (inp.category === "fertiliser") fertiliserKobo += cost;
    else chemicalsKobo += cost;
  });

  const grossMargin = computeFarmGrossMargin({
    cropId: cycle.cropId,
    plotId: cycle.plotId,
    areaHectares: cycle.targetAreaHa,
    totalYieldKg: cycle.actualYieldKg > 0 ? cycle.actualYieldKg : cycle.targetYieldKg,
    revenueKobo: currentRevenueKobo,
    costs: {
      machineryKobo,
      labourKobo,
      seedsKobo,
      fertiliserKobo,
      chemicalsKobo,
    },
  });

  // Action states
  const [opState, completeOpFormAction, isOpPending] = useActionState<OperationActionState, FormData>(
    async (prev, form) => {
      const res = await completeOperationAction(prev, form);
      if (res.ok) setActiveModal(null);
      return res;
    },
    {}
  );

  const [obsState, obsFormAction, isObsPending] = useActionState<ScoutingActionState, FormData>(
    async (prev, form) => {
      const res = await recordScoutingObservationAction(prev, form);
      if (res.ok) setActiveModal(null);
      return res;
    },
    {}
  );

  const [inputState, inputFormAction, isInputPending] = useActionState<OperationActionState, FormData>(
    async (prev, form) => {
      const res = await recordInputApplicationAction(prev, form);
      if (res.ok) setActiveModal(null);
      return res;
    },
    {}
  );

  const [harvestState, harvestFormAction, isHarvestPending] = useActionState<HarvestActionState, FormData>(
    async (prev, form) => {
      const res = await recordHarvestAction(prev, form);
      if (res.ok) setActiveModal(null);
      return res;
    },
    {}
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Banner & Lifecycle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            <Link href={`/${lang}/account/crops`} className="hover:text-neutral-700">
              Crops
            </Link>
            <span>/</span>
            <span>{plot.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-neutral-900">
              {crop?.name ?? cycle.cropId} ({variety?.name ?? cycle.varietyId})
            </h1>
            <Badge
              className={
                cycle.status === "active"
                  ? "bg-leaf-100 text-leaf-800 capitalize"
                  : cycle.status === "harvesting"
                  ? "bg-harvest-100 text-harvest-800 capitalize"
                  : "bg-neutral-100 text-neutral-700 capitalize"
              }
            >
              {cycle.status}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Farm: {plot.farm.name} • Field: {plot.name} ({cycle.targetAreaHa} ha) • Planted:{" "}
            {cycle.plantingDate} • Expected Harvest: {cycle.expectedHarvestDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cycle.status === "planning" && (
            <Button
              type="button"
              onClick={async () => {
                await activateCropCycleAction(cycle.id);
              }}
            >
              🚀 Activate Cycle
            </Button>
          )}

          {cycle.status === "active" && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setActiveModal("addHarvest");
              }}
            >
              🌾 Record First Harvest
            </Button>
          )}

          {cycle.status === "harvesting" && (
            <Button
              type="button"
              onClick={async () => {
                await completeCropCycleAction(cycle.id);
              }}
            >
              ✓ Complete Cycle
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-neutral-200 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Overview", icon: "📋" },
          { id: "operations", label: `Operations (${operations.length})`, icon: "🚜" },
          { id: "scouting", label: `Scouting (${observations.length})`, icon: "🔍" },
          { id: "inputs", label: `Inputs & Safety (${inputs.length})`, icon: "🧪" },
          { id: "health", label: `Health (${Math.round(cycle.healthScore * 100)}%)`, icon: "💚" },
          { id: "harvest", label: `Harvest Intake (${harvests.length})`, icon: "🌾" },
          { id: "costs", label: "Costs", icon: "💰" },
          { id: "profitability", label: "Enterprise Margin", icon: "📈" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tab === t.id
                ? "bg-forest-600 text-white shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-2 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Crop Growth Stages</h2>
              <p className="text-xs text-neutral-500">
                Current phenological stage and developmental timeline.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {(crop?.stages ?? []).map((stage, idx) => {
                const isCurrent = cycle.currentStage === stage.id;
                return (
                  <div
                    key={stage.id}
                    className={`p-3 rounded-xl border-2 flex flex-col justify-between ${
                      isCurrent
                        ? "border-forest-600 bg-forest-50/70"
                        : "border-neutral-200 bg-neutral-50/50"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">
                        Stage {idx + 1}
                      </span>
                      <div className="font-bold text-xs text-neutral-900 mt-0.5">{stage.name}</div>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-2">
                      Day {stage.relativeStartDay} – {stage.relativeEndDay}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-neutral-500 uppercase font-semibold">Target Yield</span>
                <div className="text-lg font-extrabold text-neutral-900 mt-0.5">
                  {cycle.targetYieldKg.toLocaleString()} kg
                </div>
              </div>
              <div>
                <span className="text-xs text-neutral-500 uppercase font-semibold">Actual Yield</span>
                <div className="text-lg font-extrabold text-forest-700 mt-0.5">
                  {cycle.actualYieldKg.toLocaleString()} kg
                </div>
              </div>
              <div>
                <span className="text-xs text-neutral-500 uppercase font-semibold">Budget</span>
                <div className="text-lg font-extrabold text-neutral-900 mt-0.5">
                  {formatNaira(cycle.estimatedBudgetKobo)}
                </div>
              </div>
              <div>
                <span className="text-xs text-neutral-500 uppercase font-semibold">Actual Cost</span>
                <div className="text-lg font-extrabold text-amber-700 mt-0.5">
                  {formatNaira(cycle.actualCostKobo)}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 flex flex-col justify-between gap-4 bg-forest-50/40">
            <div>
              <h3 className="font-bold text-forest-950">Field Characteristics</h3>
              <div className="mt-4 flex flex-col gap-2.5 text-xs text-neutral-700">
                <div className="flex justify-between py-1 border-b border-forest-100">
                  <span className="text-neutral-500">Soil Texture:</span>
                  <strong className="capitalize">{plot.soil_texture ?? "Sandy loam"}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-forest-100">
                  <span className="text-neutral-500">Irrigation:</span>
                  <strong className="capitalize">{plot.irrigation_type ?? "Rainfed"}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-forest-100">
                  <span className="text-neutral-500">Agro-Ecological Zone:</span>
                  <strong className="capitalize">{plot.farm.zone?.replace(/_/g, " ") ?? "Derived Savanna"}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-forest-100">
                  <span className="text-neutral-500">Health Index:</span>
                  <strong className="text-forest-700 font-bold">{Math.round(cycle.healthScore * 100)}%</strong>
                </div>
              </div>
            </div>

            <Link
              href={`/${lang}/account/assistant?q=${encodeURIComponent(
                `Advisory for my ${crop?.name} cycle in ${plot.name} at stage ${cycle.currentStage}`
              )}`}
              className="w-full text-center py-2 px-3 bg-forest-600 text-white rounded-xl text-xs font-bold hover:bg-forest-700"
            >
              🤖 Ask AI Farm Assistant
            </Link>
          </Card>
        </div>
      )}

      {/* 2. OPERATIONS TAB */}
      {tab === "operations" && (
        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Scheduled Field Operations</h2>
              <p className="text-xs text-neutral-500">
                Agronomic tasks with equipment hiring bridges and cost records.
              </p>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-neutral-100">
            {operations.map((op) => (
              <div key={op.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      op.status === "completed"
                        ? "bg-forest-100 text-forest-700"
                        : op.status === "skipped"
                        ? "bg-neutral-100 text-neutral-400"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {op.status === "completed" ? "✓" : op.status === "skipped" ? "—" : "•"}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900">{op.name}</h3>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      Stage: <span className="capitalize">{op.stage}</span> • Window:{" "}
                      {op.scheduledStartDate} to {op.scheduledEndDate}
                      {op.actualDate && ` • Done: ${op.actualDate}`}
                    </div>
                    {op.notes && <p className="text-xs text-neutral-600 mt-1 italic">{op.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {op.requiredEquipment && op.status === "pending" && (
                    <Link
                      href={`/${lang}/account/bookings/new?farm=${plot.farm.id}&notes=${encodeURIComponent(
                        `Operation: ${op.name} for ${crop?.name} on ${plot.name}`
                      )}`}
                      className="px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100"
                    >
                      🚜 Book {op.requiredEquipment}
                    </Link>
                  )}

                  {op.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedOp(op);
                        setActiveModal("completeOp");
                      }}
                    >
                      Mark Complete
                    </Button>
                  )}

                  {op.actualCostKobo > 0 && (
                    <Badge className="bg-neutral-100 text-neutral-700">{formatNaira(op.actualCostKobo)}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. SCOUTING & TELEMETRY TAB */}
      {tab === "scouting" && (
        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Scouting Logs & Telemetry</h2>
              <p className="text-xs text-neutral-500">
                Geo-located observations for pests, diseases, weeds, and nutrient deficiency.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setActiveModal("addObs")}
            >
              + Log Scouting Observation
            </Button>
          </div>

          {observations.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">
              No scouting observations recorded yet. Field health is normal.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {observations.map((obs) => (
                <div
                  key={obs.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                    obs.resolved ? "bg-neutral-50/70 border-neutral-200" : "bg-white border-neutral-300 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        {obs.category}
                      </span>
                      <Badge
                        className={
                          obs.severity === "severe" || obs.severity === "high"
                            ? "bg-red-100 text-red-800"
                            : obs.severity === "medium"
                            ? "bg-harvest-100 text-harvest-800"
                            : "bg-leaf-100 text-leaf-800"
                        }
                      >
                        {obs.severity}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 mt-2">{obs.description}</p>
                    {obs.recommendedAction && (
                      <p className="text-xs text-forest-700 mt-1 font-medium">
                        Action: {obs.recommendedAction}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-xs">
                    <span className="text-neutral-400">
                      {obs.resolved ? "✓ Resolved" : "Open issue"}
                    </span>
                    {!obs.resolved && (
                      <button
                        type="button"
                        onClick={async () => {
                          await resolveScoutingObservationAction(obs.id, cycle.id);
                        }}
                        className="text-xs font-bold text-forest-700 hover:underline"
                      >
                        Mark Resolved →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 4. INPUTS & CHEMICAL SAFETY TAB */}
      {tab === "inputs" && (
        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Input Applications & Chemical Safety</h2>
              <p className="text-xs text-neutral-500">
                NAFDAC-cleared seeds, fertilisers, and protection with Pre-Harvest Interval (PHI) verification.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setActiveModal("addInput")}
            >
              + Record Input Application
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Rate / Area</th>
                  <th className="p-3">Total Quantity</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Applied Date</th>
                  <th className="p-3">PHI Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {inputs.map((inp) => (
                  <tr key={inp.id} className="hover:bg-neutral-50/50">
                    <td className="p-3 font-bold text-neutral-900">{inp.productName}</td>
                    <td className="p-3 capitalize">{inp.category}</td>
                    <td className="p-3">
                      {inp.ratePerHa} {inp.unit}/ha ({inp.areaAppliedHa} ha)
                    </td>
                    <td className="p-3 font-semibold">
                      {inp.totalQuantity} {inp.unit}
                    </td>
                    <td className="p-3 font-semibold text-neutral-800">
                      {formatNaira(inp.costKobo)}
                    </td>
                    <td className="p-3">{inp.appliedDate}</td>
                    <td className="p-3">
                      <Badge className="bg-leaf-100 text-leaf-800">NAFDAC Cleared</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5. HEALTH TAB */}
      {tab === "health" && (
        <Card className="p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Crop Health Index & Risk Telemetry</h2>
            <p className="text-xs text-neutral-500">
              Real-time health assessment calculated deterministically from field conditions.
            </p>
          </div>

          <div className="flex items-center gap-6 p-6 bg-neutral-50 rounded-2xl border">
            <div className="text-center">
              <span className="text-4xl font-extrabold text-forest-700">
                {Math.round(cycle.healthScore * 100)}%
              </span>
              <div className="text-xs font-bold text-neutral-500 uppercase mt-1">Health Score</div>
            </div>
            <div className="border-l pl-6 flex flex-col gap-1">
              <span className="font-bold text-sm text-neutral-900 capitalize">
                Status: {cycle.healthStatus}
              </span>
              <p className="text-xs text-neutral-600">
                {cycle.healthScore >= 0.85
                  ? "Field is performing optimally according to GAP standards with no major pest pressure."
                  : cycle.healthScore >= 0.70
                  ? "Minor stresses detected. Review pending operations or unresolved scouting items."
                  : "Field requires immediate intervention to mitigate yield loss."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 6. HARVEST INTAKE TAB */}
      {tab === "harvest" && (
        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Harvest Batches & Intake Logs</h2>
              <p className="text-xs text-neutral-500">
                Traceable harvest batches ready for storage or market listing.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setActiveModal("addHarvest")}
            >
              + Record Harvest Batch
            </Button>
          </div>

          {harvests.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">
              No harvest batches recorded yet for this cycle.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 text-neutral-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Batch Code</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Weight (kg)</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3">Moisture</th>
                    <th className="p-3">Storage</th>
                    <th className="p-3">Market Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {harvests.map((h) => (
                    <tr key={h.id}>
                      <td className="p-3 font-mono font-bold text-forest-800">{h.batchCode}</td>
                      <td className="p-3">{h.harvestDate}</td>
                      <td className="p-3 font-bold text-neutral-900">
                        {h.quantityKg.toLocaleString()} kg
                      </td>
                      <td className="p-3 uppercase font-semibold">{h.qualityGrade.replace(/_/g, " ")}</td>
                      <td className="p-3">{h.moisturePct ? `${h.moisturePct}%` : "—"}</td>
                      <td className="p-3">{h.storageLocation ?? "Barn / Silo"}</td>
                      <td className="p-3">
                        <Link
                          href={`/${lang}/account/listings?crop=${cycle.cropId}&batch=${h.batchCode}`}
                          className="font-bold text-forest-700 hover:underline"
                        >
                          List for Sale →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 7. COSTS TAB */}
      {tab === "costs" && (
        <Card className="p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Direct Cost of Production</h2>
            <p className="text-xs text-neutral-500">
              Aggregated expenditures across machinery hiring, labor, seeds, and protection.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-50 rounded-xl border">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Machinery</span>
              <div className="text-base font-bold text-neutral-900 mt-1">
                {formatNaira(machineryKobo)}
              </div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Labour</span>
              <div className="text-base font-bold text-neutral-900 mt-1">
                {formatNaira(labourKobo)}
              </div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Seeds & Inputs</span>
              <div className="text-base font-bold text-neutral-900 mt-1">
                {formatNaira(seedsKobo + fertiliserKobo + chemicalsKobo)}
              </div>
            </div>
            <div className="p-4 bg-forest-50 rounded-xl border border-forest-200">
              <span className="text-xs text-forest-800 uppercase font-semibold">Total Direct Cost</span>
              <div className="text-base font-extrabold text-forest-950 mt-1">
                {formatNaira(cycle.actualCostKobo)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 8. PROFITABILITY TAB */}
      {tab === "profitability" && (
        <Card className="p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Enterprise Gross Margin & ROI</h2>
            <p className="text-xs text-neutral-500">
              Deterministic farm-books economic calculation based on yield output vs total direct expenses.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-50 rounded-xl border">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Projected Revenue</span>
              <div className="text-lg font-extrabold text-neutral-900 mt-1">
                {formatNaira(grossMargin.revenueKobo)}
              </div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Total Cost</span>
              <div className="text-lg font-extrabold text-neutral-900 mt-1">
                {formatNaira(grossMargin.totalDirectCostKobo)}
              </div>
            </div>
            <div className="p-4 bg-forest-50 rounded-xl border border-forest-200">
              <span className="text-xs text-forest-800 uppercase font-semibold">Gross Margin</span>
              <div className="text-lg font-extrabold text-forest-950 mt-1">
                {formatNaira(grossMargin.grossMarginKobo)}
              </div>
              <span className="text-xs text-forest-700">
                {formatNaira(grossMargin.grossMarginPerHectareKobo)} / ha
              </span>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border">
              <span className="text-xs text-neutral-500 uppercase font-semibold">Return on Investment</span>
              <div className="text-lg font-extrabold text-forest-700 mt-1">
                {grossMargin.roiPercentage}%
              </div>
              <span className="text-xs text-neutral-400">
                Unit cost: {formatNaira(grossMargin.costOfProductionPerKgKobo)} / kg
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* MODAL: COMPLETE OPERATION */}
      {activeModal === "completeOp" && selectedOp && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full bg-white flex flex-col gap-4 shadow-xl">
            <h3 className="font-bold text-base text-neutral-900">
              Complete Operation: {selectedOp.name}
            </h3>
            {opState.error && <Alert tone="danger">{opState.error}</Alert>}
            <form action={completeOpFormAction} className="flex flex-col gap-4">
              <input type="hidden" name="operation_id" value={selectedOp.id} />
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Date Completed
                </label>
                <input
                  type="date"
                  name="actual_date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Actual Cost (₦)
                </label>
                <input
                  type="number"
                  name="actual_cost_ngn"
                  defaultValue="0"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Notes on field condition or labor..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isOpPending}>
                  {isOpPending ? "Saving..." : "Confirm Completed"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: ADD SCOUTING OBSERVATION */}
      {activeModal === "addObs" && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full bg-white flex flex-col gap-4 shadow-xl">
            <h3 className="font-bold text-base text-neutral-900">Log Scouting Observation</h3>
            {obsState.error && <Alert tone="danger">{obsState.error}</Alert>}
            <form action={obsFormAction} className="flex flex-col gap-4">
              <input type="hidden" name="cycle_id" value={cycle.id} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Category
                  </label>
                  <select name="category" className="w-full px-3 py-2 border rounded-lg">
                    <option value="pest">Pest</option>
                    <option value="disease">Disease</option>
                    <option value="weed">Weed</option>
                    <option value="nutrient_deficiency">Nutrient Deficiency</option>
                    <option value="water_stress">Water Stress</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Severity
                  </label>
                  <select name="severity" className="w-full px-3 py-2 border rounded-lg">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  required
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Detail the symptom, pest visual, or deficiency..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Recommended Action
                </label>
                <input
                  type="text"
                  name="recommended_action"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g. Apply fungicide spray, increase irrigation"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isObsPending}>
                  {isObsPending ? "Saving..." : "Log Observation"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: RECORD INPUT APPLICATION */}
      {activeModal === "addInput" && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full bg-white flex flex-col gap-4 shadow-xl">
            <h3 className="font-bold text-base text-neutral-900">Record Input Application</h3>
            <p className="text-xs text-neutral-500">
              NAFDAC banned chemicals (e.g. Paraquat, Carbofuran) are strictly prevented.
            </p>
            {inputState.error && <Alert tone="danger">{inputState.error}</Alert>}
            <form action={inputFormAction} className="flex flex-col gap-3">
              <input type="hidden" name="cycle_id" value={cycle.id} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Category
                  </label>
                  <select name="category" className="w-full px-3 py-2 border rounded-lg">
                    <option value="fertiliser">Fertiliser</option>
                    <option value="herbicide">Herbicide</option>
                    <option value="insecticide">Insecticide</option>
                    <option value="fungicide">Fungicide</option>
                    <option value="seed">Seed</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Chemical Registry
                  </label>
                  <select name="chemical_id" className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Custom Product</option>
                    {APPROVED_CHEMICALS_REGISTRY.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brandName} {c.isBannedInNigeria ? "(BANNED)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Product / Brand Name
                </label>
                <input
                  type="text"
                  name="product_name"
                  required
                  placeholder="e.g. NPK 15-15-15, ForceUp"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Rate / ha
                  </label>
                  <input
                    type="number"
                    name="rate_per_ha"
                    defaultValue="2"
                    step="0.1"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Unit</label>
                  <select name="unit" className="w-full px-3 py-2 border rounded-lg">
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="bags">bags</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">Cost (₦)</label>
                  <input
                    type="number"
                    name="cost_ngn"
                    defaultValue="25000"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isInputPending}>
                  {isInputPending ? "Validating & Saving..." : "Record Application"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: RECORD HARVEST */}
      {activeModal === "addHarvest" && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full bg-white flex flex-col gap-4 shadow-xl">
            <h3 className="font-bold text-base text-neutral-900">Record Harvest Intake</h3>
            {harvestState.error && <Alert tone="danger">{harvestState.error}</Alert>}
            <form action={harvestFormAction} className="flex flex-col gap-3">
              <input type="hidden" name="cycle_id" value={cycle.id} />
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Harvest Date
                </label>
                <input
                  type="date"
                  name="harvest_date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Quantity (kg)
                  </label>
                  <input
                    type="number"
                    name="quantity_kg"
                    required
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Quality Grade
                  </label>
                  <select name="quality_grade" className="w-full px-3 py-2 border rounded-lg">
                    <option value="grade_a">Grade A (Premium)</option>
                    <option value="grade_b">Grade B (Standard)</option>
                    <option value="grade_c">Grade C (Sub-standard)</option>
                    <option value="processing_grade">Processing Grade</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Moisture % (optional)
                  </label>
                  <input
                    type="number"
                    name="moisture_pct"
                    step="0.1"
                    placeholder="13.5"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    name="storage_location"
                    placeholder="Main Barn / Silo 1"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="secondary" type="button" onClick={() => setActiveModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isHarvestPending}>
                  {isHarvestPending ? "Saving Batch..." : "Record Harvest"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
