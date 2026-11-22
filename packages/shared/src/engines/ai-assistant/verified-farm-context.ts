import { FARM_ZONES } from '../../roles';
import type { LiveFarmContextSnapshot } from '../farm-context/types';

export const ACTIVE_CROP_CYCLE_STATUSES = Object.freeze([
  'land_preparation',
  'planting',
  'establishment',
  'maintenance',
  'harvesting',
] as const);

export type ActiveCropCycleStatus = (typeof ACTIVE_CROP_CYCLE_STATUSES)[number];

export const VALID_AGRO_ZONES: ReadonlySet<string> = new Set<string>([
  ...FARM_ZONES,
  'southern_guinea_savanna',
  'northern_guinea_savanna',
  'sudan_savanna',
  'sahel_savanna',
  'mangrove_swamp',
  'mid_altitude',
]);

export const VALID_GROWTH_STAGES: ReadonlySet<string> = new Set<string>([
  'pre_planting',
  'pre-planting',
  'planting',
  'basal',
  'emergence',
  'seedling',
  'vegetative',
  'tillering',
  'flowering',
  'fruiting',
  'pod_filling',
  'tuber_initiation',
  'bulking',
  'maturation',
  'harvest',
  'top_dress',
  'split',
]);

/** Maximum age of a live farm context snapshot before it is considered stale (15 minutes). */
export const MAX_VERIFIED_FARM_CONTEXT_AGE_MS = 15 * 60 * 1000;

/**
 * Trusted server-verified agronomic farm context (Batch 04.0-H Revision 5).
 *
 * Derived exclusively from authorised RLS-scoped farm, plot, and active crop-cycle records.
 * Tracked in a module-private `WeakSet` with an unforgeable `Symbol` brand and deep-frozen
 * so caller-created, cloned, or mutated objects are always rejected fail-closed.
 */
export interface VerifiedAgronomicFarmContext {
  readonly farmId: string;
  readonly plotId?: string;
  readonly zone: string;
  readonly cropId: string;
  readonly cropCycleId: string;
  readonly cropCycleStatus: ActiveCropCycleStatus;
  readonly growthStage: string;
  readonly resolvedAt: string; // strict ISO timestamp
  readonly verificationState: 'verified_current';
  readonly source: 'rls_live_farm_context';
}

export type VerifiedFarmContextResolutionResult =
  | {
      ok: true;
      context: VerifiedAgronomicFarmContext;
    }
  | {
      ok: false;
      reasonCode:
        | 'farm_context_unavailable'
        | 'farm_context_stale'
        | 'farm_zone_unverified'
        | 'crop_cycle_missing'
        | 'crop_cycle_plot_mismatch'
        | 'crop_cycle_inactive'
        | 'growth_stage_missing'
        | 'growth_stage_invalid';
      message: string;
    };

const TRUSTED_FARM_CONTEXT_BRAND = Symbol('cultivanode.trusted_agronomic_farm_context');
const TRUSTED_FARM_CONTEXT_REGISTRY = new WeakSet<VerifiedAgronomicFarmContext>();

function deepFreezeContext<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object') {
    for (const key of Reflect.ownKeys(value as object)) {
      const child = (value as Record<PropertyKey, unknown>)[key];
      if (child !== null && typeof child === 'object') {
        deepFreezeContext(child);
      }
    }
    Object.freeze(value);
  }
  return value;
}

