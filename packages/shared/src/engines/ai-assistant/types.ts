import type { FarmZone, AppLanguage } from '../../roles';
import type { AgronomySeason } from '../agronomy/types';

export interface FarmerContext {
  farmerId: string;
  cropId: string;
  varietyId?: string;
  /** Verified agro-ecological zone when known; MUST remain undefined when unverified (never invented). */
  zone?: FarmZone;
  season?: AgronomySeason;
  stageName?: string;
  daysAfterPlanting?: number;
  farmId?: string;
  plotId?: string;
  /** Exact active crop_cycles.id selected by the farmer; required for trusted crop-cycle context. */
  cycleId?: string;
  requestId?: string;
}

export interface GroundedKnowledgeSnippet {
  sourceTitle: string;
  sourceVersion: number;
  approvedBy?: string;
  status?: 'draft' | 'published';
  content: string;
}

export interface GroundedPrompt {
  language: AppLanguage | 'pcm';
  systemPrompt: string;
  userPrompt: string;
  contextSources: GroundedKnowledgeSnippet[];
}

export interface GuardrailCheckResult {
  passed: boolean;
  bannedChemicalsDetected: string[];
  approvedChemicalsDetected: string[];
  safetyAppendices: string[];
  sanitizedResponseText: string;
}
