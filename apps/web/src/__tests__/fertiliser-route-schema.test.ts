import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/engines-api-helper", () => ({
  authorizeRequest: vi.fn(),
  parseJsonBody: vi.fn(),
}));

import { FertiliserSchema, SoilSchema } from "@/app/api/engines/agronomy/fertiliser/route";

const validSoil = {
  pH: 6.2,
  organicMatterPercent: 2.1,
  phosphorusPpm: 12,
  potassiumPpm: 140,
};

const validRequest = {
  cropId: "maize",
  targetYieldTonnesPerHa: 5,
  farmAreaHectares: 2,
  soil: validSoil,
};

describe("fertiliser route input validation", () => {
  it("accepts complete finite soil test data and maps canonical fields", () => {
    const parsed = SoilSchema.safeParse(validSoil);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual(validSoil);
    }
  });

  it("accepts supported legacy aliases without inventing values", () => {
    const parsed = SoilSchema.safeParse({
      ph: 6.2,
      organicMatterPct: 2.1,
      phosphorusPpm: 12,
      potassiumPpm: 140,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual(validSoil);
    }
  });

  it.each([
    ["pH", { organicMatterPercent: 2.1, phosphorusPpm: 12, potassiumPpm: 140 }],
    ["organic matter", { pH: 6.2, phosphorusPpm: 12, potassiumPpm: 140 }],
    ["phosphorus", { pH: 6.2, organicMatterPercent: 2.1, potassiumPpm: 140 }],
    ["potassium", { pH: 6.2, organicMatterPercent: 2.1, phosphorusPpm: 12 }],
  ])("rejects missing %s rather than supplying a default", (_field, soil) => {
    expect(SoilSchema.safeParse(soil).success).toBe(false);
  });

  it.each([
    ["pH", { ...validSoil, pH: 15 }],
    ["negative organic matter", { ...validSoil, organicMatterPercent: -0.1 }],
    ["malformed phosphorus", { ...validSoil, phosphorusPpm: Number.NaN }],
    ["infinite potassium", { ...validSoil, potassiumPpm: Number.POSITIVE_INFINITY }],
  ])("rejects invalid %s values", (_field, soil) => {
    expect(SoilSchema.safeParse(soil).success).toBe(false);
  });

  it("accepts a complete fertiliser request", () => {
    expect(FertiliserSchema.safeParse(validRequest).success).toBe(true);
  });

  it("rejects non-finite yield and area values", () => {
    expect(FertiliserSchema.safeParse({
      ...validRequest,
      targetYieldTonnesPerHa: Number.POSITIVE_INFINITY,
    }).success).toBe(false);
    expect(FertiliserSchema.safeParse({
      ...validRequest,
      farmAreaHectares: Number.NaN,
    }).success).toBe(false);
  });
});
