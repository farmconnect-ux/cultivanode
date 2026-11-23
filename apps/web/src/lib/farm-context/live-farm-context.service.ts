import "server-only";
import {
  PROVISIONAL_SOIL_TEST_VALIDITY_DAYS,
  PROVISIONAL_SOIL_VALIDITY_NOTE,
  aggregateMachineryUsageLogs,
  calculateInventoryLedgerBalances,
  evaluateInventoryLedgerConsistency,
  evaluateMachineryTelemetryConsistency,
  extractSnapshotAuditReferences,
  makeNumericFact,
  matchFarmWeatherForecast,
  normalizeAuditContextReferences,
  parseFarmLocationCoordinates,
  selectAuthoritativeSoilRecord,
  type AuditContextReference,
  type ContextConflictDetail,
  type ContextFact,
  type ContextState,
  type ContextValidationIssue,
  type CoreQueryError,
  type CoreQueryStatus,
  type CropIdentityDomainData,
  type DomainContextSection,
  type EquipmentTelemetryDomainData,
  type FarmContextDomain,
  type FarmInventoryDomainData,
  type FarmerObservationsDomainData,
  type FinancialMarketplaceDomainData,
  type InventoryTransactionInput,
  type LiveFarmContextSnapshot,
  type MachineryUsageLogInput,
  type QueryErrorKind,
  type SoilChemistryDomainData,
  type SoilMoistureDomainData,
  type SoilRecordCandidate,
  type WeatherDomainData,
} from "@cultivanode/shared";
import type { VerifiedFarmCallerContext } from "@/lib/engines-api-helper";

/**
 * CultivaNode 3.0 — Batch 03.1C / 03.1D RLS-Scoped LiveFarmContextService (ADR-001, ADR-007).
 *
 * Security & data-integrity invariants:
 * - Server-only.
 * - Executes 100% of queries through `caller.client` (the caller's verified Supabase JWT + RLS).
 * - ZERO `service_role` reads of farm data.
 * - Explicit column selection, deterministic ordering, complete pagination for ledger/usage aggregates.
 * - Initial `farms` and `plots` query errors are explicitly classified and propagated — never coerced to empty/missing.
 * - Every fact carries provenance pointing to its actual evidence table and record ID (never fabricated).
 */

const MAX_DOMAIN_ROWS = 50;
const PAGINATION_PAGE_SIZE = 1000;
const MAX_INVENTORY_TX_PAGES = 50; // 50,000 transactions safety bound
const MAX_USAGE_LOG_PAGES = 20; // 20,000 usage sessions safety bound

interface SupabaseQueryErrorLike {
  code?: string | null;
  message?: string | null;
  status?: number | null;
}

function classifyQueryError(error: SupabaseQueryErrorLike | null | undefined): QueryErrorKind {
  const code = String(error?.code ?? "");
  const msg = String(error?.message ?? "").toLowerCase();
  if (code === "PGRST301" || error?.status === 401 || msg.includes("jwt") || msg.includes("unauthorized")) {
    return "auth_error";
  }
  if (code === "42501" || error?.status === 403 || msg.includes("permission denied") || msg.includes("row-level security")) {
    return "rls_denied";
  }
  if (code === "57014" || msg.includes("timeout") || msg.includes("canceling statement") || msg.includes("aborted")) {
    return "timeout";
  }
  return "database_error";
}

function makeErrorSection<T>(
  domain: FarmContextDomain,
  message: string,
  errorKind: QueryErrorKind = "database_error",
  code: ContextValidationIssue["code"] = "domain_query_error",
): DomainContextSection<T> {
  return {
    domain,
    status: "error",
    data: null,
    errorKind,
    errorMessage: message,
    sourceRefs: [],
    conflicts: [],
    missingFields: [],
    validationIssues: [
      {
        domain,
        field: "domain_query",
        code,
        message,
      },
    ],
  };
}

function emptyFact<T>(state: ContextState = "missing", note?: string): ContextFact<T> {
  return { value: null, state, provenance: null, ...(note ? { note } : {}) };
}

function emptyWeatherData(state: ContextState = "missing", note?: string): WeatherDomainData {
  return {
    locationLabel: emptyFact<string>(state, note),
    matchedBy: null,
    provider: emptyFact<string>(state, note),
    fetchedAt: emptyFact<string>(state, note),
    observedAt: emptyFact<string>(state, note),
    forecastPeriod: emptyFact<string>(state, note),
    temperatureC: emptyFact<number>(state, note),
    rainfallMm: emptyFact<number>(state, note),
    humidityPct: emptyFact<number>(state, note),
    windSpeedKmh: emptyFact<number>(state, note),
    ageHours: null,
  };
}

const WEATHER_OBSERVATION_MAX_AGE_HOURS = 12;
const ISO_TIMESTAMP_WITH_ZONE_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

function assessWeatherObservationTimestamp(
  value: unknown,
  retrievedAt: string,
): { value: string | null; state: ContextState; note?: string } {
  if (value === null || value === undefined || value === "") {
    return { value: null, state: "missing", note: "Weather provider did not supply an observation timestamp." };
  }
  if (typeof value !== "string") {
    return { value: null, state: "invalid_rejected", note: "Weather observation timestamp is not a string." };
  }

  const match = ISO_TIMESTAMP_WITH_ZONE_RE.exec(value);
  const parsedMs = Date.parse(value);
  if (!match || !Number.isFinite(parsedMs)) {
    return { value: null, state: "invalid_rejected", note: "Weather observation timestamp is not valid ISO 8601 with a timezone." };
  }

  const [, year, month, day, hour, minute, second, zone] = match;
  const calendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
  const calendarValid =
    calendar.getUTCFullYear() === Number(year) &&
    calendar.getUTCMonth() === Number(month) - 1 &&
    calendar.getUTCDate() === Number(day) &&
    calendar.getUTCHours() === Number(hour) &&
    calendar.getUTCMinutes() === Number(minute) &&
    calendar.getUTCSeconds() === Number(second);
  const zoneMatch = zone === "Z" ? null : /[+-](\d{2}):(\d{2})$/.exec(zone);
  const zoneValid = !zoneMatch || (Number(zoneMatch[1]) <= 14 && Number(zoneMatch[2]) <= 59 && (Number(zoneMatch[1]) < 14 || Number(zoneMatch[2]) === 0));
  if (!calendarValid || !zoneValid) {
    return { value: null, state: "invalid_rejected", note: "Weather observation timestamp contains an invalid calendar date or timezone." };
  }

  const retrievedMs = Date.parse(retrievedAt);
  if (!Number.isFinite(retrievedMs) || parsedMs > retrievedMs) {
    return { value: null, state: "invalid_rejected", note: "Weather observation timestamp is in the future or retrieval time is invalid." };
  }
  if (retrievedMs - parsedMs > WEATHER_OBSERVATION_MAX_AGE_HOURS * 3_600_000) {
    return { value, state: "stale", note: "Weather observation is older than the 12-hour current-conditions validity window." };
  }
  return { value, state: "verified_current" };
}