function mintTrustedFarmContext(data: VerifiedAgronomicFarmContext): VerifiedAgronomicFarmContext {
  const ctx: VerifiedAgronomicFarmContext = { ...data };
  Object.defineProperty(ctx, TRUSTED_FARM_CONTEXT_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  deepFreezeContext(ctx);
  TRUSTED_FARM_CONTEXT_REGISTRY.add(ctx);
  return ctx;
}

export function isTrustedVerifiedFarmContext(value: unknown): value is VerifiedAgronomicFarmContext {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as VerifiedAgronomicFarmContext;
  return (
    TRUSTED_FARM_CONTEXT_REGISTRY.has(candidate) &&
    (value as Record<symbol, unknown>)[TRUSTED_FARM_CONTEXT_BRAND] === true &&
    Object.isFrozen(candidate) &&
    candidate.verificationState === 'verified_current' &&
    candidate.source === 'rls_live_farm_context'
  );
}

/**
 * Resolves an immutable, WeakSet-registered `VerifiedAgronomicFarmContext` from an RLS-scoped
 * `LiveFarmContextSnapshot`. Fails closed when farm zone, active crop cycle, plot match,
 * growth stage, or snapshot freshness cannot be established.
 */
export function resolveVerifiedAgronomicFarmContextFromSnapshot(
  snapshot: LiveFarmContextSnapshot | null | undefined,
  options?: {
    plotId?: string | null;
    cropId?: string | null;
    referenceDate?: string;
  },
): VerifiedFarmContextResolutionResult {
  if (!snapshot || !snapshot.farmId?.trim()) {
    return {
      ok: false,
      reasonCode: 'farm_context_unavailable',
      message: 'Verified RLS farm context snapshot is unavailable.',
    };
  }

  if (snapshot.farmQueryStatus && snapshot.farmQueryStatus !== 'ok') {
    return {
      ok: false,
      reasonCode: 'farm_context_unavailable',
      message: `Farm record query status is "${snapshot.farmQueryStatus}"; verified context cannot be established.`,
    };
  }

  const resolvedAt = snapshot.retrievedAt?.trim() ?? '';
  const resolvedTs = Date.parse(resolvedAt);
  const refTs = options?.referenceDate ? Date.parse(options.referenceDate) : Date.now();
  if (!resolvedAt || Number.isNaN(resolvedTs) || Number.isNaN(refTs)) {
    return {
      ok: false,
      reasonCode: 'farm_context_stale',
      message: 'Farm context retrieval timestamp is missing or invalid.',
    };
  }
  const ageMs = refTs - resolvedTs;
  if (ageMs > MAX_VERIFIED_FARM_CONTEXT_AGE_MS || ageMs < -60_000) {
    return {
      ok: false,
      reasonCode: 'farm_context_stale',
      message: 'Farm context snapshot is stale or future-dated and cannot authorise a numerical recommendation.',
    };
  }

  const rawZone = typeof snapshot.farmZone === 'string' ? snapshot.farmZone.trim().toLowerCase() : '';
  if (!rawZone || !VALID_AGRO_ZONES.has(rawZone)) {
    return {
      ok: false,
      reasonCode: 'farm_zone_unverified',
      message: 'Authoritative agro-ecological zone is missing or invalid on the verified farm record.',
    };
  }

  const cropDomain = snapshot.domains?.crop_identity_variety_and_stage;
  if (!cropDomain || cropDomain.status === 'error' || !cropDomain.data) {
    return {
      ok: false,
      reasonCode: 'crop_cycle_missing',
      message: 'Active crop-cycle records could not be verified for this farm.',
    };
  }

  const activeCycles = cropDomain.data.activeCycles ?? [];
  if (activeCycles.length === 0) {
    return {
      ok: false,
      reasonCode: 'crop_cycle_missing',
      message: 'No active crop cycle exists on the verified farm record.',
    };
  }

  const targetPlotId = options?.plotId?.trim() || '';
  const targetCropId = options?.cropId?.trim().toLowerCase() || '';

  let matchedCycle = activeCycles.find((c) => {
    if (targetPlotId && c.plotId !== targetPlotId) return false;
    if (targetCropId && c.cropId.trim().toLowerCase() !== targetCropId) return false;
    return true;
  });

  if (!matchedCycle) {
    if (targetPlotId) {
      return {
        ok: false,
        reasonCode: 'crop_cycle_plot_mismatch',
        message: 'No active crop cycle matches the verified plot and crop.',
      };
    }
    return {
      ok: false,
      reasonCode: 'crop_cycle_missing',
      message: 'No active crop cycle matches the requested crop on this farm.',
    };
  }

  if (matchedCycle.state !== 'verified_current' || !matchedCycle.cycleId?.trim()) {
    return {
      ok: false,
      reasonCode: 'crop_cycle_inactive',
      message: 'Crop cycle record is not verified_current or lacks a valid cycle identifier.',
    };
  }

  const rawStage = typeof matchedCycle.currentStage === 'string' ? matchedCycle.currentStage.trim().toLowerCase() : '';
  if (!rawStage) {
    return {
      ok: false,
      reasonCode: 'growth_stage_missing',
      message: 'Active crop cycle does not have a recorded growth stage.',
    };
  }
  if (!VALID_GROWTH_STAGES.has(rawStage)) {
    return {
      ok: false,
      reasonCode: 'growth_stage_invalid',
      message: `Recorded crop growth stage "${matchedCycle.currentStage}" is not a recognized agronomic stage.`,
    };
  }

  const cropId = matchedCycle.cropId.trim().toLowerCase();
  if (!cropId) {
    return {
      ok: false,
      reasonCode: 'crop_cycle_missing',
      message: 'Active crop cycle is missing crop identity.',
    };
  }

  const resolvedPlotId = targetPlotId || matchedCycle.plotId?.trim() || undefined;

  return {
    ok: true,
    context: mintTrustedFarmContext({
      farmId: snapshot.farmId.trim(),
      ...(resolvedPlotId ? { plotId: resolvedPlotId } : {}),
      zone: rawZone,
      cropId,
      cropCycleId: matchedCycle.cycleId.trim(),
      cropCycleStatus: 'maintenance',
      growthStage: rawStage,
      resolvedAt,
      verificationState: 'verified_current',
      source: 'rls_live_farm_context',
    }),
  };
}
