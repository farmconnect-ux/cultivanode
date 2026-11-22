import { z } from "zod";

// Shared types, validation and pure helpers for the Content & Knowledge workbench (/admin/content).
// The database functions in supabase/migrations/20261124000000_content_knowledge_workbench.sql enforce the same
// rules; these schemas give staff a clear message before a round trip.

export type StandardStatus = "draft" | "in_review" | "approved" | "published" | "superseded" | "retired";

export type Stage = { name: string; start_day: number; end_day: number; description?: string };
export type NutrientApplication = { timing: string; product: string; rate_kg_ha: number; n_kg_ha: number; notes?: string };
export type ProtectionNote = { title: string; text: string };

export type StandardRow = {
  id: string;
  standard_code: string;
  crop_or_livestock_id: string;
  agro_zone: string;
  version: string;
  title: string;
  description: string | null;
  source_authority: string;
  status: StandardStatus;
  is_active: boolean;
  parameters: Record<string, unknown> | null;
  mandated_operations: string[] | null;
  restricted_chemicals: string[] | null;
  max_nitrogen_kg_ha: number | string | null;
  author_id: string | null;
  reviewer_id: string | null;
  approved_by_name: string | null;
  published_at: string | null;
  effective_from: string | null;
  effective_to: string | null;
  supersedes_id: string | null;
  change_notes: string | null;
  created_at: string;
};

export type AgrochemicalStatus = "draft" | "pending_review" | "approved" | "withdrawn";

export type AgrochemicalRow = {
  id: string;
  trade_name: string;
  product_category: string;
  formulation: string | null;
  active_ingredients: string;
  manufacturer: string | null;
  nafdac_reg_no: string | null;
  label_rate_value: number | string | null;
  label_rate_unit: string | null;
  rei_hours: number | null;
  phi_days: number | null;
  who_hazard_class: string | null;
  target_crops: string[];
  target_pests: string[];
  label_source: string;
  status: AgrochemicalStatus;
  created_by: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  withdrawn_reason: string | null;
  updated_at: string;
};

export type TranslationStatus = "pending" | "submitted" | "approved" | "rejected";

export type TranslationRow = {
  id: string;
  source_key: string;
  source_text: string;
  domain: string;
  target_lang: "yo" | "ha" | "ig" | "pcm";
  translated_text: string | null;
  status: TranslationStatus;
  translated_by: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  updated_at: string;
};

export type HistoryEntry = {
  happened_at: string;
  action: string;
  actor_name: string;
  standard_id: string;
  version: string;
  details: Record<string, unknown>;
};

export const PRODUCT_CATEGORIES = [
  "herbicide",
  "insecticide",
  "fungicide",
  "nematicide",
  "rodenticide",
  "fertiliser",
  "biostimulant",
  "other",
] as const;
export const RATE_UNITS = ["L/ha", "ml/ha", "kg/ha", "g/ha", "ml/16L", "g/16L"] as const;
export const HAZARD_CLASSES = ["Ia", "Ib", "II", "III", "U", "not_classified"] as const;
export const TRANSLATION_LANGS = [
  { id: "yo", label: "Yorùbá" },
  { id: "ha", label: "Hausa" },
  { id: "ig", label: "Igbo" },
  { id: "pcm", label: "Pidgin" },
] as const;
export const TRANSLATION_DOMAINS = ["pest", "fertility", "safety", "weather", "standard", "general"] as const;
export const AGRO_ZONES = [
  { id: "rainforest", label: "Rainforest" },
  { id: "derived_savanna", label: "Derived savanna" },
  { id: "all", label: "All zones" },
] as const;

const uuid = z.string().uuid();
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

export const StageSchema = z
  .object({
    name: z.string().trim().min(1, "Each stage needs a name.").max(120),
    start_day: z.coerce.number().int().min(-60).max(730),
    end_day: z.coerce.number().int().min(-60).max(730),
    description: optionalText(2000),
  })
  .refine((s) => s.end_day >= s.start_day, { message: "A stage cannot end before it starts." });

export const NutrientSchema = z.object({
  timing: z.string().trim().min(1, "Each application needs a timing.").max(80),
  product: z.string().trim().min(1, "Each application needs a product.").max(120),
  rate_kg_ha: z.coerce.number().positive("Product rate must be above 0.").max(2000),
  n_kg_ha: z.coerce.number().min(0).max(500),
  notes: optionalText(500),
});

export const ProtectionNoteSchema = z.object({
  title: z.string().trim().min(1).max(120),
  text: z.string().trim().min(1).max(2000),
});