export async function getLiveFarmContextSnapshot(
  caller: VerifiedFarmCallerContext,
  options: { now?: Date } = {},
): Promise<LiveFarmContextSnapshot> {
  const retrievedAt = (options.now ?? new Date()).toISOString();
  const { client, farmId } = caller;

  // Fetch core farm identity + plots first (RLS-scoped under caller JWT).
  // Errors MUST be inspected explicitly and never coerced into empty arrays or missing facts.
  const [farmRes, plotsRes] = await Promise.all([
    client
      .from("farms")
      .select("id, name, zone, state, lga, location, soil_information, updated_at")
      .eq("id", farmId)
      .maybeSingle(),
    client
      .from("plots")
      .select("id, farm_id, name, current_crop, soil_ph, organic_matter_pct, soil_texture, updated_at")
      .eq("farm_id", farmId)
      .order("updated_at", { ascending: false })
      .limit(MAX_DOMAIN_ROWS),
  ]);

  const coreQueryErrors: CoreQueryError[] = [];
  let farmQueryStatus: CoreQueryStatus = "ok";
  let plotsQueryStatus: CoreQueryStatus = "ok";
  let farmError: CoreQueryError | null = null;
  let plotsError: CoreQueryError | null = null;

  if (farmRes.error) {
    farmQueryStatus = "error";
    farmError = {
      target: "farms",
      kind: classifyQueryError(farmRes.error),
      message: `Failed to retrieve farm record (${classifyQueryError(farmRes.error)}).`,
    };
    coreQueryErrors.push(farmError);
  } else if (!farmRes.data) {
    farmQueryStatus = "empty";
  }

  if (plotsRes.error) {
    plotsQueryStatus = "error";
    plotsError = {
      target: "plots",
      kind: classifyQueryError(plotsRes.error),
      message: `Failed to retrieve farm plots (${classifyQueryError(plotsRes.error)}).`,
    };
    coreQueryErrors.push(plotsError);
  } else if (!plotsRes.data || plotsRes.data.length === 0) {
    plotsQueryStatus = "empty";
  }

  const farm = farmError ? null : (farmRes.data ?? null);
  const plots = plotsError ? [] : (plotsRes.data ?? []);
  const plotIds = plots.map((p) => p.id);

  // Parallelise all 8 independent domain queries under the caller's JWT.
  // Plot-dependent domains receive `plotsError` so they fail explicitly rather than assuming 0 plots.
  const [
    soilSection,
    moistureSection,
    cropSection,
    weatherSection,
    inventorySection,
    financeSection,
    equipmentSection,
    observationsSection,
  ] = await Promise.all([
    loadSoilChemistryDomain(client, farm, plots, plotIds, plotsError, retrievedAt),
    loadSoilMoistureDomain(client, farmId, plotIds, plotsError, retrievedAt),
    loadCropIdentityDomain(client, farmId, plots, plotsError, retrievedAt),
    loadWeatherDomain(client, farm, farmError, retrievedAt),
    loadInventoryDomain(client, farmId, retrievedAt),
    loadFinancialMarketplaceDomain(client, farmId, retrievedAt),
    loadEquipmentTelemetryDomain(client, farmId, plotIds, plotsError, retrievedAt),
    loadFarmerObservationsDomain(client, farmId, retrievedAt),
  ]);

  const domains = {
    soil_chemistry_and_nutrients: soilSection,
    soil_moisture_and_irrigation: moistureSection,
    crop_identity_variety_and_stage: cropSection,
    weather_and_environment: weatherSection,
    farm_inventory_and_stock: inventorySection,
    financial_and_marketplace_records: financeSection,
    equipment_and_iot_telemetry: equipmentSection,
    farmer_observations_and_scouting: observationsSection,
  };

  const allConflicts: ContextConflictDetail[] = Object.values(domains).flatMap((d) => d.conflicts);
  const allIssues: ContextValidationIssue[] = Object.values(domains).flatMap((d) => d.validationIssues);
  const missingInformation = Object.values(domains).flatMap((d) =>
    d.missingFields.map((field) => ({ domain: d.domain, field })),
  );

  const snapshot: LiveFarmContextSnapshot = {
    farmId,
    farmName: farm?.name ?? null,
    farmZone: farm?.zone ?? null,
    farmState: farm?.state ?? null,
    farmLga: farm?.lga ?? null,
    farmQueryStatus,
    plotsQueryStatus,
    coreQueryErrors,
    retrievedAt,
    scope: "farm",
    domains,
    auditContextRefs: [],
    conflicts: allConflicts,
    missingInformation,
    validationIssues: allIssues,
    memoryExtension: {
      available: false,
      reason: "batch_03_2_pending",
      farmScopeItems: [],
      profileScopeItems: [],
    },
  };

  snapshot.auditContextRefs = extractSnapshotAuditReferences(snapshot);
  return snapshot;
}

