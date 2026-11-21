import "server-only";
import {
  PROVISIONAL_SOIL_TEST_VALIDITY_DAYS,
  PROVISIONAL_SOIL_VALIDITY_NOTE,
  evaluateInventoryLedgerConsistency,
  evaluateMachineryTelemetryConsistency,
  extractSnapshotAuditReferences,
  makeNumericFact,
  normalizeAuditContextReferences,
  selectAuthoritativeSoilRecord,
  type AuditContextReference,
  type ContextConflictDetail,
  type ContextFact,
  type ContextValidationIssue,
  type CropIdentityDomainData,
  type DomainContextSection,
  type EquipmentTelemetryDomainData,
  type FarmContextDomain,
  type FarmInventoryDomainData,
  type FarmerObservationsDomainData,
  type FinancialMarketplaceDomainData,
  type LiveFarmContextSnapshot,
  type SoilChemistryDomainData,
  type SoilMoistureDomainData,
  type SoilRecordCandidate,
  type WeatherDomainData,
} from "@cultivanode/shared";
import type { VerifiedFarmCallerContext } from "@/lib/engines-api-helper";

/**
 * CultivaNode 3.0 — Batch 03.1C RLS-Scoped LiveFarmContextService (ADR-001, ADR-007).
 *
 * Security invariants:
 * - Server-only.
 * - Executes 100% of queries through `caller.client` (the caller's verified Supabase JWT + RLS).
 * - ZERO `service_role` reads of farm data.
 * - Explicit column selection, bounded limits, deterministic ordering.
 * - Query errors produce `status: 'error'` with a validation issue (never confused with `missing`).
 */

const MAX_DOMAIN_ROWS = 50;

function makeErrorSection<T>(domain: FarmContextDomain, message: string): DomainContextSection<T> {
  return {
    domain,
    status: "error",
    data: null,
    errorMessage: message,
    sourceRefs: [],
    conflicts: [],
    missingFields: [],
    validationIssues: [
      {
        domain,
        field: "domain_query",
        code: "domain_query_error",
        message,
      },
    ],
  };
}

function emptyFact<T>(): ContextFact<T> {
  return { value: null, state: "missing", provenance: null };
}

