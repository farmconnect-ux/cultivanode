import { NextResponse } from "next/server";
import { evaluateFertiliserRecommendation, type SoilNutrientProfile } from "@cultivanode/shared";
import { authorizeFarmRequest, parseJsonBody, verifyFarmPlotAccess } from "@/lib/engines-api-helper";
import { FertiliserSchema } from "@/lib/fertiliser-schema";

/**
 * POST /api/engines/agronomy/fertiliser (Batch 04.0-H Revision 4)
 *
 * Security & tenant-isolation boundary:
 * 1. Requires Bearer JWT authentication before disclosing body validation errors.
 * 2. Validates request payload with strict Zod schema (mandatory UUID farmId, typed P/K basis, no overrides).
 * 3. Enforces active-account + caller RLS farm ownership via `authorizeFarmRequest` (ZERO service-role).
 * 4. Enforces caller RLS plot-to-farm ownership via `verifyFarmPlotAccess` when plotId is supplied.
 * 5. Derives authoritative farmId/plotId from verified server-side records and passes `verifiedLabReport: null`
 *    (caller-declared `lab_confirmed` provenance is never trusted as verified laboratory evidence).
 */
export async function POST(req: Request) {
  const hasBearer = /^Bearer\s+\S+$/i.test(req.headers.get("Authorization")?.trim() ?? "");
  if (!hasBearer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(req, FertiliserSchema);
  if (!parsed.ok) return parsed.response;

  // Enforce caller authentication, active account, and RLS-scoped farm ownership (NO service_role).
  const farmAuth = await authorizeFarmRequest(req, parsed.data.farmId, {
    requireActiveAccount: true,
  });
  if (!farmAuth.authorized) return farmAuth.response;

  const verifiedFarmId = farmAuth.farmId;

  // Reject cross-farm soil report association before invoking the engine.
  if (parsed.data.soil.farmId !== verifiedFarmId) {
    return NextResponse.json(
      {
        status: "insufficient_evidence",
        reasonCode: "soil_farm_mismatch",
        error: "Soil test report farm association does not match the verified farm.",
        missingRequirements: ["matching_farm_soil_test"],
        guidance: "Submit a laboratory soil test sampled from your verified farm.",
      },
      { status: 422 },
    );
  }

  // Enforce plot-to-farm ownership under caller RLS whenever a plotId is supplied on request or soil.
  const reqPlotId = parsed.data.plotId;
  const soilPlotId = parsed.data.soil.plotId;
  let verifiedPlotId: string | undefined;

  if (reqPlotId || soilPlotId) {
    if (!reqPlotId || !soilPlotId || reqPlotId !== soilPlotId) {
      return NextResponse.json(
        {
          status: "insufficient_evidence",
          reasonCode: !soilPlotId
            ? "soil_plot_association_missing"
            : !reqPlotId
              ? "plot_id_missing"
              : "soil_plot_mismatch",
          error: "Plot-specific recommendations require matching verified plot associations on both request and soil report.",
          missingRequirements: ["matching_verified_plot_association"],
          guidance: "Specify a valid plot belonging to your verified farm and a matching plot soil test.",
        },
        { status: 422 },
      );
    }

    const plotAccess = await verifyFarmPlotAccess(farmAuth.client, verifiedFarmId, reqPlotId);
    if (!plotAccess.ok) return plotAccess.response;
    verifiedPlotId = plotAccess.plotId;
  }

  const authoritativeSoil: SoilNutrientProfile = {
    ...(parsed.data.soil as SoilNutrientProfile),
    farmId: verifiedFarmId,
    ...(verifiedPlotId ? { plotId: verifiedPlotId } : {}),
    // Caller-declared `lab_confirmed` is never elevated to verified laboratory evidence.
    verifiedLabReport: null,
  };

  const result = evaluateFertiliserRecommendation({
    cropId: parsed.data.cropId,
    targetYieldTonnesPerHa: parsed.data.targetYieldTonnesPerHa,
    farmAreaHectares: parsed.data.farmAreaHectares,
    soil: authoritativeSoil,
    zone: parsed.data.zone,
    growthStage: parsed.data.growthStage,
    farmId: verifiedFarmId,
    plotId: verifiedPlotId,
    requestId: parsed.data.requestId,
  });

  if (!result.ok) {
    const httpStatus = result.status === "invalid_input" ? 400 : 422;
    return NextResponse.json(
      {
        status: result.status,
        reasonCode: result.reasonCode,
        error: result.message,
        missingRequirements: result.missingRequirements,
        guidance: result.guidance,
      },
      { status: httpStatus },
    );
  }

  return NextResponse.json({
    ...result.recommendation,
    recommendationStatus: result.status,
    protocol: result.protocol,
    assumptions: result.assumptions,
    missingInformation: result.missingInformation,
  });
}
