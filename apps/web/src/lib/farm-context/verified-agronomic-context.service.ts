import "server-only";
import {
  ACTIVE_CROP_CYCLE_STATUSES,
  FARM_ZONES,
  VALID_GROWTH_STAGES,
  resolveVerifiedAgronomicFarmContextFromSnapshot,
  type FarmZone,
  type LiveFarmContextSnapshot,
  type VerifiedAgronomicFarmContext,
  type VerifiedGeographicZoneResolution,
} from "@cultivanode/shared";
import { verifyFarmPlotAccess, type VerifiedFarmCallerContext } from "@/lib/engines-api-helper";
import { getLiveFarmContextSnapshot } from "@/lib/farm-context/live-farm-context.service";

export interface ClientContextAssertions {
  plotId?: string | null;
  cropId?: string | null;
  cycleId?: string | null;
  zone?: string | null;
  stageName?: string | null;
}

export type ServerVerifiedContextResult =
  | {
      conflict: true;
      httpStatus: 400 | 404 | 422 | 500;
      code:
        | "INVALID_AGRO_ZONE"
        | "ZONE_MISMATCH"
        | "INVALID_GROWTH_STAGE"
        | "GROWTH_STAGE_MISMATCH"
        | "PLOT_ACCESS_DENIED";
      error: string;
    }
  | {
      conflict: false;
      snapshot: LiveFarmContextSnapshot;
      verifiedPlotId?: string;
      /** Stored farm zone from RLS `farms.zone` (for display/conflict checks only; NOT independently geographically verified). */
      verifiedZone?: FarmZone;
      verifiedCropId?: string;
      verifiedGrowthStage?: string;
      /**
       * Trusted immutable agronomic farm context eligible for numerical fertiliser validation.
       * Always `null` when geographic verification is unavailable (`geographic_zone_unverified`),
       * crop cycles are ambiguous (`crop_cycle_ambiguous`), or lifecycle status is ineligible.
       */
      verifiedContext: VerifiedAgronomicFarmContext | null;
      unavailableReasonCode: string | null;
      ambiguousCycleCount?: number;
    };

/**
 * Single authoritative server-side resolver shared by `/api/ai/assistant` and `askFarmAssistantAction`
 * (Batch 04.0-H Revision 6 — Findings 1, 2, and 3).
 *
 * Security & agronomic integrity invariants:
 * - Finding 1 (Geographic Verification): `farms.zone` is a stored farm attribute, NOT independent
 *   geographic verification. Because no authoritative agro-ecological boundary dataset exists in
 *   the repository yet, `verifiedGeographicZone` defaults to `null` and `verifiedContext` fails
 *   closed with `geographic_zone_unverified` (never silently falling back to `farms.zone`).
 * - Finding 2 (Lifecycle Integrity): Preserves actual DB `crop_cycles.status` and never hardcodes
 *   `maintenance` or synthetic `verified_current`.
 * - Finding 3 (Ambiguity Rejection): Uses deterministic `.filter(...)` instead of `.find(...)`;
 *   when multiple active crop cycles match without unique plot/crop disambiguation, refuses to
 *   pick an arbitrary first match and returns `unavailableReasonCode: "crop_cycle_ambiguous"`.
 */
