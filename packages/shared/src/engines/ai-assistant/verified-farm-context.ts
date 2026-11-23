import { FARM_ZONES } from '../../roles';
import type { LiveFarmContextSnapshot } from '../farm-context/types';

/** All active cultivation lifecycle statuses permitted by `crop_cycles_status_check`. */
export const ACTIVE_CROP_CYCLE_STATUSES = Object.freeze([
  'land_preparation',
  'planting',
  'establishment',
  'maintenance',
  'harvesting',
] as const);

export type ActiveCropCycleStatus = (typeof ACTIVE_CROP_CYCLE_STATUSES)[number];

/**
 * Subset of active crop-cycle statuses eligible for fertiliser recommendation operations.
 * `harvesting` is an active cultivation status in the schema but is NOT eligible for new
 * fertiliser prescriptions.
 */
export const FERTILISER_ELIGIBLE_CROP_CYCLE_STATUSES = Object.freeze([
  'land_preparation',
  'planting',
  'establishment',
  'maintenance',
] as const);

export type FertiliserEligibleCropCycleStatus = (typeof FERTILISER_ELIGIBLE_CROP_CYCLE_STATUSES)[number];

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
 * Authoritative geographically resolved agro-ecological zone (Batch 04.0-H Revision 6, Finding 1).
 *
 * A farmer-entered or stored `farms.zone` string is NOT independent geographic verification.
 * Because the repository does not yet contain an authoritative agro-ecological boundary dataset
 * or licensed geographic classification service, NO production factory currently mints this type
 * and numerical fertiliser recommendations fail closed with `geographic_zone_unverified`.
 */
export interface VerifiedGeographicZoneResolution {
  readonly zone: string;
  readonly coordinates: { readonly lat: number; readonly lng: number };
  readonly farmId: string;
  readonly plotId?: string;
  readonly datasetId: string;
  readonly datasetVersion: string;
  readonly resolvedAt: string; // strict ISO timestamp
  readonly source: 'authoritative_boundary_dataset';
}

/**
 * Trusted server-verified agronomic farm context (Batch 04.0-H Revision 6).
 *
 * Derived exclusively from authorised RLS-scoped farm, plot, active crop-cycle, and
 * independently verified geographic-zone records. Tracked in a module-private `WeakSet`
 * with an unforgeable `Symbol` brand and deep-frozen so caller-created, cloned, or
 * mutated objects are always rejected fail-closed.
 */
export interface VerifiedAgronomicFarmContext {
  readonly farmId: string;
  readonly plotId?: string;
  readonly zone: string;
  readonly geographicProvenance: {
    readonly coordinates: { readonly lat: number; readonly lng: number };
    readonly datasetId: string;
    readonly datasetVersion: string;
    readonly resolvedAt: string;
    readonly source: 'authoritative_boundary_dataset';
  };
  readonly cropId: string;
  readonly cropCycleId: string;
  readonly cropCycleStatus: FertiliserEligibleCropCycleStatus;
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
        | 'geographic_zone_unverified'
        | 'geographic_zone_invalid'
        | 'geographic_zone_conflict'
        | 'geographic_zone_farm_mismatch'
        | 'geographic_zone_plot_mismatch'
        | 'crop_cycle_missing'
        | 'crop_cycle_ambiguous'
        | 'crop_cycle_selection_required'
        | 'crop_cycle_plot_mismatch'
        | 'crop_cycle_status_missing'
        | 'crop_cycle_inactive'
        | 'crop_cycle_status_ineligible_for_fertiliser'
        | 'growth_stage_missing'
        | 'growth_stage_invalid';
      message: string;
      ambiguousCycleCount?: number;
    };

const TRUSTED_FARM_CONTEXT_BRAND = Symbol('cultivanode.trusted_agronomic_farm_context');
const TRUSTED_FARM_CONTEXT_REGISTRY = new WeakSet<VerifiedAgronomicFarmContext>();

const TRUSTED_GEO_ZONE_BRAND = Symbol('cultivanode.trusted_geographic_zone_resolution');
const TRUSTED_GEO_ZONE_REGISTRY = new WeakSet<VerifiedGeographicZoneResolution>();

function isTestRuntime(): boolean {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.VITEST === 'true' || env?.NODE_ENV === 'test';
}

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

function isValidCoordinates(coords: unknown): coords is { lat: number; lng: number } {
  if (!coords || typeof coords !== 'object') return false;
  const { lat, lng } = coords as { lat?: unknown; lng?: unknown };
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false; // Null Island placeholder
  return true;
}

export function isTrustedGeographicZoneResolution(
  value: unknown,
): value is VerifiedGeographicZoneResolution {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as VerifiedGeographicZoneResolution;
  return (
    TRUSTED_GEO_ZONE_REGISTRY.has(candidate) &&
    (value as Record<symbol, unknown>)[TRUSTED_GEO_ZONE_BRAND] === true &&
    Object.isFrozen(candidate) &&
    Object.isFrozen(candidate.coordinates) &&
    isValidCoordinates(candidate.coordinates) &&
    candidate.source === 'authoritative_boundary_dataset' &&
    typeof candidate.datasetId === 'string' &&
    candidate.datasetId.trim().length > 0 &&
    typeof candidate.datasetVersion === 'string' &&
    candidate.datasetVersion.trim().length > 0
  );
}

