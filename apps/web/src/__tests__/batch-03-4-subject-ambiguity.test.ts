import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/engines-api-helper", async () => {
  const actual = await vi.importActual<typeof import("@/lib/engines-api-helper")>("@/lib/engines-api-helper");
  return {
    ...actual,
    verifyFarmPlotAccess: vi.fn(async (_c: unknown, _f: string, plotId: string) => ({ ok: true, plotId })),
  };
});
vi.mock("@/lib/farm-context/live-farm-context.service", () => ({
  getLiveFarmContextSnapshot: vi.fn(),
}));

import { resolveServerVerifiedAgronomicContext } from "@/lib/farm-context/verified-agronomic-context.service";

/**
 * Batch 03.4, LFC-AC-04: when more than one active crop cycle matches and none is selected,
 * the server names the candidates (`subject_ambiguous`) instead of guessing a cycle.
 */

const FARM_ID = "11111111-1111-4111-8111-111111111111";
const PLOT_A = "33333333-3333-4333-8333-333333333333";
const PLOT_B = "44444444-4444-4444-8444-444444444444";

const caller = {
  user: { id: "user-1" } as never,
  farmId: FARM_ID,
  client: {} as never,
  verifiedAt: new Date().toISOString(),
};

const cycles = [
  { cycleId: "cycle-maize", plotId: PLOT_A, cropId: "maize", status: "maintenance", currentStage: "vegetative", plantingDate: "2026-09-01", state: "unverified_provisional" },
  { cycleId: "cycle-cassava", plotId: PLOT_B, cropId: "cassava", status: "maintenance", currentStage: "vegetative", plantingDate: "2026-06-10", state: "unverified_provisional" },
  { cycleId: "cycle-old", plotId: PLOT_B, cropId: "maize", status: "completed", currentStage: "harvest", plantingDate: "2026-03-01", state: "unverified_provisional" },
];

const snapshot = () =>
  ({
    farmId: FARM_ID,
    farmZone: "derived_savanna",
    farmQueryStatus: "ok",
    retrievedAt: new Date().toISOString(),
    domains: {
      crop_identity_variety_and_stage: {
        status: "ok",
        data: {
          activeCycles: cycles,
          fallbackPlotCrops: [
            { plotId: PLOT_A, plotName: "North plot", currentCrop: "maize", state: "unverified_provisional" },
            { plotId: PLOT_B, plotName: "River plot", currentCrop: "cassava", state: "unverified_provisional" },
          ],
        },
      },
    },
    auditContextRefs: [],
  }) as never;

describe("LFC-AC-04 subject ambiguity", () => {
  it("returns the active candidates with plot names when no cycle is selected", async () => {
    const res = await resolveServerVerifiedAgronomicContext({ caller, snapshot: snapshot() });
    expect(res.conflict).toBe(false);
    if (res.conflict) return;
    expect(res.verifiedContext).toBeNull();
    expect(res.unavailableReasonCode).toBe("crop_cycle_ambiguous");
    expect(res.subjectAmbiguity?.status).toBe("subject_ambiguous");
    expect(res.subjectAmbiguity?.candidates.map((c) => c.cycleId)).toEqual(["cycle-maize", "cycle-cassava"]);
    expect(res.subjectAmbiguity?.candidates[0]).toMatchObject({ cropId: "maize", plotName: "North plot", plantingDate: "2026-09-01" });
    // Completed cycles are never offered.
    expect(res.subjectAmbiguity?.candidates.some((c) => c.cycleId === "cycle-old")).toBe(false);
  });

  it("narrows by crop and is not ambiguous when only one active cycle matches", async () => {
    const res = await resolveServerVerifiedAgronomicContext({ caller, snapshot: snapshot(), assertions: { cropId: "cassava" } });
    expect(res.conflict).toBe(false);
    if (res.conflict) return;
    expect(res.subjectAmbiguity).toBeUndefined();
    expect(res.verifiedCropId).toBe("cassava");
  });

  it("is not ambiguous once the farmer picks a cycle", async () => {
    const res = await resolveServerVerifiedAgronomicContext({
      caller,
      snapshot: snapshot(),
      assertions: { plotId: PLOT_A, cropId: "maize", cycleId: "cycle-maize" },
    });
    expect(res.conflict).toBe(false);
    if (res.conflict) return;
    expect(res.subjectAmbiguity).toBeUndefined();
    expect(res.unavailableReasonCode).not.toBe("crop_cycle_ambiguous");
  });

  it("the audited route passes the ambiguity to the assistant", () => {
    const src = readFileSync(resolve(__dirname, "../app/api/ai/assistant/route.ts"), "utf8");
    expect(src).toMatch(/subjectAmbiguity:\s*verifiedCtxRes\.subjectAmbiguity \?\? null/);
  });

  it("the web assistant offers the candidates as choices", () => {
    const src = readFileSync(resolve(__dirname, "../components/account/ai-farm-assistant.tsx"), "utf8");
    expect(src).toContain("res.subjectAmbiguity?.candidates");
    expect(src).toContain("Which crop is this about?");
  });
});
