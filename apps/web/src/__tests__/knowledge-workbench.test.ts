import { describe, expect, it } from "vitest";
import {
  AgrochemicalSchema,
  NewStandardSchema,
  StandardDraftSchema,
  diffStandards,
  nextVersion,
  readParameters,
  stableStringify,
  standardTranslationSources,
  totalNitrogen,
  type StandardRow,
} from "@/lib/admin/knowledge";

const base: StandardRow = {
  id: "00000000-0000-4000-8000-000000000001",
  standard_code: "GAP_LETTUCE_DS",
  crop_or_livestock_id: "lettuce",
  agro_zone: "derived_savanna",
  version: "1.0",
  title: "Lettuce",
  description: null,
  source_authority: "TEST",
  status: "draft",
  is_active: false,
  parameters: {
    seed_rate_g_ha: 500,
    stages: [{ name: "Nursery", start_day: -28, end_day: 0, description: "Raise seedlings" }],
    nutrient_plan: [{ timing: "Basal", product: "NPK 15-15-15", rate_kg_ha: 200, n_kg_ha: 30 }],
    protection_notes: [{ title: "Aphids", text: "Scout weekly" }],
  },
  mandated_operations: ["Nursery"],
  restricted_chemicals: ["paraquat"],
  max_nitrogen_kg_ha: "100",
  author_id: null,
  reviewer_id: null,
  approved_by_name: null,
  published_at: null,
  effective_from: null,
  effective_to: null,
  supersedes_id: null,
  change_notes: null,
  created_at: "2026-11-24T00:00:00Z",
};

const draft = {
  id: base.id,
  title: "Lettuce",
  description: "",
  agro_zone: "derived_savanna",
  source_authority: "TEST",
  max_nitrogen_kg_ha: 100,
  stages: [{ name: "Nursery", start_day: -28, end_day: 0 }],
  nutrient_plan: [{ timing: "Basal", product: "NPK", rate_kg_ha: 200, n_kg_ha: 30 }],
  protection_notes: [],
  mandated_operations: [],
  restricted_chemicals: [],
};

describe("knowledge workbench helpers", () => {
  it("reads structured parameters and keeps other keys", () => {
    const p = readParameters(base.parameters);
    expect(p.stages).toHaveLength(1);
    expect(p.nutrient_plan[0]?.n_kg_ha).toBe(30);
    expect(p.other).toEqual({ seed_rate_g_ha: 500 });
    expect(readParameters(null).stages).toEqual([]);
    expect(readParameters({ stages: "bad" }).stages).toEqual([]);
  });

  it("totals nitrogen", () => {
    expect(totalNitrogen([{ n_kg_ha: 30 }, { n_kg_ha: 46.5 }])).toBe(76.5);
  });

  it("refuses a nutrient plan above the maximum nitrogen", () => {
    expect(StandardDraftSchema.safeParse(draft).success).toBe(true);
    const over = StandardDraftSchema.safeParse({
      ...draft,
      nutrient_plan: [{ timing: "Top", product: "Urea", rate_kg_ha: 300, n_kg_ha: 138 }],
    });
    expect(over.success).toBe(false);
    expect(over.error?.issues[0]?.message).toContain("above this standard's maximum");
  });

  it("refuses a stage that ends before it starts", () => {
    const r = StandardDraftSchema.safeParse({ ...draft, stages: [{ name: "x", start_day: 10, end_day: 5 }] });
    expect(r.success).toBe(false);
  });

  it("validates new standard codes and versions", () => {
    const ok = {
      standard_code: "GAP_LETTUCE_DS",
      crop_or_livestock_id: "lettuce",
      agro_zone: "derived_savanna",
      version: "1.0",
      title: "Lettuce",
      source_authority: "TEST",
      max_nitrogen_kg_ha: null,
      supersedes_id: null,
      copy_from_id: null,
    };
    expect(NewStandardSchema.safeParse(ok).success).toBe(true);
    expect(NewStandardSchema.safeParse({ ...ok, standard_code: "gap lettuce" }).success).toBe(false);
    expect(NewStandardSchema.safeParse({ ...ok, version: "v1" }).success).toBe(false);
  });

  it("requires a rate and unit together for agrochemicals", () => {
    const base = {
      id: null,
      trade_name: "Test",
      product_category: "insecticide" as const,
      active_ingredients: "Emamectin benzoate 50 g/kg",
      label_rate_value: 250,
      label_rate_unit: "g/ha" as const,
      rei_hours: 12,
      phi_days: 14,
      who_hazard_class: "III" as const,
      target_crops: [],
      target_pests: [],
      label_source: "Label",
    };
    expect(AgrochemicalSchema.safeParse(base).success).toBe(true);
    expect(AgrochemicalSchema.safeParse({ ...base, label_rate_unit: null }).success).toBe(false);
  });

  it("computes the next version", () => {
    expect(nextVersion([])).toBe("1.0");
    expect(nextVersion(["1.0", "1.1"])).toBe("1.2");
    expect(nextVersion(["2.9", "1.4"])).toBe("2.10");
  });

  it("diffs two versions field by field", () => {
    const after: StandardRow = {
      ...base,
      version: "1.1",
      title: "Lettuce v2",
      parameters: { stages: [{ name: "Nursery", start_day: -21, end_day: 0 }] },
    };
    const lines = diffStandards(base, after);
    expect(lines.map((l) => l.field)).toEqual(
      expect.arrayContaining(["Title", "Stage 1", "Nutrient application 1", "Protection notes"]),
    );
    expect(diffStandards(base, base)).toEqual([]);
  });

  it("builds stable JSON regardless of key order", () => {
    expect(stableStringify({ b: 1, a: [{ d: 2, c: 3 }] })).toBe(stableStringify({ a: [{ c: 3, d: 2 }], b: 1 }));
  });

  it("creates valid translation keys for a standard", () => {
    const sources = standardTranslationSources(base);
    expect(sources.map((s) => s.source_key)).toEqual([
      "standard:gap_lettuce_ds:1.0:stage:1:name",
      "standard:gap_lettuce_ds:1.0:stage:1:description",
      "standard:gap_lettuce_ds:1.0:protection:1",
    ]);
    for (const s of sources) expect(s.source_key).toMatch(/^[a-z0-9_.:-]{3,200}$/);
  });
});
