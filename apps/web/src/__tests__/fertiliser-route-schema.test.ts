import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/engines-api-helper", () => ({
  authorizeRequest: vi.fn(),
  parseJsonBody: vi.fn(),
}));

import { FertiliserSchema, SoilSchema } from "@/lib/fertiliser-schema";

const FARM_ID = "11111111-1111-4111-8111-111111111111";

const validSoil = {
  pH: 6.2,
  organicMatterPercent: 2.1,
  phosphorus: {
    value: 12,
    unit: "ppm" as const,
    basis: "elemental_P" as const,
  },
  potassium: {
    value: 140,
    unit: "ppm" as const,
    basis: "elemental_K" as const,
  },
  provenance: "lab_confirmed" as const,
  extractionMethod: "bray_1",
  samplingDepthCm: 15,
  testDate: "2026-10-01",
  farmId: FARM_ID,
};

const validRequest = {
  cropId: "maize",
  targetYieldTonnesPerHa: 5,
  farmAreaHectares: 2,
  zone: "derived_savanna",
  growthStage: "basal",
  farmId: FARM_ID,
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
      phosphorus: { value: 12, unit: "ppm", basis: "elemental_P" },
      potassium: { value: 140, unit: "ppm", basis: "elemental_K" },
      provenance: "lab_confirmed",
      extractionMethod: "bray_1",
      samplingDepthCm: 15,
      testDate: "2026-10-01",
      farmId: FARM_ID,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual(validSoil);
    }
  });

  it("rejects legacy untyped potassiumPpm/phosphorusPpm and ppm/mg_kg missing explicit nutrient basis", () => {
    const { potassium: _k, ...withoutPotassium } = validSoil;
    expect(
      SoilSchema.safeParse({ ...withoutPotassium, potassiumPpm: 140 }).success,
    ).toBe(false);

    const { phosphorus: _p, ...withoutPhosphorus } = validSoil;
    expect(
      SoilSchema.safeParse({ ...withoutPhosphorus, phosphorusPpm: 12 }).success,
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
        phosphorus: { value: 12, unit: "ppm" }, // missing basis
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
    ["phosphorus", { ...validSoil, phosphorus: undefined }],
    ["potassium", { ...validSoil, potassium: undefined }],
    ["provenance", { ...validSoil, provenance: undefined }],
    ["extractionMethod", { ...validSoil, extractionMethod: undefined }],
    ["samplingDepthCm", { ...validSoil, samplingDepthCm: undefined }],
    ["testDate", { ...validSoil, testDate: undefined }],
    ["soil farmId", { ...validSoil, farmId: undefined }],
  ])("rejects missing %s rather than supplying a default", (_field, soil) => {
    expect(SoilSchema.safeParse(soil).success).toBe(false);
  });

  it.each([
    ["pH", { ...validSoil, pH: 15 }],
    ["negative organic matter", { ...validSoil, organicMatterPercent: -0.1 }],
    ["malformed phosphorus", { ...validSoil, phosphorus: { value: Number.NaN, unit: "ppm", basis: "elemental_P" } }],
    ["infinite potassium", { ...validSoil, potassium: { value: Number.POSITIVE_INFINITY, unit: "ppm", basis: "elemental_K" } }],
  ])("rejects invalid %s values", (_field, soil) => {
    expect(SoilSchema.safeParse(soil).success).toBe(false);
  });

  it("accepts a complete fertiliser request and rejects caller bypass flags and protocol overrides", () => {
    expect(FertiliserSchema.safeParse(validRequest).success).toBe(true);
    expect(
      FertiliserSchema.safeParse({ ...validRequest, requireStrictSoilProvenance: false }).success,
    ).toBe(false);
    expect(
      FertiliserSchema.safeParse({
        ...validRequest,
        protocolOverride: { approvalStatus: "agronomist_approved" },
      }).success,
    ).toBe(false);
    expect(
      FertiliserSchema.safeParse({ ...validRequest, approvalStatus: "agronomist_approved" }).success,
    ).toBe(false);
    expect(
      FertiliserSchema.safeParse({ ...validRequest, farmId: undefined }).success,
    ).toBe(false);
    expect(
      FertiliserSchema.safeParse({ ...validRequest, farmId: "not-a-uuid" }).success,
    ).toBe(false);
    expect(
      FertiliserSchema.safeParse({
        ...validRequest,
        soil: { ...validSoil, verifiedLabReport: { verificationStatus: "verified" } },
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