async function loadSoilChemistryDomain(
  client: VerifiedFarmCallerContext["client"],
  farm: { id: string; soil_information: unknown; updated_at: string } | null,
  plots: Array<{
    id: string;
    soil_ph: number | null;
    organic_matter_pct: number | null;
    soil_texture: string | null;
    updated_at: string;
  }>,
  plotIds: string[],
  plotsError: CoreQueryError | null,
  retrievedAt: string,
): Promise<DomainContextSection<SoilChemistryDomainData>> {
  const domain: FarmContextDomain = "soil_chemistry_and_nutrients";
  if (plotsError) {
    return makeErrorSection(domain, plotsError.message, plotsError.kind, "core_query_error");
  }
  try {
    let soilRows: SoilRecordCandidate[] = [];
    if (plotIds.length > 0) {
      const { data, error } = await client
        .from("soil_records")
        .select(
          "id, plot_id, ph, nitrogen_pct, phosphorus_ppm, potassium_cmol_kg, organic_matter_pct, soil_type, source, tested_on, created_at",
        )
        .in("plot_id", plotIds)
        .order("tested_on", { ascending: false, nullsFirst: false })
        .limit(MAX_DOMAIN_ROWS);
      if (error) return makeErrorSection(domain, "Failed to retrieve soil records.", classifyQueryError(error));
      soilRows = (data ?? []).map((r) => ({
        id: r.id,
        plotId: r.plot_id,
        ph: r.ph,
        nitrogenPct: r.nitrogen_pct,
        phosphorusPpm: r.phosphorus_ppm,
        potassiumCmolKg: r.potassium_cmol_kg,
        organicMatterPct: r.organic_matter_pct,
        soilType: r.soil_type,
        source: r.source,
        testedOn: r.tested_on,
        createdAt: r.created_at,
      }));
    }

    const { selected, freshness, rejectedIssues } = selectAuthoritativeSoilRecord(soilRows, retrievedAt);
    const sourceRefs: AuditContextReference[] = [];
    const validationIssues: ContextValidationIssue[] = [...rejectedIssues];
    const missingFields: string[] = [];

    if (freshness.issue) validationIssues.push(freshness.issue);

    if (selected) {
      const trust: "agent_verified" | "platform_verified" | "self_reported" =
        selected.source === "agent_verified"
          ? "agent_verified"
          : selected.source === "platform_verified"
            ? "platform_verified"
            : "self_reported";
      const prov = {
        source: "soil_records" as const,
        recordId: selected.id,
        sourceTrust: trust,
        observedAt: selected.testedOn ? `${selected.testedOn}T00:00:00Z` : selected.createdAt,
        retrievedAt,
        provisionalPolicyNote: PROVISIONAL_SOIL_VALIDITY_NOTE,
      };
      sourceRefs.push({
        source: "soil_records",
        record_id: selected.id,
        observed_at: selected.createdAt,
      });

      const ph = makeNumericFact(selected.ph, freshness.state, prov);
      const nitrogenPct = makeNumericFact(selected.nitrogenPct, freshness.state, prov);
      const phosphorusPpm = makeNumericFact(selected.phosphorusPpm, freshness.state, prov);
      const potassiumCmolKg = makeNumericFact(selected.potassiumCmolKg, freshness.state, prov);
      const organicMatterPct = makeNumericFact(selected.organicMatterPct, freshness.state, prov);
      const soilType: ContextFact<string> = selected.soilType
        ? { value: selected.soilType, state: freshness.state, provenance: prov }
        : emptyFact<string>();
      const testedOn: ContextFact<string> = selected.testedOn
        ? { value: selected.testedOn, state: freshness.state, provenance: prov }
        : emptyFact<string>();

      for (const [key, fact] of Object.entries({ ph, nitrogenPct, phosphorusPpm, potassiumCmolKg, organicMatterPct, testedOn })) {
        if (fact.state === "missing") missingFields.push(key);
      }

      return {
        domain,
        status: "ok",
        data: {
          ph,
          nitrogenPct,
          phosphorusPpm,
          potassiumCmolKg,
          organicMatterPct,
          soilType,
          testedOn,
          soilTestAgeDays: freshness.ageDays,
          provisionalValidityDays: PROVISIONAL_SOIL_TEST_VALIDITY_DAYS,
          provisionalThresholdPendingAgronomyValidation: true,
        },
        sourceRefs: normalizeAuditContextReferences(sourceRefs),
        conflicts: [],
        missingFields,
        validationIssues,
      };
    }

    // Fallback precedence: plots.soil_* (unverified_provisional) -> missing
    const plotWithSoil = plots.find((p) => p.soil_ph !== null || p.organic_matter_pct !== null || p.soil_texture !== null);
    if (plotWithSoil) {
      const prov = {
        source: "plots" as const,
        recordId: plotWithSoil.id,
        sourceTrust: "self_reported" as const,
        observedAt: plotWithSoil.updated_at,
        retrievedAt,
        provisionalPolicyNote: PROVISIONAL_SOIL_VALIDITY_NOTE,
      };
      sourceRefs.push({ source: "plots", record_id: plotWithSoil.id, observed_at: plotWithSoil.updated_at });
      missingFields.push("nitrogenPct", "phosphorusPpm", "potassiumCmolKg", "testedOn");
      return {
        domain,
        status: "partial",
        data: {
          ph: makeNumericFact(plotWithSoil.soil_ph, "unverified_provisional", prov),
          nitrogenPct: emptyFact<number>(),
          phosphorusPpm: emptyFact<number>(),
          potassiumCmolKg: emptyFact<number>(),
          organicMatterPct: makeNumericFact(plotWithSoil.organic_matter_pct, "unverified_provisional", prov),
          soilType: plotWithSoil.soil_texture
            ? { value: plotWithSoil.soil_texture, state: "unverified_provisional", provenance: prov }
            : emptyFact<string>(),
          testedOn: emptyFact<string>(),
          soilTestAgeDays: null,
          provisionalValidityDays: PROVISIONAL_SOIL_TEST_VALIDITY_DAYS,
          provisionalThresholdPendingAgronomyValidation: true,
        },
        sourceRefs: normalizeAuditContextReferences(sourceRefs),
        conflicts: [],
        missingFields,
        validationIssues,
      };
    }

    if (farm) sourceRefs.push({ source: "farms", record_id: farm.id, observed_at: farm.updated_at });
    return {
      domain,
      status: "empty",
      data: {
        ph: emptyFact<number>(),
        nitrogenPct: emptyFact<number>(),
        phosphorusPpm: emptyFact<number>(),
        potassiumCmolKg: emptyFact<number>(),
        organicMatterPct: emptyFact<number>(),
        soilType: emptyFact<string>(),
        testedOn: emptyFact<string>(),
        soilTestAgeDays: null,
        provisionalValidityDays: PROVISIONAL_SOIL_TEST_VALIDITY_DAYS,
        provisionalThresholdPendingAgronomyValidation: true,
      },
      sourceRefs: normalizeAuditContextReferences(sourceRefs),
      conflicts: [],
      missingFields: ["ph", "nitrogenPct", "phosphorusPpm", "potassiumCmolKg", "organicMatterPct", "testedOn"],
      validationIssues,
    };
  } catch {
    return makeErrorSection(domain, "Unexpected error retrieving soil chemistry domain.");
  }
}