export async function getLiveFarmContextSnapshot(
  caller: VerifiedFarmCallerContext,
  options: { now?: Date } = {},
): Promise<LiveFarmContextSnapshot> {
  const retrievedAt = (options.now ?? new Date()).toISOString();
  const { client, farmId } = caller;

  // Fetch core farm identity + plots first (RLS-scoped under caller JWT) so plot-scoped
  // domains (`soil_records`, `telemetry_rollups`, `telemetry_readings`) can filter cleanly.
  const [farmRes, plotsRes] = await Promise.all([
    client
      .from("farms")
      .select("id, name, zone, state, lga, soil_information, updated_at")
      .eq("id", farmId)
      .maybeSingle(),
    client
      .from("plots")
      .select("id, farm_id, name, current_crop, soil_ph, organic_matter_pct, soil_texture, updated_at")
      .eq("farm_id", farmId)
      .order("updated_at", { ascending: false })
      .limit(MAX_DOMAIN_ROWS),
  ]);

  const farm = farmRes.data ?? null;
  const plots = plotsRes.data ?? [];
  const plotIds = plots.map((p) => p.id);

  // Parallelise all 8 independent bounded domain queries under the caller's JWT.
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
    loadSoilChemistryDomain(client, farm, plots, plotIds, retrievedAt),
    loadSoilMoistureDomain(client, farmId, plotIds, retrievedAt),
    loadCropIdentityDomain(client, farmId, plots, retrievedAt),
    loadWeatherDomain(client, retrievedAt),
    loadInventoryDomain(client, farmId, retrievedAt),
    loadFinancialMarketplaceDomain(client, farmId, retrievedAt),
    loadEquipmentTelemetryDomain(client, farmId, plotIds, retrievedAt),
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
  retrievedAt: string,
): Promise<DomainContextSection<SoilChemistryDomainData>> {
  const domain: FarmContextDomain = "soil_chemistry_and_nutrients";
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
      if (error) return makeErrorSection(domain, "Failed to retrieve soil records.");
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
  retrievedAt: string,
): Promise<DomainContextSection<SoilMoistureDomainData>> {
  const domain: FarmContextDomain = "soil_moisture_and_irrigation";
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

    if (rollupsRes.error || eventsRes.error || zonesRes.error) {
      return makeErrorSection(domain, "Failed to retrieve soil moisture and irrigation data.");
    }

    const sourceRefs: AuditContextReference[] = [];
    const missingFields: string[] = [];
    const nowMs = new Date(retrievedAt).getTime();

    // Precedence: telemetry_rollups (valid_count > 0) > irrigation_zones.current_moisture_pct
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
        source: "farms",
        recordId: farmId,
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
            source: "farms",
            recordId: farmId,
            sourceTrust: "platform_verified",
            observedAt: latestEvent.started_at,
            retrievedAt,
          },
        }
      : emptyFact<string>();
    const latestIrrigationVolumeLitres = latestEvent
      ? makeNumericFact(latestEvent.volume_litres, "verified_current", {
          source: "farms",
          recordId: farmId,
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
  _retrievedAt: string,
): Promise<DomainContextSection<CropIdentityDomainData>> {
  const domain: FarmContextDomain = "crop_identity_variety_and_stage";
  try {
    const { data, error } = await client
      .from("crop_cycles")
      .select("id, plot_id, crop_id, current_stage, status, planting_date, expected_harvest_date, health_status, health_score, created_at")
      .eq("farm_id", farmId)
      .eq("status", "active")
      .order("planting_date", { ascending: false })
      .limit(MAX_DOMAIN_ROWS);

    if (error) return makeErrorSection(domain, "Failed to retrieve active crop cycles.");

    const cycles = (data ?? []).map((c) => ({
      cycleId: c.id,
      plotId: c.plot_id,
      cropId: c.crop_id,
      currentStage: c.current_stage,
      plantingDate: c.planting_date,
      expectedHarvestDate: c.expected_harvest_date,
      healthStatus: c.health_status,
      healthScore: c.health_score,
      state: "verified_current" as const,
    }));

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

    return {
      domain,
      status: cycles.length > 0 ? "ok" : fallbackPlotCrops.length > 0 ? "partial" : "empty",
      data: { activeCycles: cycles, fallbackPlotCrops },
      sourceRefs: normalizeAuditContextReferences(sourceRefs),
      conflicts: [],
      missingFields: cycles.length === 0 && fallbackPlotCrops.length === 0 ? ["activeCycles"] : [],
      validationIssues: [],
    };
  } catch {
    return makeErrorSection(domain, "Unexpected error retrieving crop identity domain.");
  }
}

async function loadWeatherDomain(
  client: VerifiedFarmCallerContext["client"],
  retrievedAt: string,
): Promise<DomainContextSection<WeatherDomainData>> {
  const domain: FarmContextDomain = "weather_and_environment";
  try {
    const { data, error } = await client
      .from("weather_cache")
      .select("provider, fetched_at")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return makeErrorSection(domain, "Failed to retrieve weather cache.");
    if (!data) {
      return {
        domain,
        status: "empty",
        data: { provider: emptyFact<string>(), fetchedAt: emptyFact<string>(), ageHours: null },
        sourceRefs: [],
        conflicts: [],
        missingFields: ["weather_cache"],
        validationIssues: [],
      };
    }

    const ageHours = Math.max(0, (new Date(retrievedAt).getTime() - new Date(data.fetched_at).getTime()) / 3_600_000);
    const state = ageHours > 12 ? "stale" : "verified_current";
    const prov = {
      source: "weather_cache" as const,
      recordId: data.provider,
      sourceTrust: "cache" as const,
      observedAt: data.fetched_at,
      retrievedAt,
    };

    return {
      domain,
      status: "ok",
      data: {
        provider: { value: data.provider, state, provenance: prov },
        fetchedAt: { value: data.fetched_at, state, provenance: prov },
        ageHours: Math.round(ageHours * 10) / 10,
      },
      sourceRefs: normalizeAuditContextReferences([
        { source: "weather_cache", record_id: data.provider, observed_at: data.fetched_at },
      ]),
      conflicts: [],
      missingFields: [],
      validationIssues: [],
    };
  } catch {
    return makeErrorSection(domain, "Unexpected error retrieving weather domain.");
  }
}

async function loadInventoryDomain(
  client: VerifiedFarmCallerContext["client"],
  farmId: string,
  retrievedAt: string,
): Promise<DomainContextSection<FarmInventoryDomainData>> {
  const domain: FarmContextDomain = "farm_inventory_and_stock";
  try {
    const [invRes, txRes] = await Promise.all([
      client
        .from("farm_inventory")
        .select("id, item_name, category, quantity, unit, updated_at")
        .eq("farm_id", farmId)
        .order("updated_at", { ascending: false })
        .limit(MAX_DOMAIN_ROWS),
      client
        .from("farm_inventory_transactions")
        .select("id, inventory_id, transaction_type, quantity, created_at")
        .eq("farm_id", farmId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (invRes.error || txRes.error) {
      return makeErrorSection(domain, "Failed to retrieve farm inventory or transaction ledger.");
    }

    const ledgerTotals = new Map<string, number>();
    for (const tx of txRes.data ?? []) {
      const sign = /out|use|consume|issue|write_off|loss/i.test(tx.transaction_type) ? -1 : 1;
      ledgerTotals.set(tx.inventory_id, (ledgerTotals.get(tx.inventory_id) ?? 0) + sign * tx.quantity);
    }

    const conflicts: ContextConflictDetail[] = [];
    const validationIssues: ContextValidationIssue[] = [];
    const sourceRefs: AuditContextReference[] = [];

    const items = (invRes.data ?? []).map((item) => {
      const hasLedger = ledgerTotals.has(item.id);
      const ledgerQty = hasLedger ? ledgerTotals.get(item.id)! : null;
      const check = evaluateInventoryLedgerConsistency({
        inventoryId: item.id,
        itemName: item.item_name,
        cachedQuantity: item.quantity,
        ledgerQuantity: ledgerQty,
        retrievedAt,
        updatedAt: item.updated_at,
      });

      if (check.conflict) conflicts.push(check.conflict);
      if (check.issue) validationIssues.push(check.issue);
      sourceRefs.push({ source: "farm_inventory", record_id: item.id, observed_at: item.updated_at });

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
        ledgerQuantity: makeNumericFact(ledgerQty, check.state, {
          source: "farm_inventory_transactions",
          recordId: item.id,
          sourceTrust: "derived_ledger",
          observedAt: retrievedAt,
          retrievedAt,
        }),
        state: check.state,
      };
    });

    return {
      domain,
      status: items.length > 0 ? "ok" : "empty",
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
    const [txRes, ordersRes] = await Promise.all([
      client
        .from("farm_financial_transactions")
        .select("id, transaction_date, created_at")
        .eq("farm_id", farmId)
        .order("transaction_date", { ascending: false })
        .limit(MAX_DOMAIN_ROWS),
      client
        .from("marketplace_orders")
        .select("id, placed_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);

    if (txRes.error || ordersRes.error) {
      return makeErrorSection(domain, "Failed to retrieve financial or marketplace records.");
    }

    const txs = txRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const sourceRefs: AuditContextReference[] = [
      ...txs.slice(0, 10).map((t) => ({ source: "farm_financial_transactions" as const, record_id: t.id, observed_at: t.created_at })),
      ...orders.slice(0, 10).map((o) => ({ source: "marketplace_orders" as const, record_id: o.id, observed_at: o.updated_at })),
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
      status: txs.length > 0 || orders.length > 0 ? "ok" : "empty",
      data: {
        recentFarmTransactionsCount: txs.length,
        recentMarketplaceOrdersCount: orders.length,
        latestTransactionDate,
      },
      sourceRefs: normalizeAuditContextReferences(sourceRefs),
      conflicts: [],
      missingFields: txs.length === 0 && orders.length === 0 ? ["financial_records"] : [],
      validationIssues: [],
    };
  } catch {
    return makeErrorSection(domain, "Unexpected error retrieving financial/marketplace domain.");
  }
}

async function loadEquipmentTelemetryDomain(
  client: VerifiedFarmCallerContext["client"],
  farmId: string,
  plotIds: string[],
  retrievedAt: string,
): Promise<DomainContextSection<EquipmentTelemetryDomainData>> {
  const domain: FarmContextDomain = "equipment_and_iot_telemetry";
  try {
    const [assetsRes, usageRes, machTelRes, iotRes] = await Promise.all([
      client
        .from("farm_machinery_assets")
        .select("id, name, category, current_status, engine_hours, updated_at")
        .eq("farm_id", farmId)
        .order("updated_at", { ascending: false })
        .limit(MAX_DOMAIN_ROWS),
      client
        .from("farm_machinery_usage_logs")
        .select("id, machinery_id, hours_operated, end_time")
        .eq("farm_id", farmId)
        .order("end_time", { ascending: false })
        .limit(100),
      client
        .from("machinery_telemetry")
        .select("id, machinery_id, engine_hours, recorded_at")
        .eq("farm_id", farmId)
        .order("recorded_at", { ascending: true })
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

    if (assetsRes.error || usageRes.error || machTelRes.error || iotRes.error) {
      return makeErrorSection(domain, "Failed to retrieve equipment or telemetry data.");
    }

    const usageByMachinery = new Map<string, number>();
    for (const u of usageRes.data ?? []) {
      usageByMachinery.set(u.machinery_id, (usageByMachinery.get(u.machinery_id) ?? 0) + u.hours_operated);
    }

    const telByMachinery = new Map<string, Array<{ id: string; engineHours: number | null; recordedAt: string }>>();
    for (const t of machTelRes.data ?? []) {
      const arr = telByMachinery.get(t.machinery_id) ?? [];
      arr.push({ id: t.id, engineHours: t.engine_hours, recordedAt: t.recorded_at });
      telByMachinery.set(t.machinery_id, arr);
    }

    const conflicts: ContextConflictDetail[] = [];
    const validationIssues: ContextValidationIssue[] = [];
    const sourceRefs: AuditContextReference[] = [];

    const machinery = (assetsRes.data ?? []).map((asset) => {
      const samples = telByMachinery.get(asset.id) ?? [];
      const loggedHours = usageByMachinery.has(asset.id) ? usageByMachinery.get(asset.id)! : null;
      const check = evaluateMachineryTelemetryConsistency({
        machineryId: asset.id,
        machineryName: asset.name,
        assetEngineHours: asset.engine_hours,
        loggedUsageHoursTotal: loggedHours,
        telemetrySamples: samples,
      });

      conflicts.push(...check.conflicts);
      validationIssues.push(...check.issues);
      sourceRefs.push({ source: "farm_machinery_assets", record_id: asset.id, observed_at: asset.updated_at });
      const latestSample = samples[samples.length - 1];
      if (latestSample) {
        sourceRefs.push({ source: "machinery_telemetry", record_id: latestSample.id, observed_at: latestSample.recordedAt });
      }

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
        latestTelemetryEngineHours: makeNumericFact(check.latestValidHours, check.state, {
          source: "machinery_telemetry",
          recordId: latestSample?.id ?? asset.id,
          sourceTrust: check.state === "conflicting" ? "sensor_suspicious" : "sensor_valid",
          observedAt: check.latestObservedAt,
          retrievedAt,
        }),
        loggedUsageHoursTotal: loggedHours,
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
      status: machinery.length > 0 || validReadings.length > 0 ? "ok" : "empty",
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

    if (cyclesRes.error || alertsRes.error) {
      return makeErrorSection(domain, "Failed to retrieve scouting observations or crop alerts.");
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
      if (obsRes.error) return makeErrorSection(domain, "Failed to retrieve crop observations.");
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