/**
 * Internal test-only helper for unit testing geographic-zone verification rules.
 * Refuses to execute outside test runtime and is NOT exported from `@cultivanode/shared`.
 * @internal
 */
export function __mintTestVerifiedGeographicZone(
  data: VerifiedGeographicZoneResolution,
): VerifiedGeographicZoneResolution {
  if (!isTestRuntime()) {
    throw new Error('Test geographic-zone helper is strictly forbidden outside test runtime.');
  }
  const cloned: VerifiedGeographicZoneResolution = {
    ...data,
    coordinates: { ...data.coordinates },
  };
  Object.defineProperty(cloned, TRUSTED_GEO_ZONE_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  deepFreezeContext(cloned);
  TRUSTED_GEO_ZONE_REGISTRY.add(cloned);
  return cloned;
}

function mintTrustedFarmContext(data: VerifiedAgronomicFarmContext): VerifiedAgronomicFarmContext {
  const ctx: VerifiedAgronomicFarmContext = {
    ...data,
    geographicProvenance: {
      ...data.geographicProvenance,
      coordinates: { ...data.geographicProvenance.coordinates },
    },
  };
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
    Object.isFrozen(candidate.geographicProvenance) &&
    candidate.verificationState === 'verified_current' &&
    candidate.source === 'rls_live_farm_context'
  );
}

/**
 * Resolves an immutable, WeakSet-registered `VerifiedAgronomicFarmContext` from an RLS-scoped
 * `LiveFarmContextSnapshot` and an independently verified geographic-zone resolution.
 *
 * Enforces Revision 6 Findings 1, 2, and 3:
 * - Finding 1: Requires `verifiedGeographicZone` from an authoritative boundary dataset; NEVER
 *   silently falls back to `snapshot.farmZone` (`farms.zone`). Fails closed with
 *   `geographic_zone_unverified` when unavailable, or `geographic_zone_conflict` if stored
 *   `farms.zone` contradicts the geographically resolved zone.
 * - Finding 2: Preserves the actual database `crop_cycles.status` (never hardcodes `maintenance`),
 *   rejects missing/inactive/completed/cancelled/archived statuses, and rejects `harvesting` as
 *   ineligible for fertiliser prescriptions.
 * - Finding 3: Uses deterministic `.filter(...)` instead of `.find(...)`; fails closed with
 *   `crop_cycle_ambiguous` whenever multiple active crop cycles match without unique selection.
 */