async function loadSoilMoistureDomain(
  client: VerifiedFarmCallerContext["client"],
  farmId: string,
  plotIds: string[],
  plotsError: CoreQueryError | null,
  retrievedAt: string,
): Promise<DomainContextSection<SoilMoistureDomainData>> {
  const domain: FarmContextDomain = "soil_moisture_and_irrigation";
  if (plotsError) {
    return makeErrorSection(domain, plotsError.message, plotsError.kind, "core_query_error");
  }
  try {
    const [rollupsRes, eventsRes, zonesRes] = await Promise.all([
      plotIds.length > 0
        ? client
            .from("telemetry_rollups")
            .select("id, plot_id, channel_code, bucket_timestamp, last_value, valid_count")
            .in("plot_id", plotIds)
            .gt("valid_count", 0)
            .order("bucket_timestamp", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [], error: null }),
      client
        .from("irrigation_events")
        .select("id, started_at, volume_litres, status")
        .eq("farm_id", farmId)
        .order("started_at", { ascending: false })
        .limit(10),
      client
        .from("irrigation_zones")
        .select("id, current_moisture_pct, status, updated_at")
        .eq("farm_id", farmId)
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);

    const firstErr = rollupsRes.error ?? eventsRes.error ?? zonesRes.error;
    if (firstErr) {
      return makeErrorSection(domain, "Failed to retrieve soil moisture and irrigation data.", classifyQueryError(firstErr));
    }

    const sourceRefs: AuditContextReference[] = [];
    const missingFields: string[] = [];
    const nowMs = new Date(retrievedAt).getTime();

    // Precedence: telemetry_rollups (valid_count > 0) > irrigation_zones.current_moisture_pct
    // Provenance MUST identify the actual source table & record ID (never fabricated under `farms`).
    const moistureRollup = (rollupsRes.data ?? []).find((r) => /moisture/i.test(r.channel_code));
    const zoneWithMoisture = (zonesRes.data ?? []).find((z) => z.current_moisture_pct !== null);
    let moistureFact: ContextFact<number> = emptyFact<number>();

    if (moistureRollup) {
      const ageHours = (nowMs - new Date(moistureRollup.bucket_timestamp).getTime()) / 3_600_000;
      const state = ageHours > 12 ? "stale" : "verified_current";
      moistureFact = makeNumericFact(moistureRollup.last_value, state, {
        source: "telemetry_rollups",
        recordId: moistureRollup.id,
        sourceTrust: "sensor_valid",
        observedAt: moistureRollup.bucket_timestamp,
        retrievedAt,
      });
      sourceRefs.push({
        source: "telemetry_rollups",
        record_id: moistureRollup.id,
        observed_at: moistureRollup.bucket_timestamp,
      });
    } else if (zoneWithMoisture) {
      moistureFact = makeNumericFact(zoneWithMoisture.current_moisture_pct, "unverified_provisional", {
        source: "irrigation_zones",
        recordId: zoneWithMoisture.id,
        sourceTrust: "self_reported",
        observedAt: zoneWithMoisture.updated_at,
        retrievedAt,
      });
    } else {
      missingFields.push("moisturePct");
    }

    const latestEvent = (eventsRes.data ?? [])[0] ?? null;
    const latestIrrigationAt: ContextFact<string> = latestEvent
      ? {
          value: latestEvent.started_at,
          state: "verified_current",
          provenance: {
            source: "irrigation_events",
            recordId: latestEvent.id,
            sourceTrust: "platform_verified",
            observedAt: latestEvent.started_at,
            retrievedAt,
          },
        }
      : emptyFact<string>();
    const latestIrrigationVolumeLitres = latestEvent
      ? makeNumericFact(latestEvent.volume_litres, "verified_current", {
          source: "irrigation_events",
          recordId: latestEvent.id,
          sourceTrust: "platform_verified",
          observedAt: latestEvent.started_at,
          retrievedAt,
        })
      : emptyFact<number>();

    if (!latestEvent) missingFields.push("latestIrrigationAt");

    return {
      domain,
      status: moistureFact.state === "missing" && !latestEvent ? "empty" : "ok",
      data: {
        moisturePct: moistureFact,
        latestIrrigationAt,
        latestIrrigationVolumeLitres,
        activeZoneCount: (zonesRes.data ?? []).filter((z) => z.status === "active").length,
      },
      sourceRefs: normalizeAuditContextReferences(sourceRefs),
      conflicts: [],
      missingFields,
      validationIssues: [],
    };
  } catch {
    return makeErrorSection(domain, "Unexpected error retrieving soil moisture domain.");
  }
}

async function loadCropIdentityDomain(
  client: VerifiedFarmCallerContext["client"],
  farmId: string,
  plots: Array<{ id: string; name: string; current_crop: string | null; updated_at: string }>,
  plotsError: CoreQueryError | null,
  _retrievedAt: string,
): Promise<DomainContextSection<CropIdentityDomainData>> {
  const domain: FarmContextDomain = "crop_identity_variety_and_stage";
  try {
    const { data, error } = await client
      .from("crop_cycles")
      .select("id, plot_id, crop_id, current_stage, status, planting_date, expected_harvest_date, health_status, health_score, created_at")
      .eq("farm_id", farmId)
      // Match the lifecycle values enforced by crop_cycles_status_check.
      // Planning is not yet active cultivation; completed and abandoned cycles are terminal.
      .in("status", ["land_preparation", "planting", "establishment", "maintenance", "harvesting"])
      .order("planting_date", { ascending: false })
      .limit(MAX_DOMAIN_ROWS);

    if (error) return makeErrorSection(domain, "Failed to retrieve active crop cycles.", classifyQueryError(error));

    const ACTIVE_CYCLE_STATUSES = new Set([
      "land_preparation",
      "planting",
      "establishment",
      "maintenance",
      "harvesting",
    ]);

    const cycles = (data ?? []).map((c) => {
      const normalizedStatus = typeof c.status === "string" ? c.status.trim().toLowerCase() : "";
      return {
        cycleId: c.id,
        plotId: c.plot_id,
        cropId: c.crop_id,
        status: normalizedStatus,
        currentStage: c.current_stage,
        plantingDate: c.planting_date,
        expectedHarvestDate: c.expected_harvest_date,
        healthStatus: c.health_status,
        healthScore: c.health_score,
        // Active lifecycle + a populated stage do not independently verify agronomic truth.
        // Preserve the record as provisional; the trusted resolver validates DB status and identity.
        state: "unverified_provisional" as const,
      };
    });

    // If there are no active crop cycles and the plots query failed, we cannot conclude crop identity is missing.
    if (cycles.length === 0 && plotsError) {
      return makeErrorSection(domain, plotsError.message, plotsError.kind, "core_query_error");
    }

    const sourceRefs: AuditContextReference[] = (data ?? []).map((c) => ({
      source: "crop_cycles",
      record_id: c.id,
      observed_at: c.created_at,
    }));

    const fallbackPlotCrops = plots
      .filter((p) => p.current_crop)
      .map((p) => ({
        plotId: p.id,
        plotName: p.name,
        currentCrop: p.current_crop,
        state: "unverified_provisional" as const,
      }));

    if (cycles.length === 0) {
      for (const p of plots) {
        if (p.current_crop) {
          sourceRefs.push({ source: "plots", record_id: p.id, observed_at: p.updated_at });
        }
      }
    }

    const validationIssues: ContextValidationIssue[] = plotsError
      ? [
          {
            domain,
            field: "plots",
            code: "core_query_error",
            message: plotsError.message,
          },
        ]
      : [];

    return {
      domain,
      status: plotsError ? "partial" : cycles.length > 0 ? "ok" : fallbackPlotCrops.length > 0 ? "partial" : "empty",
      data: { activeCycles: cycles, fallbackPlotCrops },
      sourceRefs: normalizeAuditContextReferences(sourceRefs),
      conflicts: [],
      missingFields: cycles.length === 0 && fallbackPlotCrops.length === 0 ? ["activeCycles"] : [],
      validationIssues,
    };
  } catch {
    return makeErrorSection(domain, "Unexpected error retrieving crop identity domain.");
  }
}

