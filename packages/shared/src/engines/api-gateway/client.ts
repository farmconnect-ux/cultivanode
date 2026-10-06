import type { CancellationRequest, CancellationOutcome } from '../cancellation-disputes/types';
import type { DisputeArbitrationInput, DisputeArbitrationOutcome } from '../cancellation-disputes/types';
import type { GenerateScheduleParams } from '../agronomy/schedule-generator';
import type { PlantingSchedule } from '../agronomy/types';
import type { SoilNutrientProfile, FertiliserRecommendation, SprayPlan, CropWeatherAlert, WeatherDayForecast } from '../inputs/types';
import type { FarmerContext, GroundedPrompt, GuardrailCheckResult } from '../ai-assistant/types';
import type { AppLanguage } from '../../roles';

// Direct pure functional engine callers
import { evaluateCancellation } from '../cancellation-disputes/cancellation';
import { arbitrateDispute } from '../cancellation-disputes/disputes';
import { generatePlantingSchedule } from '../agronomy/schedule-generator';
import { calculateFertiliserRecommendation } from '../inputs/fertiliser';
import { generateSprayPlan } from '../inputs/spray-planner';
import { evaluateCropWeatherHazards } from '../inputs/weather-alerts';
import { buildGroundedPrompt } from '../ai-assistant/prompt-builder';
import { checkChemicalSafetyGuardrails } from '../ai-assistant/chemical-guardrail';

export interface EngineClientConfig {
  mode: 'in_memory' | 'http';
  apiBaseUrl?: string;
  jwtToken?: string;
}

/**
 * Unified modular client to execute CultivaNode engines.
 * Supports in-memory direct execution for micro-benchmarks/unit-tests,
 * or stateless HTTP execution with JWT Bearer tokens for distributed microservices.
 */
export class CultivaNodeEnginesClient {
  constructor(private config: EngineClientConfig = { mode: 'in_memory' }) {}

  private async fetchHttp<T>(endpoint: string, body: unknown): Promise<T> {
    if (!this.config.apiBaseUrl || !this.config.jwtToken) {
      throw new Error('HTTP mode requires apiBaseUrl and jwtToken');
    }
    const res = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.jwtToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Engine API error [${res.status}]: ${errorText}`);
    }

    return (await res.json()) as T;
  }

  // Cancellation Engine
  async evaluateCancellation(req: CancellationRequest): Promise<CancellationOutcome> {
    if (this.config.mode === 'http') {
      return this.fetchHttp<CancellationOutcome>('/api/engines/cancellation', req);
    }
    return evaluateCancellation(req);
  }

  // Dispute Arbitration Engine
  async arbitrateDispute(input: DisputeArbitrationInput): Promise<DisputeArbitrationOutcome> {
    if (this.config.mode === 'http') {
      return this.fetchHttp<DisputeArbitrationOutcome>('/api/engines/disputes', input);
    }
    return arbitrateDispute(input);
  }

  // Agronomy Schedule Generator
  async generatePlantingSchedule(params: GenerateScheduleParams): Promise<PlantingSchedule> {
    if (this.config.mode === 'http') {
      return this.fetchHttp<PlantingSchedule>('/api/engines/agronomy/schedule', params);
    }
    return generatePlantingSchedule(params);
  }

  // Fertiliser Engine
  async calculateFertiliserRecommendation(
    cropId: string,
    targetYieldTonnesPerHa: number,
    farmAreaHectares: number,
    soil: SoilNutrientProfile
  ): Promise<FertiliserRecommendation> {
    if (this.config.mode === 'http') {
      return this.fetchHttp<FertiliserRecommendation>('/api/engines/agronomy/fertiliser', {
        cropId,
        targetYieldTonnesPerHa,
        farmAreaHectares,
        soil,
      });
    }
    return calculateFertiliserRecommendation(cropId, targetYieldTonnesPerHa, farmAreaHectares, soil);
  }

  // Spray Planner Engine
  async planSpray(
    chemicalId: string,
    areaHectares: number,
    applicationDate: string,
    plannedHarvestDate: string,
    knapsackTankLiters = 16
  ): Promise<SprayPlan> {
    if (this.config.mode === 'http') {
      return this.fetchHttp<SprayPlan>('/api/engines/agronomy/spray', {
        chemicalId,
        areaHectares,
        applicationDate,
        plannedHarvestDate,
        knapsackTankLiters,
      });
    }
    return generateSprayPlan(chemicalId, areaHectares, applicationDate, plannedHarvestDate, knapsackTankLiters);
  }

  // Weather Hazards Engine
  async evaluateWeatherHazards(
    cropId: string,
    stageName: string,
    forecasts: WeatherDayForecast[]
  ): Promise<CropWeatherAlert[]> {
    if (this.config.mode === 'http') {
      return this.fetchHttp<CropWeatherAlert[]>('/api/engines/agronomy/weather-alerts', {
        cropId,
        stageName,
        forecasts,
      });
    }
    return evaluateCropWeatherHazards({ cropId, stageName, forecasts });
  }

  // AI Assistant Grounding & Guardrail
  buildAIPrompt(query: string, context: FarmerContext, language: AppLanguage | 'pcm' = 'en'): GroundedPrompt {
    return buildGroundedPrompt(query, context, language);
  }

  checkAIGuardrails(responseText: string): GuardrailCheckResult {
    return checkChemicalSafetyGuardrails(responseText);
  }
}