export async function resolveServerVerifiedAgronomicContext(params: {
  caller: VerifiedFarmCallerContext;
  snapshot?: LiveFarmContextSnapshot;
  assertions?: ClientContextAssertions;
  /** Optional server-verified geographic zone resolution when an authoritative boundary dataset is wired. */
  verifiedGeographicZone?: VerifiedGeographicZoneResolution | null;
  referenceDate?: string;
}): Promise<ServerVerifiedContextResult> {
  const { caller, assertions } = params;

  // 1. Verify plot ownership under caller RLS whenever a plotId is asserted
  let verifiedPlotId: string | undefined;
  const rawPlotId = assertions?.plotId?.trim();
  if (rawPlotId) {
    const plotCheck = await verifyFarmPlotAccess(caller.client, caller.farmId, rawPlotId);
    if (!plotCheck.ok) {
      const status = plotCheck.response.status === 500 ? 500 : 404;
      return {
        conflict: true,
        httpStatus: status,
        code: "PLOT_ACCESS_DENIED",
        error: "Plot not found or access denied.",
      };
    }
    verifiedPlotId = plotCheck.plotId;
  }

  // 2. Load RLS-scoped LiveFarmContextSnapshot (if not already provided by caller route)
  const snapshot = params.snapshot ?? (await getLiveFarmContextSnapshot(caller));

  // 3. Validate client zone assertion against stored RLS farm zone (for spoofing rejection only;
  //    this does NOT constitute independent geographic verification for numerical prescriptions).
  const storedFarmZone =
    typeof snapshot.farmZone === "string" &&
    (FARM_ZONES as readonly string[]).includes(snapshot.farmZone.trim().toLowerCase())
      ? (snapshot.farmZone.trim().toLowerCase() as FarmZone)
      : undefined;

  if (assertions?.zone !== undefined && assertions.zone !== null && assertions.zone.trim() !== "") {
    const clientZone = assertions.zone.trim().toLowerCase();
    if (!(FARM_ZONES as readonly string[]).includes(clientZone)) {
      return {
        conflict: true,
        httpStatus: 400,
        code: "INVALID_AGRO_ZONE",
        error: `Invalid agro-ecological zone "${assertions.zone}".`,
      };
    }
    if (!storedFarmZone || clientZone !== storedFarmZone) {
      return {
        conflict: true,
        httpStatus: 422,
        code: "ZONE_MISMATCH",
        error: "Client-supplied agro-ecological zone does not match the verified farm record.",
      };
    }
  }

  // 4. Deterministic, unambiguous active crop-cycle resolution (NEVER `.find(...)` first-match!)
  const allCycles = snapshot.domains?.crop_identity_variety_and_stage?.data?.activeCycles ?? [];
  const requestedCrop = assertions?.cropId?.trim().toLowerCase() || "";
  const requestedCycleId = assertions?.cycleId?.trim() || "";
  const activeStatusSet = new Set<string>(ACTIVE_CROP_CYCLE_STATUSES);

  const scopedActiveCycles = allCycles.filter((c) => {
    if (verifiedPlotId && c.plotId !== verifiedPlotId) return false;
    if (requestedCrop && c.cropId.trim().toLowerCase() !== requestedCrop) return false;
    if (requestedCycleId && c.cycleId !== requestedCycleId) return false;
    // If status is populated, require it to be an active cultivation status; if omitted in legacy mocks,
    // allow downstream `resolveVerifiedAgronomicFarmContextFromSnapshot` to reject `crop_cycle_status_missing`.
    return typeof c.status === "string" && activeStatusSet.has(c.status.trim().toLowerCase());
  });

  const isAmbiguous = scopedActiveCycles.length > 1;
  const matchedCycle = scopedActiveCycles.length === 1 ? scopedActiveCycles[0] : undefined;

  const verifiedStageRaw =
    typeof matchedCycle?.currentStage === "string" ? matchedCycle.currentStage.trim().toLowerCase() : "";
  const verifiedGrowthStage =
    verifiedStageRaw && VALID_GROWTH_STAGES.has(verifiedStageRaw) ? verifiedStageRaw : undefined;

  // Client-supplied stageName is an untrusted assertion: reject invalid or conflicting assertions;
  // NEVER let client stageName override or substitute for a missing, ambiguous, or different cycle stage.
  if (
    assertions?.stageName !== undefined &&
    assertions.stageName !== null &&
    assertions.stageName.trim() !== ""
  ) {
    const clientStage = assertions.stageName.trim().toLowerCase();
    if (!VALID_GROWTH_STAGES.has(clientStage)) {
      return {
        conflict: true,
        httpStatus: 400,
        code: "INVALID_GROWTH_STAGE",
        error: `Invalid crop growth stage "${assertions.stageName}".`,
      };
    }
    if (!verifiedGrowthStage || clientStage !== verifiedGrowthStage) {
      return {
        conflict: true,
        httpStatus: 422,
        code: "GROWTH_STAGE_MISMATCH",
        error: "Client-supplied crop growth stage does not match the verified active crop cycle.",
      };
    }
  }

  // 5. Attempt to mint immutable, WeakSet-registered VerifiedAgronomicFarmContext.
  //    In production, `params.verifiedGeographicZone` is `null` because no authoritative boundary
  //    dataset exists yet, so this fails closed with `geographic_zone_unverified` (or `crop_cycle_ambiguous`).
  const resolution = resolveVerifiedAgronomicFarmContextFromSnapshot(snapshot, {
    plotId: verifiedPlotId,
    cropId: requestedCrop || undefined,
    cycleId: requestedCycleId || undefined,
    verifiedGeographicZone: params.verifiedGeographicZone ?? null,
    referenceDate: params.referenceDate,
  });

  return {
    conflict: false,
    snapshot,
    verifiedPlotId,
    verifiedZone: storedFarmZone,
    verifiedCropId: matchedCycle?.cropId ?? undefined,
    verifiedGrowthStage,
    verifiedContext: resolution.ok ? resolution.context : null,
    unavailableReasonCode: resolution.ok
      ? null
      : isAmbiguous
        ? "crop_cycle_ambiguous"
        : resolution.reasonCode,
    ...(isAmbiguous ? { ambiguousCycleCount: scopedActiveCycles.length } : {}),
  };
}