async function loadWeatherDomain(
  client: VerifiedFarmCallerContext["client"],
  farm: { id: string; state: string | null; location: unknown } | null,
  farmError: CoreQueryError | null,
  retrievedAt: string,
): Promise<DomainContextSection<WeatherDomainData>> {
  const domain: FarmContextDomain = "weather_and_environment";
  if (farmError) {
    return makeErrorSection(domain, farmError.message, farmError.kind, "core_query_error");
  }
  if (!farm) {
    return {
      domain,
      status: "empty",
      data: emptyWeatherData("missing", "Farm record unavailable for weather location matching."),
      sourceRefs: [],
      conflicts: [],
      missingFields: ["farm_location"],
      validationIssues: [],
    };
  }

  const parsedLocation = parseFarmLocationCoordinates(farm.location);
  const coords = parsedLocation.status === "valid" ? parsedLocation.coords : null;
  const farmState = farm.state?.trim() || null;

  if (!coords && !farmState) {
    const isInvalid = parsedLocation.status === "invalid";
    return {
      domain,
      status: "empty",
      data: emptyWeatherData(
        isInvalid ? "invalid_rejected" : "missing",
        isInvalid
          ? "Farm coordinates are invalid and no verified state is available."
          : "Farm location coordinates and state are missing.",
      ),
      sourceRefs: [],
      conflicts: [],
      missingFields: ["farm_location"],
      validationIssues: [
        {
          domain,
          field: "location",
          code: "missing_or_invalid_farm_location",
          message: isInvalid
            ? "Farm coordinates are invalid; weather cannot be matched to this farm."
            : "Farm has no verified coordinates or state for farm-specific weather matching.",
          source: "farms",
          recordId: farm.id,
        },
      ],
    };
  }

  try {
    const { data, error } = await client
      .from("weather_cache")
      .select("provider, payload, fetched_at")
      .order("fetched_at", { ascending: false })
      .limit(10);

    if (error) {
      const kind = classifyQueryError(error);
      if (kind === "rls_denied") {
        return {
          domain,
          status: "unavailable",
          data: emptyWeatherData("missing", "Weather cache is not directly readable under caller RLS."),
          errorKind: kind,
          errorMessage: "Weather cache is unavailable under caller RLS.",
          sourceRefs: [],
          conflicts: [],
          missingFields: ["weather_cache"],
          validationIssues: [],
        };
      }
      return makeErrorSection(domain, "Failed to retrieve weather cache.", kind);
    }

    const cacheRows = data ?? [];
    if (cacheRows.length === 0) {
      return {
        domain,
        status: "empty",
        data: emptyWeatherData("missing"),
        sourceRefs: [],
        conflicts: [],
        missingFields: ["weather_cache"],
        validationIssues: [],
      };
    }

    // Search cached provider rows for a verified match to THIS farm's coordinates or state.
    let matchedRow: (typeof cacheRows)[number] | null = null;
    let matchedForecast: ReturnType<typeof matchFarmWeatherForecast> = null;

    for (const row of cacheRows) {
      const match = matchFarmWeatherForecast(row.payload, { state: farmState, coords });
      if (match) {
        matchedRow = row;
        matchedForecast = match;
        break;
      }
    }

    if (!matchedRow || !matchedForecast) {
      return {
        domain,
        status: "empty",
        data: emptyWeatherData("missing", "No cached weather record matches this farm's verified location."),
        sourceRefs: [],
        conflicts: [],
        missingFields: ["weather_cache"],
        validationIssues: [
          {
            domain,
            field: "weather_cache",
            code: "weather_location_mismatch",
            message: "Available weather cache entries do not match this farm's verified geographical location.",
            source: "farms",
            recordId: farm.id,
          },
        ],
      };
    }

    const retrievedMs = Date.parse(retrievedAt);
    const fetchedMs = Date.parse(matchedRow.fetched_at);
    const cacheTimestampValid = Number.isFinite(retrievedMs) && Number.isFinite(fetchedMs) && fetchedMs <= retrievedMs;
    const ageHours = cacheTimestampValid ? (retrievedMs - fetchedMs) / 3_600_000 : null;
    const cacheState: ContextState = !cacheTimestampValid
      ? "invalid_rejected"
      : ageHours !== null && ageHours > WEATHER_OBSERVATION_MAX_AGE_HOURS
        ? "stale"
        : matchedForecast.matchedBy === "coordinates"
          ? "verified_current"
          : "unverified_provisional";
    // `provider` is the weather_cache primary key (one-to-one FK to integration_providers).
    // It identifies the cache row, while fetched_at remains retrieval time, not observation time.
    const observation = assessWeatherObservationTimestamp(matchedForecast.forecast.now?.observedAt, retrievedAt);
    const currentConditionsState: ContextState =
      cacheState === "invalid_rejected" || observation.state === "invalid_rejected"
        ? "invalid_rejected"
        : cacheState === "stale" || observation.state === "stale"
          ? "stale"
          : observation.state === "missing"
            ? "unverified_provisional"
            : cacheState;
    const observedTimestamp = observation.value;
    const prov = {
      source: "weather_cache" as const,
      recordId: matchedRow.provider,
      sourceTrust: "cache" as const,
      observedAt: observedTimestamp,
      retrievedAt,
    };
    const currentConditionsNote =
      currentConditionsState === "verified_current"
        ? undefined
        : cacheState === "invalid_rejected"
          ? "Weather cache retrieval timestamp is invalid or in the future."
          : observation.state === "invalid_rejected"
            ? observation.note
            : cacheState === "stale"
              ? "Weather cache retrieval is older than 12 hours."
              : observation.state === "stale" || observation.state === "missing"
                ? observation.note
                : "Weather location match is provisional.";

    const days = matchedForecast.forecast.days ?? [];
    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    const forecastPeriodValue =
      firstDay?.date && lastDay?.date
        ? firstDay.date === lastDay.date
          ? firstDay.date
          : `${firstDay.date}..${lastDay.date}`
        : null;

    const place = matchedForecast.forecast.place;
    const locationLabelValue =
      place?.town && place?.state ? `${place.town}, ${place.state}` : (place?.state ?? farmState);

    const temperatureC = makeNumericFact(matchedForecast.forecast.now?.tempC ?? null, currentConditionsState, prov, currentConditionsNote);
    const humidityPct = makeNumericFact(matchedForecast.forecast.now?.humidity ?? null, currentConditionsState, prov, currentConditionsNote);
    const windSpeedKmh = makeNumericFact(matchedForecast.forecast.now?.windKmh ?? null, currentConditionsState, prov, currentConditionsNote);
    // Daily rainfall is a forecast-period value, not a current observed measurement.
    const rainfallMm = makeNumericFact(firstDay?.rainMm ?? null, cacheState, {
      ...prov,
      observedAt: null,
    });

    const missingFields: string[] = [];
    if (temperatureC.state === "missing") missingFields.push("temperatureC");
    if (rainfallMm.state === "missing") missingFields.push("rainfallMm");
    if (humidityPct.state === "missing") missingFields.push("humidityPct");
    if (windSpeedKmh.state === "missing") missingFields.push("windSpeedKmh");

    return {
      domain,
      status: missingFields.length > 0 ? "partial" : "ok",
      data: {
        locationLabel: locationLabelValue
          ? { value: locationLabelValue, state: cacheState, provenance: prov }
          : emptyFact<string>(),
        matchedBy: matchedForecast.matchedBy,
        provider: { value: matchedRow.provider, state: cacheState, provenance: prov },
        fetchedAt: { value: matchedRow.fetched_at, state: cacheState, provenance: prov },
        observedAt: observedTimestamp
          ? { value: observedTimestamp, state: observation.state, provenance: prov, ...(observation.note ? { note: observation.note } : {}) }
          : emptyFact<string>(observation.state, observation.note),
        forecastPeriod: forecastPeriodValue
          ? { value: forecastPeriodValue, state: cacheState, provenance: prov }
          : emptyFact<string>(),
        temperatureC,
        rainfallMm,
        humidityPct,
        windSpeedKmh,
        ageHours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
      },
      sourceRefs: normalizeAuditContextReferences([
        { source: "weather_cache", record_id: matchedRow.provider },
      ]),
      conflicts: [],
      missingFields,
      validationIssues: [],
    };
  } catch {
    return makeErrorSection(domain, "Unexpected error retrieving weather domain.");
  }
}

