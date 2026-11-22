import { NextResponse } from "next/server";
import { evaluateFertiliserRecommendation, type SoilNutrientProfile } from "@cultivanode/shared";
import { authorizeRequest, parseJsonBody } from "@/lib/engines-api-helper";
import { FertiliserSchema } from "@/lib/fertiliser-schema";

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  const parsed = await parseJsonBody(req, FertiliserSchema);
  if (!parsed.ok) return parsed.response;

  const result = evaluateFertiliserRecommendation({
    cropId: parsed.data.cropId,
    targetYieldTonnesPerHa: parsed.data.targetYieldTonnesPerHa,
    farmAreaHectares: parsed.data.farmAreaHectares,
    soil: parsed.data.soil as SoilNutrientProfile,
    zone: parsed.data.zone,
    growthStage: parsed.data.growthStage,
    requireStrictSoilProvenance: parsed.data.requireStrictSoilProvenance ?? false,
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
