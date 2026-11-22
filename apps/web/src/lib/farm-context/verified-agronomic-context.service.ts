import "server-only";
import {
  FARM_ZONES,
  VALID_GROWTH_STAGES,
  resolveVerifiedAgronomicFarmContextFromSnapshot,
  type FarmZone,
  type LiveFarmContextSnapshot,
  type VerifiedAgronomicFarmContext,
} from "@cultivanode/shared";
import { verifyFarmPlotAccess, type VerifiedFarmCallerContext } from "@/lib/engines-api-helper";
import { getLiveFarmContextSnapshot } from "@/lib/farm-context/live-farm-context.service";

export interface ClientContextAssertions {
  plotId?: string | null;
  cropId?: string | null;
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
      verifiedZone?: FarmZone;
      verifiedCropId?: string;
      verifiedGrowthStage?: string;
      verifiedContext: VerifiedAgronomicFarmContext | null;
      unavailableReasonCode: string | null;
    };

/**
 * Single authoritative server-side resolver shared by `/api/ai/assistant` and `askFarmAssistantAction`
 * (Batch 04.0-H Revision 5, Remediations A, B, C, D).
 *
 * Security invariants:
 * - Resolves geographic zone ONLY from the verified RLS-scoped `farms` record (`snapshot.farmZone`).
 * - Resolves active crop cycle and growth stage ONLY from verified RLS-scoped `crop_cycles` records.
 * - Verifies plot-to-farm ownership under caller RLS via `verifyFarmPlotAccess` when `plotId` is supplied.
 * - Treats client-supplied `zone` and `stageName` strictly as untrusted assertions:
 *   rejects invalid or conflicting assertions (non-disclosing) and NEVER lets them override server records.
 * - Produces a deep-frozen, WeakSet-registered `VerifiedAgronomicFarmContext` when all mandatory
 *   conditions are satisfied, or `verifiedContext: null` (causing numerical prescriptions to fail closed).
 */
export async function resolveServerVerifiedAgronomicContext(params: {
  caller: VerifiedFarmCallerContext;
  snapshot?: LiveFarmContextSnapshot;
  assertions?: ClientContextAssertions;
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

  // 3. Authoritative geographic zone from verified farm record (NEVER from client assertion)
  const verifiedZone =
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
    if (!verifiedZone || clientZone !== verifiedZone) {
      return {
        conflict: true,
        httpStatus: 422,
        code: "ZONE_MISMATCH",
        error: "Client-supplied agro-ecological zone does not match the verified farm record.",
      };
    }
  }

  // 4. Authoritative active crop cycle & growth stage from verified RLS crop_cycles
  const activeCycles = snapshot.domains?.crop_identity_variety_and_stage?.data?.activeCycles ?? [];
  const requestedCrop = assertions?.cropId?.trim().toLowerCase() || "";
  const matchedCycle = activeCycles.find((c) => {
    if (verifiedPlotId && c.plotId !== verifiedPlotId) return false;
    if (requestedCrop && c.cropId.trim().toLowerCase() !== requestedCrop) return false;
    return true;
  });

  const verifiedStageRaw =
    typeof matchedCycle?.currentStage === "string" ? matchedCycle.currentStage.trim().toLowerCase() : "";
  const verifiedGrowthStage =
    verifiedStageRaw && VALID_GROWTH_STAGES.has(verifiedStageRaw) ? verifiedStageRaw : undefined;

  // Client-supplied stageName is an untrusted assertion: reject invalid or conflicting assertions;
  // NEVER let client stageName override or substitute for a missing/different active crop-cycle stage.
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

  // 5. Mint immutable, WeakSet-registered VerifiedAgronomicFarmContext when all checks succeed
  const resolution = resolveVerifiedAgronomicFarmContextFromSnapshot(snapshot, {
    plotId: verifiedPlotId,
    cropId: matchedCycle?.cropId ?? (requestedCrop || undefined),
    referenceDate: params.referenceDate,
  });

  return {
    conflict: false,
    snapshot,
    verifiedPlotId,
    verifiedZone,
    verifiedCropId: matchedCycle?.cropId ?? undefined,
    verifiedGrowthStage,
    verifiedContext: resolution.ok ? resolution.context : null,
    unavailableReasonCode: resolution.ok ? null : resolution.reasonCode,
  };
}