async function fetchAllFarmInventoryTransactions(
  client: VerifiedFarmCallerContext["client"],
  farmId: string,
): Promise<{
  ok: true;
  rows: InventoryTransactionInput[];
  isComplete: boolean;
} | { ok: false; errorKind: QueryErrorKind }> {
  const rows: InventoryTransactionInput[] = [];
  let isComplete = true;

  for (let page = 0; page < MAX_INVENTORY_TX_PAGES; page++) {
    const from = page * PAGINATION_PAGE_SIZE;
    const to = from + PAGINATION_PAGE_SIZE - 1;
    const { data, error } = await client
      .from("farm_inventory_transactions")
      .select("id, inventory_id, transaction_type, quantity, created_at")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      return { ok: false, errorKind: classifyQueryError(error) };
    }

    const batch = data ?? [];
    for (const tx of batch) {
      rows.push({
        id: tx.id,
        inventoryId: tx.inventory_id,
        transactionType: tx.transaction_type,
        quantity: tx.quantity,
        createdAt: tx.created_at,
      });
    }

    if (batch.length < PAGINATION_PAGE_SIZE) {
      return { ok: true, rows, isComplete: true };
    }
    if (page === MAX_INVENTORY_TX_PAGES - 1) {
      isComplete = false;
    }
  }

  return { ok: true, rows, isComplete };
}

async function loadInventoryDomain(
  client: VerifiedFarmCallerContext["client"],
  farmId: string,
  retrievedAt: string,
): Promise<DomainContextSection<FarmInventoryDomainData>> {
  const domain: FarmContextDomain = "farm_inventory_and_stock";
  try {
    const [invRes, txResult] = await Promise.all([
      client
        .from("farm_inventory")
        .select("id, item_name, category, quantity, unit, updated_at")
        .eq("farm_id", farmId)
        .order("updated_at", { ascending: false })
        .limit(MAX_DOMAIN_ROWS),
      fetchAllFarmInventoryTransactions(client, farmId),
    ]);

    if (invRes.error) {
      return makeErrorSection(domain, "Failed to retrieve farm inventory.", classifyQueryError(invRes.error));
    }
    if (!txResult.ok) {
      return makeErrorSection(domain, "Failed to retrieve farm inventory transaction ledger.", txResult.errorKind);
    }

    const ledgerSummaries = calculateInventoryLedgerBalances(txResult.rows);
    const conflicts: ContextConflictDetail[] = [];
    const validationIssues: ContextValidationIssue[] = [];
    const sourceRefs: AuditContextReference[] = [];

    const items = (invRes.data ?? []).map((item) => {
      const summary = ledgerSummaries.get(item.id) ?? null;
      const ledgerQty = summary ? summary.balance : null;
      const check = evaluateInventoryLedgerConsistency({
        inventoryId: item.id,
        itemName: item.item_name,
        cachedQuantity: item.quantity,
        ledgerQuantity: ledgerQty,
        latestTransactionId: summary?.latestTransactionId ?? null,
        latestTransactionAt: summary?.latestTransactionAt ?? null,
        isLedgerComplete: txResult.isComplete,
        retrievedAt,
        updatedAt: item.updated_at,
      });

      if (check.conflict) conflicts.push(check.conflict);
      if (check.issue) validationIssues.push(check.issue);
      sourceRefs.push({ source: "farm_inventory", record_id: item.id, observed_at: item.updated_at });
      if (summary) {
        sourceRefs.push({
          source: "farm_inventory_transactions",
          record_id: summary.latestTransactionId,
          observed_at: summary.latestTransactionAt,
        });
      }

      return {
        inventoryId: item.id,
        itemName: item.item_name,
        category: item.category,
        unit: item.unit,
        cachedQuantity: makeNumericFact(item.quantity, check.state, {
          source: "farm_inventory",
          recordId: item.id,
          sourceTrust: "self_reported",
          observedAt: item.updated_at,
          retrievedAt,
        }),
        ledgerQuantity: summary
          ? makeNumericFact(ledgerQty, check.state, {
              source: "farm_inventory_transactions",
              recordId: summary.latestTransactionId,
              sourceTrust: "derived_ledger",
              observedAt: summary.latestTransactionAt,
              retrievedAt,
            })
          : emptyFact<number>(),
        ledgerComplete: txResult.isComplete,
        transactionCount: summary?.transactionCount ?? 0,
        state: check.state,
      };
    });

    return {
      domain,
      status: items.length > 0 ? (txResult.isComplete ? "ok" : "partial") : "empty",
      data: { items },
      sourceRefs: normalizeAuditContextReferences(sourceRefs),
      conflicts,
      missingFields: items.length === 0 ? ["farm_inventory"] : [],
      validationIssues,
    };
  } catch {
    return makeErrorSection(domain, "Unexpected error retrieving farm inventory domain.");
  }
}

async function loadFinancialMarketplaceDomain(
  client: VerifiedFarmCallerContext["client"],
  farmId: string,
  retrievedAt: string,
): Promise<DomainContextSection<FinancialMarketplaceDomainData>> {
  const domain: FarmContextDomain = "financial_and_marketplace_records";
  try {
    // Marketplace orders do not carry a direct `farm_id` column; authoritative farm association
    // runs through `marketplace_produce_provenance.farm_id -> listing_id -> marketplace_order_items.order_id`.
    // Orders without a verified farm provenance link (including ambiguous buyer-side orders) are excluded.
    const [txRes, provRes] = await Promise.all([
      client
        .from("farm_financial_transactions")
        .select("id, transaction_date, created_at")
        .eq("farm_id", farmId)
        .order("transaction_date", { ascending: false })
        .limit(MAX_DOMAIN_ROWS),
      client
        .from("marketplace_produce_provenance")
        .select("listing_id")
        .eq("farm_id", farmId)
        .limit(MAX_DOMAIN_ROWS),
    ]);

    const firstErr = txRes.error ?? provRes.error;
    if (firstErr) {
      return makeErrorSection(domain, "Failed to retrieve financial or farm marketplace provenance records.", classifyQueryError(firstErr));
    }

    const farmListingIds = Array.from(new Set((provRes.data ?? []).map((p) => p.listing_id).filter(Boolean)));
    let farmOrders: Array<{ id: string; placed_at: string | null; updated_at: string }> = [];

    if (farmListingIds.length > 0) {
      const itemsRes = await client
        .from("marketplace_order_items")
        .select("order_id, listing_id")
        .in("listing_id", farmListingIds)
        .limit(200);
      if (itemsRes.error) {
        return makeErrorSection(domain, "Failed to retrieve farm-associated marketplace order items.", classifyQueryError(itemsRes.error));
      }

      const farmOrderIds = Array.from(new Set((itemsRes.data ?? []).map((i) => i.order_id).filter(Boolean)));
      if (farmOrderIds.length > 0) {
        const ordersRes = await client
          .from("marketplace_orders")
          .select("id, placed_at, updated_at")
          .in("id", farmOrderIds)
          .order("updated_at", { ascending: false })
          .limit(MAX_DOMAIN_ROWS);
        if (ordersRes.error) {
          return makeErrorSection(domain, "Failed to retrieve farm-associated marketplace orders.", classifyQueryError(ordersRes.error));
        }
        farmOrders = ordersRes.data ?? [];
      }
    }

    const txs = txRes.data ?? [];
    const sourceRefs: AuditContextReference[] = [
      ...txs.slice(0, 10).map((t) => ({ source: "farm_financial_transactions" as const, record_id: t.id, observed_at: t.created_at })),
      ...farmOrders.slice(0, 10).map((o) => ({ source: "marketplace_orders" as const, record_id: o.id, observed_at: o.updated_at })),
    ];

    const latestTx = txs[0] ?? null;
    const latestTransactionDate: ContextFact<string> = latestTx
      ? {
          value: latestTx.transaction_date,
          state: "unverified_provisional",
          provenance: {
            source: "farm_financial_transactions",
            recordId: latestTx.id,
            sourceTrust: "self_reported",
            observedAt: latestTx.created_at,
            retrievedAt,
          },
        }
      : emptyFact<string>();

    return {
      domain,
      status: txs.length > 0 || farmOrders.length > 0 ? "ok" : "empty",
      data: {
        recentFarmTransactionsCount: txs.length,
        recentMarketplaceOrdersCount: farmOrders.length,
        latestTransactionDate,
      },
      sourceRefs: normalizeAuditContextReferences(sourceRefs),
      conflicts: [],
      missingFields: txs.length === 0 && farmOrders.length === 0 ? ["financial_records"] : [],
      validationIssues: [],
    };
  } catch {
    return makeErrorSection(domain, "Unexpected error retrieving financial/marketplace domain.");
  }
}

