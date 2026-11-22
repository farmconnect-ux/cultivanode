import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/engines-api-helper", () => ({
  authorizeRequest: vi.fn(),
  parseJsonBody: vi.fn(),
}));

import { FertiliserSchema, SoilSchema } from "@/lib/fertiliser-schema";

const validSoil = {
  pH: 6.2,
  organicMatterPercent: 2.1,
  phosphorusPpm: 12,
  potassium: {
    value: 140,
    unit: "ppm" as const,
    basis: "elemental_K" as const,
  },
  provenance: "lab_confirmed" as const,
  extractionMethod: "bray_1",
  samplingDepthCm: 15,
  testDate: "2026-10-01",
};

const validRequest = {
  cropId: "maize",
  targetYieldTonnesPerHa: 5,
  farmAreaHectares: 2,
  zone: "derived_savanna",
  growthStage: "basal",
  soil: validSoil,
};

describe("fertiliser route input validation (Batch 04.0-H Revision 2)", () => {
  it("accepts complete finite laboratory soil test data with explicit potassium basis and provenance", () => {
    const parsed = SoilSchema.safeParse(validSoil);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual(validSoil);
    }
  });

  it("accepts supported pH and organicMatterPct aliases without inventing values", () => {
    const parsed = SoilSchema.safeParse({
      ph: 6.2,
      organicMatterPct: 2.1,
      phosphorusPpm: 12,
      potassium: { value: 140, unit: "ppm", basis: "elemental_K" },
      provenance: "lab_confirmed",
      extractionMethod: "bray_1",
      samplingDepthCm: 15,
      testDate: "2026-10-01",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual(validSoil);
    }
  });

  it("rejects legacy untyped potassiumPpm and ppm/mg_kg missing explicit nutrient basis", () => {
    const { potassium: _k, ...withoutPotassium } = validSoil;
    expect(
      SoilSchema.safeParse({ ...withoutPotassium, potassiumPpm: 140 }).success,
    ).toBe(false);

    expect(
      SoilSchema.safeParse({
        ...validSoil,
        potassium: { value: 140, unit: "ppm" }, // missing basis
      }).success,
    ).toBe(false);

    expect(
      SoilSchema.safeParse({
        ...validSoil,
        potassium: { value: 0.25, unit: "cmol_kg", basis: "K2O" }, // incompatible
      }).success,
    ).toBe(false);
  });

  it.each([
    ["pH", { ...validSoil, pH: undefined }],
    ["organic matter", { ...validSoil, organicMatterPercent: undefined }],
    ["phosphorus", { ...validSoil, phosphorusPpm: undefined }],
    ["potassium", { ...validSoil, potassium: undefined }],
    ["provenance", { ...validSoil, provenance: undefined }],
    ["extractionMethod", { ...validSoil, extractionMethod: undefined }],
    ["samplingDepthCm", { ...validSoil, samplingDepthCm: undefined }],
    ["testDate", { ...validSoil, testDate: undefined }],
  ])("rejects missing %s rather than supplying a default", (_field, soil) => {
    expect(SoilSchema.safeParse(soil).success).toBe(false);
  });

  it.each([
    ["pH", { ...validSoil, pH: 15 }],
    ["negative organic matter", { ...validSoil, organicMatterPercent: -0.1 }],
    ["malformed phosphorus", { ...validSoil, phosphorusPpm: Number.NaN }],
    ["infinite potassium", { ...validSoil, potassium: { value: Number.POSITIVE_INFINITY, unit: "ppm", basis: "elemental_K" } }],
  ])("rejects invalid %s values", (_field, soil) => {
    expect(SoilSchema.safeParse(soil).success).toBe(false);
  });

  it("accepts a complete fertiliser request and rejects caller bypass flags like requireStrictSoilProvenance=false", () => {
    expect(FertiliserSchema.safeParse(validRequest).success).toBe(true);
    expect(
      FertiliserSchema.safeParse({
        ...validRequest,
        requireStrictSoilProvenance: false,
      }).success,
    ).toBe(false);
  });

  it("rejects missing zone, missing growthStage, unsupported crops, and non-finite yield/area", () => {
    expect(FertiliserSchema.safeParse({ ...validRequest, zone: undefined }).success).toBe(false);
    expect(FertiliserSchema.safeParse({ ...validRequest, growthStage: undefined }).success).toBe(false);
    expect(FertiliserSchema.safeParse({ ...validRequest, cropId: "bell-pepper" }).success).toBe(false);
    expect(FertiliserSchema.safeParse({ ...validRequest, targetYieldTonnesPerHa: Number.POSITIVE_INFINITY }).success).toBe(false);
    expect(FertiliserSchema.safeParse({ ...validRequest, farmAreaHectares: Number.NaN }).success).toBe(false);
  });
});