export function resolveVerifiedAgronomicFarmContextFromSnapshot(
  snapshot: LiveFarmContextSnapshot | null | undefined,
  options?: {
    plotId?: string | null;
    cropId?: string | null;
    cycleId?: string | null;
    verifiedGeographicZone?: VerifiedGeographicZoneResolution | null;
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

  const targetPlotId = options?.plotId?.trim() || '';
  const targetCropId = options?.cropId?.trim().toLowerCase() || '';
  const targetCycleId = options?.cycleId?.trim() || '';

  // Numerical context must identify one exact cycle, plot, and crop. A coincidental single match
  // is not sufficient evidence that the caller selected the intended cultivation cycle.
  if (!targetPlotId || !targetCropId || !targetCycleId) {
    return {
      ok: false,
      reasonCode: 'crop_cycle_selection_required',
      message: 'Explicit plot, crop, and crop-cycle identifiers are required to establish trusted cycle-specific context.',
    };
  }

  // Finding 1: Independent geographic-zone verification (NEVER fall back to stored `farms.zone`)
  const geo = options?.verifiedGeographicZone;
  if (!geo || !isTrustedGeographicZoneResolution(geo)) {
    return {
      ok: false,
      reasonCode: 'geographic_zone_unverified',
      message:
        'Agro-ecological zone has not been independently verified from authoritative geographic boundary data; stored farms.zone alone cannot authorise numerical fertiliser recommendations.',
    };
  }

  const normalizedGeoZone = geo.zone.trim().toLowerCase();
  if (!VALID_AGRO_ZONES.has(normalizedGeoZone)) {
    return {
      ok: false,
      reasonCode: 'geographic_zone_invalid',
      message: `Geographically resolved zone "${geo.zone}" is outside supported agro-ecological zones.`,
    };
  }

  const geoResolvedTs = Date.parse(geo.resolvedAt);
  if (Number.isNaN(geoResolvedTs) || refTs - geoResolvedTs > MAX_VERIFIED_FARM_CONTEXT_AGE_MS || refTs - geoResolvedTs < -60_000) {
    return {
      ok: false,
      reasonCode: 'farm_context_stale',
      message: 'Geographic zone resolution timestamp is stale or invalid.',
    };
  }

  if (geo.farmId.trim() !== snapshot.farmId.trim()) {
    return {
      ok: false,
      reasonCode: 'geographic_zone_farm_mismatch',
      message: 'Geographically verified zone belongs to a different farm.',
    };
  }

  if (targetPlotId && geo.plotId?.trim() && geo.plotId.trim() !== targetPlotId) {
    return {
      ok: false,
      reasonCode: 'geographic_zone_plot_mismatch',
      message: 'Geographically verified zone belongs to a different plot.',
    };
  }

  // Reject conflict between stored `farms.zone` and independently resolved geographic zone
  const storedZone = typeof snapshot.farmZone === 'string' ? snapshot.farmZone.trim().toLowerCase() : '';
  if (storedZone && storedZone !== normalizedGeoZone) {
    return {
      ok: false,
      reasonCode: 'geographic_zone_conflict',
      message: `Stored farm zone "${storedZone}" conflicts with geographically resolved zone "${normalizedGeoZone}".`,
    };
  }

  // Finding 2 & Finding 3: Explicit, unambiguous crop-cycle resolution preserving actual DB status
  const cropDomain = snapshot.domains?.crop_identity_variety_and_stage;
  if (!cropDomain || cropDomain.status === 'error' || !cropDomain.data) {
    return {
      ok: false,
      reasonCode: 'crop_cycle_missing',
      message: 'Active crop-cycle records could not be verified for this farm.',
    };
  }

  const allCycles = cropDomain.data.activeCycles ?? [];
  if (allCycles.length === 0) {
    return {
      ok: false,
      reasonCode: 'crop_cycle_missing',
      message: 'No active crop cycle exists on the verified farm record.',
    };
  }


  const scopedCycles = allCycles.filter((c) => {
    if (targetPlotId && c.plotId !== targetPlotId) return false;
    if (c.cropId.trim().toLowerCase() !== targetCropId) return false;
    if (c.cycleId !== targetCycleId) return false;
    return true;
  });

  if (scopedCycles.length === 0) {
    return {
      ok: false,
      reasonCode: targetPlotId ? 'crop_cycle_plot_mismatch' : 'crop_cycle_missing',
      message: targetPlotId
        ? 'No crop cycle matches the explicitly selected plot, crop, and cycle on this farm.'
        : 'No crop cycle matches the requested crop on this farm.',
    };
  }

  const activeStatusSet = new Set<string>(ACTIVE_CROP_CYCLE_STATUSES);
  const eligibleStatusSet = new Set<string>(FERTILISER_ELIGIBLE_CROP_CYCLE_STATUSES);

  const activeMatches = scopedCycles.filter((c) => {
    const st = typeof c.status === 'string' ? c.status.trim().toLowerCase() : '';
    return activeStatusSet.has(st);
  });

  // Finding 3: NEVER pick `[0]` when multiple active crop cycles match!
  if (activeMatches.length > 1) {
    return {
      ok: false,
      reasonCode: 'crop_cycle_ambiguous',
      message: `Multiple active crop cycles (${activeMatches.length}) match this request; specify the exact plot and crop to uniquely identify one active cycle.`,
      ambiguousCycleCount: activeMatches.length,
    };
  }

  if (activeMatches.length === 0) {
    const hasMissingStatus = scopedCycles.some(
      (c) => typeof c.status !== 'string' || c.status.trim() === '',
    );
    return {
      ok: false,
      reasonCode: hasMissingStatus ? 'crop_cycle_status_missing' : 'crop_cycle_inactive',
      message: hasMissingStatus
        ? 'Crop cycle record is missing its authoritative database lifecycle status.'
        : 'Matched crop cycle is inactive, completed, cancelled, archived, or otherwise not in active cultivation.',
    };
  }

  const matchedCycle = activeMatches[0]!;
  const actualStatus = matchedCycle.status!.trim().toLowerCase();

  // Finding 2: Check fertiliser operation eligibility (e.g. reject `harvesting`)
  if (!eligibleStatusSet.has(actualStatus)) {
    return {
      ok: false,
      reasonCode: 'crop_cycle_status_ineligible_for_fertiliser',
      message: `Crop cycle lifecycle status "${actualStatus}" is not eligible for numerical fertiliser prescriptions.`,
    };
  }

  if (!matchedCycle.cycleId?.trim() || matchedCycle.cycleId !== targetCycleId) {
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
      zone: normalizedGeoZone,
      geographicProvenance: {
        coordinates: { lat: geo.coordinates.lat, lng: geo.coordinates.lng },
        datasetId: geo.datasetId.trim(),
        datasetVersion: geo.datasetVersion.trim(),
        resolvedAt: geo.resolvedAt.trim(),
        source: 'authoritative_boundary_dataset',
      },
      cropId,
      cropCycleId: matchedCycle.cycleId.trim(),
      cropCycleStatus: actualStatus as FertiliserEligibleCropCycleStatus,
      growthStage: rawStage,
      resolvedAt,
      verificationState: 'verified_current',
      source: 'rls_live_farm_context',
    }),
  };
}
