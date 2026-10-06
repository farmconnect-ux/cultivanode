"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CROP_CATALOGUE,
  generatePlantingSchedule,
  calculateFertiliserRecommendation,
  type CropDefinition,
  type CropVariety,
  type AgronomySeason,
  type FarmZone,
  type SoilNutrientProfile,
} from "@cultivanode/shared";
import { Badge, Button, Card } from "@/components/ui";
import type { Locale } from "@/i18n/config";

interface PlotItem {
  id: string;
  name: string;
  area_ha: number | null;
}

interface SoilRecordItem {
  id: string;
  plot_id: string;
  soil_type: string | null;
  ph: number | null;
  organic_matter_pct: number | null;
  nitrogen_pct: number | null;
  phosphorus_ppm: number | null;
  potassium_cmol_kg: number | null;
  tested_on: string | null;
}

interface FarmAgronomyPlannerProps {
  farmId: string;
  farmName: string;
  farmZone?: string | null;
  plots: PlotItem[];
  soilRecords: SoilRecordItem[];
  lang: Locale;
}

export function FarmAgronomyPlanner({
  farmId,
  farmName,
  farmZone,
  plots,
  soilRecords,
  lang,
}: FarmAgronomyPlannerProps) {
  const [selectedPlotId, setSelectedPlotId] = useState<string>(plots[0]?.id ?? "");
  const [selectedCropId, setSelectedCropId] = useState<string>("maize");
  const [season, setSeason] = useState<AgronomySeason>("early_rainy");
  const [plantingDate, setPlantingDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]!;
  });

  const selectedCrop = useMemo(() => {
    return CROP_CATALOGUE.find((c: CropDefinition) => c.id === selectedCropId) ?? CROP_CATALOGUE[0]!;
  }, [selectedCropId]);

  const [selectedVarietyId, setSelectedVarietyId] = useState<string>(
    selectedCrop.varieties[0]?.id ?? ""
  );

  const selectedVariety = useMemo(() => {
    return selectedCrop.varieties.find((v: CropVariety) => v.id === selectedVarietyId) ?? selectedCrop.varieties[0]!;
  }, [selectedCrop, selectedVarietyId]);

  const selectedPlot = useMemo(() => {
    return plots.find((p) => p.id === selectedPlotId) ?? plots[0];
  }, [plots, selectedPlotId]);

  const plotArea = selectedPlot?.area_ha ? Number(selectedPlot.area_ha) : 1.0;

  // Normalized agro-ecological zone
  const zone: FarmZone =
    farmZone === "rainforest" || farmZone === "derived_savanna" || farmZone === "southern_guinea"
      ? (farmZone as FarmZone)
      : "rainforest";

  // Deterministically generate schedule
  const schedule = useMemo(() => {
    try {
      return generatePlantingSchedule({
        cropId: selectedCrop.id,
        varietyId: selectedVariety?.id ?? selectedCrop.varieties[0]?.id ?? "v1",
        farmAreaHectares: plotArea,
        plantingDate,
        zone,
        season,
      });
    } catch {
      return null;
    }
  }, [selectedCrop, selectedVariety, plotArea, plantingDate, zone, season]);

  // Find soil test for selected plot
  const plotSoil = useMemo(() => {
    if (!selectedPlot) return null;
    return soilRecords.find((s) => s.plot_id === selectedPlot.id) ?? soilRecords[0] ?? null;
  }, [selectedPlot, soilRecords]);

  // Compute fertiliser recommendation
  const fertiliserRec = useMemo(() => {
    if (!plotSoil || !selectedVariety) return null;
    const profile: SoilNutrientProfile = {
      pH: plotSoil.ph ?? 6.2,
      phosphorusPpm: plotSoil.phosphorus_ppm ?? 12,
      potassiumPpm: plotSoil.potassium_cmol_kg ? plotSoil.potassium_cmol_kg * 390 : 130,
      organicMatterPercent: plotSoil.organic_matter_pct ?? 1.8,
      nitrogenPercent: plotSoil.nitrogen_pct ?? 0.12,
    };

    return calculateFertiliserRecommendation(
      selectedCrop.id,
      selectedVariety.expectedYieldTonnesPerHa,
      plotArea,
      profile
    );
  }, [plotSoil, selectedVariety, selectedCrop, plotArea]);

  // Export to standard iCalendar (.ics) format for mobile/offline sync
  const handleExportIcs = () => {
    if (!schedule) return;

    const formatDateForIcs = (dateStr: string) => dateStr.replace(/-/g, "");

    const events = schedule.operations
      .map((op) => {
        const start = formatDateForIcs(op.startDate);
        const end = formatDateForIcs(op.endDate);
        const summary = `${op.name} [${selectedCrop.commonName} - ${selectedPlot?.name ?? "Plot"}]`;
        const description = `${op.description}\\nStage: ${op.stage}\\nRequirements: ${[
          op.requirements.equipment?.join(", "),
          op.requirements.providers?.join(", "),
          op.requirements.inputCategory,
        ]
          .filter(Boolean)
          .join(" | ")}`;

        return [
          "BEGIN:VEVENT",
          `UID:${op.id}-${Date.now()}@cultivanode.com`,
          `DTSTAMP:${formatDateForIcs(new Date().toISOString().split("T")[0]!)}T000000Z`,
          `DTSTART;VALUE=DATE:${start}`,
          `DTEND;VALUE=DATE:${end}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${description}`,
          `LOCATION:${farmName}`,
          "STATUS:CONFIRMED",
          "END:VEVENT",
        ].join("\r\n");
      })
      .join("\r\n");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CultivaNode//Farm Operations Planner//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      events,
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${farmName.toLowerCase().replace(/\s+/g, "-")}-${selectedCrop.id}-calendar.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <Card className="flex flex-col gap-4 border-leaf-200 bg-leaf-50/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-leaf-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-leaf-900">
              Agronomy Schedule &amp; Operations Planner
            </h3>
            <p className="text-xs text-muted">
              Dynamic agricultural timetable aligned with South-West Nigeria GAP standards (IITA &amp; NIHORT).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-leaf-100 text-leaf-800 text-xs">
              Zone: {zone.replace("_", " ").toUpperCase()}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportIcs}
              className="border-leaf-300 text-leaf-900 hover:bg-leaf-100 text-xs"
              title="Download standard .ics file for Google Calendar or phone reminders"
            >
              📅 Add to Calendar (.ics)
            </Button>
          </div>
        </div>

        {/* Form controls */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {/* Plot select */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-leaf-900">Select Plot</label>
            <select
              value={selectedPlotId}
              onChange={(e) => setSelectedPlotId(e.target.value)}
              className="rounded border border-line bg-surface px-3 py-2 text-ink text-xs focus:border-leaf-600 focus:outline-none"
            >
              {plots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.area_ha ? `${p.area_ha} ha` : "Area not set"})
                </option>
              ))}
            </select>
          </div>

          {/* Crop select (15 South-West crops) */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-leaf-900">Crop (South-West Pilot)</label>
            <select
              value={selectedCropId}
              onChange={(e) => {
                const newCropId = e.target.value;
                setSelectedCropId(newCropId);
                const c = CROP_CATALOGUE.find((cr: CropDefinition) => cr.id === newCropId);
                if (c?.varieties[0]) {
                  setSelectedVarietyId(c.varieties[0].id);
                }
              }}
              className="rounded border border-line bg-surface px-3 py-2 text-ink text-xs focus:border-leaf-600 focus:outline-none"
            >
              <optgroup label="Field & Staple Crops (8)">
                <option value="maize">Maize (Àgbàdo)</option>
                <option value="cassava">Cassava (Gbaágùdá)</option>
                <option value="yam">Yam (Iṣu)</option>
                <option value="rice">Rice (Ìrẹsì)</option>
                <option value="cowpea">Cowpea / Beans (Ẹwà)</option>
                <option value="plantain">Plantain / Banana (Ọ̀gẹ̀dẹ̀)</option>
                <option value="egusi">Egusi Melon (Ẹ̀gúsí)</option>
                <option value="sweet_potato">Sweet Potato (Kùkúndùkú)</option>
              </optgroup>
              <optgroup label="Fresh Vegetables (7)">
                <option value="tomato">Tomato (Tòmátì)</option>
                <option value="pepper">Pepper (Ata Tatashe / Rodo / Shombo)</option>
                <option value="okra">Okra (Ilá)</option>
                <option value="amaranth">Amaranth / Green (Tẹtẹ)</option>
                <option value="ewedu">Jute Mallow (Éwédú)</option>
                <option value="cucumber">Cucumber (Kókúmbà)</option>
                <option value="watermelon">Watermelon (Elegede)</option>
              </optgroup>
            </select>
          </div>

          {/* Variety select */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-leaf-900">Improved Variety</label>
            <select
              value={selectedVarietyId}
              onChange={(e) => setSelectedVarietyId(e.target.value)}
              className="rounded border border-line bg-surface px-3 py-2 text-ink text-xs focus:border-leaf-600 focus:outline-none"
            >
              {selectedCrop.varieties.map((v: CropVariety) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.daysToMaturity} days, {v.expectedYieldTonnesPerHa}t/ha)
                </option>
              ))}
            </select>
          </div>

          {/* Planting Date & Season */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-leaf-900">Planting / Sowing Date</label>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="rounded border border-line bg-surface px-2 py-1.5 text-ink text-xs focus:border-leaf-600 focus:outline-none"
              />
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as AgronomySeason)}
                className="rounded border border-line bg-surface px-2 py-1.5 text-ink text-xs focus:border-leaf-600 focus:outline-none"
              >
                <option value="early_rainy">Early Rainy</option>
                <option value="late_rainy">Late Rainy</option>
                <option value="dry_irrigated">Dry Irrigated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Variety Summary Info Banner */}
        <div className="flex flex-wrap items-center gap-4 rounded bg-surface p-3 border border-line text-xs">
          <span>
            Variety: <strong className="text-leaf-900">{selectedVariety?.name}</strong>
          </span>
          <span>
            Maturity: <strong className="text-leaf-900">{selectedVariety?.daysToMaturity} days</strong>
          </span>
          <span>
            Target Yield: <strong className="text-harvest-800">{selectedVariety?.expectedYieldTonnesPerHa} t/ha</strong> (
            {(selectedVariety?.expectedYieldTonnesPerHa * plotArea).toFixed(1)} t total on {plotArea} ha)
          </span>
          {selectedVariety?.droughtTolerant && (
            <Badge className="bg-harvest-100 text-harvest-800 text-[10px]">💧 Drought Tolerant</Badge>
          )}
          <span className="text-muted ml-auto">
            Estimated Harvest:{" "}
            <strong className="text-leaf-900">{schedule?.harvestEstimatedDate ?? "Calculating..."}</strong>
          </span>
        </div>
      </Card>

      {/* Fertiliser Recommendation Box */}
      {fertiliserRec && (
        <Card className="flex flex-col gap-3 border-harvest-200 bg-harvest-50/20 p-4">
          <div className="flex items-center justify-between border-b border-harvest-100 pb-2">
            <div>
              <h4 className="font-bold text-sm text-harvest-900">
                Scientific Fertiliser Plan for {selectedPlot?.name} ({plotArea} ha)
              </h4>
              <p className="text-[11px] text-muted">
                Calculated from soil test (pH: {plotSoil?.ph ?? "N/A"}, P: {plotSoil?.phosphorus_ppm ?? "N/A"} ppm)
              </p>
            </div>
            <Badge className="bg-harvest-100 text-harvest-900 text-xs">Soil-Grounded</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fertiliserRec.productApplications.map((app) => (
              <div key={app.productName} className="rounded border border-harvest-200 bg-surface p-3">
                <p className="font-bold text-xs text-ink">{app.productName}</p>
                <p className="text-lg font-black text-leaf-900 mt-1">
                  {app.fiftyKgBags} bags <span className="text-xs font-normal text-muted">({app.totalKg} kg)</span>
                </p>
                <p className="text-[11px] text-muted">
                  Rate: {app.kgPerHa} kg/ha • Timing: {app.timing.replace(/_/g, " ")}
                </p>
              </div>
            ))}

            {fertiliserRec.limeRecommendationKgPerHa > 0 && (
              <div className="rounded border border-accent-200 bg-surface p-3">
                <p className="font-bold text-xs text-accent-900">Agricultural Lime (pH Correction)</p>
                <p className="text-lg font-black text-accent-700 mt-1">
                  {Math.round((fertiliserRec.limeRecommendationKgPerHa * plotArea) / 50)} bags
                </p>
                <p className="text-[11px] text-muted">
                  Apply {fertiliserRec.limeRecommendationKgPerHa} kg/ha 2-4 weeks before planting
                </p>
              </div>
            )}
          </div>

          {fertiliserRec.warning && (
            <div className="rounded bg-accent-50 border border-accent-200 p-2.5 text-xs text-accent-900">
              ⚠️ <strong>Soil Advisory:</strong> {fertiliserRec.warning}
            </div>
          )}
        </Card>
      )}

      {/* Operations Timetable */}
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="text-base font-bold text-leaf-900">
              Scheduled Field Operations ({schedule?.operations.length ?? 0} Steps)
            </h3>
            <p className="text-xs text-muted">
              Standard-compliant operational calendar. Tap to book machinery or service providers directly.
            </p>
          </div>
          <Badge className="bg-leaf-50 text-leaf-700 text-xs">
            Standard: {schedule?.standardsCompliance.standardId}
          </Badge>
        </div>

        {!schedule || schedule.operations.length === 0 ? (
          <p className="text-xs text-muted py-4">No operations found for this crop selection.</p>
        ) : (
          <div className="divide-y divide-line">
            {schedule.operations.map((op, idx) => {
              const reqEquipment = op.requirements.equipment?.[0];
              const reqProvider = op.requirements.providers?.[0];

              return (
                <div key={op.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 sm:max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-leaf-100 text-[11px] font-bold text-leaf-800">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-ink">{op.name}</h4>
                      <Badge className="bg-earth-100 text-earth-800 text-[10px]">{op.stage}</Badge>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{op.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted pt-1">
                      <span>
                        📅 <strong>Window:</strong> {op.startDate} &rarr; {op.endDate}
                      </span>
                      {op.requirements.equipment && (
                        <span>
                          🚜 <strong>Equipment:</strong> {op.requirements.equipment.join(", ")}
                        </span>
                      )}
                      {op.requirements.providers && (
                        <span>
                          👥 <strong>Provider:</strong> {op.requirements.providers.join(", ")}
                        </span>
                      )}
                      {op.requirements.inputCategory && (
                        <span>
                          📦 <strong>Input:</strong> {op.requirements.inputCategory}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Operational Booking Action */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    {reqEquipment ? (
                      <Link
                        href={`/${lang}/account/bookings/new?farm=${farmId}&equipment=${reqEquipment}&notes=${encodeURIComponent(
                          `Operation: ${op.name} for ${selectedCrop.commonName}`
                        )}`}
                      >
                        <Button variant="primary" size="sm" className="text-xs">
                          🚜 Book {reqEquipment}
                        </Button>
                      </Link>
                    ) : reqProvider ? (
                      <Link href={`/${lang}/account/find?type=${reqProvider}`}>
                        <Button variant="secondary" size="sm" className="text-xs border-leaf-400 text-leaf-900">
                          👥 Find {reqProvider.replace(/_/g, " ")}
                        </Button>
                      </Link>
                    ) : (
                      <Badge className="bg-surface border border-line text-muted text-[11px]">
                        Farm Hand Activity
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