export const StandardDraftSchema = z
  .object({
    id: uuid,
    title: z.string().trim().min(3, "The title must be at least 3 characters.").max(200),
    description: z.string().trim().max(2000).default(""),
    agro_zone: z.string().trim().min(1).max(80),
    source_authority: z.string().trim().min(2).max(200),
    max_nitrogen_kg_ha: z.number().min(0).max(500).nullable(),
    stages: z.array(StageSchema).max(20),
    nutrient_plan: z.array(NutrientSchema).max(12),
    protection_notes: z.array(ProtectionNoteSchema).max(20),
    mandated_operations: z.array(z.string().trim().min(1).max(120)).max(30),
    restricted_chemicals: z.array(z.string().trim().min(1).max(80)).max(50),
  })
  .superRefine((d, ctx) => {
    const n = totalNitrogen(d.nutrient_plan);
    if (d.max_nitrogen_kg_ha !== null && n > d.max_nitrogen_kg_ha) {
      ctx.addIssue({
        code: "custom",
        message: `The nutrient plan supplies ${n} kg N/ha, above this standard's maximum of ${d.max_nitrogen_kg_ha} kg N/ha.`,
      });
    }
  });
export type StandardDraftInput = z.input<typeof StandardDraftSchema>;

export const NewStandardSchema = z.object({
  standard_code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9_]{3,80}$/, "Use capital letters, numbers and underscores, e.g. GAP_LETTUCE_V1."),
  crop_or_livestock_id: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{2,80}$/, "Use lower-case letters, numbers and underscores, e.g. lettuce."),
  agro_zone: z.string().trim().min(1).max(80),
  version: z.string().trim().regex(/^\d+(\.\d+){0,2}$/, "Use a version like 1.0 or 2.1."),
  title: z.string().trim().min(3).max(200),
  source_authority: z.string().trim().min(2).max(200),
  max_nitrogen_kg_ha: z.number().min(0).max(500).nullable(),
  supersedes_id: uuid.nullable(),
  copy_from_id: uuid.nullable(),
});
export type NewStandardInput = z.input<typeof NewStandardSchema>;

export const AgrochemicalSchema = z
  .object({
    id: uuid.nullable(),
    trade_name: z.string().trim().min(2, "Trade name is required.").max(120),
    product_category: z.enum(PRODUCT_CATEGORIES),
    formulation: optionalText(40),
    active_ingredients: z.string().trim().min(2, "Active ingredients are required.").max(300),
    manufacturer: optionalText(160),
    nafdac_reg_no: z
      .string()
      .trim()
      .max(40)
      .refine((v) => v === "" || /^[A-Za-z0-9/. -]{3,40}$/.test(v), "Registration number has unexpected characters.")
      .optional(),
    label_rate_value: z.number().positive().max(10000).nullable(),
    label_rate_unit: z.enum(RATE_UNITS).nullable(),
    rei_hours: z.number().int().min(0).max(720).nullable(),
    phi_days: z.number().int().min(0).max(365).nullable(),
    who_hazard_class: z.enum(HAZARD_CLASSES).nullable(),
    target_crops: z.array(z.string().trim().min(1).max(60)).max(30),
    target_pests: z.array(z.string().trim().min(1).max(80)).max(30),
    label_source: z.string().trim().min(3, "Say where these details come from.").max(500),
  })
  .refine((d) => (d.label_rate_value === null) === (d.label_rate_unit === null), {
    message: "Give both a label rate and its unit, or neither.",
  });
export type AgrochemicalInput = z.input<typeof AgrochemicalSchema>;

export const TranslationRequestSchema = z.object({
  source_key: z.string().trim().regex(/^[a-z0-9_.:-]{3,200}$/, "Keys use lower-case letters, numbers and . _ : - only."),
  source_text: z.string().trim().min(1).max(2000),
  domain: z.enum(TRANSLATION_DOMAINS),
  target_lang: z.enum(["yo", "ha", "ig", "pcm"]),
});

/** Reads the structured parts of a standard's parameters, ignoring anything malformed. */
export function readParameters(parameters: unknown): {
  stages: Stage[];
  nutrient_plan: NutrientApplication[];
  protection_notes: ProtectionNote[];
  other: Record<string, unknown>;
} {
  const p = parameters && typeof parameters === "object" && !Array.isArray(parameters) ? (parameters as Record<string, unknown>) : {};
  const { stages, nutrient_plan, protection_notes, ...other } = p;
  const list = <T,>(v: unknown, schema: z.ZodType<T>): T[] =>
    Array.isArray(v) ? v.map((x) => schema.safeParse(x)).filter((r) => r.success).map((r) => r.data as T) : [];
  return {
    stages: list(stages, StageSchema as unknown as z.ZodType<Stage>),
    nutrient_plan: list(nutrient_plan, NutrientSchema as unknown as z.ZodType<NutrientApplication>),
    protection_notes: list(protection_notes, ProtectionNoteSchema),
    other,
  };
}

