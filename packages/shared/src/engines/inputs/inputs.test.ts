import { describe, it, expect } from 'vitest';
import { calculateFertiliserRecommendation } from './fertiliser';
import {
  evaluateWithTestApprovedProtocol,
  makeTestApprovedProtocolFixture,
  makeTestVerifiedLabReport,
} from './__testing__/approved-protocol-test-harness';
import { generateSprayPlan } from './spray-planner';
import { evaluateCropWeatherHazards } from './weather-alerts';
import { FarmInventoryLedger } from './inventory';
import { computeFarmGrossMargin } from './farm-books';

describe('Fertiliser Engine', () => {
  it('fails closed on provisional built-in maize protocol without an independent agronomic approval record', () => {
    const soil = {
      pH: 6.2,
      phosphorus: { value: 12, unit: 'ppm' as const, basis: 'elemental_P' as const },
      potassium: { value: 140, unit: 'ppm' as const, basis: 'elemental_K' as const },
      organicMatterPercent: 1.8,
      provenance: 'lab_confirmed' as const,
      extractionMethod: 'bray_1' as const,
      samplingDepthCm: 15,
      testDate: '2026-10-01',
      farmId: 'farm-unit-1',
    };

    expect(() =>
      calculateFertiliserRecommendation('maize', 5.0, 2.0, soil, {
        zone: 'derived_savanna',
        growthStage: 'basal',
        farmId: 'farm-unit-1',
        referenceDate: '2026-11-22',
      }),
    ).toThrow('protocol_provisional_not_approved');
  });

  it('calculates NPK and Urea for 5 t/ha maize on moderate soil when backed by internal test-only approved fixture', () => {
    const soil = {
      pH: 6.2,
      phosphorus: { value: 12, unit: 'ppm' as const, basis: 'elemental_P' as const },
      potassium: { value: 140, unit: 'ppm' as const, basis: 'elemental_K' as const },
      organicMatterPercent: 1.8,
      provenance: 'lab_confirmed' as const,
      extractionMethod: 'bray_1' as const,
      samplingDepthCm: 15,
      testDate: '2026-10-01',
      farmId: 'farm-unit-1',
      verifiedLabReport: makeTestVerifiedLabReport({ farmId: 'farm-unit-1', plotId: undefined }),
    };

    const res = evaluateWithTestApprovedProtocol(
      {
        cropId: 'maize',
        targetYieldTonnesPerHa: 5.0,
        farmAreaHectares: 2.0,
        soil,
        zone: 'derived_savanna',
        growthStage: 'basal',
        farmId: 'farm-unit-1',
        referenceDate: '2026-11-22',
      },
      makeTestApprovedProtocolFixture('maize'),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const rec = res.recommendation;
    expect(rec.cropId).toBe('maize');
    expect(rec.productApplications.length).toBe(2);

    const npk = rec.productApplications.find((p) => p.productName.includes('NPK'));
    const urea = rec.productApplications.find((p) => p.productName.includes('Urea'));

    expect(npk).toBeDefined();
    expect(urea).toBeDefined();
    expect(npk?.fiftyKgBags).toBeGreaterThan(0);
    expect(urea?.fiftyKgBags).toBeGreaterThan(0);
    expect(rec.limeRecommendationKgPerHa).toBe(0);
  });

  it('recommends lime and warns on acidic soil (pH < 5.5) with internal test-only approved fixture', () => {
    const acidSoil = {
      pH: 4.8,
      phosphorus: { value: 6, unit: 'ppm' as const, basis: 'elemental_P' as const },
      potassium: { value: 80, unit: 'ppm' as const, basis: 'elemental_K' as const },
      organicMatterPercent: 1.5,
      provenance: 'lab_confirmed' as const,
      extractionMethod: 'bray_1' as const,
      samplingDepthCm: 15,
      testDate: '2026-10-01',
      farmId: 'farm-unit-1',
      verifiedLabReport: makeTestVerifiedLabReport({ farmId: 'farm-unit-1', plotId: undefined }),
    };
    const res = evaluateWithTestApprovedProtocol(
      {
        cropId: 'maize',
        targetYieldTonnesPerHa: 4.0,
        farmAreaHectares: 1.0,
        soil: acidSoil,
        zone: 'rainforest',
        growthStage: 'pre_planting',
        farmId: 'farm-unit-1',
        referenceDate: '2026-11-22',
      },
      makeTestApprovedProtocolFixture('maize'),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.recommendation.limeRecommendationKgPerHa).toBeGreaterThan(0);
    expect(res.recommendation.warning).toContain('acidic');
  });
});

describe('Spray Planner Engine', () => {
  it('generates a compliant spray plan for Atrazine on maize', () => {
    const plan = generateSprayPlan(
      'atrazine-500sc',
      2.0,
      '2026-05-01',
      '2026-08-15' // Harvest is 106 days later, well after 60-day PHI
    );

    expect(plan.productName).toContain('Atrazine');
    expect(plan.totalChemicalRequiredLitersOrKg).toBe(6.0); // 3L/ha * 2ha
    expect(plan.knapsackTanksCount).toBeGreaterThan(0);
    expect(plan.preHarvestIntervalDays).toBe(60);
    expect(plan.earliestSafeHarvestDate).toBe('2026-06-30');
  });

  it('rejects spray if planned harvest violates Pre-Harvest Interval (PHI)', () => {
    expect(() =>
      generateSprayPlan(
        'atrazine-500sc',
        1.0,
        '2026-07-01',
        '2026-07-15' // Harvest only 14 days later, violates 60-day PHI!
      )
    ).toThrow('PRE-HARVEST INTERVAL VIOLATION');
  });

  it('rejects banned agrochemicals in Nigeria', () => {
    expect(() =>
      generateSprayPlan('paraquat-dichloride', 1.0, '2026-05-01', '2026-09-01')
    ).toThrow('BANNED');
  });
});

describe('Crop Weather Hazards Engine', () => {
  it('detects heavy rain fertiliser leaching risk', () => {
    const forecasts = [
      { date: '2026-05-10', tempMaxC: 31, tempMinC: 22, rainMm: 45, windSpeedKmh: 15, humidityPercent: 80 },
    ];

    const alerts = evaluateCropWeatherHazards({
      cropId: 'maize',
      stageName: 'Vegetative',
      forecasts,
    });

    expect(alerts.length).toBe(1);
    expect(alerts[0]?.alertType).toBe('fertiliser_leaching');
  });

  it('flags fungal blight hazard for tomato under hot humid conditions', () => {
    const forecasts = [
      { date: '2026-06-05', tempMaxC: 30, tempMinC: 24, rainMm: 10, windSpeedKmh: 10, humidityPercent: 92 },
    ];

    const alerts = evaluateCropWeatherHazards({
      cropId: 'tomato',
      stageName: 'Flowering',
      forecasts,
    });

    expect(alerts.some((a) => a.alertType === 'fungal_blight_risk')).toBe(true);
  });
});

describe('Farm Inventory Ledger', () => {
  it('prevents negative inventory balances', () => {
    const ledger = new FarmInventoryLedger([
      { id: '1', sku: 'SEED-MAIZE-15', name: 'SAMMAZ 15', category: 'seed', unit: 'kg', quantityOnHand: 25, costPerUnitKobo: 120000 },
    ]);

    // Receive more
    ledger.recordMovement({ sku: 'SEED-MAIZE-15', movementType: 'receive', quantity: 15, unitCostKobo: 120000 });
    expect(ledger.getItemBySku('SEED-MAIZE-15')?.quantityOnHand).toBe(40);

    // Issue valid amount
    ledger.recordMovement({ sku: 'SEED-MAIZE-15', movementType: 'issue_to_field', quantity: 30, unitCostKobo: 120000 });
    expect(ledger.getItemBySku('SEED-MAIZE-15')?.quantityOnHand).toBe(10);

    // Attempt to issue 15 when only 10 available
    expect(() =>
      ledger.recordMovement({ sku: 'SEED-MAIZE-15', movementType: 'issue_to_field', quantity: 15, unitCostKobo: 120000 })
    ).toThrow('INSUFFICIENT STOCK');
  });
});

describe('Farm Financial Accounting', () => {
  it('computes gross margin and unit cost of production correctly in kobo', () => {
    const report = computeFarmGrossMargin({
      cropId: 'maize',
      plotId: 'plot_A',
      areaHectares: 2.0,
      totalYieldKg: 9000, // 9 tonnes
      revenueKobo: 360000000, // ₦3,600,000 (₦400/kg)
      costs: {
        machineryKobo: 80000000, // ₦800,000
        labourKobo: 40000000, // ₦400,000
        seedsKobo: 30000000, // ₦300,000
        fertiliserKobo: 50000000, // ₦500,000
        chemicalsKobo: 20000000, // ₦200,000
      },
    });

    expect(report.totalDirectCostKobo).toBe(220000000); // ₦2,200,000
    expect(report.grossMarginKobo).toBe(140000000); // ₦1,400,000 profit
    expect(report.grossMarginPerHectareKobo).toBe(70000000); // ₦700,000 / ha
    expect(report.costOfProductionPerKgKobo).toBe(24444); // ~₦244.44 / kg
    expect(report.roiPercentage).toBeGreaterThan(60);
  });
});
