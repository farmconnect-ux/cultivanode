// Suggested growth stages and field operations for a crop cycle, from the shared agronomy
// catalogue (IITA / NIHORT based templates). Pure functions: used by the crop planner (browser)
// and the crop cycle page (server). Farmers accept, edit or skip each suggestion.
import { CROP_LIFECYCLE_TEMPLATES, NORMALIZED_CROP_CATALOGUE, getCropById, getCropTemplate } from "@cultivanode/shared";

export const OP_TYPES = ["land_prep", "planting", "fertiliser", "weed_control", "pest_control", "disease_control", "irrigation", "scouting", "harvest", "other"] as const;
export type OpType = (typeof OP_TYPES)[number];

export type CropChoice = {
  id: string;
  name: string;
  localName?: string;
  hasTemplate: boolean;
  varieties: { id: string; name: string; days: number; yieldKgPerHa: number }[];
};

export type SuggestedStage = { id: string; name: string; startsOn: string; endsOn: string; description: string };
export type SuggestedOperation = {
  key: string;
  name: string;
  stage: string;
  operationType: OpType;
  startsOn: string;
  endsOn: string;
  description: string;
  machinery: string | null;
};
export type CropPlanSuggestion = {
  cropId: string;
  varietyId: string | null;
  harvestOn: string;
  targetYieldKgPerHa: number | null;
  stages: SuggestedStage[];
  operations: SuggestedOperation[];
  /** True when the crop has its own template; otherwise a general field-crop plan is suggested. */
  specific: boolean;
};

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Crops farmers can plan, those with a full operations template first. */
export function cropChoices(): CropChoice[] {
  return NORMALIZED_CROP_CATALOGUE.map((c) => ({
    id: c.id,
    name: c.commonName,
    localName: c.localNames?.yo,
    hasTemplate: Boolean(CROP_LIFECYCLE_TEMPLATES[c.id]),
    varieties: c.varieties.map((v) => ({ id: v.id, name: v.name, days: v.daysToMaturity, yieldKgPerHa: Math.round(v.expectedYieldTonnesPerHa * 1000) })),
  })).sort((a, b) => Number(b.hasTemplate) - Number(a.hasTemplate)); // stable: keeps the catalogue's staples-first order
}

/** Map a template operation onto the operation types the database knows. */
export function operationTypeOf(name: string, stage: string, inputCategory?: string): OpType {
  const s = `${name} ${stage}`.toLowerCase();
  if (/harvest|lift|uproot|picking|shelling/.test(s)) return "harvest";
  if (/plough|harrow|ridg|clear|land prep|bed form|tillage|mound/.test(s)) return "land_prep";
  if (/plant|sow|transplant|nursery|seed/.test(s) || inputCategory === "seed") return "planting";
  if (/fertili|top.?dress|npk|urea|manure|nutrient/.test(s) || inputCategory === "fertiliser") return "fertiliser";
  if (/weed|herbicide/.test(s) || inputCategory === "herbicide") return "weed_control";
  if (/fung|disease|blight|rot/.test(s) || inputCategory === "fungicide") return "disease_control";
  if (/pest|insect|armyworm|borer|spray/.test(s) || inputCategory === "insecticide") return "pest_control";
  if (/irrigat|water/.test(s)) return "irrigation";
  if (/scout|monitor|inspect|count|check/.test(s)) return "scouting";
  return "other";
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function pickVariety(cropId: string, variety: string | null | undefined) {
  const crop = getCropById(cropId);
  if (!crop) return null;
  const v = variety ? norm(variety) : "";
  return (
    crop.varieties.find((x) => norm(x.id) === v || norm(x.name) === v) ??
    crop.varieties.find((x) => v && (norm(x.name).includes(v) || v.includes(norm(x.id)))) ??
    crop.varieties[0] ??
    null
  );
}

/** Stages and operations for a crop planted on `plantingDate`. */
export function suggestCropPlan(cropIdRaw: string, plantingDate: string, variety?: string | null): CropPlanSuggestion {
  const cropId = norm(cropIdRaw).replace(/ /g, "_");
  const crop = getCropById(cropId);
  const v = pickVariety(cropId, variety);
  const template = getCropTemplate(cropId);
  const cycleDays = v?.daysToMaturity ?? crop?.typicalDurationDays ?? 100;
  const stagesDef = crop?.growthStages ?? crop?.stages ?? [];
  const stages: SuggestedStage[] = [...stagesDef]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ id: s.id, name: s.name, startsOn: addDays(plantingDate, s.relativeStartDay), endsOn: addDays(plantingDate, s.relativeEndDay), description: s.description }));
  const operations: SuggestedOperation[] = template.operations
    .map((op) => ({
      key: op.id,
      name: op.name,
      stage: op.stageName,
      operationType: operationTypeOf(op.name, op.stageName, op.requirements?.inputCategory),
      startsOn: addDays(plantingDate, op.relativeStartDay),
      endsOn: addDays(plantingDate, Math.max(op.relativeStartDay, op.relativeEndDay)),
      description: op.description,
      machinery: op.requirements?.equipment?.length ? op.requirements.equipment.map((e) => e.replace(/_/g, " ")).join(", ") : null,
    }))
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  return {
    cropId,
    varietyId: v?.id ?? null,
    harvestOn: addDays(plantingDate, cycleDays),
    targetYieldKgPerHa: v ? Math.round(v.expectedYieldTonnesPerHa * 1000) : null,
    stages,
    operations,
    specific: Boolean(CROP_LIFECYCLE_TEMPLATES[cropId]),
  };
}

/** The stage a crop should be in today, by calendar. */
export function stageOn(stages: SuggestedStage[], day: string): SuggestedStage | null {
  if (!stages.length) return null;
  if (day < stages[0]!.startsOn) return null;
  return stages.find((s) => day >= s.startsOn && day <= s.endsOn) ?? (day > stages.at(-1)!.endsOn ? stages.at(-1)! : null);
}

type ExistingOp = { name: string; operation_type?: string | null; scheduled_date?: string | null };

const daysBetween = (a: string, b: string) => Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;

/**
 * Suggestions the cycle doesn't cover yet. An existing operation covers a suggestion when the names match,
 * or when it is the same kind of work within 10 days. Suggestions dated before `notBefore` are dropped
 * (for a crop already in the ground, last month's land preparation is no longer useful advice).
 */
export function missingOperations(suggested: SuggestedOperation[], existing: ExistingOp[], notBefore?: string): SuggestedOperation[] {
  const names = new Set(existing.map((o) => norm(o.name)));
  return suggested.filter((s) => {
    if (notBefore && s.endsOn < notBefore) return false;
    if (names.has(norm(s.name))) return false;
    return !existing.some(
      (o) => o.scheduled_date && (o.operation_type === s.operationType || operationTypeOf(o.name, "") === s.operationType) && daysBetween(o.scheduled_date, s.startsOn) <= 10,
    );
  });
}