export function totalNitrogen(plan: { n_kg_ha: number }[]): number {
  return Math.round(plan.reduce((sum, a) => sum + (Number.isFinite(a.n_kg_ha) ? a.n_kg_ha : 0), 0) * 100) / 100;
}

export function toNumberOrNull(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Next minor version after the highest existing version for a code: 1.0 -> 1.1, 2.9 -> 2.10. */
export function nextVersion(versions: string[]): string {
  const parsed = versions
    .map((v) => v.split(".").map((x) => Number.parseInt(x, 10)))
    .filter((parts) => parts.every((n) => Number.isFinite(n)));
  if (parsed.length === 0) return "1.0";
  parsed.sort((a, b) => (b[0]! - a[0]!) || ((b[1] ?? 0) - (a[1] ?? 0)));
  const [major, minor = 0] = parsed[0]!;
  return `${major}.${minor + 1}`;
}

export type DiffLine = { field: string; before: string; after: string };

/** Field-level differences between two versions of a standard, for the compare view. */
export function diffStandards(before: StandardRow, after: StandardRow): DiffLine[] {
  const lines: DiffLine[] = [];
  const push = (field: string, a: unknown, b: unknown) => {
    const x = fmt(a);
    const y = fmt(b);
    if (x !== y) lines.push({ field, before: x, after: y });
  };
  push("Title", before.title, after.title);
  push("Zone", before.agro_zone, after.agro_zone);
  push("Source", before.source_authority, after.source_authority);
  push("Maximum nitrogen (kg N/ha)", toNumberOrNull(before.max_nitrogen_kg_ha), toNumberOrNull(after.max_nitrogen_kg_ha));
  push("Mandated operations", before.mandated_operations ?? [], after.mandated_operations ?? []);
  push("Restricted chemicals", before.restricted_chemicals ?? [], after.restricted_chemicals ?? []);
  const pa = readParameters(before.parameters);
  const pb = readParameters(after.parameters);
  const max = Math.max(pa.stages.length, pb.stages.length);
  for (let i = 0; i < max; i++) {
    push(`Stage ${i + 1}`, stageText(pa.stages[i]), stageText(pb.stages[i]));
  }
  const maxN = Math.max(pa.nutrient_plan.length, pb.nutrient_plan.length);
  for (let i = 0; i < maxN; i++) {
    push(`Nutrient application ${i + 1}`, nutrientText(pa.nutrient_plan[i]), nutrientText(pb.nutrient_plan[i]));
  }
  push("Protection notes", pa.protection_notes.map((n) => n.title), pb.protection_notes.map((n) => n.title));
  return lines;
}

function stageText(s: Stage | undefined): string {
  return s ? `${s.name} (day ${s.start_day} to ${s.end_day})${s.description ? `: ${s.description}` : ""}` : "";
}

function nutrientText(a: NutrientApplication | undefined): string {
  return a ? `${a.timing}: ${a.product} ${a.rate_kg_ha} kg/ha (${a.n_kg_ha} kg N/ha)` : "";
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

/** Stable JSON (sorted keys) so the export checksum only changes when content changes. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/** Translation keys for the stages and protection notes of a standard. */
export function standardTranslationSources(
  std: Pick<StandardRow, "standard_code" | "version" | "parameters">,
): { source_key: string; source_text: string; domain: "standard" | "pest" }[] {
  const base = `standard:${std.standard_code.toLowerCase()}:${std.version.replace(/[^0-9.]/g, "")}`;
  const p = readParameters(std.parameters);
  const out: { source_key: string; source_text: string; domain: "standard" | "pest" }[] = [];
  p.stages.forEach((s, i) => {
    out.push({ source_key: `${base}:stage:${i + 1}:name`, source_text: s.name, domain: "standard" });
    if (s.description) out.push({ source_key: `${base}:stage:${i + 1}:description`, source_text: s.description, domain: "standard" });
  });
  p.protection_notes.forEach((n, i) => {
    out.push({ source_key: `${base}:protection:${i + 1}`, source_text: `${n.title}: ${n.text}`.slice(0, 2000), domain: "pest" });
  });
  return out;
}