async function fetchAllFarmMachineryUsageLogs(
  client: VerifiedFarmCallerContext["client"],
  farmId: string,
): Promise<{
  ok: true;
  rows: MachineryUsageLogInput[];
  isComplete: boolean;
} | { ok: false; errorKind: QueryErrorKind }> {
  const rows: MachineryUsageLogInput[] = [];
  let isComplete = true;

  for (let page = 0; page < MAX_USAGE_LOG_PAGES; page++) {
    const from = page * PAGINATION_PAGE_SIZE;
    const to = from + PAGINATION_PAGE_SIZE - 1;
    const { data, error } = await client
      .from("farm_machinery_usage_logs")
      .select("id, machinery_id, hours_operated, start_time, end_time")
      .eq("farm_id", farmId)
      .order("end_time", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (error) {
      return { ok: false, errorKind: classifyQueryError(error) };
    }

    const batch = data ?? [];
    for (const u of batch) {
      rows.push({
        id: u.id,
        machineryId: u.machinery_id,
        hoursOperated: u.hours_operated,
        startTime: u.start_time,
        endTime: u.end_time,
      });
    }

    if (batch.length < PAGINATION_PAGE_SIZE) {
      return { ok: true, rows, isComplete: true };
    }
    if (page === MAX_USAGE_LOG_PAGES - 1) {
      isComplete = false;
    }
  }

  return { ok: true, rows, isComplete };
}

async function loadEquipmentTelemetryDomain(
  client: VerifiedFarmCallerContext["client"],
  farmId: string,
  plotIds: string[],
  plotsError: CoreQueryError | null,
  retrievedAt: string,
): Promise<DomainContextSection<EquipmentTelemetryDomainData>> {
  const domain: FarmContextDomain = "equipment_and_iot_telemetry";
  if (plotsError) {
    return makeErrorSection(domain, plotsError.message, plotsError.kind, "core_query_error");
  }
  try {
    const [assetsRes, usageResult, machTelRes, iotRes] = await Promise.all([
      client
        .from("farm_machinery_assets")
        .select("id, name, category, current_status, engine_hours, updated_at")
        .eq("farm_id", farmId)
        .order("updated_at", { ascending: false })
        .limit(MAX_DOMAIN_ROWS),
      fetchAllFarmMachineryUsageLogs(client, farmId),
      // Retrieve the NEWEST 200 telemetry readings descending, then arrange chronologically before evaluation.
      client
        .from("machinery_telemetry")
        .select("id, machinery_id, engine_hours, recorded_at, source_category, validation_status, trust_classification")
        .eq("farm_id", farmId)
        .order("recorded_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(200),
      plotIds.length > 0
        ? client
            .from("telemetry_readings")
            .select("id, quality_flag, source_timestamp")
            .in("plot_id", plotIds)
            .order("source_timestamp", { ascending: false })
            .limit(100)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (assetsRes.error) {
      return makeErrorSection(domain, "Failed to retrieve farm machinery assets.", classifyQueryError(assetsRes.error));
    }
    if (!usageResult.ok) {
      return makeErrorSection(domain, "Failed to retrieve machinery usage logs.", usageResult.errorKind);
    }
    const telErr = machTelRes.error ?? iotRes.error;
    if (telErr) {
      return makeErrorSection(domain, "Failed to retrieve equipment or IoT telemetry data.", classifyQueryError(telErr));
    }

    const usageByMachinery = new Map<string, MachineryUsageLogInput[]>();
    for (const u of usageResult.rows) {
      const arr = usageByMachinery.get(u.machineryId) ?? [];
      arr.push(u);
      usageByMachinery.set(u.machineryId, arr);
    }

    const telByMachinery = new Map<
      string,
      Array<{
        id: string;
        engineHours: number | null;
        recordedAt: string;
        sourceCategory?: string | null;
        validationStatus?: string | null;
        trustClassification?: string | null;
      }>
    >();
    for (const t of machTelRes.data ?? []) {
      const arr = telByMachinery.get(t.machinery_id) ?? [];
      arr.push({
        id: t.id,
        engineHours: t.engine_hours,
        recordedAt: t.recorded_at,
        sourceCategory: t.source_category,
        validationStatus: t.validation_status,
        trustClassification: t.trust_classification,
      });
      telByMachinery.set(t.machinery_id, arr);
    }

    const conflicts: ContextConflictDetail[] = [];
    const validationIssues: ContextValidationIssue[] = [];
    const sourceRefs: AuditContextReference[] = [];

    const machinery = (assetsRes.data ?? []).map((asset) => {
      // Arrange the newest bounded telemetry sample chronologically ascending before consistency checks.
      const samples = [...(telByMachinery.get(asset.id) ?? [])].sort(
        (a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id),
      );

      const usageAgg = aggregateMachineryUsageLogs(usageByMachinery.get(asset.id) ?? [], {
        machineryName: asset.name,
        isCompleteHistory: usageResult.isComplete,
      });

      const check = evaluateMachineryTelemetryConsistency({
        machineryId: asset.id,
        machineryName: asset.name,
        assetEngineHours: asset.engine_hours,
        telemetrySamples: samples,
        retrievedAt,
      });

      conflicts.push(...check.conflicts);
      validationIssues.push(...check.issues, ...usageAgg.issues);
      sourceRefs.push({ source: "farm_machinery_assets", record_id: asset.id, observed_at: asset.updated_at });
      if (check.latestValidSampleId && check.latestValidObservedAt) {
        sourceRefs.push({
          source: "machinery_telemetry",
          record_id: check.latestValidSampleId,
          observed_at: check.latestValidObservedAt,
        });
      }
      if (usageAgg.latestRecordId && usageAgg.latestObservedAt) {
        sourceRefs.push({
          source: "farm_machinery_usage_logs",
          record_id: usageAgg.latestRecordId,
          observed_at: usageAgg.latestObservedAt,
        });
      }

      const latestObservedTelemetryEngineHours: ContextFact<number> =
        check.latestObservedId !== null && check.latestObservedHours !== null
          ? makeNumericFact(
              check.latestObservedHours,
              check.latestObservedId === check.latestValidSampleId ? check.state : "invalid_rejected",
              {
                source: "machinery_telemetry",
                recordId: check.latestObservedId,
                sourceTrust:
                  check.state === "conflicting" || check.latestObservedId !== check.latestValidSampleId
                    ? "sensor_suspicious"
                    : "sensor_valid",
                observedAt: check.latestObservedAt,
                retrievedAt,
              },
            )
          : emptyFact<number>();

      const latestTelemetryEngineHours: ContextFact<number> =
        check.latestValidSampleId !== null && check.latestValidHours !== null
          ? makeNumericFact(check.latestValidHours, check.state, {
              source: "machinery_telemetry",
              recordId: check.latestValidSampleId,
              sourceTrust: check.state === "conflicting" ? "sensor_suspicious" : "sensor_valid",
              observedAt: check.latestValidObservedAt,
              retrievedAt,
            })
          : emptyFact<number>(check.state === "invalid_rejected" ? "invalid_rejected" : "missing");

      const recentLoggedUsageHours: ContextFact<number> =
        usageAgg.latestRecordId !== null && usageAgg.totalHours !== null
          ? makeNumericFact(
              usageAgg.totalHours,
              usageAgg.isCompleteHistory ? "verified_current" : "unverified_provisional",
              {
                source: "farm_machinery_usage_logs",
                recordId: usageAgg.latestRecordId,
                sourceTrust: "derived_ledger",
                observedAt: usageAgg.latestObservedAt,
                retrievedAt,
              },
              usageAgg.isCompleteHistory
                ? "Aggregated from complete farm machinery session usage logs."
                : "Recent bounded session usage subset; not a complete lifetime total.",
            )
          : emptyFact<number>();

      return {
        machineryId: asset.id,
        name: asset.name,
        category: asset.category,
        status: asset.current_status,
        assetEngineHours: makeNumericFact(asset.engine_hours, "verified_current", {
          source: "farm_machinery_assets",
          recordId: asset.id,
          sourceTrust: "self_reported",
          observedAt: asset.updated_at,
          retrievedAt,
        }),
        latestObservedTelemetryEngineHours,
        latestTelemetryEngineHours,
        recentLoggedUsageHours,
        loggedUsageSummary: {
          totalHours: usageAgg.totalHours,
          recordCount: usageAgg.recordCount,
          isCompleteHistory: usageAgg.isCompleteHistory,
          periodStart: usageAgg.periodStart,
          periodEnd: usageAgg.periodEnd,
        },
        state: check.state,
      };
    });

    const readings = iotRes.data ?? [];
    const validReadings = readings.filter((r) => r.quality_flag === "valid");
    const excludedFaulty = readings.filter((r) => r.quality_flag !== "valid");
    for (const r of validReadings.slice(0, 10)) {
      sourceRefs.push({ source: "telemetry_readings", record_id: r.id, observed_at: r.source_timestamp });
    }

    return {
      domain,
      status: machinery.length > 0 || validReadings.length > 0 ? (usageResult.isComplete ? "ok" : "partial") : "empty",
      data: {
        machinery,
        validSensorReadingsCount: validReadings.length,
        excludedFaultyReadingsCount: excludedFaulty.length,
      },
      sourceRefs: normalizeAuditContextReferences(sourceRefs),
      conflicts,
      missingFields: machinery.length === 0 && validReadings.length === 0 ? ["equipment_and_telemetry"] : [],
      validationIssues,
    };
  } catch {
    return makeErrorSection(domain, "Unexpected error retrieving equipment and IoT telemetry domain.");
  }
}

async function loadFarmerObservationsDomain(
  client: VerifiedFarmCallerContext["client"],
  farmId: string,
  _retrievedAt: string,
): Promise<DomainContextSection<FarmerObservationsDomainData>> {
  const domain: FarmContextDomain = "farmer_observations_and_scouting";
  try {
    const [cyclesRes, alertsRes] = await Promise.all([
      client.from("crop_cycles").select("id").eq("farm_id", farmId).limit(MAX_DOMAIN_ROWS),
      client
        .from("crop_alerts")
        .select("id, created_at, is_dismissed")
        .eq("farm_id", farmId)
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false })
        .limit(MAX_DOMAIN_ROWS),
    ]);

    const firstErr = cyclesRes.error ?? alertsRes.error;
    if (firstErr) {
      return makeErrorSection(domain, "Failed to retrieve scouting observations or crop alerts.", classifyQueryError(firstErr));
    }

    const cycleIds = (cyclesRes.data ?? []).map((c) => c.id);
    let obsRows: Array<{
      id: string;
      crop_cycle_id: string;
      category: string;
      severity: string;
      title: string;
      resolved: boolean;
      observed_at: string;
    }> = [];

    if (cycleIds.length > 0) {
      const obsRes = await client
        .from("crop_observations")
        .select("id, crop_cycle_id, category, severity, title, resolved, observed_at")
        .in("crop_cycle_id", cycleIds)
        .order("observed_at", { ascending: false })
        .limit(MAX_DOMAIN_ROWS);
      if (obsRes.error) return makeErrorSection(domain, "Failed to retrieve crop observations.", classifyQueryError(obsRes.error));
      obsRows = obsRes.data ?? [];
    }

    const sourceRefs: AuditContextReference[] = [
      ...obsRows.slice(0, 15).map((o) => ({ source: "crop_observations" as const, record_id: o.id, observed_at: o.observed_at })),
      ...(alertsRes.data ?? []).slice(0, 15).map((a) => ({ source: "crop_alerts" as const, record_id: a.id, observed_at: a.created_at })),
    ];

    return {
      domain,
      status: obsRows.length > 0 || (alertsRes.data ?? []).length > 0 ? "ok" : "empty",
      data: {
        unresolvedObservationsCount: obsRows.filter((o) => !o.resolved).length,
        activeAlertsCount: (alertsRes.data ?? []).length,
        recentObservations: obsRows.slice(0, 10).map((o) => ({
          observationId: o.id,
          cropCycleId: o.crop_cycle_id,
          category: o.category,
          severity: o.severity,
          title: o.title,
          observedAt: o.observed_at,
          state: "unverified_provisional" as const,
        })),
      },
      sourceRefs: normalizeAuditContextReferences(sourceRefs),
      conflicts: [],
      missingFields: obsRows.length === 0 && (alertsRes.data ?? []).length === 0 ? ["observations_and_alerts"] : [],
      validationIssues: [],
    };
  } catch {
    return makeErrorSection(domain, "Unexpected error retrieving farmer observations domain.");
  }
}
